import React, { useState, useCallback } from 'react';
import { Send, CornerDownLeft, Square } from 'lucide-react';
import { PRESET_SCENARIOS } from '../mocks/mockScenarios';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({ onSendMessage, onCancel, disabled = false, isGenerating = false }) => {
    const [input, setInput] = useState('');

    const handleSubmit = useCallback(
      (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isGenerating) {
          onCancel?.();
          return;
        }
        if (!input.trim() || disabled) return;
        onSendMessage(input.trim());
        setInput('');
      },
      [input, disabled, isGenerating, onCancel, onSendMessage]
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
        if (disabled || isGenerating) return;
        onSendMessage(query);
      },
      [disabled, isGenerating, onSendMessage]
    );

    return (
      <div className="border-t border-lotte-border bg-lotte-surface p-4 sm:p-5">
        <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl space-y-3">
          {/* 사전 정의된 시나리오 추천 칩 */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-medium text-lotte-muted">시나리오 테스트:</span>
            {PRESET_SCENARIOS.map((scenario) => {
              const isErrorSim = Boolean(scenario.simulateError);
              return (
                <button
                  key={scenario.id}
                  type="button"
                  disabled={disabled || isGenerating}
                  onClick={() => handleSelectPreset(scenario.presetPrompt)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                    isErrorSim
                      ? 'border-lotte-red/30 bg-lotte-red-light/50 text-lotte-red hover:border-lotte-red hover:bg-lotte-red-light focus-visible:ring-lotte-red'
                      : 'border-lotte-border bg-lotte-background text-lotte-dark hover:border-lotte-gold/60 hover:bg-lotte-gold-light focus-visible:ring-lotte-gold'
                  }`}
                >
                  {scenario.label}
                </button>
              );
            })}
          </div>

          {/* 입력창 폼 */}
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled && !isGenerating}
                placeholder={
                  isGenerating
                    ? 'AI가 실시간 답변을 생성하고 있습니다...'
                    : '롯데백화점 관련 질문이나 요청사항을 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)'
                }
                rows={2}
                className="w-full resize-none rounded-lg border border-lotte-border bg-white px-3.5 py-2.5 text-sm text-lotte-dark placeholder:text-gray-400 focus:border-lotte-gold focus:outline-none focus:ring-1 focus:ring-lotte-gold disabled:bg-gray-50"
              />
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex h-11 items-center justify-center rounded-lg border border-lotte-red bg-lotte-red-light px-4 text-sm font-semibold text-lotte-red shadow-2xs hover:bg-lotte-red hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-red"
              >
                <Square className="h-4 w-4 mr-1.5 fill-current" />
                <span>중단</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={disabled || !input.trim()}
                className="flex h-11 items-center justify-center rounded-lg bg-lotte-gold px-4 text-sm font-semibold text-white shadow-2xs hover:bg-lotte-gold-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-gold focus-visible:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-1.5" />
                <span>전송</span>
                <CornerDownLeft className="h-3 w-3 ml-1 opacity-70" />
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
