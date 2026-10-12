# Thread & Context Persistence Specification

Tenduck 클라이언트의 **대화 스레드(세션) 관리 및 LLM 컨텍스트 영속성(Persistence)** 기획 및 구현 명세서입니다.

---

## 1. 비즈니스 요구사항 및 사용자 흐름

1. **지속 가능한 대화 세션 (Conversation Threads)**:
   - 사용자는 주제별로 대화를 분리하여 "새 대화 시작"을 할 수 있습니다.
   - 첫 번째 질문이 입력되면 질문의 핵심 내용(최대 20자)을 추출하여 스레드 제목으로 자동 설정합니다.
   - 사용자는 언제든지 연필 아이콘을 눌러 스레드 제목을 직접 수정하거나, 불필요한 스레드를 삭제할 수 있습니다.
2. **컨텍스트 영속성 (Context Persistence)**:
   - 브라우저를 닫거나 새로고침하더라도 이전 대화 내역(사용자 질문, AI 답변, 사고 과정 Thought, 도구 호출 내역, 토큰 통계 메트릭)이 100% 복원됩니다.
   - 클라이언트 1차 캐싱 계층: `localStorage` (`tenduck_threads_v1`, `tenduck_active_thread_id_v1`)
   - 백엔드 2차 연계 계층: `prompt.submit` 시 해당 스레드의 `conversationId`를 전달하여 서버 측 멀티턴(Multi-turn) 메모리 유지.

---

## 2. 데이터 모델 (Data Model)

```typescript
export interface Thread {
  id: string;                      // 고유 ID (thread_1728730000_abc)
  title: string;                   // 스레드 제목
  createdAt: number;               // 생성 일시
  updatedAt: number;               // 최근 수정 일시
  messages: ChatMessage[];          // 해당 스레드의 전체 대화 턴
  contextSummary?: string;         // (선택) 이전 턴 요약 메모리
  metadata?: {
    model?: string;
    temperature?: number;
    totalTokensUsed?: number;
    pinned?: boolean;
  };
}
```

---

## 3. UI/UX 레이아웃 구조 (3단 콘솔)

```text
+-------------------------------------------------------------------------------------------------+
|  [Sidebar Toggle] [LOTTE GOLD Logo] TENDUCK AI           [Mock/Live Toggle] [WS Connected 🟢]   |
+-------------------------------------------------------------------------------------------------+
|  [좌측: 스레드 목록 (260px)] |  [중앙: 활성 대화창 (Flex-1)]       | [우측: AI 처리 콘솔 (340px)]|
|                             |                                    |                             |
|  [+ 새 대화 시작]             |  User: 에비뉴엘 브랜드 알려줘         |  [STAGE: GENERATING]        |
|  - 롯데백화점 컨시어지 안내  |  AI: 샤넬, 루이비통...               |  - Reasoning steps...       |
|  - 주말 사은행사 문의       |                                    |  - Tool: fetch_avenuel()    |
|  - VIP 라운지 혜택 안내     |  [하단 고정: 메시지 입력창 + 전송]    |  - Metrics: 45.2 tok/s      |
+-------------------------------------------------------------------------------------------------+
```

---

## 4. 성능 최적화 보장 (Performance Harness)

- **`useTransition`**: 스레드 전환 클릭 시 메시지가 수십 개 누적된 상태에서도 사이드바 클릭 즉각 반응 (0ms Interaction Delay).
- **`useMemo`**: 스레드 정렬(최신순) 및 활성 스레드 검색 연산 메모이제이션.
- **스트리밍 완료 즉시 영속화**: AI 토큰 스트리밍이 끝나면 `onComplete` 이벤트에서 활성 스레드의 `messages` 배열에 원자적(Atomic) 업데이트.
