import { DateTime } from 'luxon';

export interface LocalBirthTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** IANA 타임존 ID (예: Asia/Seoul) */
  timezone: string;
}

export interface UtcBirthTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  iso: string;
  /** 그 순간 현지 시각의 UTC 오프셋 (분). 예: 한국 1988년 여름 서머타임이면 600 */
  offsetMinutes: number;
}

export class BirthTimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BirthTimeError';
  }
}

/**
 * 현지 시각을 UTC로 바꾼다. IANA 타임존 DB를 쓰므로 과거 서머타임과 표준시 변경이 반영된다.
 * (예: 한국 1954~61년 UTC+8:30, 1987~88년 여름 UTC+10)
 *
 * 서머타임이 시작돼 시계를 건너뛴 시각(존재하지 않는 시각)은 Luxon 규칙대로 한 시간 뒤로 밀리고,
 * 서머타임이 끝나 두 번 있었던 시각은 앞쪽(서머타임) 오프셋을 쓴다.
 */
export function localToUtc(local: LocalBirthTime): UtcBirthTime {
  const zoned = DateTime.fromObject(
    { year: local.year, month: local.month, day: local.day, hour: local.hour, minute: local.minute },
    { zone: local.timezone },
  );
  if (!zoned.isValid) {
    // 날짜·시각 범위는 먼저 검증하므로, 여기서 실패하면 대부분 알 수 없는 타임존 ID다.
    throw new BirthTimeError(`출생 도시의 시간대(${local.timezone})를 알 수 없어요. 도시를 다시 골라 주세요.`);
  }

  const utc = zoned.toUTC();
  return {
    year: utc.year,
    month: utc.month,
    day: utc.day,
    hour: utc.hour,
    minute: utc.minute,
    second: utc.second + utc.millisecond / 1000,
    iso: utc.toISO() ?? '',
    offsetMinutes: zoned.offset,
  };
}
