'use client';

import { ResultEmpty } from '@/components/result/ResultStates';
import { ReportError, ReportPaywall, ReportSkeleton } from '@/components/report/ReportStates';
import { ReportView } from '@/components/report/ReportView';
import { StarBackground } from '@/components/ui/StarBackground';
import { useNatalReport } from '@/hooks/useNatalReport';

/** 2단계 유료 정밀 리포트. 잠금(결제 준비 중) → 실제 계산 → 휠 차트·행성·하우스·애스펙트 */
export default function ReportPage() {
  const { state, retry, setDevUnlocked } = useNatalReport();

  return (
    <>
      <StarBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        {state.status === 'loading' && <ReportSkeleton />}
        {state.status === 'empty' && <ResultEmpty />}
        {state.status === 'locked' && (
          <ReportPaywall nickname={state.input.nickname} onDevUnlock={() => setDevUnlocked(true)} />
        )}
        {state.status === 'error' && <ReportError message={state.message} onRetry={retry} />}
        {state.status === 'success' && (
          <ReportView input={state.input} report={state.report} onDevLock={() => setDevUnlocked(false)} />
        )}
      </main>
    </>
  );
}
