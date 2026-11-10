import type { ChartApiResponse } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

/** 서버 계산(POST /api/chart)이 실패했을 때. 서버가 준 안내 문구가 있으면 그대로 쓴다. */
export class ChartApiError extends Error {
  constructor(message = '별자리를 계산하지 못했어요. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.') {
    super(message);
    this.name = 'ChartApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 서버 응답의 큰 모양만 확인한다(세부 값은 같은 저장소의 서버가 만든다). */
export function isChartApiResponse(value: unknown): value is ChartApiResponse {
  return (
    isRecord(value) &&
    isRecord(value.positions) &&
    isRecord(value.positions.bodies) &&
    isRecord(value.elementBalance) &&
    Array.isArray(value.aspects)
  );
}

function errorMessageOf(body: unknown): string | null {
  return isRecord(body) && typeof body.error === 'string' ? body.error : null;
}

/** 출생 정보로 실제 차트를 계산한다. 무료 결과(chartService)와 정밀 차트(reportService)가 같이 쓴다. */
export async function requestChart(input: BirthInput, signal?: AbortSignal): Promise<ChartApiResponse> {
  const response = await fetch('/api/chart', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ChartApiError(errorMessageOf(body) ?? undefined);
  if (!isChartApiResponse(body)) throw new ChartApiError('계산 결과 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.');
  return body;
}
