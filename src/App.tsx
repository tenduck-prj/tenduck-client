import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { LiveProcessViewer } from './components/LiveProcessViewer';
import { ChatInput } from './components/ChatInput';
import { useWebSocketLLM } from './hooks/useWebSocketLLM';
import { useOptimizedStreaming } from './hooks/useOptimizedStreaming';
import { ChatMessage } from './types/llm';

export default function App() {
  const [mockMode, setMockMode] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 1. WebSocket 및 LLM 통신 훅
  const {
    isConnected,
    isConnecting,
    currentStage,
    stageMessage,
    thoughts,
    toolCalls,
    streamingText,
    metrics,
    sendPrompt,
    reconnect,
  } = useWebSocketLLM({
    mockMode,
    onComplete: ({ text, metrics }) => {
      // 응답 완료 시 영구 메시지 목록에 추가
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
          metrics: metrics || undefined,
        },
      ]);
    },
  });

  // 2. 성능 최적화 훅 (useTransition, useDeferredValue, useMemo, useCallback)
  const {
    deferredText,
    copyToClipboard,
  } = useOptimizedStreaming({
    rawStreamingText: streamingText,
    thoughts,
    toolCalls,
  });

  // 3. 메시지 발송 핸들러
  const handleSendMessage = useCallback(
    (promptText: string) => {
      // 유저 메시지 즉시 추가
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_user_${Date.now()}`,
          role: 'user',
          content: promptText,
          timestamp: Date.now(),
        },
      ]);

      // 웹소켓 프롬프트 전송
      sendPrompt(promptText);
    },
    [sendPrompt]
  );

  const isGenerating =
    currentStage === 'planning' ||
    currentStage === 'reasoning' ||
    currentStage === 'tool_calling' ||
    currentStage === 'generating';

  return (
    <div className="flex h-screen flex-col bg-lotte-background font-sans text-lotte-dark selection:bg-lotte-red/10 selection:text-lotte-red">
      {/* 상단 글로벌 헤더 */}
      <Header
        isConnected={isConnected}
        isConnecting={isConnecting}
        mockMode={mockMode}
        onToggleMockMode={() => setMockMode((prev) => !prev)}
        onReconnect={reconnect}
      />

      {/* 메인 2단 작업 영역 (좌: 대화창 / 우: AI 라이브 프로세스 콘솔) */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden p-3 gap-3 sm:p-5 sm:gap-5">
        {/* 좌측: 실시간 대화창 (65%) */}
        <section className="flex flex-1 flex-col rounded-lg border border-lotte-border bg-lotte-surface shadow-2xs overflow-hidden">
          <MessageList
            messages={messages}
            streamingText={deferredText}
            isStreaming={isGenerating}
            onCopy={copyToClipboard}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isGenerating}
          />
        </section>

        {/* 우측: 실시간 AI 사고 및 도구 콘솔 (35%) */}
        <section className="hidden w-80 lg:flex lg:w-96 flex-col">
          <LiveProcessViewer
            currentStage={currentStage}
            stageMessage={stageMessage}
            thoughts={thoughts}
            toolCalls={toolCalls}
            metrics={metrics}
          />
        </section>
      </main>
    </div>
  );
}
