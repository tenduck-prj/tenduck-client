import { ConversationTurn, LLMErrorCode } from '../types/llm';

export interface MockToolSimulation {
  toolId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: 'success' | 'failure';
  result?: string;
  error?: string;
  executionMs: number;
}

export interface MockScenarioDefinition {
  id: string;
  category: 'branch' | 'vip' | 'dining' | 'promotion' | 'service' | 'system';
  label: string;
  presetPrompt: string;
  keywords: string[];
  stageMessages: {
    reasoning: string;
    toolCalling: string;
    generating: string;
  };
  thoughts: Array<{
    step: number;
    topic: string;
    content: string;
  }>;
  tools: MockToolSimulation[];
  answer: string;
  simulateError?: {
    code: LLMErrorCode;
    message: string;
    retryable: boolean;
  };
}

/**
 * 롯데백화점 핵심 점포 지식베이스 도메인 데이터 (컨시어지 참조 원장)
 */
export const LOTTE_BRANCH_DIRECTORY = {
  main_store: {
    name: '롯데백화점 본점 (소공동) & 에비뉴엘 본점',
    address: '서울특별시 중구 남대문로 81 (소공동 1)',
    subway: '2호선 을지로입구역 7번 출구 (지하 직결)',
    hours: { weekday: '10:30 ~ 20:00', weekend: '10:30 ~ 20:30' },
    contact: '1577-0001 / 에비뉴엘 컨시어지 02-771-2500',
  },
  jamsil: {
    name: '롯데백화점 잠실점 & 에비뉴엘 월드타워점',
    address: '서울특별시 송파구 올림픽로 240 / 300 (롯데월드타워&몰)',
    subway: '2·8호선 잠실역 1·2·3·4번 출구 (지하 직결)',
    hours: { weekday: '10:30 ~ 20:00', weekend: '10:30 ~ 20:30' },
    contact: '1577-0001 / 월드타워 에비뉴엘 02-3213-2500',
  },
  timevillas_suwon: {
    name: '타임빌라스 수원 (TIMEVILLAS SUWON)',
    address: '경기도 수원시 권선구 세화로 134 (서둔동)',
    subway: '1호선·수인분당선·KTX 수원역 2층 연결통로 직결',
    hours: { weekday: '10:30 ~ 20:00', weekend: '10:30 ~ 20:30' },
    diningHouseHours: '10:30 ~ 22:00 (3F 다이닝 에비뉴)',
  },
  busan_centum: {
    name: '롯데백화점 부산본점 (서면) & 센텀시티점',
    address: '부산광역시 부산진구 가야대로 772 / 해운대구 센텀남대로 59',
    subway: '부산 1·2호선 서면역 / 2호선 센텀시티역 지하 직결',
    hours: { weekday: '10:30 ~ 20:00', weekend: '10:30 ~ 20:30' },
  },
} as const;

