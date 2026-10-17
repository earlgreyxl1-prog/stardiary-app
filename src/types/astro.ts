export type ZodiacSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type ElementId = 'fire' | 'earth' | 'air' | 'water';

/** 계산하는 천체. 태양과 달을 포함한 전통 10천체. */
export type BodyId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

/** 황경(0 이상 360 미만)을 별자리와 별자리 안 도수로 나눈 값 */
export interface SignPosition {
  /** 황경 (도) */
  longitude: number;
  sign: ZodiacSignId;
  /** 별자리 안에서의 도수 (0 이상 30 미만) */
  degree: number;
}

export interface BodyPosition extends SignPosition {
  /** 하루 이동량 (도/일). 음수면 역행 */
  speed: number;
  retrograde: boolean;
}

/**
 * 출생 시간을 모를 때, 그날 0시부터 24시 사이에 별자리가 바뀌는 천체의 범위.
 * 예: 달이 그날 게자리에서 사자자리로 넘어갔다면 { first: 'cancer', last: 'leo' }
 */
export interface SignRange {
  first: ZodiacSignId;
  last: ZodiacSignId;
}

export type HouseSystemId = 'placidus' | 'porphyry' | 'whole-sign';

/** 하우스 번호 1~12 */
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * 12하우스 계산 결과. 기본은 Placidus이고, 고위도라 계산할 수 없으면 Porphyry → Whole Sign 순으로 바꾼다.
 * - fallbackReason: 'high-latitude'(위도 ±66° 초과라 처음부터 대체), 'calculation-failed'(Placidus 계산 실패)
 */
export interface NatalHouses {
  system: HouseSystemId;
  fallbackReason: 'high-latitude' | 'calculation-failed' | null;
  /** cusps[0]이 1하우스 시작선(= 상승궁) */
  cusps: SignPosition[];
  /** 하우스 시작선을 하나도 얻지 못하고 하우스 안에 통째로 갇힌 별자리 (인터셉션) */
  intercepted: Array<{ sign: ZodiacSignId; house: HouseNumber }>;
  /** 두 하우스의 시작선을 연달아 차지한 별자리 */
  duplicated: Array<{ sign: ZodiacSignId; houses: [HouseNumber, HouseNumber] }>;
  /** 각 천체가 놓인 하우스 */
  bodyHouses: Record<BodyId, HouseNumber>;
}

/**
 * 계산 엔진(Swiss Ephemeris)이 돌려주는 원본 위치. 해석 문구는 들어 있지 않다.
 * - timeUnknown이면 bodies는 현지 정오 기준이고, angles는 null이다.
 */
export interface NatalPositions {
  /** 출생 순간의 UTC (ISO 8601) */
  utc: string;
  /** 출생 당시 현지 시각의 UTC 오프셋 (분). 서머타임과 과거 표준시 변경이 반영된 값 */
  utcOffsetMinutes: number;
  julianDayUt: number;
  timeUnknown: boolean;
  bodies: Record<BodyId, BodyPosition>;
  /** 상승궁(ASC)과 천정(MC). 출생 시간을 모르면 null */
  angles: { ascendant: SignPosition; midheaven: SignPosition } | null;
  /** 12하우스. 출생 시간을 모르면 null */
  houses: NatalHouses | null;
  /** 출생 시간을 모를 때만 채워진다. 그날 안에 별자리가 바뀌는 천체만 들어 있다. */
  ambiguousSigns: Partial<Record<BodyId, SignRange>>;
}

/** 4원소 점수를 매기는 대상. 10천체 + 상승궁(ASC) + 천정(MC) */
export type ElementPointSource = BodyId | 'ascendant' | 'midheaven';

/** 한 천체(지점)가 어느 원소에 몇 점을 보탰는지 */
export interface ElementContribution {
  source: ElementPointSource;
  sign: ZodiacSignId;
  element: ElementId;
  points: number;
}

/**
 * 원소 코멘트를 어떻게 보여줄지 (2026-10-17 사용자 결정, 근거: docs/element-distribution.md).
 * - balanced: 네 원소가 모두 15% 이상 35% 이하 → 균형형 코멘트 하나만 보여준다(강한 편·적은 편 생략).
 * - leaning: 그 밖의 경우.
 *   - strong.elements: 점수가 가장 높은 원소(동점이면 여럿). 제목에 모두 쓴다("불과 흙이 똑같이 강해요").
 *   - strong.commentElement: 코멘트를 보여줄 원소 하나. 동점이면 가장 무거운 지점(태양 > 달 > 상승궁 > …)을 가진 원소.
 *   - lacking: 점수가 가장 낮고 15% 미만인 원소(동점이면 모두). 비어 있으면 '적은 편'을 보여주지 않는다.
 *     여럿이면 제목에 모두 쓰고 각 원소의 '적은 편' 코멘트를 이어 붙인다.
 */
