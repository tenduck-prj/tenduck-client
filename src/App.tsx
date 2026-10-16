import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ThreadSidebar } from './components/ThreadSidebar';
import { MessageList } from './components/MessageList';
import { LiveProcessViewer } from './components/LiveProcessViewer';
import { ChatInput } from './components/ChatInput';
import { useWebSocketLLM } from './hooks/useWebSocketLLM';
import { useOptimizedStreaming } from './hooks/useOptimizedStreaming';
import { useThreadManager } from './hooks/useThreadManager';
import { ConversationTurn } from './types/llm';

export default function App() {
  const [mockMode, setMockMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // 1. 스레드 및 대화 컨텍스트 매니저 훅 (localStorage 자동 영속성)
  const {
    threads,
    activeThreadId,
    activeMessages,
    createThread,
    switchThread,
    deleteThread,
    updateThreadTitle,
    addMessageToThread,
    addMessageToActiveThread,
  } = useThreadManager();

  // 2. WebSocket 및 LLM 통신 훅 (스레드 격리 및 멀티턴 컨텍스트 지원)
  const {
    isConnected,
    isConnecting,
    currentStage,
    stageMessage,
    thoughts,
    toolCalls,
    streamingText,
    metrics,
    error,
    isRetryable,
    streamingThreadId,
    wsLatencyMs,
    sendPrompt,
    retryLastPrompt,
    cancelPrompt,
    reconnect,
  } = useWebSocketLLM({
    mockMode,
    onComplete: ({
      conversationId,
      text,
      metrics: finalMetrics,
      thoughts: finalThoughts,
      toolCalls: finalTools,
    }) => {
      // 스트리밍 중 사용자가 다른 스레드로 전환했더라도 요청이 시작된 원본 스레드에 정확히 저장
      const targetId = conversationId || activeThreadId;
      addMessageToThread(targetId, {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
        metrics: finalMetrics || undefined,
        thoughts: finalThoughts.length > 0 ? finalThoughts : undefined,
        toolCalls: finalTools.length > 0 ? finalTools : undefined,
      });
    },
  });

  // 3. 성능 최적화 훅 (useTransition, useDeferredValue, useMemo, useCallback)
  const { deferredText, copyToClipboard } = useOptimizedStreaming({
    rawStreamingText: streamingText,
    thoughts,
    toolCalls,
  });

  // 4. 사용자 메시지 발송 핸들러 (이전 대화 맥락 history를 함께 전달)
  const handleSendMessage = useCallback(
    (promptText: string) => {
      // 현재 활성 스레드의 이전 대화 내역을 멀티턴 컨텍스트로 변환
      const history: ConversationTurn[] = activeMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      // 1) 활성 스레드에 사용자 메시지 저장
      addMessageToActiveThread({
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: promptText,
        timestamp: Date.now(),
      });

      // 2) 웹소켓(또는 멀티 시나리오 목업 엔진)으로 스레드 ID 및 컨텍스트 히스토리 전송
      sendPrompt(promptText, activeThreadId, history);
    },
    [activeMessages, activeThreadId, addMessageToActiveThread, sendPrompt]
  );

  const isGenerating =
    currentStage === 'planning' ||
    currentStage === 'reasoning' ||
    currentStage === 'tool_calling' ||
    currentStage === 'generating';

  // 현재 보고 있는 스레드가 스트리밍 중인 스레드인지 판별 (스레드 격리 보장)
  const isCurrentThreadStreaming =
    isGenerating && (!streamingThreadId || streamingThreadId === activeThreadId);
  const currentThreadError =
    !streamingThreadId || streamingThreadId === activeThreadId ? error : null;

  return (
    <div className="flex h-screen flex-col bg-lotte-background font-sans text-lotte-dark selection:bg-lotte-gold/20 selection:text-lotte-gold-dark">
      {/* 상단 글로벌 헤더 */}
      <Header
        isConnected={isConnected}
        isConnecting={isConnecting}
        mockMode={mockMode}
        isSidebarOpen={isSidebarOpen}
        isConsoleOpen={isConsoleOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
        onToggleMockMode={() => setMockMode((prev) => !prev)}
        onReconnect={reconnect}
      />

      {/* 메인 작업 영역: [스레드 사이드바] + [대화창 (중앙)] + [AI 라이브 콘솔 (우측)] */}
      <main className="flex w-full flex-1 overflow-hidden p-2 gap-2 sm:p-3 sm:gap-3">
        {/* 1. 좌측: 스레드 히스토리 및 컨텍스트 관리 사이드바 */}
        <ThreadSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
          onCreateThread={createThread}
          onSwitchThread={switchThread}
          onDeleteThread={deleteThread}
          onUpdateTitle={updateThreadTitle}
        />

        {/* 2. 중앙: 활성 스레드의 실시간 대화창 (인라인 생각/도구 호출 및 에러 복구 포함) */}
        <section className="flex flex-1 flex-col rounded-lg border border-lotte-border bg-lotte-surface shadow-2xs overflow-hidden min-w-0">
          <MessageList
            messages={activeMessages}
            streamingText={isCurrentThreadStreaming ? deferredText : ''}
            isStreaming={isCurrentThreadStreaming}
            currentStage={currentStage}
            stageMessage={stageMessage}
            liveThoughts={thoughts}
            liveToolCalls={toolCalls}
            error={currentThreadError}
            isRetryable={isRetryable}
            onRetry={retryLastPrompt}
            onCopy={copyToClipboard}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            onCancel={cancelPrompt}
            disabled={isGenerating}
            isGenerating={isGenerating}
          />
        </section>

        {/* 3. 우측: 실시간 AI 사고 및 도구 콘솔 (토글 및 반응형) */}
        {isConsoleOpen && (
          <section className="w-80 lg:w-88 flex flex-col shrink-0">
            <LiveProcessViewer
              currentStage={currentStage}
              stageMessage={stageMessage}
              thoughts={thoughts}
              toolCalls={toolCalls}
              metrics={metrics}
              wsLatencyMs={wsLatencyMs}
            />
          </section>
        )}
      </main>
    </div>
  );
}
