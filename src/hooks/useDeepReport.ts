'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDeepReportAccess } from '@/hooks/useDeepReportAccess';
import { useSavedBirthInput } from '@/hooks/useSavedBirthInput';
import { getDeepReport } from '@/services/deepReportService';
import type { BirthInput } from '@/types/birth';
import type { DeepChapterId, DeepProductId, DeepReport } from '@/types/deepReport';

export type DeepReportState =
  | { status: 'loading' }
  | { status: 'empty' }
  /** 산 장이 하나도 없다 → 주제 고르기 화면 */
  | { status: 'store'; input: BirthInput }
  | { status: 'error'; input: BirthInput; message: string }
  | { status: 'success'; input: BirthInput; report: DeepReport; owned: DeepChapterId[] };

export interface UseDeepReport {
  state: DeepReportState;
  retry: () => void;
  devGrant: (productId: DeepProductId) => void;
  devReset: () => void;
}

/** 마지막으로 끝난 요청. key가 현재 요청과 다르면 아직 로딩 중이다(useChartResult와 같은 방식). */
type Settled = { key: string; status: 'success'; report: DeepReport } | { key: string; status: 'error'; message: string };

const FALLBACK_ERROR = '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';

/** 저장된 출생 정보와 산 장을 보고, 산 장이 있을 때만 심화 리포트를 불러온다. */
export function useDeepReport(): UseDeepReport {
  const saved = useSavedBirthInput();
  const { owned, devGrant, devReset } = useDeepReportAccess();
  const input = saved.hydrated ? saved.input : null;

  const [settled, setSettled] = useState<Settled | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const ownedKey = owned === null ? '' : owned.join(',');
  const requestKey = `${retryTick}:${ownedKey}:${saved.hydrated ? (saved.raw ?? '') : ''}`;
  const shouldFetch = input !== null && owned !== null && owned.length > 0;

  useEffect(() => {
    if (!shouldFetch || input === null || owned === null) return;
    let cancelled = false;
    const controller = new AbortController();
    getDeepReport(input, owned, controller.signal)
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
  }, [shouldFetch, input, owned, requestKey]);

  const retry = useCallback(() => setRetryTick((tick) => tick + 1), []);

  let state: DeepReportState;
  if (!saved.hydrated || owned === null) state = { status: 'loading' };
  else if (input === null) state = { status: 'empty' };
  else if (owned.length === 0) state = { status: 'store', input };
  else if (settled === null || settled.key !== requestKey) state = { status: 'loading' };
  else if (settled.status === 'error') state = { status: 'error', input, message: settled.message };
  else state = { status: 'success', input, report: settled.report, owned };

  return { state, retry, devGrant, devReset };
}
