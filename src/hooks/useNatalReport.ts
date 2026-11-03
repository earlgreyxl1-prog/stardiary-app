'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSavedBirthInput } from '@/hooks/useSavedBirthInput';
import type { NatalReport } from '@/lib/report/buildReport';
import { getNatalReport } from '@/services/reportService';
import type { BirthInput } from '@/types/birth';

export type NatalReportState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; input: BirthInput; message: string }
  | { status: 'success'; input: BirthInput; report: NatalReport };

export interface UseNatalReport {
  state: NatalReportState;
  retry: () => void;
}

/** 마지막으로 끝난 요청. key가 현재 요청과 다르면 아직 로딩 중이다(useChartResult와 같은 방식). */
type Settled = { key: string; status: 'success'; report: NatalReport } | { key: string; status: 'error'; message: string };

const FALLBACK_ERROR = '정밀 차트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.';

/** 저장된 출생 정보로 실제 계산을 불러온다. 정밀 차트는 무료라 잠금이 없다. */
export function useNatalReport(): UseNatalReport {
  const saved = useSavedBirthInput();
  const input = saved.hydrated ? saved.input : null;

  const [settled, setSettled] = useState<Settled | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const requestKey = `${retryTick}:${saved.hydrated ? (saved.raw ?? '') : ''}`;

  useEffect(() => {
    if (input === null) return;
    let cancelled = false;
    const controller = new AbortController();
    getNatalReport(input, controller.signal)
      .then((report) => {
        if (!cancelled) setSettled({ key: requestKey, status: 'success', report });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSettled({ key: requestKey, status: 'error', message: error instanceof Error ? error.message : FALLBACK_ERROR });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [input, requestKey]);

  const retry = useCallback(() => setRetryTick((tick) => tick + 1), []);

  let state: NatalReportState;
  if (!saved.hydrated) state = { status: 'loading' };
  else if (input === null) state = { status: 'empty' };
  else if (settled === null || settled.key !== requestKey) state = { status: 'loading' };
  else if (settled.status === 'error') state = { status: 'error', input, message: settled.message };
  else state = { status: 'success', input, report: settled.report };

  return { state, retry };
}
