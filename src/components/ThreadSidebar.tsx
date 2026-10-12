import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { Thread } from '../types/llm';

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onCreateThread: () => void;
  onSwitchThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export const ThreadSidebar: React.FC<ThreadSidebarProps> = React.memo(
  ({
    threads,
    activeThreadId,
    isOpen,
    onCreateThread,
    onSwitchThread,
    onDeleteThread,
    onUpdateTitle,
  }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editInput, setEditInput] = useState('');

    const handleStartEdit = (t: Thread, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(t.id);
      setEditInput(t.title);
    };

    const handleSaveEdit = (id: string, e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (editInput.trim()) {
        onUpdateTitle(id, editInput.trim());
      }
      setEditingId(null);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteThread(id);
    };

    if (!isOpen) {
      return null;
    }

    return (
      <aside className="flex flex-col w-64 md:w-72 shrink-0 rounded-lg border border-lotte-border bg-lotte-surface shadow-2xs overflow-hidden transition-all duration-200">
        {/* 상단 액션: 새 대화 시작 버튼 */}
        <div className="p-3 border-b border-lotte-border bg-lotte-background/50">
          <button
            type="button"
            onClick={() => onCreateThread()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-lotte-gold px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-lotte-gold-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-gold"
          >
            <Plus className="h-4 w-4" />
            <span>새 대화 시작</span>
          </button>
        </div>

        {/* 스레드 목록 섹션 헤더 */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-lotte-border/60 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-lotte-muted">
            대화 기록 ({threads.length})
          </span>
          <span className="text-[10px] text-lotte-muted font-mono">Context Stored</span>
        </div>

        {/* 스레드 리스트 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-xs text-lotte-muted">
              저장된 대화 기록이 없습니다.
            </div>
          ) : (
            threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const isEditing = editingId === thread.id;

              return (
                <div
                  key={thread.id}
                  onClick={() => onSwitchThread(thread.id)}
                  className={`group relative flex items-center justify-between rounded-md px-3 py-2.5 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-lotte-gold-light border border-lotte-gold-border font-semibold text-lotte-gold-dark shadow-2xs'
                      : 'border border-transparent text-lotte-dark hover:bg-lotte-background hover:text-lotte-dark'
                  }`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveEdit(thread.id, e)}
                      className="flex flex-1 items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="w-full rounded border border-lotte-gold px-1.5 py-0.5 text-xs text-lotte-dark focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                        title="저장"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="취소"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <MessageSquare
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isActive ? 'text-lotte-gold-dark' : 'text-lotte-muted'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs">
                            {typeof thread.title === 'string' ? thread.title : '새로운 대화'}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-lotte-muted mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(thread.updatedAt).toLocaleDateString('ko-KR', {
                                month: 'numeric',
                                day: 'numeric',
                              })}
                            </span>
                            <span>·</span>
                            <span>{thread.messages.length}개 대화</span>
                          </div>
                        </div>
                      </div>

                      {/* 호버 시 표시되는 액션 버튼 (이름 변경, 삭제) */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(thread, e)}
                          className="p-1 text-lotte-muted hover:text-lotte-dark rounded hover:bg-white"
                          title="제목 변경"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(thread.id, e)}
                          className="p-1 text-lotte-muted hover:text-lotte-red rounded hover:bg-white"
                          title="스레드 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 하단 푸터: 컨텍스트 영속성 안내 */}
        <div className="border-t border-lotte-border bg-lotte-background/60 p-2.5 text-center text-[10px] text-lotte-muted">
          <span>대화 내용과 컨텍스트가 로컬에 안전하게 보관됩니다.</span>
        </div>
      </aside>
    );
  }
);

ThreadSidebar.displayName = 'ThreadSidebar';
