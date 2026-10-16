import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ServerPacket,
  ClientPacket,
  AIProcessingStage,
  ThoughtStep,
  ToolCallEvent,
  LiveStreamMetrics,
  ConversationTurn,
} from '../types/llm';
import { resolveMockScenario } from '../mocks/mockScenarios';

export interface WebSocketLLMState {
  isConnected: boolean;
  isConnecting: boolean;
  currentStage: AIProcessingStage;
  stageMessage: string;
  thoughts: ThoughtStep[];
  toolCalls: ToolCallEvent[];
  streamingText: string;
  streamingThreadId: string | null;
  metrics: LiveStreamMetrics | null;
  error: string | null;
  isRetryable: boolean;
  sessionId: string | null;
  wsLatencyMs: number | null;
}

export interface CompleteResult {
  conversationId: string;
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

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/llm/v1';
const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocketLLM({
  url = DEFAULT_WS_URL,
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
    streamingThreadId: null,
    metrics: null,
    error: null,
    isRetryable: false,
    sessionId: null,
    wsLatencyMs: null,
  });

  // 클로저 안전성을 위한 최신 상태 레퍼런스
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const thoughtsRef = useRef<ThoughtStep[]>([]);
  const toolCallsRef = useRef<ToolCallEvent[]>([]);
  const streamingTextRef = useRef<string>('');
  const activeConversationIdRef = useRef<string>('conv_default');

