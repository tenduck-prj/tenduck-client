import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { Thread, ChatMessage } from '../types/llm';

const STORAGE_KEY_THREADS = 'tenduck_threads_v1';
const STORAGE_KEY_ACTIVE_ID = 'tenduck_active_thread_id_v1';

const INITIAL_THREAD: Thread = {
  id: 'thread_default_welcome',
  title: '롯데백화점 컨시어지 안내',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
    {
      id: 'msg_welcome_init',
      role: 'assistant',
      content:
        '안녕하세요. 롯데백화점 프리미엄 AI 컨시어지입니다.\n본점 에비뉴엘 명품관, VIP 라운지 혜택, 행사 정보 등 무엇이든 질문해 주세요.',
      timestamp: Date.now(),
    },
  ],
};

export function useThreadManager() {
  const [isPending, startTransition] = useTransition();

  // 1. 로컬 스토리지에서 스레드 목록 로드 (데이터 무결성 방어 정제)
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THREADS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t) => ({
            ...t,
            // 객체나 비문자열이 title로 저장된 경우 문자열로 안전하게 복구
            title: typeof t.title === 'string' && t.title.trim() ? t.title : '새로운 대화',
            messages: Array.isArray(t.messages) ? t.messages : [],
            createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
            updatedAt: typeof t.updatedAt === 'number' ? t.updatedAt : Date.now(),
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load threads from localStorage:', err);
    }
    return [INITIAL_THREAD];
  });

  // 2. 활성 스레드 ID 로드
  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch (err) {
      console.warn('Failed to load active thread ID:', err);
    }
    return INITIAL_THREAD.id;
  });

  // 3. 스레드 변경 시 localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeThreadId);
    } catch (err) {
      console.warn('Failed to save threads to localStorage:', err);
    }
  }, [threads, activeThreadId]);

  // 4. 활성 스레드 객체 및 메시지 목록 (useMemo 캐싱)
  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0] || null;
  }, [threads, activeThreadId]);

  const activeMessages = useMemo(() => {
    return activeThread ? activeThread.messages : [];
  }, [activeThread]);

  // 5. 최근 활동순 정렬된 스레드 목록 (useMemo 캐싱)
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [threads]);

  // 6. 새 스레드 생성 (useCallback - MouseEvent 객체 오염 원천 차단)
  const createThread = useCallback((customTitle?: unknown) => {
    const titleString =
      typeof customTitle === 'string' && customTitle.trim()
        ? customTitle.trim()
        : '새로운 대화';

    const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newThread: Thread = {
      id: newThreadId,
      title: titleString,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThreadId);
    return newThreadId;
  }, []);

  // 7. 스레드 전환 (useTransition을 적용하여 UI 인터랙션 랙 방지)
  const switchThread = useCallback((targetId: string) => {
    startTransition(() => {
      setActiveThreadId(targetId);
    });
  }, []);

  // 8. 스레드 삭제 (useCallback)
  const deleteThread = useCallback(
    (targetId: string) => {
      setThreads((prev) => {
        const filtered = prev.filter((t) => t.id !== targetId);
        if (filtered.length === 0) {
          // 남은 스레드가 없으면 새 기본 스레드 생성
          const fresh = {
            id: `thread_${Date.now()}`,
            title: '새로운 대화',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
          };
          setActiveThreadId(fresh.id);
          return [fresh];
        }

        // 현재 활성 스레드가 삭제된 경우 첫 번째 스레드로 자동 전환
        if (activeThreadId === targetId) {
          setActiveThreadId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeThreadId]
  );

  // 9. 스레드 제목 수정 (useCallback)
  const updateThreadTitle = useCallback((threadId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, title: newTitle.trim(), updatedAt: Date.now() } : t))
    );
  }, []);

  // 10. 활성 스레드에 메시지 추가 (첫 질문 시 스레드 제목 자동 설정)
  const addMessageToActiveThread = useCallback(
    (message: ChatMessage) => {
      setThreads((prev) => {
        return prev.map((t) => {
          if (t.id === activeThreadId) {
            const isFirstUserMessage =
              t.messages.length === 0 && message.role === 'user' && t.title === '새로운 대화';

            const updatedTitle = isFirstUserMessage
              ? message.content.length > 20
                ? message.content.substring(0, 20) + '...'
                : message.content
              : t.title;

            return {
              ...t,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: [...t.messages, message],
            };
          }
          return t;
        });
      });
    },
    [activeThreadId]
  );

  // 11. 활성 스레드의 마지막 메시지 업데이트 또는 일괄 교체
  const updateActiveThreadMessages = useCallback(
    (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
      setThreads((prev) => {
        return prev.map((t) => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              updatedAt: Date.now(),
              messages: updater(t.messages),
            };
          }
          return t;
        });
      });
    },
    [activeThreadId]
  );

  return {
    threads: sortedThreads,
    activeThread,
    activeThreadId,
    activeMessages,
    isSwitching: isPending,
    createThread,
    switchThread,
    deleteThread,
    updateThreadTitle,
    addMessageToActiveThread,
    updateActiveThreadMessages,
  };
}