export const PRESET_SCENARIOS: MockScenarioDefinition[] = [
  {
    id: 'avenuel_directory',
    category: 'branch',
    label: '본점 에비뉴엘 층별 브랜드',
    presetPrompt: '본점 에비뉴엘 명품관 층별 입점 브랜드 안내해줘',
    keywords: ['에비뉴엘', '층별', '입점', '소공동', '샤넬', '에르메스', '루이비통'],
    stageMessages: {
      reasoning: '롯데백화점 본점(소공동) 에비뉴엘 층별 조닝(Zoning) 데이터 분석 중...',
      toolCalling: '사내 점포 디렉토리 API (fetch_avenuel_directory) 호출 중...',
      generating: '층별 럭셔리 부티크 안내 답변 생성 중...',
    },
    thoughts: [
      {
        step: 1,
        topic: '고객 의도 파악',
        content:
          '1. 질문 핵심: 롯데백화점 본점 에비뉴엘(AVENUEL) B1F~9F 층별 입점 명품 브랜드 및 주요 시설 확인\n2. 하이주얼리, 워치, 레더굿즈, 남성 럭셔리, 파인다이닝 층별 구분 안내 필요.\n',
      },
      {
        step: 2,
        topic: '점포 API 쿼리 실행',
        content:
          '3. fetch_avenuel_directory(branch="main_store", section="avenuel") 도구를 호출하여 최신 입점 부티크 및 컨시어지 연락처를 조회합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_avenuel_dir_01',
        toolName: 'fetch_avenuel_directory',
        arguments: { branch: 'main_store', section: 'avenuel', includeBoutiques: true },
        status: 'success',
        result:
          '본점 에비뉴엘 B1F~9F 총 68개 럭셔리 부티크 및 다이닝 조회 완료 (에르메스, 샤넬, 루이비통, 롤렉스, 까르띠에, 반클리프 아펠, 고야드 등)',
        executionMs: 165,
      },
    ],
    answer:
      `안녕하세요. 롯데백화점 프리미엄 AI 컨시어지입니다.\n\n` +
      `요청하신 **롯데백화점 본점(소공동) 에비뉴엘(AVENUEL)** 층별 주요 입점 브랜드 안내드립니다.\n\n` +
      `## 1. 층별 주요 부티크 구성\n` +
      `1. **1F 럭셔리 아이콘 & 하이주얼리**: 에르메스(Hermès), 샤넬(Chanel), 루이비통(Louis Vuitton), 고야드(Goyard), 까르띠에(Cartier), 반클리프 아펠(Van Cleef & Arpels), 롤렉스(Rolex)\n` +
      `2. **2F 인터내셔널 부티크 & 하이엔드 워치**: 셀린느(Celine), 디올(Dior), 펜디(Fendi), 예거 르쿨트르(Jaeger-LeCoultre), 바쉐론 콘스탄틴(Vacheron Constantin), 오메가(Omega), 불가리(Bvlgari), 티파니(Tiffany & Co.)\n` +
      `3. **3F 디자이너 럭셔리 & 슈즈 살롱**: 프라다(Prada), 구찌(Gucci), 보테가 베네타(Bottega Veneta), 생로랑(Saint Laurent), 로에베(Loewe), 크리스찬 루부탱(Christian Louboutin), 마놀로 블라닉(Manolo Blahnik)\n` +
      `4. **4F 남성 럭셔리 & 컨템포러리**: 루이비통 멘즈, 디올 멘즈, 구찌 멘즈, 톰브라운(Thom Browne), 발렌시아가(Balenciaga), 몽클레르(Moncler), 스톤아일랜드(Stone Island)\n` +
      `5. **5F 프레스티지 골프 & 라이프스타일**: PXG, 지포어(G/FORE), 마크앤로나, 니치 퍼퓸 부티크(딥티크, 조말론 런던, 바이레도)\n` +
      `6. **6F~9F 아트홀 · 시네마 · 파인다이닝**: 에비뉴엘 아트홀(6F), 롯데시네마 샤롯데관(6F~8F), 미쉐린 & 파인다이닝 레스토랑(9F)\n\n` +
      `## 2. 컨시어지 전용 서비스\n` +
      `- **퍼스널 쇼퍼 룸(PSR)**: 사전 예약 고객 대상 1:1 전담 쇼퍼 스타일링 및 프라이빗 피팅 지원\n` +
      `- **직통 문의**: 에비뉴엘 본점 컨시어지 데스크 (` +
      '`02-771-2500`' +
      ` / 2호선 을지로입구역 7번 출구 지하 연결)\n\n` +
      `특정 브랜드의 당일 워크인 웨이팅 현황이나 매장 직통 번호를 추가로 조회해 드릴까요?`,
  },
  {
    id: 'jamsil_worldtower',
    category: 'branch',
    label: '잠실 월드타워점 & 크리스마스 마켓',
    presetPrompt: '잠실 에비뉴엘 월드타워점 명품관 구성과 크리스마스 마켓 정보 알려줘',
    keywords: ['잠실', '월드타워', '롯데월드몰', '크리스마스', '샤롯데가든', '아레나'],
    stageMessages: {
      reasoning: '잠실 롯데타운(백화점 잠실점 · 에비뉴엘 월드타워점 · 월드몰) 통합 데이터 조회 중...',
      toolCalling: '잠실 타운 디렉토리 및 시즌 팝업 스케줄 API 병렬 호출 중...',
      generating: '잠실 에비뉴엘 월드타워점 및 시즌 마켓 안내문 생성 중...',
    },
    thoughts: [
      {
        step: 1,
        topic: '잠실 롯데타운 복합 구역 분리',
        content:
          '1. 잠실점은 백화점 본관, 에비뉴엘 월드타워점(명품관), 롯데월드몰 3개 구역이 지하/지상으로 연결된 국내 최대 규모 타운.\n2. 에비뉴엘 월드타워점 핵심 부티크와 월드파크(아레나 광장) 시즌 시그니처 행사 정보를 함께 조회합니다.\n',
      },
      {
        step: 2,
        topic: '점포 및 팝업 이벤트 도구 호출',
        content:
          '3. fetch_avenuel_directory(branch="jamsil_worldtower") 및 query_seasonal_popups 도구를 실행합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_jamsil_dir_01',
        toolName: 'fetch_avenuel_directory',
        arguments: { branch: 'jamsil_worldtower', includeWorldMall: true },
        status: 'success',
        result:
          '에비뉴엘 월드타워점 B1F~6F: 에르메스·샤넬·루이비통·디올·까르띠에·티파니·롤렉스·오데마피게 등 풀라인 부티크 운영 확인',
        executionMs: 148,
      },
      {
        toolId: 'tool_jamsil_popup_02',
        toolName: 'query_seasonal_popups',
        arguments: { branch: 'jamsil_worldtower', zone: ['Atrium_1F', 'World_Park_Arena'] },
        status: 'success',
        result:
          '1F 더 크라운(The Crown) 하이주얼리 팝업 운영 중 / 야외 월드파크 잔디광장 유럽형 원더랜드 마켓 및 회전목마 사전예약 패스트트랙 운영',
        executionMs: 132,
      },
    ],
    answer:
      `국내 최대 럭셔리 타운인 **롯데백화점 잠실점 & 에비뉴엘 월드타워점** 안내해 드립니다.\n\n` +
      `## 1. 에비뉴엘 월드타워점 (Luxury Tower) 주요 구성\n` +
      `- **B1F 더 크라운(The Crown) & 니치 퍼퓸**: 글로벌 하이엔드 브랜드의 시그니처 팝업 아트리움 및 럭셔리 뷰티 부티크\n` +
      `- **1F~2F 3대 명품 & 하이주얼리·워치**: **에르메스, 샤넬, 루이비통, 디올** 풀라인 메종 및 롤렉스, 까르띠에, 반클리프 아펠, 파텍필립, 오데마피게\n` +
      `- **3F~4F 컨템포러리 럭셔리 & 멘즈**: 프라다, 구찌, 셀린느, 보테가 베네타, 로로피아나(Loro Piana), 브리오니(Brioni)\n` +
      `- **6F 파인다이닝 & 아트홀**: 미쉐린 가이드 선정 레스토랑, 시그니엘 연계 다이닝 및 롯데콘서트홀 연결 통로\n\n` +
      `## 2. 잠실 월드파크 & 롯데월드몰 시그니처 팝업/마켓\n` +
      `1. **월드파크 야외 광장 (아레나 광장)**: 대형 유럽형 시즌 마켓(크리스마스 마켓 등), 대형 트리 및 2층 회전목마 운영\n` +
      `2. **입장 방법**: **롯데백화점 APP**을 통한 사전 패스트트랙(Fast-Track) 예매 또는 현장 QR 웨이팅 등록\n` +
      `3. **런던베이글뮤지엄 · 노티드 등 월드몰 F&B**: 롯데월드몰 1F~B1F에 위치하며 백화점 APP 내 ` +
      '`롯백웨이팅`' +
      ` 연동 지원\n\n` +
      `잠실점 주차장 진입 게이트(월드타워 지하 동측/남측 진입로) 혼잡도나 에비뉴엘 라운지 위치를 안내해 드릴까요?`,
  },
  {
    id: 'vip_lounge_valet',
    category: 'vip',
    label: 'AVENUEL VIP 라운지 & 발레파킹',
    presetPrompt: 'AVENUEL VIP 라운지 이용 자격 및 발레파킹 혜택 알려줘',
    keywords: ['vip', '라운지', '발레', '주차', '블랙', '에메랄드', '퍼플', '오렌지', '그린', '등급'],
    stageMessages: {
      reasoning: '2026년 AVENUEL VIP 등급 체계(BLACK~GREEN) 및 라운지 운영 정책 검토 중...',
      toolCalling: 'VIP 라운지 혼잡도 및 발레파킹 정책 API 병렬 호출 중...',
      generating: '등급별 선정 기준 · 라운지 · 발레파킹 안내문 생성 중...',
    },
    thoughts: [
      {
        step: 1,
        topic: 'VIP 등급 기준 및 라운지 매핑',
        content:
          '1. 롯데백화점 VIP 제도인 AVENUEL 5개 등급(BLACK, EMERALD, PURPLE, ORANGE, GREEN) 선정 기준 및 전용 라운지 위치 확인.\n',
      },
      {
        step: 2,
        topic: '실시간 라운지 혼잡도 및 발레파킹 조회',
        content:
          '2. check_vip_lounge_status 와 lookup_valet_parking_policy 2개 도구를 순차 호출하여 실시간 대기 현황과 주차 혜택을 결합합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_vip_lounge_01',
        toolName: 'check_vip_lounge_status',
        arguments: { branch: 'main_store', floor: ['2F', '3F', '4F'] },
        status: 'success',
        result:
          '본점 에비뉴엘 2F(BLACK), 3F(EMERALD), 4F(PURPLE) 라운지 현재 대기 0팀 (여유, 즉시 입장 가능)',
        executionMs: 140,
      },
      {
        toolId: 'tool_valet_policy_02',
        toolName: 'lookup_valet_parking_policy',
        arguments: { branch: 'main_store', year: 2026 },
        status: 'success',
        result:
          'AVENUEL BLACK/EMERALD/PURPLE/ORANGE 전용 발레파킹 부스(을지로 입구 사거리 에비뉴엘 정문) 무료 지원 및 일 3~8시간 무료 주차 적용',
        executionMs: 115,
      },
    ],
    answer:
      `롯데백화점 **2026년 AVENUEL VIP 등급별 혜택 · 라운지 · 발레파킹 기준**을 안내해 드립니다.\n\n` +
      `## 1. AVENUEL VIP 등급 체계 및 전용 라운지 (본점 기준)\n` +
      `- **AVENUEL BLACK** (최상위 VVIP 자체 선정): 에비뉴엘 **2F 프라이빗 살롱** (전담 버틀러 상주, 스페셜 플레이팅 다과 & 샴페인 페어링)\n` +
      `- **AVENUEL EMERALD** (연간 1억 원 이상): 에비뉴엘 **3F 에메랄드 라운지** (동반 2인 입장, 시즌 스페셜티 핸드드립 커피 & 디저트)\n` +
      `- **AVENUEL PURPLE** (연간 5,000만~7,000만 원 이상): 에비뉴엘 **4F 퍼플 라운지** (동반 1인 입장, 프리미엄 다과 및 테이크아웃 음료)\n` +
      `- **AVENUEL ORANGE** (연간 2,000만~2,500만 원 이상): 본관 및 에비뉴엘 **오렌지 라운지** 일 1회 이용\n` +
      `- **AVENUEL GREEN** (연간 1,000만 원 이상 / 우량 고객): 전 점 **그린 라운지 / 멤버스 바(Bar)** 음료 테이크아웃 이용\n\n` +
      `## 2. 발레파킹(Valet Parking) 및 무료 주차 혜택\n` +
      `1. **발레파킹 대상**: AVENUEL BLACK · EMERALD · PURPLE · ORANGE 등급 무료 제공\n` +
      `2. **무료 주차 시간**: 등급별 일 **3시간 ~ 종일 무료 주차** 자동 정산 (롯데백화점 APP 내 차량 번호 최대 2대 등록 가능)\n` +
      `3. **현재 라운지 실시간 상태**: 현재 본점 에비뉴엘 2F~4F 전 라운지 **대기 없이 즉시 입장 가능**합니다.\n\n` +
      '```json\n' +
      '{\n' +
      '  "branch": "LOTTE_MAIN_AVENUEL",\n' +
      '  "loungeStatus": "AVAILABLE (Wait: 0 min)",\n' +
      '  "valetGate": "Avenuel Main Drop-zone (Gate 1)",\n' +
      '  "avenuelPointRedemption": "Fine Dining / Spa / Luxury Curation Gift"\n' +
      '}\n' +
      '```\n\n' +
      `고객님의 등급에 맞춘 **에비뉴엘 포인트(AVENUEL POINT)** 사용처나 차량 번호 등록 방법을 안내해 드릴까요?`,
  },
  {
    id: 'dining_fnb',
    category: 'dining',
    label: '푸드에비뉴 & 미쉐린 맛집 추천',
    presetPrompt: '본점과 잠실점 지하 푸드홀 디저트랑 가족 식사하기 좋은 미쉐린 맛집 추천해줘',
    keywords: ['맛집', '식당', '식사', '레스토랑', '푸드', '디저트', '카페', '미쉐린', '웨이팅', '먹거리'],
    stageMessages: {
      reasoning: '점포별 F&B 큐레이션 원장 및 실시간 다이닝 웨이팅 데이터 분석 중...',
      toolCalling: '다이닝 디렉토리 및 실시간 웨이팅 API (query_dining_waiting) 호출 중...',
      generating: '미쉐린 다이닝 및 프리미엄 디저트 추천 리스트 작성 중...',
    },
    thoughts: [
      {
        step: 1,
        topic: '고객 다이닝 니즈 분류',
        content:
          '1. 지하 1층 프리미엄 푸드홀(디저트/델리)과 상층부 식당가(가족 모임용 파인다이닝/한식/중식)로 나누어 추천 필요.\n2. 실시간 웨이팅 현황을 함께 조회하여 방문 편의성을 높입니다.\n',
      },
      {
        step: 2,
        topic: '실시간 웨이팅 API 조회',
        content:
          '3. query_dining_waiting(branches=["main_store", "jamsil"]) 도구를 실행하여 주요 레스토랑 대기 시간을 확인합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_dining_wait_01',
        toolName: 'query_dining_waiting',
        arguments: { branches: ['main_store', 'jamsil'], category: ['fine_dining', 'dessert_deli'] },
        status: 'success',
        result:
          '본점 13F·에비뉴엘 9F 다이닝 평균 대기 10~15분 / B1F 프리미엄 디저트 존(보닐라감자칩·파티스리·수제화과자) 즉시 구매 가능',
        executionMs: 152,
      },
    ],
    answer:
      `롯데백화점 **본점 및 잠실점 시그니처 다이닝 & 디저트 큐레이션**을 안내해 드립니다.\n\n` +
      `## 1. 가족 모임 & 비즈니스 다이닝 추천 (식당가)\n` +
      `- **본점 에비뉴엘 9F & 본관 13F 식당가**:\n` +
      `  1. **홍연 (중식 파인다이닝)**: 북경오리 및 제철 해산물 코스 요리 (프라이빗 룸 완비, 가족 모임 1순위)\n` +
      `  2. **봉피양 / 한우리 (프리미엄 한식)**: 평양냉면 및 한우 샤브샤브·불고기 정식\n` +
      `  3. **스시 파인다이닝 & 스테이크 하우스**: 제철 오마카세 및 드라이에이징 스테이크 코스\n` +
      `- **잠실 에비뉴엘 6F & 롯데월드몰 5F~6F**:\n` +
      `  1. **도림 / 무탄 / 아그라**: 잠실 타워 뷰와 함께 즐기는 프리미엄 중식·인도 커리·한우 다이닝\n` +
      `  2. **고든램지 버거 (롯데월드몰 B1F)**: 하이엔드 수제 버거 & 트러플 프라이즈\n\n` +
      `## 2. B1F 푸드홀 (Food Avenue) 인기 디저트 & 와인\n` +
      `- **선물용 프리미엄 디저트**: 피에르 에르메 / 위고에빅토르 스타일 프렌치 파티스리, 명인 수제 양갱 & 화과자 세트, 뵈르(버터) 구움과자\n` +
      `- **와인 & 샴페인 샵 (B1F 와인갤러리)**: 소믈리에 상주, 돔페리뇽·크루그·그랑크뤼 와인 선물 포장 및 당일 다이닝 콜키지 연계 상담\n\n` +
      `## 3. 스마트 웨이팅 안내\n` +
      `- 매장 도착 전 **롯데백화점 APP > 다이닝 웨이팅** 메뉴에서 원격 줄서기를 신청하시면 대기 시간 없이 바로 입장하실 수 있습니다.`,
  },
  {
    id: 'weekend_promotion',
    category: 'promotion',
    label: '주말 사은행사 & 상품권 계산',
    presetPrompt: '이번 주말 롯데상품권 사은행사 기준 알려줘',
    keywords: ['사은', '상품권', '행사', '할인', '프로모션', '결제', '엘포인트', '웨딩'],
    stageMessages: {
      reasoning: '본점 및 에비뉴엘 주말 프로모션 원장 조회 중...',
      toolCalling: '사은행사 계산기 도구 (query_store_promotions) 실행 중...',
      generating: '구매 금액대별 롯데상품권 증정 기준 정리 중...',
    },
    thoughts: [
      {
        step: 1,
        topic: '주말 프로모션 조건 검증',
        content:
          '1. 금주 금~일요일(3일간) 진행되는 해외명품/주얼리/워치 단일 브랜드 구매 금액대별 7% 및 10% 사은 기준 확인.\n2. 롯데웨딩멤버스 더블 마일리지 및 카드 무이자 할부 조건을 함께 정리합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_promo_calc_01',
        toolName: 'query_store_promotions',
        arguments: { branch: 'main_store', period: 'weekend', category: 'luxury_watch_jewelry' },
        status: 'success',
        result:
          '해외명품/워치/주얼리 100/200/300/500/1,000만 원 이상 구매 시 7% 롯데상품권 증정 (지정 카드 결제 시 최대 10% 구간 운영)',
        executionMs: 190,
      },
    ],
    answer:
      `이번 주말(금~일) 진행되는 **롯데백화점 본점 및 에비뉴엘 사은행사 기준**을 안내해 드립니다.\n\n` +
      `## 1. 해외명품 · 주얼리 · 워치 사은행사 (7% 상당 롯데상품권)\n` +
      `- **100만 원 이상 구매 시**: 롯데상품권 **7만 원** 증정\n` +
      `- **200만 원 이상 구매 시**: 롯데상품권 **14만 원** 증정\n` +
      `- **300만 원 이상 구매 시**: 롯데상품권 **21만 원** 증정\n` +
      `- **500만 원 이상 구매 시**: 롯데상품권 **35만 원** 증정\n` +
      `- **1,000만 원 이상 구매 시**: 롯데상품권 **70만 원** 증정\n\n` +
      `## 2. 패션 · 컨템포러리 · 골프 스페셜 리워드 (10% 구간)\n` +
      `- **30만 / 60만 / 100만 원 이상 구매 시**: 롯데상품권 **3만 / 6만 / 10만 원** 증정 (참여 브랜드 한정)\n` +
      `- **롯데웨딩멤버스 고객**: 웨딩마일리지 가입 후 9개월간 적립 금액의 **최대 7% 상당 상품권** 리워드 (더블 적립 기간 중 2배 적립)\n\n` +
      `## 3. 참여 조건 및 모바일 즉시 수령\n` +
      `1. **결제 수단**: 롯데카드 또는 현대/KB국민 등 당월 제휴 카드로 당일 단일 브랜드 전액 결제 시 적용됩니다.\n` +
      `2. **수령 방법**: 사은 데스크 방문 없이 **롯데백화점 APP > 모바일 사은품 데스크**에서 영수증 확인 후 즉시 모바일 상품권으로 수령 가능합니다.\n\n` +
      `구매 예정이신 브랜드와 예상 금액대를 알려주시면 **최대 혜택 조합(상품권 + 웨딩/에비뉴엘 마일리지 + 무이자 할부)**을 계산해 드릴까요?`,
  },
  {
    id: 'tax_refund_global',
    category: 'service',
    label: '외국인 텍스리펀드 & 컨시어지',
    presetPrompt: '외국인 관광객 텍스리펀드(Tax Refund) 위치랑 유모차 대여, 물품보관함 위치 알려줘',
    keywords: ['텍스리펀', '면세', '환급', '외국인', '여권', '유모차', '물품보관', '락커', '수선', '교환', '환불'],
    stageMessages: {
      reasoning: '점포 내 고객 편의시설(Tax Refund, 유모차 라운지, 스마트 락커) 위치 매핑 중...',
      toolCalling: '고객 서비스 시설 위치 조회 도구 (lookup_concierge_facilities) 호출 중...',
      generating: '층별 편의시설 및 텍스리펀드 한도 안내문 생성 중...',
    },
    thoughts: [
      {
        step: 1,
        topic: '편의시설 및 외국인 사후면세 규정 확인',
        content:
          '1. 외국인 고객 즉시환급(Immediate Tax Refund) 한도 및 키오스크/데스크 위치 확인.\n2. 유아 동반 고객을 위한 유모차 대여소(유아휴게실) 및 지하 사물함(물품보관함) 위치를 조회합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_facility_01',
        toolName: 'lookup_concierge_facilities',
        arguments: { branch: 'main_store', services: ['tax_refund', 'stroller_rental', 'luggage_locker'] },
        status: 'success',
        result:
          '본점 Tax Refund: 본관 1F 투어리스트 살롱 & B1F 무인 키오스크 / 유모차 대여: 본관 7F 유아휴게실 & 1F 컨시어지 / 물품보관: B1F 지하철 연결통로 및 1F 안내데스크',
        executionMs: 138,
      },
    ],
    answer:
      `롯데백화점 본점 기준 **외국인 텍스리펀드(Tax Refund) 및 주요 고객 편의시설** 위치를 안내해 드립니다.\n\n` +
      `## 1. 외국인 텍스리펀드 (Tax Refund) 안내\n` +
      `- **즉시환급 (Immediate Refund)**: 매장에서 결제 시 **실물 여권(Passport)**을 제시하시면 건당 1.5만 원 이상 ~ 100만 원 이하(체류 기간 총 500만 원 한도)까지 **부가세 차감 금액으로 즉시 결제**됩니다.\n` +
      `- **사후환급 데스크 & 키오스크 위치**:\n` +
      `  1. **본관 1F 투어리스트 살롱 (Tourist Salon)**: 글로벌 택스프리(GTF) · 글로벌블루(Global Blue) 유인 데스크 및 통역 컨시어지 상주\n` +
      `  2. **본관 B1F & 에비뉴엘 1F**: 다국어(영·중·일) 무인 환급 키오스크 운영\n\n` +
      `## 2. 유모차 대여 · 유아휴게실 · 물품보관함\n` +
      `1. **유모차 무료 대여**: **본관 1F 정문 안내데스크** 및 **7F 키즈관 유아휴게실** (생후 1개월~36개월용 프리미엄 디럭스 유모차 살균 소독 제공)\n` +
      `2. **유아휴게실 (Little Lounge)**: **본관 7F** (수유실, 이유식 카페, 기저귀 교환대, 패밀리 룸 완비)\n` +
      `3. **무료 물품보관함 & 캐리어 보관**:\n` +
      `   - **B1F 지하철(을지로입구역) 연결통로 스마트 락커** 및 **B1F 푸드홀 냉장 보관함**\n` +
      `   - 대형 여행 캐리어는 **1F 투어리스트 살롱 / 컨시어지 데스크**에서 당일 무료 보관 서비스를 제공합니다.\n\n` +
      `## 3. 교환 · 환불 및 명품 수선 안내\n` +
      `- 구매일로부터 **7일 이내** 영수증 및 결제 카드 지참 시 구매 매장 방문을 통해 교환/환불이 가능합니다.`,
  },
  {
    id: 'error_simulation',
    category: 'system',
    label: '장애/타임아웃 복구 테스트',
    presetPrompt: '[장애 테스트] 재고 서버 타임아웃 시뮬레이션 실행해줘',
    keywords: ['장애', '에러', '오류', '타임아웃'],
    stageMessages: {
      reasoning: '실시간 해외 부티크 재고 연동 요청 분석 중...',
      toolCalling: '외부 글로벌 ERP 재고 서버 (query_external_erp_inventory) 호출 중...',
      generating: '',
    },
    thoughts: [
      {
        step: 1,
        topic: '외부 ERP 연동 시도',
        content:
          '1. 실시간 매장 재고 확인을 위해 글로벌 부티크 ERP 게이트웨이에 연결을 시도합니다.\n2. 응답 지연(Timeout threshold > 1500ms) 감지 여부를 모니터링합니다.\n',
      },
    ],
    tools: [
      {
        toolId: 'tool_erp_err_01',
        toolName: 'query_external_erp_inventory',
        arguments: { sku: 'LV-CAPUCINES-BB-BLK', branch: 'main_avenuel' },
        status: 'failure',
        error: 'ETIMEDOUT: Global ERP Upstream Gateway did not respond within 1500ms',
        executionMs: 1500,
      },
    ],
    answer: '',
    simulateError: {
      code: 'MODEL_TIMEOUT',
      message:
        '사내 재고 연동 서버 응답이 지연되어 추론이 중단되었습니다. 네트워크 상태를 확인하거나 [다시 시도 (복구)] 버튼을 눌러 로컬 캐시 폴백으로 복구해 주세요.',
      retryable: true,
    },
  },
];

