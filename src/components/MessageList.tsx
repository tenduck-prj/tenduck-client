import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  User,
  Bot,
  Brain,
  Wrench,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { ChatMessage, AIProcessingStage, ThoughtStep, ToolCallEvent } from '../types/llm';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageListProps {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  currentStage?: AIProcessingStage;
  stageMessage?: string;
  liveThoughts?: ThoughtStep[];
  liveToolCalls?: ToolCallEvent[];
  onCopy: (text: string) => Promise<boolean>;
}

export const MessageList: React.FC<MessageListProps> = React.memo(
  ({
    messages,
    streamingText,
    isStreaming,
    currentStage = 'idle',
    stageMessage = '',
    liveThoughts = [],
    liveToolCalls = [],
    onCopy,
  }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [openThoughtIds, setOpenThoughtIds] = useState<Record<string, boolean>>({});
    const [isLiveThoughtOpen, setIsLiveThoughtOpen] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // 새 메시지 및 스트리밍 시 스크롤 자동 이동
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText, isStreaming]);

    const handleCopy = async (id: string, text: string) => {
      const ok = await onCopy(text);
      if (ok) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    };

    const toggleThought = (id: string) => {
      setOpenThoughtIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 sm:px-6">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="h-12 w-12 rounded-full bg-lotte-gold-light flex items-center justify-center mb-4 text-lotte-gold-dark border border-lotte-gold-border">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-lotte-dark">
              롯데백화점 커스텀 LLM 컨시어지
            </h3>
            <p className="mt-1 max-w-sm text-xs text-lotte-muted leading-relaxed">
              점포 안내, 입점 브랜드, VIP 혜택, 행사 정보 등 궁금한 점을 입력하시면
              실시간 AI 사고 과정과 함께 최적의 답변을 안내해 드립니다.
            </p>
          </div>
        )}

        {/* 기존 메시지 목록 */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasThoughts = msg.thoughts && msg.thoughts.length > 0;
          const hasTools = msg.toolCalls && msg.toolCalls.length > 0;
          const isThoughtExpanded = !!openThoughtIds[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}
            >
              {/* 아바타 */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-bold ${
                  isUser
                    ? 'bg-lotte-dark text-white'
                    : 'bg-lotte-gold text-white shadow-2xs'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : 'LT'}
              </div>

              {/* 메시지 내용 */}
              <div
                className={`group relative max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-lg p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-lotte-dark text-white'
                    : 'border border-lotte-border bg-lotte-surface text-lotte-dark shadow-2xs'
                }`}
              >
                {/* AI 응답 내 저장된 사고 과정 & 도구 호출 아코디언 */}
                {!isUser && (hasThoughts || hasTools) && (
                  <div className="mb-3 rounded border border-lotte-gold-border/60 bg-lotte-gold-light/40 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => toggleThought(msg.id)}
                      className="flex w-full items-center justify-between px-2.5 py-1.5 text-left font-medium text-lotte-gold-dark hover:bg-lotte-gold-light/80"
                    >
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3 w-3 text-lotte-gold-dark" />
                        <span>사고 과정 및 도구 호출 기록 ({msg.thoughts?.length || 0}건)</span>
                      </div>
                      {isThoughtExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>

                    {isThoughtExpanded && (
                      <div className="border-t border-lotte-gold-border/40 p-2.5 space-y-2 font-mono text-[11px] bg-white/70">
                        {msg.thoughts?.map((t, idx) => (
                          <div key={idx} className="border-l-2 border-lotte-gold pl-2 py-0.5 whitespace-pre-wrap text-gray-700">
                            {t.content}
                          </div>
                        ))}
                        {msg.toolCalls?.map((tool, idx) => (
                          <div key={idx} className="rounded bg-blue-50 border border-blue-100 p-1.5 text-blue-900">
                            <span className="font-bold">[{tool.toolName}]</span> {tool.result}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 본문 텍스트 (사용자는 일반 텍스트, AI는 마크다운 서식 적용) */}
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {/* 복사 버튼 (AI 메시지 전용) */}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-lotte-background text-lotte-muted hover:text-lotte-dark focus-visible:opacity-100"
                    title="메시지 복사"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 현재 실시간 스트리밍 중인 메시지 (텍스트 수신 전이라도 즉시 표시) */}
        {isStreaming && (
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-lotte-gold text-white text-xs font-bold shadow-2xs">
              LT
            </div>
            <div className="relative max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 rounded-lg border border-lotte-gold/50 bg-lotte-surface p-4 text-sm leading-relaxed text-lotte-dark shadow-2xs space-y-3">
              {/* 실시간 추론(Thinking) 및 상태 배너 */}
              <div className="rounded-md border border-lotte-gold-border bg-lotte-gold-light/60 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setIsLiveThoughtOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-lotte-gold-dark hover:bg-lotte-gold-light"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-lotte-gold-dark" />
                    <span className="font-semibold">
                      {currentStage === 'reasoning'
                        ? 'AI가 고객 질문을 분석하고 생각 중입니다...'
                        : currentStage === 'tool_calling'
                        ? '롯데백화점 사내 데이터 도구를 호출하고 있습니다...'
                        : currentStage === 'generating'
                        ? '답변 생성 중...'
                        : '요청을 처리하고 있습니다...'}
                    </span>
                  </div>
                  {isLiveThoughtOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-lotte-gold-dark" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-lotte-gold-dark" />
                  )}
                </button>

                {isLiveThoughtOpen && (
                  <div className="border-t border-lotte-gold-border/60 p-3 bg-white/80 space-y-2 font-mono text-[11px] max-h-40 overflow-y-auto">
                    {liveThoughts.length === 0 ? (
                      <p className="text-lotte-muted italic">생각 과정을 수립하는 중...</p>
                    ) : (
                      liveThoughts.map((t, idx) => (
                        <div key={idx} className="border-l-2 border-lotte-gold pl-2 py-0.5 whitespace-pre-wrap text-gray-700">
                          {t.content}
                        </div>
                      ))
                    )}
                    {liveToolCalls.map((tool) => (
                      <div key={tool.toolId} className="rounded bg-blue-50 border border-blue-100 p-2 text-blue-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Wrench className="h-3 w-3" />
                          <span>{tool.toolName}</span>
                          <span className="text-[10px] bg-blue-200/60 text-blue-800 px-1 rounded">{tool.status}</span>
                        </div>
                        {tool.result && <div className="mt-1 text-emerald-800">결과: {tool.result}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 실시간 텍스트 스트리밍 영역 (마크다운 실시간 서식 반영) */}
              {streamingText ? (
                <div>
                  <MarkdownRenderer content={streamingText} />
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-lotte-red animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-lotte-muted pt-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-lotte-gold animate-ping" />
                  <span>{stageMessage || '답변 작성을 시작하고 있습니다...'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
