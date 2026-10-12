/**
 * Tenduck Custom LLM Client ↔ Backend WebSocket Protocol Schema
 * 커스텀 LLM 모델 및 오케스트레이터와의 실시간 양방향 통신 타입 정의
 */

// 1. AI 처리 단계 (Lifecycle Stages)
export type AIProcessingStage =
  | 'idle'           // 대기 상태
  | 'connecting'     // 소켓/인증 핸드셰이크 중
  | 'planning'       // 초기 작업 계획 수립 중
  | 'reasoning'      // 내부 사고 및 추론 중 (Thinking)
  | 'tool_calling'   // 외부 API / 사내 DB 함수 실행 중
  | 'generating'     // 사용자 노출 텍스트 토큰 스트리밍 중
  | 'completed'      // 스트림 정상 완료
  | 'error'          // 에러 발생
  | 'cancelled';     // 사용자 취소

// 2. 도구 호출(Tool Calling) 상세 데이터 모델
export interface ToolCallInvocation {
  toolId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: number;
}

export interface ToolCallResult {
  toolId: string;
  toolName: string;
  status: 'success' | 'failure';
  result?: string;
  error?: string;
  executionMs: number;
  timestamp: number;
}

export interface ToolCallEvent {
  toolId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: 'invoking' | 'success' | 'failure';
  result?: string;
  error?: string;
  executionMs?: number;
}

// 3. 내부 사고 과정 (Thought / Chain of Thought) 모델
export interface ThoughtStep {
  step: number;
  topic?: string;
  content: string;
  timestamp: number;
}

// 4. 성능 및 토큰 통계 메트릭
export interface LiveStreamMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  elapsedMs: number;
  timeToFirstTokenMs?: number;
  tokensPerSec: number;
  latencyMs?: number;
}

// 5. 프론트엔드 채팅 메시지 모델
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  stage?: AIProcessingStage;
  thoughts?: ThoughtStep[];
  toolCalls?: ToolCallEvent[];
  metrics?: LiveStreamMetrics;
  isStreaming?: boolean;
}

// 6. 스레드 (대화 세션 및 컨텍스트 영속성) 모델
export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  contextSummary?: string;
  metadata?: {
    model?: string;
    temperature?: number;
    totalTokensUsed?: number;
    pinned?: boolean;
  };
}

// ============================================================================
// WebSocket 양방향 패킷 정의 (Client ↔ Server Packets)
// ============================================================================

// --- [클라이언트 → 서버 발송 패킷] ---
export type ClientPacket =
  | {
      type: 'connection.init';
      timestamp: number;
      payload: {
        authToken?: string;
        clientVersion: string;
        clientId: string;
      };
    }
  | {
      type: 'heartbeat.ping';
      timestamp: number;
      payload: {
        pingId: string;
      };
    }
  | {
      type: 'prompt.submit';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        prompt: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        showThinking?: boolean;
        allowedTools?: string[];
      };
    }
  | {
      type: 'prompt.cancel';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        reason: string;
      };
    };

// --- [서버 → 클라이언트 수신 패킷] ---
export type ServerPacket =
  | {
      type: 'connection.ack';
      timestamp: number;
      payload: {
        sessionId: string;
        modelVersion: string;
        serverTime: number;
        heartbeatIntervalMs: number;
        supportedTools: string[];
      };
    }
  | {
      type: 'heartbeat.pong';
      timestamp: number;
      payload: {
        pingId: string;
        serverTime: number;
      };
    }
  | {
      type: 'stage.transition';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        previousStage: AIProcessingStage;
        currentStage: AIProcessingStage;
        message?: string;
      };
    }
  | {
      type: 'thought.stream';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        step: number;
        topic?: string;
        delta: string;
      };
    }
  | {
      type: 'tool.invoke';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: ToolCallInvocation;
    }
  | {
      type: 'tool.result';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: ToolCallResult;
    }
  | {
      type: 'token.stream';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        sequence: number;
        delta: string;
      };
    }
  | {
      type: 'stream.complete';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        finalText: string;
        metrics: LiveStreamMetrics;
      };
    }
  | {
      type: 'stream.error';
      requestId: string;
      conversationId: string;
      timestamp: number;
      payload: {
        code:
          | 'AUTH_FAILED'
          | 'RATE_LIMIT_EXCEEDED'
          | 'MODEL_TIMEOUT'
          | 'CONTEXT_LENGTH_EXCEEDED'
          | 'TOOL_EXECUTION_ERROR'
          | 'INTERNAL_SERVER_ERROR';
        message: string;
        retryable: boolean;
      };
    };
