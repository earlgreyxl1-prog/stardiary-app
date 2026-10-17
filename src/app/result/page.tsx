'use client';

import { ResultEmpty, ResultError, ResultSkeleton } from '@/components/result/ResultStates';
import { ResultView } from '@/components/result/ResultView';
import { StarBackground } from '@/components/ui/StarBackground';
import { useChartResult } from '@/hooks/useChartResult';

export default function ResultPage() {
  const { state, retry } = useChartResult();

  return (
    <>
      <StarBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        {state.status === 'loading' && <ResultSkeleton />}
        {state.status === 'empty' && <ResultEmpty />}
        {state.status === 'error' && <ResultError onRetry={retry} />}
        {state.status === 'success' && <ResultView input={state.input} summary={state.summary} />}
      </main>
    </>
  );
}
