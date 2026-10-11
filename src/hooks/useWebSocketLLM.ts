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
}

interface UseWebSocketLLMOptions {
  url?: string;
  mockMode?: boolean;
  onToken?: (token: string) => void;
  onComplete?: (result: { text: string; metrics: LiveStreamMetrics | null }) => void;
}

export function useWebSocketLLM({
  url = 'ws://localhost:8000/ws/llm/v1',
  mockMode = true,
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
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 1. 소켓 연결 핸들러
  const connect = useCallback(() => {
    if (mockMode) {
      setState((prev) => ({ ...prev, isConnected: true, isConnecting: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isConnecting: true }));
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      };

      ws.onclose = () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
        // 자동 재연결 시도 (3초 후)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
          error: 'WebSocket 연결 에러가 발생했습니다.',
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
      console.error('WebSocket connection initialization error:', err);
      setState((prev) => ({ ...prev, isConnecting: false, error: '소켓 초기화 실패' }));
    }
  }, [url, mockMode]);

  // 2. 서버 수신 패킷 처리기
  const handleServerPacket = useCallback(
    (packet: ServerPacket) => {
      switch (packet.type) {
        case 'status.stage':
          setState((prev) => ({
            ...prev,
            currentStage: packet.payload.stage,
            stageMessage: packet.payload.message || '',
          }));
          break;

        case 'stream.thought':
          setState((prev) => {
            const lastThought = prev.thoughts[prev.thoughts.length - 1];
            if (lastThought && lastThought.step === packet.payload.step) {
              const updated = [...prev.thoughts];
              updated[updated.length - 1] = {
                ...lastThought,
                content: lastThought.content + packet.payload.delta,
              };
              return { ...prev, thoughts: updated };
            } else {
              return {
                ...prev,
                thoughts: [
                  ...prev.thoughts,
                  {
                    step: packet.payload.step,
                    content: packet.payload.delta,
                    timestamp: Date.now(),
                  },
                ],
              };
            }
          });
          break;

        case 'event.tool_call':
          setState((prev) => {
            const existingIndex = prev.toolCalls.findIndex(
              (t) => t.toolId === packet.payload.toolId
            );
            if (existingIndex >= 0) {
              const updated = [...prev.toolCalls];
              updated[existingIndex] = packet.payload;
              return { ...prev, toolCalls: updated };
            }
            return { ...prev, toolCalls: [...prev.toolCalls, packet.payload] };
          });
          break;

        case 'stream.token':
          onToken?.(packet.payload.delta);
          setState((prev) => ({
            ...prev,
            currentStage: 'generating',
            streamingText: prev.streamingText + packet.payload.delta,
          }));
          break;

        case 'stream.done':
          setState((prev) => {
            const finalState = {
              ...prev,
              currentStage: 'completed' as const,
              metrics: packet.payload,
            };
            onComplete?.({
              text: prev.streamingText,
              metrics: packet.payload,
            });
            return finalState;
          });
          break;

        case 'stream.error':
          setState((prev) => ({
            ...prev,
            currentStage: 'error',
            error: packet.payload.message,
          }));
          break;
      }
    },
    [onToken, onComplete]
  );

  // 3. Mock 시뮬레이터 (개발 및 테스트용)
  const runMockSimulation = useCallback(
    (promptText: string) => {
      // 이전 타이머 정리
      mockTimeoutRef.current.forEach(clearTimeout);
      mockTimeoutRef.current = [];

      setState((prev) => ({
        ...prev,
        currentStage: 'planning',
        stageMessage: '사용자 요청 분석 및 계획 수립 중...',
        thoughts: [],
        toolCalls: [],
        streamingText: '',
        metrics: null,
        error: null,
      }));

      const timers: ReturnType<typeof setTimeout>[] = [];

      // 1) 사고 단계 (Reasoning)
      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'status.stage',
            requestId: 'req_mock',
            payload: { stage: 'reasoning', message: '관련 롯데백화점 정보 및 프로모션 데이터 검토' },
          });
          handleServerPacket({
            type: 'stream.thought',
            requestId: 'req_mock',
            payload: {
              step: 1,
              delta: `1. 질문 분석: "${promptText}"\n2. 롯데백화점 본점 에비뉴엘 명품관 및 멤버십 혜택 조회 필요.\n`,
            },
          });
        }, 400)
      );

      // 2) 도구 호출 단계 (Tool Calling)
      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'status.stage',
            requestId: 'req_mock',
            payload: { stage: 'tool_calling', message: '사내 백화점 지점 API 연동 실행' },
          });
          handleServerPacket({
            type: 'event.tool_call',
            requestId: 'req_mock',
            payload: {
              toolId: 'tool_lotte_search',
              toolName: 'query_store_promotions',
              arguments: { branch: 'main_store', target: 'avenuel' },
              status: 'invoking',
            },
          });
        }, 1100)
      );

      // 도구 실행 완료
      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'event.tool_call',
            requestId: 'req_mock',
            payload: {
              toolId: 'tool_lotte_search',
              toolName: 'query_store_promotions',
              arguments: { branch: 'main_store', target: 'avenuel' },
              status: 'success',
              result: '본점 에비뉴엘 1~4층 럭셔리 부티크 프로모션 및 VIP 라운지 혜택 조회 성공',
            },
          });
        }, 1800)
      );

      // 3) 토큰 스트리밍 (Generating)
      const sampleAnswer =
        `안녕하세요. 롯데백화점 프리미엄 AI 컨시어지입니다.\n\n` +
        `요청하신 **롯데백화점 본점 에비뉴엘** 관련 안내드립니다.\n\n` +
        `1. **럭셔리 부티크 입점 혜택**: 본점 에비뉴엘에서는 주요 명품 브랜드 구매 고객을 위한 전용 마일리지 적립 프로모션을 진행하고 있습니다.\n` +
        `2. **AVENUEL VIP 라운지**: 에비뉴엘 3층 및 4층에 위치한 프라이빗 라운지에서 전문 바리스타 음료 및 발레파킹 서비스를 이용하실 수 있습니다.\n` +
        `3. **퍼스널 쇼퍼 서비스**: 사전 예약 시 전문 스타일리스트의 1:1 맞춤 쇼핑 동행 서비스가 지원됩니다.\n\n` +
        `추가로 확인이 필요하신 층별 입점 브랜드나 주차 안내가 있으신가요?`;

      const tokens = sampleAnswer.split('');
      const startTime = Date.now();

      tokens.forEach((token, index) => {
        timers.push(
          setTimeout(() => {
            handleServerPacket({
              type: 'stream.token',
              requestId: 'req_mock',
              payload: { delta: token },
            });

            // 마지막 토큰
            if (index === tokens.length - 1) {
              const elapsedMs = Date.now() - startTime;
              handleServerPacket({
                type: 'stream.done',
                requestId: 'req_mock',
                payload: {
                  totalTokens: tokens.length,
                  elapsedMs,
                  tokensPerSec: Math.round((tokens.length / (elapsedMs / 1000)) * 10) / 10,
                  latencyMs: 120,
                },
              });
            }
          }, 2400 + index * 20)
        );
      });

      mockTimeoutRef.current = timers;
    },
    [handleServerPacket]
  );

  // 4. 프롬프트 전송 함수
  const sendPrompt = useCallback(
    (promptText: string) => {
      if (!promptText.trim()) return;

      if (mockMode) {
        runMockSimulation(promptText);
        return;
      }

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setState((prev) => ({
          ...prev,
          error: 'WebSocket이 연결되지 않았습니다.',
        }));
        return;
      }

      const packet: ClientPacket = {
        type: 'request.prompt',
        requestId: `req_${Date.now()}`,
        timestamp: Date.now(),
        payload: {
          prompt: promptText,
          temperature: 0.7,
          showThought: true,
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

  // 5. 초기 마운트 시 연결 및 정리
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
    reconnect: connect,
  };
}
