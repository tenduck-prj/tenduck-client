# DESIGN.md - Lotte Department Store CI & Design Tokens

이 문서는 Tenduck 커스텀 LLM 클라이언트의 디자인 가이드라인입니다.
롯데백화점의 품격 있는 브랜드 아이덴티티와 절제된 미학을 기반으로 하며, AI 슬롭(Slop)을 배제합니다.

---

## 1. 브랜드 아이덴티티 & 컬러 시스템

롯데백화점 CI의 핵심 가치인 '신뢰', '세련미', '정직함'을 인터페이스에 반영합니다.

| 토큰명 | HEX | 용도 | 설명 |
| :--- | :--- | :--- | :--- |
| `lotte-red` | `#DA291C` | Primary Signature | 브랜드 대표 색상. 주요 CTA 버튼, 활성 상태 뱃지, 실시간 연결 상태 |
| `lotte-red-hover` | `#BD2014` | Primary Hover | CTA 버튼 마우스 호버 상태 |
| `lotte-red-light` | `#FDF1F0` | Tint Background | 주의/활성 뱃지 배경, 강조 인용구 배경 |
| `lotte-gold` | `#C5A880` | Premier Accent | 롯데백화점 샴페인 골드. AI 처리 단계(Reasoning/Tool) 뱃지, 고급 포인트 |
| `lotte-dark` | `#111111` | Primary Text | 텍스트 본문 및 메인 헤딩 (눈의 피로도를 줄인 딥 차콜 블랙) |
| `lotte-charcoal` | `#1E1E1E` | Dark Surface | 라이브 콘솔/코드 블록/사고 과정 뷰어 배경 |
| `lotte-surface` | `#FFFFFF` | Light Surface | 카드, 모달, 입력창 배경 |
| `lotte-background` | `#F8F9FA` | Page Background | 페이지 기본 배경 |
| `lotte-border` | `#E8EAED` | Border & Divider | 컴포넌트 경계선, 구분선 |
| `lotte-muted` | `#666666` | Secondary Text | 타임스탬프, 보조 설명, 라벨 |

---

## 2. 타이포그래피 원칙

- **기본 폰트**: Pretendard (가독성 높은 휴머니스트 산세리프)
- **코드/로그 폰트**: JetBrains Mono (토큰 스트리밍, JSON Tool Call, 디버그 로그용)
- **계층 구조**:
  - H1 (대시보드 타이틀): `text-xl font-bold tracking-tight text-lotte-dark`
  - H2 (섹션 타이틀): `text-base font-semibold text-lotte-dark`
  - Body: `text-sm leading-relaxed text-lotte-dark`
  - Meta/Caption: `text-xs text-lotte-muted`

---

## 3. 실시간 AI 콘솔 레이아웃 구조

```text
+--------------------------------------------------------------------------+
|  [LOTTE RED Logo] Tenduck AI Console          [WS Status: Connected 🟢]  |
+--------------------------------------------------------------------------+
|  [좌측: 실시간 대화 & 결과 뷰 (65%)]     |  [우측: 실시간 AI 내부 처리 콘솔 (35%)]|
|                                         |                                        |
|  User: 롯데백화점 본점 세일 정보 분석해줘 |  [STAGE: TOOL_CALLING] ⚡             |
|                                         |  - Reasoning: 고객 질문 의도 분석...   |
|  AI: [실시간 스트리밍 답변 생성 중...]     |  - Tool: search_branch_promotions()    |
|                                         |  - Metrics: 42 tok/s | Latency: 180ms  |
+--------------------------------------------------------------------------+
|  [하단 고정: 메시지 입력창 + 파라미터 제어 + 전송 버튼]                      |
+--------------------------------------------------------------------------+
```

---

## 4. Anti-Slop 디자인 가이드라인

- **금지**: 보라색/인디고 그라데이션, 인위적인 별 모양 아이콘(✨), 불투명도 90%의 블러 처리(과도한 글래스모피즘), 가짜 메트릭 수치.
- **권장**: 선명하고 정돈된 라인, 실용적인 2단 콘솔, 실제 소켓 전송 상태의 솔직한 표현, 키보드 단축키 지원(`Cmd+Enter` 전송).
