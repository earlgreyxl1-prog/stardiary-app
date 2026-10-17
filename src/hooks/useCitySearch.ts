'use client';

import { useCallback, useEffect, useState } from 'react';
import { searchCities } from '@/services/cityService';
import type { City } from '@/types/city';

export type CitySearchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseCitySearchResult {
  status: CitySearchStatus;
  results: City[];
  retry: () => void;
}

/** 마지막으로 끝난 검색. key가 현재 요청과 다르면 아직 로딩 중이다. */
interface SettledSearch {
  key: string;
  status: 'success' | 'error';
  results: City[];
}

const EMPTY_RESULTS: City[] = [];

/** 입력값을 디바운스해서 도시를 검색한다. 이전 요청의 늦은 응답은 무시한다. */
export function useCitySearch(query: string, debounceMs = 300): UseCitySearchResult {
  const [settled, setSettled] = useState<SettledSearch | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const trimmed = query.trim();
  const requestKey = `${retryTick}:${trimmed}`;

  useEffect(() => {
    if (trimmed.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const found = await searchCities(trimmed, controller.signal);
        if (cancelled) return;
        setSettled({ key: requestKey, status: 'success', results: found });
      } catch {
        if (cancelled) return;
        setSettled({ key: requestKey, status: 'error', results: EMPTY_RESULTS });
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort(); // 입력이 바뀌면 이전 요청은 서버 응답을 기다리지 않고 버린다.
    };
  }, [trimmed, requestKey, debounceMs]);

  const retry = useCallback(() => setRetryTick((tick) => tick + 1), []);

  if (trimmed.length === 0) {
    return { status: 'idle', results: EMPTY_RESULTS, retry };
  }
  if (settled === null || settled.key !== requestKey) {
    return { status: 'loading', results: EMPTY_RESULTS, retry };
  }
  return { status: settled.status, results: settled.results, retry };
}
