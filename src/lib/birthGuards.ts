import { validateDate, validateNickname, validateTime } from '@/lib/validators';
import type { BirthInput } from '@/types/birth';
import type { City } from '@/types/city';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isCity(value: unknown): value is City {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nameKo === 'string' &&
    typeof value.nameEn === 'string' &&
    typeof value.country === 'string' &&
    typeof value.countryCode === 'string' &&
    (value.region === undefined || typeof value.region === 'string') &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    typeof value.timezone === 'string'
  );
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

/** 모양(필드와 타입)만 확인한다. sessionStorage처럼 우리가 저장한 값을 읽을 때 쓴다. */
export function isBirthInput(value: unknown): value is BirthInput {
  return (
    isRecord(value) &&
    typeof value.nickname === 'string' &&
    typeof value.year === 'number' &&
    typeof value.month === 'number' &&
    typeof value.day === 'number' &&
    isNumberOrNull(value.hour) &&
    isNumberOrNull(value.minute) &&
    typeof value.timeUnknown === 'boolean' &&
    isCity(value.city)
  );
}

/**
 * 모양과 값의 범위까지 확인한다. 서버처럼 외부에서 받은 값을 계산에 넘기기 전에 쓴다.
 * 문제가 없으면 null, 있으면 사용자에게 보여줄 수 있는 메시지.
 */
export function findBirthInputProblem(value: unknown): string | null {
  if (!isBirthInput(value)) return '출생 정보 형식이 올바르지 않아요';

  const pad = (n: number) => String(n).padStart(2, '0');
  const problem =
    validateNickname(value.nickname) ??
    validateDate(String(value.year), String(value.month), String(value.day)) ??
    validateTime(
      value.timeUnknown,
      value.hour === null ? '' : pad(value.hour),
      value.minute === null ? '' : pad(value.minute),
    );
  if (problem) return problem;

  const { latitude, longitude } = value.city;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return '도시 좌표가 올바르지 않아요';
  return null;
}
