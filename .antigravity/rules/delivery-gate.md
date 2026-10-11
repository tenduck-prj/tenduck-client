# Delivery Gate Rule for Tenduck

에이전트는 코드를 변경하거나 작업을 완료하기 전에 반드시 본 Delivery Gate 절차를 수행해야 합니다.

---

## 1. 사전 실행 검증 (Mandatory Commands)

작업 완료 선언 전 다음 명령어를 실행하여 에러가 없음을 확인해야 합니다:

```bash
npm run gate
```

위 스크립트는 다음 항목을 순차적으로 자동 검사합니다:
1. **Anti-slop Lint**: 금지된 보라색/인디고 그라데이션, AI 과장 카피 키워드 탐지
2. **Design Token Lint**: 허가되지 않은 임의 컬러 사용 여부 탐지
3. **TypeScript Typecheck**: `tsc -b` 타입 정합성 검사
4. **Accessible Semantics**: 포커스 및 상호작용 엘리먼트 속성 검사

---

## 2. 수동 인수 점검 체크리스트 (PO & FE Gate)

- [ ] **롯데 CI 준수**: 메인 포인트는 `#DA291C`(Lotte Red), 보조 포인트는 `#C5A880`(Gold)인가?
- [ ] **실시간 WebSocket 처리**: AI 사고 과정(Reasoning/Thought)과 토큰 스트리밍이 부드럽게 분리되어 렌더링되는가?
- [ ] **성능 최적화**: 토큰 스트리밍 중 불필요한 전체 리렌더링이 방지되었는가? (`useDeferredValue`, `useCallback`, `useTransition` 적용)
- [ ] **에러 및 재연결 복구**: 소켓 연결 끊김이나 LLM 에러 발생 시 사용자 친화적인 복구 UI가 제공되는가?
