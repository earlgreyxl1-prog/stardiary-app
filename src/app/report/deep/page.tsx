'use client';

import { DeepReportErrorView, DeepReportSkeleton, DeepReportStore } from '@/components/deepReport/DeepReportStates';
import { DeepReportView } from '@/components/deepReport/DeepReportView';
import { ResultEmpty } from '@/components/result/ResultStates';
import { StarBackground } from '@/components/ui/StarBackground';
import { useDeepReport } from '@/hooks/useDeepReport';

/** 유료 심화 리포트. 주제(장)별 낱개 또는 네 주제 묶음으로 열고, 산 장만 보여준다(지금은 목업). */
export default function DeepReportPage() {
  const { state, retry, devGrant, devReset } = useDeepReport();

  return (
    <>
      <StarBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        {state.status === 'loading' && <DeepReportSkeleton />}
        {state.status === 'empty' && <ResultEmpty />}
        {state.status === 'store' && <DeepReportStore nickname={state.input.nickname} onDevGrant={devGrant} />}
        {state.status === 'error' && <DeepReportErrorView message={state.message} onRetry={retry} />}
        {state.status === 'success' && (
          <DeepReportView
            report={state.report}
            nickname={state.input.nickname}
            owned={state.owned}
            onDevGrant={devGrant}
            onDevReset={devReset}
          />
        )}
      </main>
    </>
  );
}
