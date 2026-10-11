# Tenduck - Custom LLM AI Console Client

롯데백화점 CI를 기반으로 한 커스텀 LLM 클라이언트 프로젝트입니다.
`anti-slop` 철학을 계승하여 AI 특유의 뻔한 디자인 요소를 배제하고, **기획(PO) - 개발(FE) - 검증(Verification)** 3단계 하네스 엔지니어링을 자동화합니다.

---

## 1. 하네스 엔지니어링 3단계 구성

### ① 기획 하네스 (`specs/`)
- [specs/DESIGN.md](file:///Users/mukho/Desktop/tenduck/specs/DESIGN.md): 롯데백화점 CI 컬러(`LOTTE Red #DA291C`, `Champagne Gold #C5A880`) 및 타이포그래피 토큰 정의
- [specs/PRD_TEMPLATE.md](file:///Users/mukho/Desktop/tenduck/specs/PRD_TEMPLATE.md): PO 기획 명세서 템플릿 (LLM 실시간 처리 라이프사이클 및 인수 조건 강제)
- [specs/LLM_WEBSOCKET_CONTRACT.md](file:///Users/mukho/Desktop/tenduck/specs/LLM_WEBSOCKET_CONTRACT.md): 커스텀 LLM 백엔드와의 실시간 WebSocket 프로토콜 명세 (사고 과정, 도구 호출, 토큰 스트리밍)
- [specs/ACCEPTANCE_CRITERIA.md](file:///Users/mukho/Desktop/tenduck/specs/ACCEPTANCE_CRITERIA.md): PO 인수 검증 및 품질 합의 기준

### ② 개발 하네스 (`src/`)
- [src/types/llm.ts](file:///Users/mukho/Desktop/tenduck/src/types/llm.ts): LLM 스트리밍 패킷 및 상태 머신 타입 정의
- [src/hooks/useWebSocketLLM.ts](file:///Users/mukho/Desktop/tenduck/src/hooks/useWebSocketLLM.ts): WebSocket 연결 관리, 자동 재연결, 라이브 이벤트 수신 및 Mock 시뮬레이터 지원
- [src/hooks/useOptimizedStreaming.ts](file:///Users/mukho/Desktop/tenduck/src/hooks/useOptimizedStreaming.ts): `useTransition`, `useDeferredValue`, `useCallback`, `useMemo` 기반 고성능 토큰 렌더링 최적화
- [src/components/LiveProcessViewer.tsx](file:///Users/mukho/Desktop/tenduck/src/components/LiveProcessViewer.tsx): AI 내부 사고 과정(Reasoning) 및 도구 호출(Tool Calling) 실시간 시각화 콘솔
- [src/components/Header.tsx](file:///Users/mukho/Desktop/tenduck/src/components/Header.tsx), [src/components/MessageList.tsx](file:///Users/mukho/Desktop/tenduck/src/components/MessageList.tsx), [src/components/ChatInput.tsx](file:///Users/mukho/Desktop/tenduck/src/components/ChatInput.tsx)

### ③ 검증 하네스 (`scripts/`, `.antigravity/rules/`)
- [.antigravity/rules/anti-slop.md](file:///Users/mukho/Desktop/tenduck/.antigravity/rules/anti-slop.md): AI 코딩 에이전트를 위한 Anti-slop Hard Gate & Quality Lock 룰셋
- [.antigravity/rules/delivery-gate.md](file:///Users/mukho/Desktop/tenduck/.antigravity/rules/delivery-gate.md): 작업 완료 전 필수 통과 게이트
- [scripts/verify-delivery-gate.mjs](file:///Users/mukho/Desktop/tenduck/scripts/verify-delivery-gate.mjs): 자동화된 검증 스크립트 (슬롭 탐지 + TypeScript 컴파일 검사)
- [specs/DELIVERY_GATE_REPORT_TEMPLATE.md](file:///Users/mukho/Desktop/tenduck/specs/DELIVERY_GATE_REPORT_TEMPLATE.md): PO/FE 배포 승인 보고서 템플릿

---

## 2. 실행 및 검증 명령어

```bash
# 개발 서버 실행 (기본 Mock 시뮬레이션 모드 활성화)
npm run dev

# 하네스 Delivery Gate 자동 검증 (커밋/배포 전 필수)
npm run gate

# 프로덕션 빌드
npm run build
```
