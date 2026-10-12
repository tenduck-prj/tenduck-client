import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ServerPacket,
  ClientPacket,
  AIProcessingStage,
  ThoughtStep,
  ToolCallEvent,
  LiveStreamMetrics,
} from '../types/llm';

export interface WebSocketLLMState {
  isConnected: boolean;
  isConnecting: boolean;
  currentStage: AIProcessingStage;
  stageMessage: string;
  thoughts: ThoughtStep[];
  toolCalls: ToolCallEvent[];
  streamingText: string;
  metrics: LiveStreamMetrics | null;
  error: string | null;
  sessionId: string | null;
}

export interface CompleteResult {
  text: string;
  metrics: LiveStreamMetrics | null;
  thoughts: ThoughtStep[];
  toolCalls: ToolCallEvent[];
}

interface UseWebSocketLLMOptions {
  url?: string;
  mockMode?: boolean;
  authToken?: string;
  onToken?: (token: string) => void;
  onComplete?: (result: CompleteResult) => void;
}

export function useWebSocketLLM({
  url = 'ws://localhost:8000/ws/llm/v1',
  mockMode = true,
  authToken,
  onToken,
  onComplete,
}: UseWebSocketLLMOptions = {}) {
  const [state, setState] = useState<WebSocketLLMState>({
    isConnected: false,
    isConnecting: false,
    currentStage: 'idle',
    stageMessage: '',
    thoughts: [],
    toolCalls: [],
    streamingText: '',
    metrics: null,
    error: null,
    sessionId: null,
  });

  // 클로저 안전성을 위한 최신 상태 레퍼런스
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const thoughtsRef = useRef<ThoughtStep[]>([]);
  const toolCallsRef = useRef<ToolCallEvent[]>([]);
  const streamingTextRef = useRef<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentRequestIdRef = useRef<string>('');

  // 1. 서버 수신 패킷 파서 및 상태 디스패처
  const handleServerPacket = useCallback((packet: ServerPacket) => {
    switch (packet.type) {
      case 'connection.ack':
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          sessionId: packet.payload.sessionId,
          error: null,
        }));
        break;

      case 'heartbeat.pong':
        break;

      case 'stage.transition':
        setState((prev) => ({
          ...prev,
          currentStage: packet.payload.currentStage,
          stageMessage: packet.payload.message || '',
        }));
        break;

      case 'thought.stream': {
        const existingIdx = thoughtsRef.current.findIndex(
          (t) => t.step === packet.payload.step
        );

        let newThoughts: ThoughtStep[];
        if (existingIdx >= 0) {
          newThoughts = [...thoughtsRef.current];
          const cur = newThoughts[existingIdx];
          newThoughts[existingIdx] = {
            ...cur,
            content: cur.content + packet.payload.delta,
            topic: packet.payload.topic || cur.topic,
          };
        } else {
          newThoughts = [
            ...thoughtsRef.current,
            {
              step: packet.payload.step,
              topic: packet.payload.topic,
              content: packet.payload.delta,
              timestamp: packet.timestamp,
            },
          ];
        }

        thoughtsRef.current = newThoughts;
        setState((prev) => ({
          ...prev,
          thoughts: newThoughts,
        }));
        break;
      }

      case 'tool.invoke': {
        const newTools: ToolCallEvent[] = [
          ...toolCallsRef.current,
          {
            toolId: packet.payload.toolId,
            toolName: packet.payload.toolName,
            arguments: packet.payload.arguments,
            status: 'invoking',
          },
        ];
        toolCallsRef.current = newTools;
        setState((prev) => ({
          ...prev,
          currentStage: 'tool_calling',
          toolCalls: newTools,
        }));
        break;
      }

      case 'tool.result': {
        const idx = toolCallsRef.current.findIndex(
          (t) => t.toolId === packet.payload.toolId
        );
        let updatedTools = [...toolCallsRef.current];
        if (idx >= 0) {
          updatedTools[idx] = {
            ...updatedTools[idx],
            status: packet.payload.status,
            result: packet.payload.result,
            error: packet.payload.error,
            executionMs: packet.payload.executionMs,
          };
        }
        toolCallsRef.current = updatedTools;
        setState((prev) => ({
          ...prev,
          toolCalls: updatedTools,
        }));
        break;
      }

      case 'token.stream': {
        onTokenRef.current?.(packet.payload.delta);
        const newText = streamingTextRef.current + packet.payload.delta;
        streamingTextRef.current = newText;
        setState((prev) => ({
          ...prev,
          currentStage: 'generating',
          streamingText: newText,
        }));
        break;
      }

      case 'stream.complete': {
        const finalText = packet.payload.finalText || streamingTextRef.current;
        const finalMetrics = packet.payload.metrics;
        const finalThoughts = [...thoughtsRef.current];
        const finalToolCalls = [...toolCallsRef.current];

        setState((prev) => ({
          ...prev,
          currentStage: 'completed',
          streamingText: '', // 스트리밍 완료 후 초기화 (저장은 onComplete로 위임)
          metrics: finalMetrics,
        }));

        onCompleteRef.current?.({
          text: finalText,
          metrics: finalMetrics,
          thoughts: finalThoughts,
          toolCalls: finalToolCalls,
        });
        break;
      }

      case 'stream.error':
        setState((prev) => ({
          ...prev,
          currentStage: 'error',
          error: `[${packet.payload.code}] ${packet.payload.message}`,
        }));
        break;
    }
  }, []);

  // 2. 소켓 연결 핸들러
  const connect = useCallback(() => {
    if (mockMode) {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        sessionId: 'sess_mock_lotte_preview',
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isConnecting: true }));
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        const initPacket: ClientPacket = {
          type: 'connection.init',
          timestamp: Date.now(),
          payload: {
            authToken,
            clientVersion: '0.1.0',
            clientId: `fe_tenduck_${Math.random().toString(36).substring(2, 9)}`,
          },
        };
        ws.send(JSON.stringify(initPacket));
      };

      ws.onclose = () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
          error: 'WebSocket 서버 통신 장애가 발생했습니다.',
          isConnecting: false,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const packet: ServerPacket = JSON.parse(event.data);
          handleServerPacket(packet);
        } catch (err) {
          console.error('Failed to parse WebSocket packet:', err);
        }
      };
    } catch (err) {
      console.error('WebSocket initialization failure:', err);
      setState((prev) => ({ ...prev, isConnecting: false, error: '소켓 초기화 실패' }));
    }
  }, [url, mockMode, authToken, handleServerPacket]);

  // 3. Mock 실사 시뮬레이터 (빠르고 생동감 있는 실시간 라이프사이클)
  const runMockSimulation = useCallback(
    (promptText: string, requestId: string) => {
      mockTimeoutRef.current.forEach(clearTimeout);
      mockTimeoutRef.current = [];

      // 초기화
      thoughtsRef.current = [];
      toolCallsRef.current = [];
      streamingTextRef.current = '';

      setState((prev) => ({
        ...prev,
        currentStage: 'reasoning',
        stageMessage: '고객 질문 분석 및 안내 계획 수립 중...',
        thoughts: [],
        toolCalls: [],
        streamingText: '',
        metrics: null,
        error: null,
      }));

      const timers: ReturnType<typeof setTimeout>[] = [];

      // [0ms] 즉시 사고 과정 시작 (Reasoning)
      handleServerPacket({
        type: 'stage.transition',
        requestId,
        conversationId: 'conv_mock',
        timestamp: Date.now(),
        payload: {
          previousStage: 'idle',
          currentStage: 'reasoning',
          message: '고객 의도 분석 및 롯데백화점 정보 검토 중...',
        },
      });

      handleServerPacket({
        type: 'thought.stream',
        requestId,
        conversationId: 'conv_mock',
        timestamp: Date.now(),
        payload: {
          step: 1,
          topic: '요구사항 분해',
          delta: `1. 질문 의도 분석: "${promptText}"\n2. 롯데백화점 본점 에비뉴엘(Avenuel) 명품관 입점 브랜드 및 VIP 라운지 혜택 조회 필요.\n`,
        },
      });

      // [300ms] 사고 과정 추가
      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'thought.stream',
            requestId,
            conversationId: 'conv_mock',
            timestamp: Date.now(),
            payload: {
              step: 2,
              topic: '점포 API 쿼리 계획',
              delta: `3. 사내 지점 디렉토리 API(fetch_avenuel_directory)를 호출하여 실시간 입점 현황을 확인합니다.\n`,
            },
          });
        }, 300)
      );

      // [600ms] 도구 호출 시작 (Tool Invoke)
      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'stage.transition',
            requestId,
            conversationId: 'conv_mock',
            timestamp: Date.now(),
            payload: {
              previousStage: 'reasoning',
              currentStage: 'tool_calling',
              message: '본점 에비뉴엘 점포 디렉토리 API 호출 중...',
            },
          });

          handleServerPacket({
            type: 'tool.invoke',
            requestId,
            conversationId: 'conv_mock',
            timestamp: Date.now(),
            payload: {
              toolId: 'tool_call_mock_1',
              toolName: 'fetch_avenuel_directory',
              arguments: { branch: 'main_store', target: 'avenuel', category: 'luxury' },
              timestamp: Date.now(),
            },
          });
        }, 600)
      );

      // [1000ms] 도구 실행 결과 반환 (Tool Result)
      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'tool.result',
            requestId,
            conversationId: 'conv_mock',
            timestamp: Date.now(),
            payload: {
              toolId: 'tool_call_mock_1',
              toolName: 'fetch_avenuel_directory',
              status: 'success',
              result: '본점 에비뉴엘 B1F~6F: 샤넬, 루이비통, 에르메스 등 총 64개 럭셔리 부티크 및 VIP 라운지(3/4F) 확인 완료',
              executionMs: 180,
              timestamp: Date.now(),
            },
          });
        }, 1000)
      );

      // [1200ms] 최종 답변 토큰 스트리밍 시작 (Generating)
      const sampleAnswer =
        `안녕하세요. 롯데백화점 프리미엄 AI 컨시어지입니다.\n\n` +
        `요청하신 **롯데백화점 본점 에비뉴엘(AVENUEL)** 관련 안내드립니다.\n\n` +
        `1. **럭셔리 부티크 입점 안내**: 본점 에비뉴엘(B1F~6F)에는 샤넬, 에르메스, 루이비통, 까르띠에를 비롯한 최고급 명품 부티크가 입점해 있으며, VIP 마일리지 적립 혜택이 적용됩니다.\n` +
        `2. **AVENUEL VIP 라운지**: 에비뉴엘 3층과 4층에 프라이빗 라운지가 운영 중이며, 전문 바리스타 핸드드립 음료와 다과 서비스, 전용 발레파킹 서비스를 제공합니다.\n` +
        `3. **퍼스널 쇼퍼 룸 (PSR)**: 사전 예약 시 VIP 전담 스타일리스트의 1:1 맞춤 쇼핑 동행 및 프라이빗 피팅이 지원됩니다.\n\n` +
        `추가로 확인이 필요하신 입점 브랜드나 이번 주말 사은행사 정보가 있으신가요?`;

      const tokens = sampleAnswer.split('');
      const startTime = Date.now();

      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'stage.transition',
            requestId,
            conversationId: 'conv_mock',
            timestamp: Date.now(),
            payload: {
              previousStage: 'tool_calling',
              currentStage: 'generating',
              message: '답변 토큰 생성 중...',
            },
          });
        }, 1200)
      );

      tokens.forEach((token, index) => {
        timers.push(
          setTimeout(() => {
            handleServerPacket({
              type: 'token.stream',
              requestId,
              conversationId: 'conv_mock',
              timestamp: Date.now(),
              payload: {
                sequence: index + 1,
                delta: token,
              },
            });

            // 마지막 토큰 생성 완료
            if (index === tokens.length - 1) {
              const elapsedMs = Date.now() - startTime;
              handleServerPacket({
                type: 'stage.transition',
                requestId,
                conversationId: 'conv_mock',
                timestamp: Date.now(),
                payload: {
                  previousStage: 'generating',
                  currentStage: 'completed',
                  message: '답변 생성 완료',
                },
              });

              handleServerPacket({
                type: 'stream.complete',
                requestId,
                conversationId: 'conv_mock',
                timestamp: Date.now(),
                payload: {
                  finalText: sampleAnswer,
                  metrics: {
                    promptTokens: 85,
                    completionTokens: tokens.length,
                    totalTokens: 85 + tokens.length,
                    elapsedMs,
                    timeToFirstTokenMs: 380,
                    tokensPerSec: Math.round((tokens.length / (elapsedMs / 1000)) * 10) / 10,
                    latencyMs: 65,
                  },
                },
              });
            }
          }, 1250 + index * 14)
        );
      });

      mockTimeoutRef.current = timers;
    },
    [handleServerPacket]
  );

  // 4. 프롬프트 발송 함수
  const sendPrompt = useCallback(
    (promptText: string) => {
      if (!promptText.trim()) return;
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      currentRequestIdRef.current = requestId;

      if (mockMode) {
        runMockSimulation(promptText, requestId);
        return;
      }

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setState((prev) => ({
          ...prev,
          error: 'WebSocket 서버가 연결되지 않은 상태입니다.',
        }));
        return;
      }

      // 초기화
      thoughtsRef.current = [];
      toolCallsRef.current = [];
      streamingTextRef.current = '';

      const packet: ClientPacket = {
        type: 'prompt.submit',
        requestId,
        conversationId: 'conv_active',
        timestamp: Date.now(),
        payload: {
          prompt: promptText,
          temperature: 0.7,
          showThinking: true,
        },
      };

      setState((prev) => ({
        ...prev,
        currentStage: 'planning',
        stageMessage: '프롬프트 전송 완료. 모델 추론 준비 중...',
        thoughts: [],
        toolCalls: [],
        streamingText: '',
        metrics: null,
        error: null,
      }));

      wsRef.current.send(JSON.stringify(packet));
    },
    [mockMode, runMockSimulation]
  );

  // 5. 프롬프트 생성 취소 (Cancel)
  const cancelPrompt = useCallback(() => {
    if (mockMode) {
      mockTimeoutRef.current.forEach(clearTimeout);
      mockTimeoutRef.current = [];
      setState((prev) => ({
        ...prev,
        currentStage: 'cancelled',
        stageMessage: '생성이 취소되었습니다.',
      }));
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentRequestIdRef.current) {
      const cancelPacket: ClientPacket = {
        type: 'prompt.cancel',
        requestId: currentRequestIdRef.current,
        conversationId: 'conv_active',
        timestamp: Date.now(),
        payload: {
          reason: 'user_cancelled',
        },
      };
      wsRef.current.send(JSON.stringify(cancelPacket));
    }
  }, [mockMode]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      mockTimeoutRef.current.forEach(clearTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    ...state,
    sendPrompt,
    cancelPrompt,
    reconnect: connect,
  };
}
