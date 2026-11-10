import { PAID_STAGE_CONTENT } from '@/content/paidStage';
import { buildNatalReport, type NatalReport } from '@/lib/report/buildReport';
import { requestChart } from '@/services/chartApi';
import type { BirthInput } from '@/types/birth';

/**
 * 정밀 차트를 가져온다: POST /api/chart(실제 계산) → 문구로 조립.
 * 정밀 차트는 무료다(2026-11-03 결정). 유료 상품은 심화 리포트(services/deepReportService.ts)뿐이다.
 */
export async function getNatalReport(input: BirthInput, signal?: AbortSignal): Promise<NatalReport> {
  const chart = await requestChart(input, signal);
  return buildNatalReport(chart, PAID_STAGE_CONTENT);
}
