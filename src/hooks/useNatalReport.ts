'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSavedBirthInput } from '@/hooks/useSavedBirthInput';
import { useReportAccess } from '@/hooks/useReportAccess';
import type { NatalReport } from '@/lib/report/buildReport';
import { getNatalReport } from '@/services/reportService';
import type { BirthInput } from '@/types/birth';

export type NatalReportState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'locked'; input: BirthInput }
  | { status: 'error'; input: BirthInput; message: string }
  | { status: 'success'; input: BirthInput; report: NatalReport };

export interface UseNatalReport {
  state: NatalReportState;
  retry: () => void;
  setDevUnlocked: (unlocked: boolean) => void;
}

/** 마지막으로 끝난 요청. key가 현재 요청과 다르면 아직 로딩 중이다(useChartResult와 같은 방식). */
type Settled = { key: string; status: 'success'; report: NatalReport } | { key: string; status: 'error'; message: string };

const FALLBACK_ERROR = '정밀 리포트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.';

/** 저장된 출생 정보와 잠금 상태를 보고, 열려 있을 때만 실제 계산을 불러온다. */
export function useNatalReport(): UseNatalReport {
  const saved = useSavedBirthInput();
  const { unlocked, setDevUnlocked } = useReportAccess();
  const input = saved.hydrated ? saved.input : null;

  const [settled, setSettled] = useState<Settled | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const requestKey = `${retryTick}:${saved.hydrated ? (saved.raw ?? '') : ''}`;
  const shouldFetch = input !== null && unlocked === true;

  useEffect(() => {
    if (!shouldFetch || input === null) return;
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
  }, [shouldFetch, input, requestKey]);

  const retry = useCallback(() => setRetryTick((tick) => tick + 1), []);

  let state: NatalReportState;
  if (!saved.hydrated || unlocked === null) state = { status: 'loading' };
  else if (input === null) state = { status: 'empty' };
  else if (!unlocked) state = { status: 'locked', input };
  else if (settled === null || settled.key !== requestKey) state = { status: 'loading' };
  else if (settled.status === 'error') state = { status: 'error', input, message: settled.message };
  else state = { status: 'success', input, report: settled.report };

  return { state, retry, setDevUnlocked };
}
