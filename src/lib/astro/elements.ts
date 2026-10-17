import { ELEMENTS, ZODIAC_SIGNS } from '@/lib/astro/zodiac';
import type {
  ElementBalance,
  ElementCommentPlan,
  ElementContribution,
  ElementId,
  ElementPointSource,
  NatalPositions,
  ZodiacSignId,
} from '@/types/astro';

/**
 * 4원소 가중치표 (2026-10-17 사용자 결정).
 * Kerykeion v6 (오픈소스, kerykeion/charts/utils.py의 DEFAULT_WEIGHTED_POINT_WEIGHTS) 기본값을
 * 우리가 계산하는 12개 지점에만 적용했다. Kerykeion 기본 활성 지점 중 True North Node(0.5)와 Chiron(0.6)은 넣지 않았다.
 * - 태양·달·상승궁 2점
 * - 수성·금성·화성·MC 1.5점
 * - 목성·토성 1점
 * - 천왕성·해왕성·명왕성 0.5점 (세대 공통 기운이 개인 비율을 왜곡하지 않게)
 * 숫자만 참고했고 코드는 옮겨 오지 않았다 (Kerykeion은 AGPL-3.0).
 * 원소 비율에는 품계·하우스·애스펙트 보정을 넣지 않는다. 그런 보정은 '차트 파워'(lib/astro/power.ts, 유료)에서 따로 계산한다.
 */
export const ELEMENT_WEIGHTS: Record<ElementPointSource, number> = {
  sun: 2,
  moon: 2,
  ascendant: 2,
  mercury: 1.5,
  venus: 1.5,
  mars: 1.5,
  midheaven: 1.5,
  jupiter: 1,
  saturn: 1,
  uranus: 0.5,
  neptune: 0.5,
  pluto: 0.5,
};

/**
 * 원소 코멘트 규칙의 기준값 (2026-10-17 사용자 결정, 서비스 자체 기준).
 * 근거는 외부 표준이 아니라 실제 엔진으로 돌린 분포 시뮬레이션이다 (docs/element-distribution.md).
 * - 네 원소가 모두 balancedMin% 이상 balancedMax% 이하면 균형형 (약 9%의 사용자)
 * - 가장 낮은 원소가 lackingBelow% 미만이면 '적은 편'을 보여준다 (약 80%의 사용자)
 * 비율은 표시용 정수 %가 아니라 정확한 값(점수 ÷ 총점 × 100)으로 비교한다.
 */
export const ELEMENT_COMMENT_RULES = {
  balancedMin: 15,
  balancedMax: 35,
  lackingBelow: 15,
} as const;

/**
 * 강한 편 동점을 가르는 '무거운 지점' 순서. 지점마다 원소가 하나뿐이라 이 순서로 항상 하나가 정해진다.
 * 태양 > 달 > 상승궁 > 수성 > 금성 > 화성 > MC > 목성 > 토성 > 천왕성 > 해왕성 > 명왕성
 */
