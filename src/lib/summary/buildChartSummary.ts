import type {
  BigThreeKey,
  ChartApiResponse,
  ChartSummary,
  ElementBalance,
  ElementCommentText,
  ElementId,
  ElementSummaryView,
  Placement,
  SignPosition,
} from '@/types/astro';
import type { FreeStageContent } from '@/types/content';

/** 결과 화면에 필요한 위치: 태양·달·상승궁 (출생 시간을 모르면 상승궁 null) */
export interface BigThreePositions {
  sun: SignPosition;
  moon: SignPosition;
  rising: SignPosition | null;
}

export interface BuildChartSummaryInput {
  source: ChartSummary['source'];
  bigThree: BigThreePositions;
  balance: ElementBalance;
  content: FreeStageContent;
}

function toPlacement(kind: BigThreeKey, position: SignPosition, content: FreeStageContent): Placement {
  const text = content.placements[kind][position.sign];
  return {
    sign: position.sign,
    degree: position.degree,
    headline: text.headline,
    description: text.description,
    keywords: [...text.keywords],
  };
}

/** 원소 코멘트 계획(어떤 코멘트를 보여줄지)에 문구를 채운다. */
export function toElementSummaryView(balance: ElementBalance, content: FreeStageContent): ElementSummaryView {
  const plan = balance.commentPlan;
  if (plan.kind === 'balanced') return { kind: 'balanced', text: content.elements.balanced };

  const lacking = (element: ElementId): ElementCommentText => ({ element, text: content.elements.lacking[element] });
  return {
    kind: 'leaning',
    strong: {
      elements: plan.strong.elements,
      comment: { element: plan.strong.commentElement, text: content.elements.dominant[plan.strong.commentElement] },
    },
    lacking: plan.lacking.map(lacking),
  };
}

/**
 * 계산 결과(별자리 위치 + 원소 비율)와 해석 문구로 결과 화면용 ChartSummary를 만든다.
 * 목업과 실제 계산이 같은 함수를 지나므로, 화면은 데이터 출처와 상관없이 같은 모양을 받는다.
 */
export function buildChartSummary({ source, bigThree, balance, content }: BuildChartSummaryInput): ChartSummary {
  return {
    source,
    contentOrigin: content.origin,
    sun: toPlacement('sun', bigThree.sun, content),
    moon: toPlacement('moon', bigThree.moon, content),
    rising: bigThree.rising ? toPlacement('rising', bigThree.rising, content) : null,
    elements: {
      percentages: balance.percentages,
      view: toElementSummaryView(balance, content),
      excluded: balance.excluded,
    },
  };
}

/** 실제 계산(/api/chart 응답)으로 결과 화면용 ChartSummary를 만든다. 출생 시간을 모르면 angles가 null이라 상승궁도 null이다. */
export function buildComputedChartSummary(chart: ChartApiResponse, content: FreeStageContent): ChartSummary {
  const { bodies, angles } = chart.positions;
  return buildChartSummary({
    source: 'computed',
    bigThree: { sun: bodies.sun, moon: bodies.moon, rising: angles?.ascendant ?? null },
    balance: chart.elementBalance,
    content,
  });
}