export type ElementCommentPlan =
  | { kind: 'balanced' }
  | {
      kind: 'leaning';
      strong: { elements: ElementId[]; commentElement: ElementId };
      lacking: ElementId[];
    };

/**
 * 4원소 비율 계산 결과 (기본 가중치표 방식).
 * - percentages: 정수 (화면 표시용). 점수가 같은 원소는 같은 %가 되도록 해서 합이 99일 수 있다.
 * - excluded: 출생 시간을 몰라서 빠진 지점. 비율은 남은 점수만으로 계산한다.
 */
export interface ElementBalance {
  method: 'base-weights';
  scores: Record<ElementId, number>;
  percentages: Record<ElementId, number>;
  totalPoints: number;
  /** 점수가 가장 높은 원소. 동점이면 가장 무거운 지점을 가진 원소 (commentPlan의 strong.commentElement와 같다) */
  dominant: ElementId;
  /** dominant와 점수가 같은 원소들. 비어 있지 않으면 "불과 흙이 똑같이 강해요"처럼 보여줘야 한다. */
  tiedWithDominant: ElementId[];
  /** 결과 화면에 어떤 원소 코멘트를 보여줄지 */
  commentPlan: ElementCommentPlan;
  contributions: ElementContribution[];
  excluded: Array<'ascendant' | 'midheaven'>;
}

/** POST /api/chart 성공 응답 */
export interface ChartApiResponse {
  positions: NatalPositions;
  elementBalance: ElementBalance;
}

/** 1단계 무료 결과에서 보여주는 핵심 3대 요소 */
export type BigThreeKey = 'sun' | 'moon' | 'rising';

/** 별자리 고정 정보. 계산 결과와 무관한 사전 데이터다. */
export interface ZodiacSign {
  id: ZodiacSignId;
  nameKo: string;
  symbol: string;
  element: ElementId;
}

/** 특정 천체(또는 상승점)가 놓인 별자리와 그 해석 */
export interface Placement {
  sign: ZodiacSignId;
  /** 별자리 안에서의 도수 (0 이상 30 미만) */
  degree: number;
  headline: string;
  description: string;
  keywords: string[];
}

/** 원소 하나와 그 원소의 코멘트 문구 */
export interface ElementCommentText {
  element: ElementId;
  text: string;
}

/**
 * 결과 화면의 원소 코멘트 (ElementCommentPlan에 문구를 채운 것).
 * - balanced: 균형형 코멘트 하나만
 * - leaning: 강한 편(동점이면 elements가 여럿, 코멘트는 하나) + 적은 편 0~3개(여럿이면 차례로 이어 붙인다)
 */
export type ElementSummaryView =
  | { kind: 'balanced'; text: string }
  | {
      kind: 'leaning';
      strong: { elements: ElementId[]; comment: ElementCommentText };
      lacking: ElementCommentText[];
    };

export interface ElementSummary {
  /** 표시용 정수 %. 동점 원소를 같게 맞추느라 합이 99일 수 있다 (ElementBalance.percentages) */
  percentages: Record<ElementId, number>;
  view: ElementSummaryView;
  /** 출생 시간을 몰라 계산에서 빠진 지점. 비어 있지 않으면 화면에 안내한다. */
  excluded: Array<'ascendant' | 'midheaven'>;
}

/**
 * 1단계 무료 결과. 목업이든 실제 계산이든 lib/summary/buildChartSummary로 만든다.
 * - source: 'mock'이면 입력과 무관한 예시 결과라고 화면에 안내한다.
 * - contentOrigin: 해석 문구 출처. 'ai-draft'면 작가 검수 전 임시 문구라고 안내한다.
 * - rising: 출생 시간을 모르면 계산할 수 없으므로 null
 */
export interface ChartSummary {
  source: 'mock' | 'computed';
  contentOrigin: 'ai-draft' | 'writer';
  sun: Placement;
  moon: Placement;
  rising: Placement | null;
  elements: ElementSummary;
}