export const POINT_PRIORITY: readonly ElementPointSource[] = [
  'sun',
  'moon',
  'ascendant',
  'mercury',
  'venus',
  'mars',
  'midheaven',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

/** 계산과 표시 순서. 동점 원소를 나열할 때도 이 순서를 쓴다. */
const ELEMENT_ORDER: readonly ElementId[] = ELEMENTS.map((element) => element.id);

function emptyRecord(): Record<ElementId, number> {
  return { fire: 0, earth: 0, air: 0, water: 0 };
}

/**
 * 정수 백분율을 만든다 (최대 잔여법). 내림한 뒤 남은 1%씩을 소수부가 큰 원소부터 나눠 준다.
 * 단, 점수가 같은 원소는 항상 같은 %가 되도록 묶어서 주고, 묶음 전체에 줄 만큼 남지 않으면 주지 않는다.
 * 그래서 합은 100이 아니라 99가 될 수 있다 (예: 불 4점·흙 4점 → 30%/29%가 아니라 29%/29%).
 */
export function toWholePercentages(scores: Record<ElementId, number>): Record<ElementId, number> {
  const total = ELEMENT_ORDER.reduce((sum, id) => sum + scores[id], 0);
  const result = emptyRecord();
  if (total === 0) return result;

  for (const id of ELEMENT_ORDER) result[id] = Math.floor((scores[id] / total) * 100);
  let remaining = 100 - ELEMENT_ORDER.reduce((sum, id) => sum + result[id], 0);

  // 점수가 같은 원소끼리 묶고, 소수부가 큰 묶음부터 처리한다.
  const groups = new Map<number, ElementId[]>();
  for (const id of ELEMENT_ORDER) groups.set(scores[id], [...(groups.get(scores[id]) ?? []), id]);
  const fraction = (score: number) => ((score / total) * 100) % 1;
  const ordered = [...groups.entries()].sort(([a], [b]) => fraction(b) - fraction(a));

  for (const [score, ids] of ordered) {
    if (remaining === 0) break;
    if (fraction(score) === 0 || ids.length > remaining) continue;
    for (const id of ids) result[id] += 1;
    remaining -= ids.length;
  }
  return result;
}

/** 그 원소에 점수를 보탠 지점 중 가장 무거운 지점의 순위 (작을수록 무겁다). 점수가 없으면 Infinity. */
function heaviestPointRank(contributions: readonly ElementContribution[], element: ElementId): number {
  const ranks = contributions
    .filter((item) => item.element === element)
    .map((item) => POINT_PRIORITY.indexOf(item.source));
  return ranks.length > 0 ? Math.min(...ranks) : Number.POSITIVE_INFINITY;
}

/** 원소 코멘트 계획을 세운다. 규칙은 ElementCommentPlan 타입 설명 참고. */
export function planElementComments(
  scores: Record<ElementId, number>,
  contributions: readonly ElementContribution[],
): ElementCommentPlan {
  const total = ELEMENT_ORDER.reduce((sum, id) => sum + scores[id], 0);
  const percent = (id: ElementId) => (total === 0 ? 0 : (scores[id] / total) * 100);

  const { balancedMin, balancedMax, lackingBelow } = ELEMENT_COMMENT_RULES;
  if (ELEMENT_ORDER.every((id) => percent(id) >= balancedMin && percent(id) <= balancedMax)) {
    return { kind: 'balanced' };
  }

  const maxScore = Math.max(...ELEMENT_ORDER.map((id) => scores[id]));
  const strongElements = ELEMENT_ORDER.filter((id) => scores[id] === maxScore);
  const commentElement = strongElements.reduce((best, id) =>
    heaviestPointRank(contributions, id) < heaviestPointRank(contributions, best) ? id : best,
  );

  const minScore = Math.min(...ELEMENT_ORDER.map((id) => scores[id]));
  const lowest = ELEMENT_ORDER.filter((id) => scores[id] === minScore);
  const lacking = percent(lowest[0]) < lackingBelow ? lowest : [];

  return { kind: 'leaning', strong: { elements: strongElements, commentElement }, lacking };
}

/** 각 대상이 놓인 별자리 목록으로 4원소 비율을 계산한다. */
export function computeElementBalanceFromSigns(
  placements: Partial<Record<ElementPointSource, ZodiacSignId>>,
): ElementBalance {
  const scores = emptyRecord();
  const contributions: ElementContribution[] = [];

  for (const source of Object.keys(ELEMENT_WEIGHTS) as ElementPointSource[]) {
    const sign = placements[source];
    if (sign === undefined) continue;
    const element = ZODIAC_SIGNS[sign].element;
    const points = ELEMENT_WEIGHTS[source];
    scores[element] += points;
    contributions.push({ source, sign, element, points });
  }

  const totalPoints = contributions.reduce((sum, item) => sum + item.points, 0);
  const commentPlan = planElementComments(scores, contributions);

  // 균형형이어도 dominant는 필요하다(ChartSummary 등). 규칙은 강한 편 동점 처리와 같다.
  const maxScore = Math.max(...ELEMENT_ORDER.map((id) => scores[id]));
  const dominant = ELEMENT_ORDER.filter((id) => scores[id] === maxScore).reduce((best, id) =>
    heaviestPointRank(contributions, id) < heaviestPointRank(contributions, best) ? id : best,
  );
  const tiedWithDominant = ELEMENT_ORDER.filter((id) => id !== dominant && scores[id] === scores[dominant]);
  const excluded = (['ascendant', 'midheaven'] as const).filter((angle) => placements[angle] === undefined);

  return {
    method: 'base-weights',
    scores,
    percentages: toWholePercentages(scores),
    totalPoints,
    dominant,
    tiedWithDominant,
    commentPlan,
    contributions,
    excluded,
  };
}

/** 계산 엔진 결과로 4원소 비율을 계산한다. 출생 시간을 모르면 상승궁·MC는 빠진다. */
export function computeElementBalance(positions: NatalPositions): ElementBalance {
  const placements: Partial<Record<ElementPointSource, ZodiacSignId>> = {};
  for (const [body, position] of Object.entries(positions.bodies) as Array<
    [keyof NatalPositions['bodies'], NatalPositions['bodies'][keyof NatalPositions['bodies']]]
  >) {
    placements[body] = position.sign;
  }
  if (positions.angles) {
    placements.ascendant = positions.angles.ascendant.sign;
    placements.midheaven = positions.angles.midheaven.sign;
  }
  return computeElementBalanceFromSigns(placements);
}
