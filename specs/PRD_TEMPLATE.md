# [Feature PRD] <기능 이름>

- **작성자 (PO)**: 
- **담당 FE**: 
- **연동 모델 / 백엔드 엔드포인트**: 커스텀 LLM (WebSocket /ws/agent)
- **우선순위**: P0 / P1 / P2
- **작성일자**: 2026-10-12

---

## 1. 배경 및 비즈니스 목표 (Why)
- 사용자가 해결하고자 하는 문제:
- 이 기능이 사용자 경험 및 비즈니스에 제공하는 가치:

---

## 2. 사용자 스토리 (User Story)
- **As a** (사용자 역할)
- **I want to** (원하는 행동)
- **So that** (얻고자 하는 결과)

---

## 3. 실시간 AI 처리 흐름 명세 (Live AI Lifecycle)

커스텀 LLM의 단계별 상태 전이와 클라이언트 UI 요구사항을 기술합니다:

1. **대기 (Idle)**: 입력 전 상태
2. **연결 및 전송 (Connecting/Sending)**: 소켓 패킷 발송, 로딩 인디케이터
3. **추론 및 사고 (Reasoning / Thinking)**:
   - AI가 내부 계획을 수립하는 로그 실시간 출력 여부: [예 / 아니오]
   - 접이식 콘솔 표시 여부: [예 / 아니오]
4. **도구 호출 (Tool Calling)**:
   - 외부 API / DB 쿼리 실행 시 파라미터 및 실행 상태 시각화
5. **토큰 스트리밍 (Token Generating)**:
   - 청크 단위 렌더링 성능 최적화 (`useDeferredValue` 적용 여부)
6. **완료 및 실패 (Completed / Error)**:
   - 모델 응답 실패 시 Fallback UI 및 재시도 액션

---

## 4. 인수 조건 (Acceptance Criteria - Given / When / Then)

### 시나리오 1: 정상적인 토큰 스트리밍 및 사고 과정 노출
- **Given**: WebSocket 연결이 유지된 상태에서
- **When**: 사용자가 프롬프트를 전송하면
- **Then**: 우측 라이브 콘솔에 '사고 과정'이 먼저 스트리밍되고, 본문 뷰에 최종 답변이 끊김 없이 렌더링되어야 한다.

### 시나리오 2: WebSocket 연결 끊김 및 네트워크 장애
- **Given**: 스트리밍 진행 중 네트워크가 단절되면
- **When**: 3회 지수 백오프(Exponential Backoff)로 자동 재연결을 시도하며
- **Then**: 사용자에게 "연결 재시도 중..." 뱃지가 표시되고, 기존 수신된 메시지는 유실되지 않아야 한다.

---

## 5. Delivery Gate 검증 기준
- [ ] `npm run gate` 통과 확인
- [ ] Lotte Red (#DA291C) 및 Pretendard 타이포 규격 준수
- [ ] 초당 60토큰 이상의 급격한 스트림 유입 시에도 UI 멈춤 현상(FPS Drop)이 없을 것
