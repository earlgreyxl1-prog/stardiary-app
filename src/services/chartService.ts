import { FREE_STAGE_CONTENT } from '@/content/freeStage';
import { computeElementBalanceFromSigns } from '@/lib/astro/elements';
import { longitudeToSign, ZODIAC_ORDER } from '@/lib/astro/zodiac';
import { buildChartSummary } from '@/lib/summary/buildChartSummary';
import { MOCK_CHARTS, pickMockChart } from '@/mocks/chart';
import type { ChartSummary, ElementPointSource, SignPosition, ZodiacSignId } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

const MOCK_LATENCY_MS = 900;
/** 에러 UI를 확인하기 위한 목업 전용 입력값. 이 닉네임으로 온보딩하면 실패를 던진다. */
const MOCK_FAILURE_NICKNAME = '!error';

export class ChartCalculationError extends Error {
  constructor(message = '별자리를 계산하지 못했어요.') {
    super(message);
    this.name = 'ChartCalculationError';
  }
}

function signPosition(sign: ZodiacSignId, degree: number): SignPosition {
  return longitudeToSign(ZODIAC_ORDER.indexOf(sign) * 30 + degree);
}

/**
 * 1단계 무료 결과(태양/달/상승궁, 4원소)를 가져온다. 현재는 목업 차트를 쓰지만, 원소 비율·코멘트·문구 조립은
 * 실제 계산과 같은 함수(computeElementBalanceFromSigns, buildChartSummary)를 지난다.
 * 실제 계산으로 바꿀 때는 /api/chart 응답(positions, elementBalance)을 buildChartSummary에 넘기면 된다.
 */
export async function getChartSummary(input: BirthInput): Promise<ChartSummary> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  if (input.nickname.trim() === MOCK_FAILURE_NICKNAME) {
    throw new ChartCalculationError();
  }

  const mock = MOCK_CHARTS[pickMockChart(input.nickname)];
  const placements: Partial<Record<ElementPointSource, ZodiacSignId>> = { ...mock.placements };
  if (input.timeUnknown) {
    delete placements.ascendant;
    delete placements.midheaven;
  }

  return buildChartSummary({
    source: 'mock',
    bigThree: {
      sun: signPosition(mock.placements.sun, mock.degrees.sun),
      moon: signPosition(mock.placements.moon, mock.degrees.moon),
      rising: input.timeUnknown ? null : signPosition(mock.placements.ascendant, mock.degrees.ascendant),
    },
    balance: computeElementBalanceFromSigns(placements),
    content: FREE_STAGE_CONTENT,
  });
}
