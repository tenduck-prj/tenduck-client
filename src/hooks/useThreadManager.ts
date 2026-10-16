import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { Thread, ChatMessage } from '../types/llm';

const STORAGE_KEY_THREADS = 'tenduck_threads_v2';
const STORAGE_KEY_ACTIVE_ID = 'tenduck_active_thread_id_v2';

const now = Date.now();

export const INITIAL_SAMPLE_THREADS: Thread[] = [
  {
    id: 'thread_default_welcome',
    title: '롯데백화점 AI 컨시어지 종합 안내',
    createdAt: now - 1000 * 60 * 30,
    updatedAt: now - 1000 * 60 * 5,
    messages: [
      {
        id: 'msg_welcome_init',
        role: 'assistant',
        content:
          `안녕하세요. **롯데백화점 프리미엄 AI 컨시어지**입니다.\n\n` +
          `전국 주요 플래그십 점포(**본점 에비뉴엘, 잠실 월드타워점, 타임빌라스 수원, 부산본점·센텀시티점**)의 입점 브랜드, **2026 AVENUEL VIP 라운지 & 발레파킹**, **주말 사은행사**, **미쉐린 다이닝 & 웨이팅** 정보를 실시간으로 안내해 드립니다.\n\n` +
          `## 주요 안내 가능 항목\n` +
          `- **명품관 & 브랜드 조회**: 본점·잠실 에비뉴엘 층별 부티크, 롤렉스·샤넬·에르메스 워크인 안내\n` +
          `- **VIP 전용 컨시어지**: AVENUEL BLACK / EMERALD / PURPLE / ORANGE / GREEN 라운지 실시간 대기 및 발레파킹\n` +
          `- **주말 사은 & 웨딩마일리지**: 명품 7%~10% 롯데상품권 리워드 및 웨딩 더블 적립 계산\n` +
          `- **다이닝 & 편의시설**: 푸드에비뉴 디저트, 식당가 원격 웨이팅, 외국인 즉시 텍스리펀드(Tax Refund)\n\n` +
          `하단의 **시나리오 테스트 칩**을 클릭하시거나 궁금한 점을 자유롭게 입력해 보세요.`,
        timestamp: now - 1000 * 60 * 5,
      },
    ],
  },
  {
    id: 'thread_sample_wedding_avenuel',
    title: '본점 예물 투어 & 웨딩마일리지 계산',
    createdAt: now - 1000 * 60 * 180,
    updatedAt: now - 1000 * 60 * 45,
    messages: [
      {
        id: 'msg_sample_wed_1',
        role: 'user',
        content: '이번 주말에 본점 에비뉴엘로 웨딩 예물(까르띠에, 반클리프 아펠) 보러 가는데 층별 위치랑 웨딩마일리지 혜택 알려줘',
        timestamp: now - 1000 * 60 * 50,
      },
      {
        id: 'msg_sample_wed_2',
        role: 'assistant',
        content:
          `롯데백화점 본점 **에비뉴엘 웨딩 예물 투어 코스와 롯데웨딩멤버스 혜택**을 정리해 드립니다.\n\n` +
          `## 1. 하이주얼리 & 워치 부티크 층별 위치 (에비뉴엘 본점)\n` +
          `1. **에비뉴엘 1F**: **까르띠에(Cartier)**, **반클리프 아펠(Van Cleef & Arpels)**, **롤렉스(Rolex)**\n` +
          `2. **에비뉴엘 2F**: **불가리(Bvlgari)**, **티파니(Tiffany & Co.)**, **예거 르쿨트르(Jaeger-LeCoultre)**, **오메가(Omega)**\n` +
          `- **오픈런 및 모바일 웨이팅 팁**: 주말 오전 \`10:00\`부터 에비뉴엘 1층 정문 앞에서 현장 태블릿 사전 등록이 진행되며, 등록 후 카카오톡 알림톡으로 입장 안내를 받으실 수 있습니다.\n\n` +
          `## 2. 롯데웨딩멤버스 (Wedding Mileage) 리워드 혜택\n` +
          `- **적립 기간**: 가입 후 **9개월간** 전국 롯데백화점 합산 적립\n` +
          `- **리워드 구간**:\n` +
          `  - **1,000만 / 1,500만 / 2,000만 원 이상**: 각각 **50만 / 75만 / 100만 원** 롯데상품권 증정\n` +
          `  - **3,000만 / 5,000만 원 이상**: 각각 **180만(6%) / 350만 원(7%)** 롯데상품권 증정\n\n` +
          `예상하시는 예물 예산대를 말씀해 주시면 **웨딩마일리지 + 당일 카드 사은행사 중복 가능 여부**를 시뮬레이션해 드릴까요?`,
        timestamp: now - 1000 * 60 * 45,
        thoughts: [
          {
            step: 1,
            topic: '웨딩 예물 동선 및 마일리지 조회',
            content:
              '1. 본점 에비뉴엘 1F~2F 하이주얼리 부티크 위치 매핑\n2. 2026년 롯데웨딩멤버스 금액대별 상품권 증정 구간(5%~7%) 및 브랜드별 적립률 데이터 결합',
            timestamp: now - 1000 * 60 * 46,
          },
        ],
        toolCalls: [
          {
            toolId: 'tool_wed_sim_01',
            toolName: 'fetch_avenuel_directory',
            arguments: { branch: 'main_store', category: 'high_jewelry_watch' },
            status: 'success',
            result: '에비뉴엘 1F(까르띠에, 반클리프 아펠, 롤렉스) / 2F(불가리, 티파니, 예거 르쿨트르) 매칭 완료',
            executionMs: 135,
          },
        ],
        metrics: {
          promptTokens: 118,
          completionTokens: 312,
          totalTokens: 430,
          elapsedMs: 1420,
          timeToFirstTokenMs: 410,
          tokensPerSec: 46.8,
        },
      },
    ],
  },
  {
    id: 'thread_sample_jamsil_vip',
    title: '잠실 월드타워점 VIP 주차 & 다이닝 코스',
    createdAt: now - 1000 * 60 * 360,
    updatedAt: now - 1000 * 60 * 120,
    messages: [
      {
        id: 'msg_sample_jam_1',
        role: 'user',
        content: '잠실 에비뉴엘 월드타워점 퍼플 등급인데 발레파킹 게이트 위치랑 6층 식당가 추천해줘',
        timestamp: now - 1000 * 60 * 125,
      },
      {
        id: 'msg_sample_jam_2',
        role: 'assistant',
        content:
          `**AVENUEL PURPLE** 고객님을 위한 **잠실 에비뉴엘 월드타워점 발레파킹 및 6F 파인다이닝 안내**입니다.\n\n` +
          `## 1. 잠실 에비뉴엘 월드타워점 전용 발레파킹\n` +
          `- **진입 위치**: 잠실역 사거리에서 롯데월드타워 남측 진입로 진입 후 **지하 1층 에비뉴엘 전용 발레 라운지(Drop-zone)** 이용\n` +
          `- **PURPLE 혜택**: 발레파킹 서비스 무료 제공 + 일 **5시간 무료 주차** 자동 적용\n` +
          `- **전용 라운지**: 에비뉴엘 월드타워점 **4F 퍼플 라운지** (동반 1인 입장, 계절 다과 및 스페셜티 커피 제공)\n\n` +
          `## 2. 에비뉴엘 월드타워점 6F 프리미엄 다이닝 추천\n` +
          `1. **홍연 (중식 파인다이닝)**: 석촌호수 전망 프라이빗 룸 보유, 시그니처 북경오리 & 딤섬 코스\n` +
          `2. **해목 (프리미엄 히츠마부시 & 일식)**: 나고야식 장어덮밥 및 카이센동 전문점 (롯데백화점 APP 원격 웨이팅 지원)\n` +
          `3. **스테이크 하우스 & 이탈리안 비스트로**: 에비뉴엘 포인트(AVENUEL POINT) 100% 차감 결제 가능 매장\n\n` +
          `방문 예정 시간을 알려주시면 6층 식당가 실시간 대기 팀 수를 바로 확인해 드리겠습니다.`,
        timestamp: now - 1000 * 60 * 120,
        thoughts: [
          {
            step: 1,
            topic: '잠실 월드타워점 VIP 동선 확인',
            content:
              '1. 잠실 에비뉴엘 월드타워점 PURPLE 등급 발레 드롭존(지하 1층 에비뉴엘 게이트) 및 4F 라운지 확인\n2. 에비뉴엘 6F 식당가 대표 매장 및 에비뉴엘 포인트 사용 가능 여부 조회',
            timestamp: now - 1000 * 60 * 121,
          },
        ],
        toolCalls: [
          {
            toolId: 'tool_jam_vip_01',
            toolName: 'lookup_valet_parking_policy',
            arguments: { branch: 'jamsil_worldtower', tier: 'AVENUEL_PURPLE' },
            status: 'success',
            result: '잠실 에비뉴엘 B1F 전용 발레 부스 무료 이용 및 일 5시간 무료 주차 확인',
            executionMs: 120,
          },
        ],
        metrics: {
          promptTokens: 104,
          completionTokens: 288,
          totalTokens: 392,
          elapsedMs: 1280,
          timeToFirstTokenMs: 390,
          tokensPerSec: 48.1,
        },
      },
    ],
  },
];

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
    return INITIAL_SAMPLE_THREADS;
  });

  // 2. 활성 스레드 ID 로드
  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch (err) {
      console.warn('Failed to load active thread ID:', err);
    }
    return INITIAL_SAMPLE_THREADS[0].id;
  });

  // 3. 스레드 변경 시 localStorage 동기화 (용량 초과 시 자동 복구 포함)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeThreadId);
    } catch (err) {
      console.warn('Failed to save threads to localStorage (Quota protection triggered):', err);
      try {
        const trimmed = threads.slice(0, Math.max(1, threads.length - 1));
        localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(trimmed));
      } catch {
        // 무시
      }
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

  // 10. 특정 스레드 ID에 메시지 추가 (스트리밍 중 스레드 전환 시에도 정확한 스레드에 귀속)
  const addMessageToThread = useCallback(
    (targetThreadId: string, message: ChatMessage) => {
      setThreads((prev) => {
        return prev.map((t) => {
          if (t.id === targetThreadId) {
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
    []
  );

  // 11. 활성 스레드에 메시지 추가 (첫 질문 시 스레드 제목 자동 설정)
  const addMessageToActiveThread = useCallback(
    (message: ChatMessage) => {
      addMessageToThread(activeThreadId, message);
    },
    [activeThreadId, addMessageToThread]
  );

  // 12. 활성 스레드의 마지막 메시지 업데이트 또는 일괄 교체
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

  // 13. 전체 스레드 초기화 (기본 샘플 스레드 복원)
  const clearAllThreads = useCallback(() => {
    setThreads(INITIAL_SAMPLE_THREADS);
    setActiveThreadId(INITIAL_SAMPLE_THREADS[0].id);
  }, []);

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
    addMessageToThread,
    addMessageToActiveThread,
    updateActiveThreadMessages,
    clearAllThreads,
  };
}

