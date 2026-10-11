import React from 'react';
import { Copy, Check, User, Bot } from 'lucide-react';
import { ChatMessage } from '../types/llm';

interface MessageListProps {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  onCopy: (text: string) => Promise<boolean>;
}

export const MessageList: React.FC<MessageListProps> = React.memo(
  ({ messages, streamingText, isStreaming, onCopy }) => {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = async (id: string, text: string) => {
      const ok = await onCopy(text);
      if (ok) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    };

    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 sm:px-6">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="h-12 w-12 rounded-full bg-lotte-red-light flex items-center justify-center mb-4 text-lotte-red">
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
                    : 'bg-lotte-red text-white shadow-2xs'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : 'LT'}
              </div>

              {/* 메시지 내용 */}
              <div
                className={`group relative max-w-2xl rounded-lg p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-lotte-dark text-white'
                    : 'border border-lotte-border bg-lotte-surface text-lotte-dark shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

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

        {/* 현재 실시간 스트리밍 중인 메시지 */}
        {isStreaming && streamingText && (
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-lotte-red text-white text-xs font-bold shadow-2xs">
              LT
            </div>
            <div className="relative max-w-2xl rounded-lg border border-lotte-red/30 bg-lotte-surface p-4 text-sm leading-relaxed text-lotte-dark shadow-2xs">
              <div className="whitespace-pre-wrap">{streamingText}</div>
              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-lotte-red animate-pulse" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
