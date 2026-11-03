'use client';

import { ResultEmpty } from '@/components/result/ResultStates';
import { ReportError, ReportSkeleton } from '@/components/report/ReportStates';
import { ReportView } from '@/components/report/ReportView';
import { StarBackground } from '@/components/ui/StarBackground';
import { useNatalReport } from '@/hooks/useNatalReport';

/** 무료 정밀 차트. 실제 계산 → 휠 차트·행성·하우스·애스펙트, 맨 아래에서 유료 심화 리포트로 이어진다. */
export default function ReportPage() {
  const { state, retry } = useNatalReport();

  return (
    <>
      <StarBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        {state.status === 'loading' && <ReportSkeleton />}
        {state.status === 'empty' && <ResultEmpty />}
        {state.status === 'error' && <ReportError message={state.message} onRetry={retry} />}
        {state.status === 'success' && <ReportView input={state.input} report={state.report} />}
      </main>
    </>
  );
}
