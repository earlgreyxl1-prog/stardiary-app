import { PAID_STAGE_CONTENT } from '@/content/paidStage';
import { buildNatalReport, type NatalReport } from '@/lib/report/buildReport';
import type { ChartApiResponse } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

export class ReportError extends Error {
  constructor(message = '정밀 차트를 만들지 못했어요.') {
    super(message);
    this.name = 'ReportError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 서버 응답의 큰 모양만 확인한다(세부 값은 같은 저장소의 서버가 만든다). */
function isChartApiResponse(value: unknown): value is ChartApiResponse {
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

/**
 * 정밀 차트를 가져온다: POST /api/chart(실제 계산) → 문구로 조립.
 * 정밀 차트는 무료다(2026-11-03 결정). 유료 상품은 심화 리포트(services/deepReportService.ts)뿐이다.
 */
export async function getNatalReport(input: BirthInput, signal?: AbortSignal): Promise<NatalReport> {
  const response = await fetch('/api/chart', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ReportError(errorMessageOf(body) ?? undefined);
  if (!isChartApiResponse(body)) throw new ReportError('계산 결과 형식이 올바르지 않아요.');
  return buildNatalReport(body, PAID_STAGE_CONTENT);
}
