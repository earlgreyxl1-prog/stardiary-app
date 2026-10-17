import { isBirthInput } from '@/lib/birthGuards';
import type { BirthInput } from '@/types/birth';

const STORAGE_KEY = 'stardiary:birth-input:v1';

/** 저장에 실패하면 사용자에게 보여줄 수 있는 메시지로 Error를 던진다. */
export function saveBirthInput(input: BirthInput): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    throw new Error('브라우저에 정보를 저장하지 못했어요. 시크릿 모드라면 해제한 뒤 다시 시도해 주세요.');
  }
}

/** 저장된 원본 문자열. 문자열이라 useSyncExternalStore의 스냅샷으로 그대로 쓸 수 있다. */
export function readRawBirthInput(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 원본 문자열을 BirthInput으로 해석한다. 형식이 맞지 않으면 null. */
export function parseBirthInput(raw: string | null): BirthInput | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isBirthInput(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 결과 페이지에서 사용. 값이 없거나 형식이 맞지 않으면 null (Empty State 처리용). */
export function loadBirthInput(): BirthInput | null {
  return parseBirthInput(readRawBirthInput());
}

export function clearBirthInput(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 저장소 접근이 불가능하면 지울 것도 없으므로 무시한다. */
  }
}