/**
 * 사용자의 프롬프트와 이전 대화 히스토리(history)를 분석하여
 * 가장 적합한 Mock 시나리오를 반환하거나 롯데백화점 지식베이스 기반 멀티턴 응답을 동적으로 생성합니다.
 */
export function resolveMockScenario(
  promptText: string,
  history: ConversationTurn[] = []
): MockScenarioDefinition {
  const normalized = promptText.toLowerCase();

  // 1. 장애/에러 시뮬레이션 우선 매칭
  const errorScenario = PRESET_SCENARIOS.find((s) => s.id === 'error_simulation')!;
  if (errorScenario.keywords.some((kw) => normalized.includes(kw))) {
    return errorScenario;
  }

  // 2. 프리셋 프롬프트 완전 일치 시 즉시 반환
  const exactMatch = PRESET_SCENARIOS.find((s) => s.presetPrompt === promptText.trim());
  if (exactMatch) {
    return exactMatch;
  }

  // 3. 타임빌라스 수원 / 부산 센텀시티 등 지역 거점 점포 특화 질문 매칭
  if (
    normalized.includes('수원') ||
    normalized.includes('타임빌라스') ||
    normalized.includes('부산') ||
    normalized.includes('센텀')
  ) {
    const isSuwon = normalized.includes('수원') || normalized.includes('타임빌라스');
    const targetBranch = isSuwon
      ? LOTTE_BRANCH_DIRECTORY.timevillas_suwon
      : LOTTE_BRANCH_DIRECTORY.busan_centum;

    return {
      id: 'regional_flagship_store',
      category: 'branch',
      label: isSuwon ? '타임빌라스 수원 안내' : '부산본점·센텀시티점 안내',
      presetPrompt: promptText,
      keywords: [],
      stageMessages: {
        reasoning: `${targetBranch.name} 점포 운영 정보 및 시그니처 공간 분석 중...`,
        toolCalling: '전국 거점 점포 디렉토리 API (fetch_regional_branch_info) 호출 중...',
        generating: `${targetBranch.name} 맞춤 안내문 생성 중...`,
      },
      thoughts: [
        {
          step: 1,
          topic: '거점 플래그십 점포 식별',
          content: `1. 고객 문의 점포: ${targetBranch.name}\n2. 교통편(${targetBranch.subway}), 영업시간 및 특화 조닝 정보를 조회합니다.\n`,
        },
      ],
      tools: [
        {
          toolId: 'tool_regional_01',
          toolName: 'fetch_regional_branch_info',
          arguments: { branchKey: isSuwon ? 'timevillas_suwon' : 'busan_centum' },
          status: 'success',
          result: `${targetBranch.name} 영업시간(${targetBranch.hours.weekday} / 주말 ${targetBranch.hours.weekend}) 및 특화 조닝 로드 완료`,
          executionMs: 142,
        },
      ],
      answer:
        `**${targetBranch.name}** 방문 및 주요 특화 공간을 안내해 드립니다.\n\n` +
        `## 1. 점포 기본 정보\n` +
        `- **주소**: ${targetBranch.address}\n` +
        `- **대중교통**: ${targetBranch.subway}\n` +
        `- **영업시간**: 평일 ` +
        `\`${targetBranch.hours.weekday}\`` +
        ` / 주말(금~일)·공휴일 ` +
        `\`${targetBranch.hours.weekend}\`` +
        `\n\n` +
        (isSuwon
          ? `## 2. 타임빌라스 수원(TIMEVILLAS SUWON) 핵심 포인트\n` +
            `1. **프리미엄 쇼핑몰 + 백화점 하이브리드**: 컨버전스형 럭셔리 부티크(1F~2F)와 MZ 타깃 글로벌 스포츠·스트리트 플래그십이 결합된 미래형 쇼핑 공간입니다.\n` +
            `2. **3F 다이닝 에비뉴(Dining Avenue)**: 수원 지역 최대 규모 프리미엄 푸드홀로 ` +
            '`22:00`' +
            `까지 연장 운영됩니다.\n`
          : `## 2. 부산본점(서면) & 센텀시티점 핵심 포인트\n` +
            `1. **에비뉴엘 부산본점 & 센텀시티 명품관**: 영남권 최대 규모의 하이주얼리·워치·해외명품 풀라인 부티크를 운영합니다.\n` +
            `2. **해운대·센텀 연계 컨시어지**: 센텀시티역 지하 직결 통로 및 프라이빗 VIP 라운지/발레파킹을 편리하게 이용하실 수 있습니다.\n`) +
        `\n방문 예정이신 요일이나 찾으시는 브랜드가 있으시면 층별 위치를 상세히 안내해 드릴까요?`,
    };
  }

  // 4. 등록된 프리셋 시나리오 키워드 가중치 매칭
  for (const scenario of PRESET_SCENARIOS) {
    if (scenario.id === 'error_simulation') continue;
    if (scenario.keywords.some((kw) => normalized.includes(kw))) {
      return scenario;
    }
  }

  // 5. 그 외 자유 질문: 롯데백화점 지식베이스 원장 + 이전 대화 문맥(Multi-turn History) 결합 응답
  const userTurns = history.filter((h) => h.role === 'user');
  const lastUserQuestion =
    userTurns.length > 0 ? userTurns[userTurns.length - 1].content : null;

  const contextNote = lastUserQuestion
    ? `이전 대화 문맥("${
        lastUserQuestion.length > 25 ? lastUserQuestion.slice(0, 25) + '...' : lastUserQuestion
      }")을 함께 참조하여`
    : '신규 대화 세션 컨텍스트를 기반으로';

  return {
    id: 'dynamic_contextual',
    category: 'service',
    label: '맞춤 컨시어지 응답',
    presetPrompt: promptText,
    keywords: [],
    stageMessages: {
      reasoning: `${contextNote} 고객 질문 의도를 분석하고 있습니다...`,
      toolCalling: '롯데백화점 통합 지식베이스 (search_lotte_knowledge_base) 검색 중...',
      generating: '맞춤형 컨시어지 답변을 작성하고 있습니다...',
    },
    thoughts: [
      {
        step: 1,
        topic: '멀티턴 컨텍스트 및 질문 분석',
        content: `1. 현재 입력 질문: "${promptText}"\n2. 참조된 이전 대화 턴 수: ${history.length}턴 (${contextNote} 추론 수행)\n`,
      },
      {
        step: 2,
        topic: '통합 지식베이스 검색',
        content: `3. search_lotte_knowledge_base 도구를 실행하여 점포 운영 정보(영업시간, 주차, 컨시어지, 브랜드 가이드)를 매칭합니다.\n`,
      },
    ],
    tools: [
      {
        toolId: `tool_kb_${Date.now().toString().slice(-4)}`,
        toolName: 'search_lotte_knowledge_base',
        arguments: {
          query: promptText,
          contextTurns: history.length,
          branches: ['main_store', 'jamsil_worldtower', 'timevillas_suwon'],
        },
        status: 'success',
        result: `질문("${promptText.slice(0, 20)}") 관련 롯데백화점 점포 운영 가이드 및 혜택 문서 4건 매칭 완료`,
        executionMs: 155,
      },
    ],
    answer:
      `안녕하세요. 롯데백화점 AI 컨시어지입니다.\n\n` +
      `문의하신 **"${promptText}"**에 대해 ${contextNote} 안내해 드립니다.\n\n` +
      `## 1. 주요 점포 운영 및 이용 안내\n` +
      `- **정상 영업시간**: 평일(월~목) ` +
      '`10:30 ~ 20:00`' +
      ` / 주말(금~일)·공휴일 ` +
      '`10:30 ~ 20:30`' +
      ` (식당가는 점포별 ` +
      '`21:00 ~ 22:00`' +
      `까지 운영)\n` +
      `- **대표 플래그십 점포**:\n` +
      `  1. **본점 & 에비뉴엘 본점**: 2호선 을지로입구역 7번 출구 지하 직결\n` +
      `  2. **잠실점 & 에비뉴엘 월드타워점**: 2·8호선 잠실역 지하 직결\n` +
      `  3. **타임빌라스 수원**: 1호선·수인분당선 수원역 연결통로 직결\n` +
      `- **스마트 컨시어지**: **롯데백화점 APP**을 통해 무료 주차권(월 2매) 사용, 다이닝 원격 웨이팅, 모바일 사은품 즉시 수령을 이용하실 수 있습니다.\n\n` +
      (lastUserQuestion
        ? `## 2. 이전 대화 연계 안내\n앞서 문의하셨던 **"${lastUserQuestion}"** 내용과 연계하여 특정 브랜드 매장 재고나 층별 안내가 필요하시면 말씀해 주세요.\n\n`
        : ``) +
      `찾으시는 특정 점포(본점, 잠실점, 부산본점, 타임빌라스 수원 등)나 브랜드명을 알려주시면 더욱 정확한 위치와 혜택을 안내해 드리겠습니다.`,
  };
}
