import React, { useState, useCallback } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const PRESET_QUERIES = [
  '본점 에비뉴엘 명품관 층별 입점 브랜드 안내해줘',
  'AVENUEL VIP 라운지 이용 자격 및 발레파킹 혜택',
  '이번 주말 롯데상품권 사은행사 기준 알려줘',
];

export const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({ onSendMessage, disabled = false }) => {
    const [input, setInput] = useState('');

    const handleSubmit = useCallback(
      (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || disabled) return;
        onSendMessage(input.trim());
        setInput('');
      },
      [input, disabled, onSendMessage]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    const handleSelectPreset = useCallback(
      (query: string) => {
        if (disabled) return;
        onSendMessage(query);
      },
      [disabled, onSendMessage]
    );

    return (
      <div className="border-t border-lotte-border bg-lotte-surface p-4 sm:p-5">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* 사전 정의된 추천 질문 칩 */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-medium text-lotte-muted">추천 질문:</span>
            {PRESET_QUERIES.map((query, idx) => (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectPreset(query)}
                className="rounded-full border border-lotte-border bg-lotte-background px-2.5 py-1 text-xs text-lotte-dark hover:border-lotte-red/40 hover:bg-lotte-red-light/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-red disabled:opacity-50"
              >
                {query}
              </button>
            ))}
          </div>

          {/* 입력창 폼 */}
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder="롯데백화점 관련 질문이나 요청사항을 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
                rows={2}
                className="w-full resize-none rounded-lg border border-lotte-border bg-white px-3.5 py-2.5 text-sm text-lotte-dark placeholder:text-gray-400 focus:border-lotte-red focus:outline-none focus:ring-1 focus:ring-lotte-red disabled:bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className="flex h-11 items-center justify-center rounded-lg bg-lotte-red px-4 text-sm font-semibold text-white shadow-2xs hover:bg-lotte-red-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-red focus-visible:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-1.5" />
              <span>전송</span>
              <CornerDownLeft className="h-3 w-3 ml-1 opacity-70" />
            </button>
          </form>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
