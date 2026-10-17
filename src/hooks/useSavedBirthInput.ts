'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { parseBirthInput, readRawBirthInput } from '@/lib/birthStorage';
import type { BirthInput } from '@/types/birth';

export type SavedBirthInput =
  /** 서버 렌더링 중이거나 hydration 전이라 sessionStorage를 아직 읽지 못했다. */
  | { hydrated: false }
  /** raw는 저장된 원본 문자열. 요청 key 등 값이 바뀌었는지 비교할 때 쓴다. */
  | { hydrated: true; raw: string | null; input: BirthInput | null };

function subscribeStorage(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

/** sessionStorage에 저장된 출생 정보를 hydration 불일치 없이 읽는다. */
export function useSavedBirthInput(): SavedBirthInput {
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribeStorage,
    readRawBirthInput,
    () => undefined,
  );

  return useMemo<SavedBirthInput>(
    () => (raw === undefined ? { hydrated: false } : { hydrated: true, raw, input: parseBirthInput(raw) }),
    [raw],
  );
}
