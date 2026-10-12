# Anti-Slop Design & Engineering Rules for Tenduck

이 프로젝트는 커스텀 LLM 모델의 클라이언트 서비스입니다.
AI 코딩 에이전트가 만든 전형적이고 조잡한 "AI Slop"을 원천 차단하고, 롯데백화점 CI 기반의 신뢰성 있고 절제된 프로덕트 품질을 유지합니다.

---

## Tier 1: Hard Gates (절대 금지 규칙)

1. **[R-01] No Generic Purple/Indigo Gradients (보라색 네온 그라데이션 절대 금지)**
   - `bg-gradient-to-r from-purple-500 to-indigo-600` 등 뻔한 AI 스타일 그라데이션 금지.
   - 메인 코어 색상은 롯데백화점 샴페인 골드(`lotte-gold: #C5A880`), 보조 색상은 롯데 레드(`lotte-red: #DA291C`)를 사용합니다.
   
2. **[R-02] No Artificial Sparkles or Decorative Clichés (가짜 AI 이모지 금지)**
   - 버튼, 헤딩, 카드 제목에 무의미한 `✨`, `🔮`, `🚀` 등의 이모지를 장식용으로 붙이지 마십시오.
   - 아이콘은 Lucide 아이콘을 목적에 맞게 일관된 스트로크(1.5~2px)로 정제하여 사용합니다.

3. **[R-03] No Bento Grid Cargo-Culting (목적 없는 벤토 그리드 금지)**
   - 비어있는 영역을 채우기 위해 무의미한 3~4분할 카드 그리드를 만들지 마십시오.
   - 정보 구조(Information Architecture)는 LLM 입력창, 처리 로그(Thinking/Tool Call), 결과 뷰의 사용자 시선 흐름(F-pattern 또는 2단 콘솔)에 충실해야 합니다.

4. **[R-04] No Fake Metrics or Vague Hype Copy (과장된 허위 카피 금지)**
   - "99.999% 정밀도", "초광속 0.001ms 지연 시간", "Next-Gen 미래형 AI 경험" 같은 공허한 카피 금지.
   - 실제 모델 파라미터 상태, 현재 토큰 스트리밍 속도(tok/sec), 실제 연결 상태(WebSocket Latency ms)만 정직하게 표시합니다.

5. **[R-05] No Arbitrary Inline Colors (규격 외 임의 색상 금지)**
   - 임의의 hex 컬러나 임의 Tailwind 색상(`bg-blue-500`, `text-violet-700`)을 직접 쓰지 마십시오.
   - 반드시 `tailwind.config.js`에 정의된 `lotte-*` 토큰 또는 `specs/DESIGN.md`의 표준 토큰만 사용합니다.

---

## Tier 2: Quality Locks (품질 기준)

1. **[Q-01] WCAG AA 대비율 준수**
   - 골드 배경(`lotte-gold`) 위의 텍스트는 딥 차콜(`#121212`) 또는 순백(`#FFFFFF`)으로 가독성을 확보합니다.
   - 롯데 레드(`lotte-red`)는 라이브 스트리밍 상태, 에러 알림 등 보조 액센트로 절제하여 사용합니다.
   - 배경과 텍스트의 대비율은 최소 4.5:1 이상이어야 합니다.

2. **[Q-02] 키보드 네비게이션 및 포커스 링**
   - 모든 대화창, 프롬프트 전송 버튼, 어코디언 토글은 `focus-visible:ring-2 focus-visible:ring-lotte-gold`를 명시합니다.

3. **[Q-03] 실시간 WebSocket 렌더링 성능 최적화**
   - 초당 수십 개 토큰이 유입되는 스트리밍 환경에서 UI 스레드가 블로킹되지 않도록 `useTransition`, `useDeferredValue`, `useCallback`을 필수 적용합니다.
   - AI의 사고 과정(Reasoning Log)은 메인 텍스트 렌더링과 독립적인 렌더 바운더리를 가집니다.
