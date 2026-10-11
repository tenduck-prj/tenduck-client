import { useTransition, useDeferredValue, useMemo, useCallback, useRef } from 'react';
import { ThoughtStep, ToolCallEvent } from '../types/llm';

export interface UseOptimizedStreamingProps {
  rawStreamingText: string;
  thoughts: ThoughtStep[];
  toolCalls: ToolCallEvent[];
}

export function useOptimizedStreaming({
  rawStreamingText,
  thoughts,
  toolCalls,
}: UseOptimizedStreamingProps) {
  const [isPending, startTransition] = useTransition();

  // 1. useDeferredValue: 초당 수십 개의 토큰이 쏟아져 들어올 때
  // 메인 스레드 렌더링(타이핑, 스크롤)을 블로킹하지 않도록 텍스트 파싱을 지연 처리함
  const deferredText = useDeferredValue(rawStreamingText);

  // 2. 토큰 누적 상태 및 통계 (useRef를 사용하여 리렌더링 유발 없이 실시간 측정)
  const tokenCountRef = useRef(0);

  // 3. useMemo: 사고 과정(Thinking) 단계 캐싱
  const memoizedThoughts = useMemo(() => {
    return thoughts.map((t) => ({
      ...t,
      formattedTime: new Date(t.timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }));
  }, [thoughts]);

  // 4. useMemo: 도구 호출(Tool Calls) 목록 정렬 및 캐싱
  const memoizedToolCalls = useMemo(() => {
    return [...toolCalls].reverse();
  }, [toolCalls]);

  // 5. useMemo: 지연된 텍스트 기반 단락/마크다운 블록 분할 캐싱
  const parsedParagraphs = useMemo(() => {
    if (!deferredText) return [];
    return deferredText.split('\n\n').filter((p) => p.trim().length > 0);
  }, [deferredText]);

  // 6. useCallback: 무거운 액션(복사, 포맷팅 등) 래퍼
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isPending,
    startTransition,
    deferredText,
    parsedParagraphs,
    memoizedThoughts,
    memoizedToolCalls,
    tokenCount: tokenCountRef.current,
    copyToClipboard,
  };
}
