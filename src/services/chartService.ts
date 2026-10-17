import { CHART_SUMMARY_MOCK } from '@/mocks/chart';
import type { ChartSummary } from '@/types/astro';
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

/**
 * 1단계 무료 결과(태양/달/상승궁, 4원소)를 가져온다. 현재는 목업 데이터를 사용하며,
 * 실제 계산 엔진으로 교체할 때 이 함수의 시그니처(BirthInput -> ChartSummary)만 유지하면 된다.
 */
export async function getChartSummary(input: BirthInput): Promise<ChartSummary> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  if (input.nickname.trim() === MOCK_FAILURE_NICKNAME) {
    throw new ChartCalculationError();
  }

  return {
    ...CHART_SUMMARY_MOCK,
    rising: input.timeUnknown ? null : CHART_SUMMARY_MOCK.rising,
  };
}
