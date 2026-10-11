export type AIProcessingStage =
  | 'idle'
  | 'connecting'
  | 'planning'
  | 'reasoning'
  | 'tool_calling'
  | 'generating'
  | 'completed'
  | 'error';

export interface ToolCallEvent {
  toolId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: 'invoking' | 'success' | 'failure';
  result?: string;
}

export interface ThoughtStep {
  step: number;
  content: string;
  timestamp: number;
}

export interface LiveStreamMetrics {
  totalTokens: number;
  elapsedMs: number;
  tokensPerSec: number;
  latencyMs?: number;
}

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

// WebSocket Packet Contracts
export type ClientPacket = {
  type: 'request.prompt';
  requestId: string;
  timestamp: number;
  payload: {
    prompt: string;
    temperature?: number;
    showThought?: boolean;
  };
};

export type ServerPacket =
  | {
      type: 'status.stage';
      requestId: string;
      payload: {
        stage: AIProcessingStage;
        message?: string;
      };
    }
  | {
      type: 'stream.thought';
      requestId: string;
      payload: {
        delta: string;
        step: number;
      };
    }
  | {
      type: 'event.tool_call';
      requestId: string;
      payload: ToolCallEvent;
    }
  | {
      type: 'stream.token';
      requestId: string;
      payload: {
        delta: string;
      };
    }
  | {
      type: 'stream.done';
      requestId: string;
      payload: LiveStreamMetrics;
    }
  | {
      type: 'stream.error';
      requestId: string;
      payload: {
        code: string;
        message: string;
      };
    };
