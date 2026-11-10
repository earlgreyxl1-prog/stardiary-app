'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSavedBirthInput } from '@/hooks/useSavedBirthInput';
import { getChartSummary } from '@/services/chartService';
import type { ChartSummary } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

export type ChartResultState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; input: BirthInput }
  | { status: 'success'; input: BirthInput; summary: ChartSummary };

export interface UseChartResult {
  state: ChartResultState;
  retry: () => void;
}

/** 마지막으로 끝난 요청. key가 현재 요청과 다르면 아직 로딩 중이다. */
type SettledChart =
  | { key: string; status: 'success'; summary: ChartSummary }
  | { key: string; status: 'error' };

/** sessionStorage의 출생 정보를 읽어 1단계 결과(실제 계산)를 가져온다. */
export function useChartResult(): UseChartResult {
  const saved = useSavedBirthInput();
  const input = saved.hydrated ? saved.input : null;

  const [settled, setSettled] = useState<SettledChart | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const requestKey = `${retryTick}:${saved.hydrated ? (saved.raw ?? '') : ''}`;

  useEffect(() => {
    if (input === null) return;

    let cancelled = false;
    const controller = new AbortController();
    getChartSummary(input, controller.signal)
      .then((summary) => {
        if (!cancelled) setSettled({ key: requestKey, status: 'success', summary });
      })
      .catch(() => {
        if (!cancelled) setSettled({ key: requestKey, status: 'error' });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [input, requestKey]);

  const retry = useCallback(() => setRetryTick((tick) => tick + 1), []);

  if (!saved.hydrated) return { state: { status: 'loading' }, retry };
  if (input === null) return { state: { status: 'empty' }, retry };
  if (settled === null || settled.key !== requestKey) return { state: { status: 'loading' }, retry };
  if (settled.status === 'error') return { state: { status: 'error', input }, retry };
  return { state: { status: 'success', input, summary: settled.summary }, retry };
}