  // 재시도(Retry)를 위한 직전 요청 정보 보관
  const lastSubmissionRef = useRef<{
    promptText: string;
    conversationId: string;
    history: ConversationTurn[];
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingSentTimeRef = useRef<Record<string, number>>({});
  const mockTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentRequestIdRef = useRef<string>('');

  // 하트비트 타이머 정리 헬퍼
  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // 하트비트 시작 헬퍼 (Live WebSocket 모드 전용)
  const startHeartbeat = useCallback(
    (intervalMs = 30000) => {
      clearHeartbeat();
      heartbeatIntervalRef.current = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pingId = `ping_${Date.now()}`;
          pingSentTimeRef.current[pingId] = Date.now();
          const pingPacket: ClientPacket = {
            type: 'heartbeat.ping',
            timestamp: Date.now(),
            payload: { pingId },
          };
          wsRef.current.send(JSON.stringify(pingPacket));
        }
      }, intervalMs);
    },
    [clearHeartbeat]
  );

  // 1. 서버 수신 패킷 파서 및 상태 디스패처
  const handleServerPacket = useCallback(
    (packet: ServerPacket) => {
      switch (packet.type) {
        case 'connection.ack':
          reconnectAttemptsRef.current = 0;
          setState((prev) => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            sessionId: packet.payload.sessionId,
            error: null,
          }));
          startHeartbeat(packet.payload.heartbeatIntervalMs || 30000);
          break;

        case 'heartbeat.pong': {
          const sentAt = pingSentTimeRef.current[packet.payload.pingId];
          if (sentAt) {
            const rtt = Date.now() - sentAt;
            delete pingSentTimeRef.current[packet.payload.pingId];
            setState((prev) => ({ ...prev, wsLatencyMs: rtt }));
          }
          break;
        }

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
          const updatedTools = [...toolCallsRef.current];
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
          const targetConvId = packet.conversationId || activeConversationIdRef.current;

          setState((prev) => ({
            ...prev,
            currentStage: 'completed',
            streamingText: '',
            streamingThreadId: null,
            metrics: finalMetrics,
            error: null,
            isRetryable: false,
          }));

          onCompleteRef.current?.({
            conversationId: targetConvId,
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
            isRetryable: packet.payload.retryable,
          }));
          break;
      }
    },
    [startHeartbeat]
  );

  // 2. 소켓 연결 핸들러 (지수 백오프 재연결 지원)
  const connect = useCallback(() => {
    if (mockMode) {
      clearHeartbeat();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        sessionId: 'sess_mock_lotte_preview',
        wsLatencyMs: 18,
        error: null,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        const initPacket: ClientPacket = {
          type: 'connection.init',
          timestamp: Date.now(),
          payload: {
            authToken,
            clientVersion: '0.2.0',
            clientId: `fe_tenduck_${Math.random().toString(36).substring(2, 9)}`,
          },
        };
        ws.send(JSON.stringify(initPacket));
      };

      ws.onclose = () => {
        clearHeartbeat();
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 16000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, backoffMs);
        } else {
          setState((prev) => ({
            ...prev,
            error: `서버(${url}) 연결에 실패했습니다. 백엔드 실행 여부를 확인하거나 Mock 모드를 사용해주세요.`,
          }));
        }
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
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
  }, [url, mockMode, authToken, clearHeartbeat, handleServerPacket]);

  // 3. 다중 시나리오 Mock 시뮬레이터 (사고 과정 -> 다중 도구 호출 -> 에러 또는 실시간 토큰)
  const runMockSimulation = useCallback(
    (
      promptText: string,
      requestId: string,
      conversationId: string,
      history: ConversationTurn[],
      forceSuccessOnRetry = false
    ) => {
      mockTimeoutRef.current.forEach(clearTimeout);
      mockTimeoutRef.current = [];

      thoughtsRef.current = [];
      toolCallsRef.current = [];
      streamingTextRef.current = '';
      activeConversationIdRef.current = conversationId;

      const scenario = resolveMockScenario(
        forceSuccessOnRetry ? '본점 에비뉴엘 명품관 층별 입점 브랜드 안내해줘' : promptText,
        history
      );

      setState((prev) => ({
        ...prev,
        currentStage: 'reasoning',
        stageMessage: scenario.stageMessages.reasoning,
        thoughts: [],
        toolCalls: [],
        streamingText: '',
        streamingThreadId: conversationId,
        metrics: null,
        error: null,
        isRetryable: false,
      }));

      const timers: ReturnType<typeof setTimeout>[] = [];
      let timelineCursor = 0;

      // Step A: Reasoning / Thought Steps 순차 방출
      handleServerPacket({
        type: 'stage.transition',
        requestId,
        conversationId,
        timestamp: Date.now(),
        payload: {
          previousStage: 'idle',
          currentStage: 'reasoning',
          message: scenario.stageMessages.reasoning,
        },
      });

      scenario.thoughts.forEach((thoughtItem, idx) => {
        timers.push(
          setTimeout(() => {
            handleServerPacket({
              type: 'thought.stream',
              requestId,
              conversationId,
              timestamp: Date.now(),
              payload: {
                step: thoughtItem.step,
                topic: thoughtItem.topic,
                delta: thoughtItem.content,
              },
            });
          }, idx * 280)
        );
        timelineCursor = (idx + 1) * 280;
      });

      // Step B: Tool Calling (단일 또는 다중 도구 순차 호출 및 반환)
      if (scenario.tools.length > 0) {
        timers.push(
          setTimeout(() => {
            handleServerPacket({
              type: 'stage.transition',
              requestId,
              conversationId,
              timestamp: Date.now(),
              payload: {
                previousStage: 'reasoning',
                currentStage: 'tool_calling',
                message: scenario.stageMessages.toolCalling,
              },
            });
          }, timelineCursor + 100)
        );
        timelineCursor += 150;

        scenario.tools.forEach((toolSim) => {
          const invokeTime = timelineCursor;
          timers.push(
            setTimeout(() => {
              handleServerPacket({
                type: 'tool.invoke',
                requestId,
                conversationId,
                timestamp: Date.now(),
                payload: {
                  toolId: toolSim.toolId,
                  toolName: toolSim.toolName,
                  arguments: toolSim.arguments,
                  timestamp: Date.now(),
                },
              });
            }, invokeTime)
          );

          const resultTime = invokeTime + Math.min(toolSim.executionMs + 180, 450);
          timers.push(
            setTimeout(() => {
              handleServerPacket({
                type: 'tool.result',
                requestId,
                conversationId,
                timestamp: Date.now(),
                payload: {
                  toolId: toolSim.toolId,
                  toolName: toolSim.toolName,
                  status: toolSim.status,
                  result: toolSim.result,
                  error: toolSim.error,
                  executionMs: toolSim.executionMs,
                  timestamp: Date.now(),
                },
              });
            }, resultTime)
          );

          timelineCursor = resultTime + 120;
        });
      }

      // Step C: 에러 시뮬레이션인 경우 stream.error 방출 후 종료
      if (scenario.simulateError && !forceSuccessOnRetry) {
        const errPayload = scenario.simulateError;
        timers.push(
          setTimeout(() => {
            handleServerPacket({
              type: 'stream.error',
              requestId,
              conversationId,
              timestamp: Date.now(),
              payload: errPayload,
            });
          }, timelineCursor + 150)
        );
        mockTimeoutRef.current = timers;
        return;
      }

      // Step D: 정상 토큰 스트리밍 방출
      const tokens = scenario.answer.split('');
      const startTime = Date.now();
      const streamStartOffset = timelineCursor + 100;

      timers.push(
        setTimeout(() => {
          handleServerPacket({
            type: 'stage.transition',
            requestId,
            conversationId,
            timestamp: Date.now(),
            payload: {
              previousStage: 'tool_calling',
              currentStage: 'generating',
              message: scenario.stageMessages.generating,
            },
          });
        }, streamStartOffset)
      );

      tokens.forEach((token, index) => {
        timers.push(
          setTimeout(() => {
            handleServerPacket({
              type: 'token.stream',
              requestId,
              conversationId,
              timestamp: Date.now(),
              payload: {
                sequence: index + 1,
                delta: token,
              },
            });

            if (index === tokens.length - 1) {
              const elapsedMs = Date.now() - startTime;
              const promptTokenCount = Math.max(48, promptText.length * 2 + history.length * 24);
              handleServerPacket({
                type: 'stage.transition',
                requestId,
                conversationId,
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
                conversationId,
                timestamp: Date.now(),
                payload: {
                  finalText: scenario.answer,
                  metrics: {
                    promptTokens: promptTokenCount,
                    completionTokens: tokens.length,
                    totalTokens: promptTokenCount + tokens.length,
                    elapsedMs,
                    timeToFirstTokenMs: streamStartOffset,
                    tokensPerSec: Math.round((tokens.length / (elapsedMs / 1000)) * 10) / 10,
                    latencyMs: 52,
                  },
                },
              });
            }
          }, streamStartOffset + 40 + index * 12)
        );
      });

      mockTimeoutRef.current = timers;
    },
    [handleServerPacket]
  );

  // 4. 프롬프트 발송 함수 (스레드 ID 및 멀티턴 히스토리 바인딩)
  const sendPrompt = useCallback(
    (
      promptText: string,
      conversationId = 'conv_default',
      history: ConversationTurn[] = []
    ) => {
      if (!promptText.trim()) return;
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      currentRequestIdRef.current = requestId;
      activeConversationIdRef.current = conversationId;
      lastSubmissionRef.current = { promptText, conversationId, history };

      if (mockMode) {
        runMockSimulation(promptText, requestId, conversationId, history, false);
        return;
      }

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setState((prev) => ({
          ...prev,
          streamingThreadId: conversationId,
          currentStage: 'error',
          error: '[INTERNAL_SERVER_ERROR] WebSocket 서버가 연결되지 않은 상태입니다.',
          isRetryable: true,
        }));
        return;
      }

      thoughtsRef.current = [];
      toolCallsRef.current = [];
      streamingTextRef.current = '';

      const packet: ClientPacket = {
        type: 'prompt.submit',
        requestId,
        conversationId,
        timestamp: Date.now(),
        payload: {
          prompt: promptText,
          history: history.slice(-10), // 최근 10턴 컨텍스트 전달
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
        streamingThreadId: conversationId,
        metrics: null,
        error: null,
        isRetryable: false,
      }));

      wsRef.current.send(JSON.stringify(packet));
    },
    [mockMode, runMockSimulation]
  );

  // 5. 에러 발생 후 재시도 (Retry)
  const retryLastPrompt = useCallback(() => {
    const last = lastSubmissionRef.current;
    if (!last) return;

    const requestId = `req_retry_${Date.now()}`;
    currentRequestIdRef.current = requestId;

    if (mockMode) {
      // Mock 장애 테스트 후 재시도 시 정상 복구 시뮬레이션 수행
      runMockSimulation(last.promptText, requestId, last.conversationId, last.history, true);
      return;
    }

    sendPrompt(last.promptText, last.conversationId, last.history);
  }, [mockMode, runMockSimulation, sendPrompt]);

  // 6. 프롬프트 생성 취소 (Cancel)
  const cancelPrompt = useCallback(() => {
    if (mockMode) {
      mockTimeoutRef.current.forEach(clearTimeout);
      mockTimeoutRef.current = [];
      setState((prev) => ({
        ...prev,
        currentStage: 'cancelled',
        streamingThreadId: null,
        stageMessage: '생성이 취소되었습니다.',
      }));
      return;
    }

    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      currentRequestIdRef.current
    ) {
      const cancelPacket: ClientPacket = {
        type: 'prompt.cancel',
        requestId: currentRequestIdRef.current,
        conversationId: activeConversationIdRef.current,
        timestamp: Date.now(),
        payload: {
          reason: 'user_cancelled',
        },
      };
      wsRef.current.send(JSON.stringify(cancelPacket));
      setState((prev) => ({
        ...prev,
        currentStage: 'cancelled',
        streamingThreadId: null,
        stageMessage: '생성이 취소되었습니다.',
      }));
    }
  }, [mockMode]);

  useEffect(() => {
    reconnectAttemptsRef.current = 0;
    connect();

    return () => {
      clearHeartbeat();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      mockTimeoutRef.current.forEach(clearTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, clearHeartbeat]);

  return {
    ...state,
    sendPrompt,
    retryLastPrompt,
    cancelPrompt,
    reconnect: () => {
      reconnectAttemptsRef.current = 0;
      connect();
    },
  };
}
