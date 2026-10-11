# LLM WebSocket Protocol Contract (Tenduck Client ↔ Backend)

커스텀 LLM 모델의 사고 과정(Reasoning), 도구 호출(Tool Calls), 최종 답변(Token Generation)을 실시간으로 중계하는 WebSocket 패킷 스키마입니다.

---

## 1. 연결 엔드포인트 & 핸드셰이크

- **URL**: `ws://<HOST>:<PORT>/ws/llm/v1` (개발 모드 mock 지원)
- **Protocol**: JSON 패킷 기반 스트리밍

---

## 2. 클라이언트 → 서버 요청 (Client to Server)

### `request.prompt`
사용자가 프롬프트 또는 질문을 전송할 때 발송합니다.

```json
{
  "type": "request.prompt",
  "requestId": "req_1728690000_abc123",
  "timestamp": 1728690000123,
  "payload": {
    "prompt": "롯데백화점 본점 에비뉴엘 브랜드 입점 현황 정리해줘",
    "temperature": 0.7,
    "showThought": true
  }
}
```

---

## 3. 서버 → 클라이언트 스트리밍 이벤트 (Server to Client)

### ① `status.stage` (단계 상태 전이)
AI의 현재 처리 단계를 나타냅니다.

```json
{
  "type": "status.stage",
  "requestId": "req_1728690000_abc123",
  "payload": {
    "stage": "planning" | "reasoning" | "tool_calling" | "generating" | "completed" | "error",
    "message": "사용자 질문 의도 분석 중..."
  }
}
```

### ② `stream.thought` (사고 과정 라이브 스트림)
AI가 최종 답변을 내놓기 전, 내부적으로 추론하고 계획하는 생각의 흐름입니다.

```json
{
  "type": "stream.thought",
  "requestId": "req_1728690000_abc123",
  "payload": {
    "delta": "1. 본점 에비뉴엘(Avenuel) 명품관 층별 구성을 조회해야 함.\n",
    "step": 1
  }
}
```

### ③ `event.tool_call` (도구/함수 호출 상태)
외부 API나 사내 DB 쿼리를 수행할 때 발생합니다.

```json
{
  "type": "event.tool_call",
  "requestId": "req_1728690000_abc123",
  "payload": {
    "toolId": "tool_001",
    "toolName": "fetch_avenuel_directory",
    "arguments": { "branch": "main", "category": "luxury" },
    "status": "invoking" | "success" | "failure",
    "result": "총 48개 브랜드 조회 완료 (샤넬, 루이비통, 에르메스 등)"
  }
}
```

### ④ `stream.token` (최종 사용자 텍스트 토큰)
사용자에게 보여질 최종 답변의 토큰 스트림입니다.

```json
{
  "type": "stream.token",
  "requestId": "req_1728690000_abc123",
  "payload": {
    "delta": "롯데백화점 본점 에비뉴엘은 지하 1층부터 6층까지..."
  }
}
```

### ⑤ `stream.done` (응답 생성 완료)
전체 스트림이 종료되었음을 알립니다.

```json
{
  "type": "stream.done",
  "requestId": "req_1728690000_abc123",
  "payload": {
    "totalTokens": 412,
    "elapsedMs": 1420,
    "tokensPerSec": 45.8
  }
}
```

### ⑥ `stream.error` (에러 발생)
```json
{
  "type": "stream.error",
  "requestId": "req_1728690000_abc123",
  "payload": {
    "code": "MODEL_TIMEOUT",
    "message": "모델 추론 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
  }
}
```
