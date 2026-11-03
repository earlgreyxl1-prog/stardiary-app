'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { grantProduct, parseOwnedChapters } from '@/lib/deepReport/products';
import type { DeepChapterId, DeepProductId } from '@/types/deepReport';

/**
 * 심화 리포트 구매 상태 (임시). 결제·로그인이 정해지기 전까지는 화면에서만 다룬다.
 * - 운영(production): 산 장이 항상 없다. 구매 버튼은 '준비 중'으로 비활성.
 * - 개발: '개발용으로 열기' 버튼이 이 탭(sessionStorage)에만 구매 기록을 남긴다.
 * 결제를 붙이면 이 파일을 서버의 구매 확인으로 바꾼다. 심화 리포트 생성 API도 서버에서 구매 여부를 확인해야 한다.
 */
const STORAGE_KEY = 'stardiary:deep-report-dev-owned:v1';
const CHANGE_EVENT = 'stardiary:deep-report-access-change';

export const DEEP_DEV_UNLOCK_AVAILABLE = process.env.NODE_ENV !== 'production';

/** 원본 문자열을 스냅숏으로 쓴다(배열을 돌려주면 매번 새 값이라 무한 렌더링이 난다). */
function readRaw(): string {
  if (!DEEP_DEV_UNLOCK_AVAILABLE) return '';
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function writeOwned(owned: readonly DeepChapterId[]): void {
  try {
    if (owned.length === 0) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
  } catch {
    /* 저장소를 못 쓰면 구매 상태 그대로 둔다 */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export interface DeepReportAccess {
  /** 산 장(화면 순서). 서버 렌더링 중이거나 아직 읽지 못했으면 null */
  owned: DeepChapterId[] | null;
  /** 개발 환경에서만 동작한다 */
  devGrant: (productId: DeepProductId) => void;
  /** 개발 환경에서만 동작한다 */
  devReset: () => void;
}

export function useDeepReportAccess(): DeepReportAccess {
  const raw = useSyncExternalStore<string | null>(subscribe, readRaw, () => null);
  const owned = useMemo(() => (raw === null ? null : parseOwnedChapters(raw)), [raw]);

  const devGrant = useCallback((productId: DeepProductId) => {
    if (!DEEP_DEV_UNLOCK_AVAILABLE) return;
    writeOwned(grantProduct(parseOwnedChapters(readRaw()), productId));
  }, []);

  const devReset = useCallback(() => {
    if (!DEEP_DEV_UNLOCK_AVAILABLE) return;
    writeOwned([]);
  }, []);

  return { owned, devGrant, devReset };
}
