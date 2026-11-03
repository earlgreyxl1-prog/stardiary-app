'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * 유료 리포트 잠금 (임시). 결제·로그인이 정해지기 전까지 화면에서만 잠근다.
 * - 운영(production): 항상 잠김. 결제 버튼은 '준비 중'으로 비활성.
 * - 개발: '개발용 잠금 해제' 버튼으로 이 탭(sessionStorage)에서만 연다.
 * 결제를 붙이면 이 파일을 서버 권한 확인으로 바꾼다. 지금 /api/chart는 누구나 부를 수 있으니 진짜 보호가 아니다.
 */
const STORAGE_KEY = 'stardiary:report-dev-unlocked:v1';
const CHANGE_EVENT = 'stardiary:report-access-change';

export const REPORT_DEV_UNLOCK_AVAILABLE = process.env.NODE_ENV !== 'production';

function readUnlocked(): boolean {
  if (!REPORT_DEV_UNLOCK_AVAILABLE) return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
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

export interface ReportAccess {
  /** 서버 렌더링 중이거나 아직 읽지 못했으면 null */
  unlocked: boolean | null;
  /** 개발 환경에서만 동작한다 */
  setDevUnlocked: (unlocked: boolean) => void;
}

export function useReportAccess(): ReportAccess {
  const unlocked = useSyncExternalStore<boolean | null>(subscribe, readUnlocked, () => null);

  const setDevUnlocked = useCallback((next: boolean) => {
    if (!REPORT_DEV_UNLOCK_AVAILABLE) return;
    try {
      if (next) window.sessionStorage.setItem(STORAGE_KEY, '1');
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 저장소를 못 쓰면 잠금 상태 그대로 둔다 */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { unlocked, setDevUnlocked };
}
