import { describe, expect, it } from 'vitest';
import { BirthTimeError, localToUtc, type LocalBirthTime } from '@/lib/astro/time';

const seoul = (year: number, month: number, day: number, hour: number, minute: number): LocalBirthTime => ({
  year,
  month,
  day,
  hour,
  minute,
  timezone: 'Asia/Seoul',
});

describe('localToUtc — 한국 표준시 변천 (IANA 타임존 DB)', () => {
  it('보통 때는 UTC+9', () => {
    const utc = localToUtc(seoul(1990, 6, 15, 12, 0));
    expect(utc.offsetMinutes).toBe(540);
    expect(utc.iso).toBe('1990-06-15T03:00:00.000Z');
  });

  it('1987~88년 여름 서머타임은 UTC+10', () => {
    const utc = localToUtc(seoul(1988, 7, 1, 12, 0));
    expect(utc.offsetMinutes).toBe(600);
    expect(utc.iso).toBe('1988-07-01T02:00:00.000Z');
  });

  it('1954~61년 표준시는 UTC+8:30', () => {
    const utc = localToUtc(seoul(1955, 1, 15, 12, 0));
    expect(utc.offsetMinutes).toBe(510);
    expect(utc.iso).toBe('1955-01-15T03:30:00.000Z');
  });

  it('서머타임 시작으로 없는 시각(1987-05-10 02:30)은 한 시간 뒤(03:30 KDT)로 밀린다', () => {
    const utc = localToUtc(seoul(1987, 5, 10, 2, 30));
    expect(utc.offsetMinutes).toBe(600);
    expect(utc.iso).toBe('1987-05-09T17:30:00.000Z');
  });

  it('UTC 날짜가 하루 앞으로 넘어가는 경우 연·월·일도 UTC 기준이다', () => {
    const utc = localToUtc(seoul(1995, 8, 23, 6, 40));
    expect([utc.year, utc.month, utc.day, utc.hour, utc.minute]).toEqual([1995, 8, 22, 21, 40]);
  });
});

describe('localToUtc — 다른 타임존', () => {
  it('뉴욕 겨울(UTC-5)에는 UTC 날짜가 다음 날이 된다', () => {
    const utc = localToUtc({ year: 1972, month: 12, day: 3, hour: 21, minute: 15, timezone: 'America/New_York' });
    expect(utc.offsetMinutes).toBe(-300);
    expect(utc.iso).toBe('1972-12-04T02:15:00.000Z');
  });

  it('시드니 여름 서머타임(UTC+11)', () => {
    const utc = localToUtc({ year: 2004, month: 2, day: 29, hour: 3, minute: 5, timezone: 'Australia/Sydney' });
    expect(utc.offsetMinutes).toBe(660);
    expect(utc.iso).toBe('2004-02-28T16:05:00.000Z');
  });

  it('UTC+5:45처럼 15분 단위 타임존도 그대로 반영한다 (카트만두)', () => {
    const utc = localToUtc({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, timezone: 'Asia/Kathmandu' });
    expect(utc.offsetMinutes).toBe(345);
    expect(utc.iso).toBe('2000-01-01T06:15:00.000Z');
  });
});

describe('localToUtc — 오류', () => {
  it('알 수 없는 타임존이면 BirthTimeError와 고칠 방법을 담은 문구', () => {
    const run = () => localToUtc({ year: 1990, month: 1, day: 1, hour: 0, minute: 0, timezone: 'Mars/Olympus' });
    expect(run).toThrow(BirthTimeError);
    expect(run).toThrow('출생 도시의 시간대(Mars/Olympus)를 알 수 없어요. 도시를 다시 골라 주세요.');
  });
});
