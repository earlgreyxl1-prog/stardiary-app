import { FREE_STAGE_CONTENT } from '@/content/freeStage';
import { computeElementBalanceFromSigns } from '@/lib/astro/elements';
import { longitudeToSign, ZODIAC_ORDER } from '@/lib/astro/zodiac';
import { buildChartSummary, buildComputedChartSummary } from '@/lib/summary/buildChartSummary';
import { findMockChart, MOCK_CHARTS, type MockChartId } from '@/mocks/chart';
import { requestChart } from '@/services/chartApi';
import type { ChartSummary, ElementPointSource, SignPosition, ZodiacSignId } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

/** 화면 상태를 확인하는 개발용 닉네임(목업 장면, '!error')은 운영에서 동작하지 않는다. */
export const MOCK_SCENES_AVAILABLE = process.env.NODE_ENV !== 'production';

const MOCK_LATENCY_MS = 900;
/** 에러 UI를 확인하기 위한 개발용 입력값. 이 닉네임으로 온보딩하면 실패를 던진다. */
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

/** 개발용 목업 장면. 원소 비율·문구 조립은 실제 계산과 같은 함수를 지난다. */
function buildMockSummary(id: MockChartId, input: BirthInput): ChartSummary {
  const mock = MOCK_CHARTS[id];
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

/**
 * 1단계 무료 결과(태양/달/상승궁, 4원소)를 가져온다: POST /api/chart(실제 계산) → buildComputedChartSummary.
 * 개발 환경에서는 목업 닉네임('!mock' '!balanced' '!tie' '!lacking0' '!lacking3')으로 화면 장면을, '!error'로 에러 화면을 볼 수 있다.
 */
export async function getChartSummary(input: BirthInput, signal?: AbortSignal): Promise<ChartSummary> {
  if (MOCK_SCENES_AVAILABLE) {
    const nickname = input.nickname.trim();
    const mockId = findMockChart(nickname);
    if (mockId !== null || nickname === MOCK_FAILURE_NICKNAME) {
      await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
      if (mockId === null) throw new ChartCalculationError();
      return buildMockSummary(mockId, input);
    }
  }

  const chart = await requestChart(input, signal);
  return buildComputedChartSummary(chart, FREE_STAGE_CONTENT);
}
