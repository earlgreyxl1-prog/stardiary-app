import { describe, expect, it } from 'vitest';
import { computeNatalPositions } from '@/lib/astro/engine';
import { findInterceptions, houseOfLongitude, PLACIDUS_MAX_LATITUDE } from '@/lib/astro/houses';
import { longitudeToSign } from '@/lib/astro/zodiac';
import type { BirthInput } from '@/types/birth';
import type { City } from '@/types/city';

const cuspsOf = (longitudes: number[]) => longitudes.map(longitudeToSign);

const city = (id: string, latitude: number, longitude: number, timezone: string): City => ({
  id,
  nameKo: id,
  nameEn: id,
  country: '',
  countryCode: 'XX',
  latitude,
  longitude,
  timezone,
});

const SEOUL = city('seoul', 37.5665, 126.978, 'Asia/Seoul');
const TROMSO = city('tromso', 69.6496, 18.956, 'Europe/Oslo');

const birth = (overrides: Partial<BirthInput>): BirthInput => ({
  nickname: 't',
  year: 1995,
  month: 8,
  day: 23,
  hour: 6,
  minute: 40,
  timeUnknown: false,
  city: SEOUL,
  ...overrides,
});

describe('houseOfLongitude (순수 함수)', () => {
  // 1하우스가 물고기자리 20°에서 시작해 0°(양자리)를 넘어가는 시작선
  const wrapping = cuspsOf([350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320]);

  it('0°를 넘어가는 하우스를 올바로 판정한다', () => {
    expect(houseOfLongitude(355, wrapping)).toBe(1);
    expect(houseOfLongitude(5, wrapping)).toBe(1);
    expect(houseOfLongitude(349.9, wrapping)).toBe(12);
    expect(houseOfLongitude(330, wrapping)).toBe(12);
  });

  it('시작선과 정확히 같은 황경은 그 하우스에 속한다', () => {
    expect(houseOfLongitude(20, wrapping)).toBe(2);
    expect(houseOfLongitude(350, wrapping)).toBe(1);
  });
});

describe('findInterceptions (순수 함수)', () => {
  it('사용자 예시: 1하우스 양자리 25° → 2하우스 쌍둥이자리 2°면 황소자리가 1하우스에 포획된다', () => {
    const cusps = cuspsOf([25, 62, 90, 120, 150, 180, 205, 242, 270, 300, 330, 0]);
    const { intercepted, duplicated } = findInterceptions(cusps);
    expect(intercepted).toEqual([
      { sign: 'taurus', house: 1 },
      { sign: 'scorpio', house: 7 },
    ]);
    expect(duplicated).toEqual([
      { sign: 'libra', houses: [6, 7] },
      { sign: 'aries', houses: [12, 1] },
    ]);
  });

  it('Whole Sign(30°씩)에는 인터셉션이 없다', () => {
    const wholeSign = cuspsOf(Array.from({ length: 12 }, (_, index) => 120 + index * 30));
    expect(findInterceptions(wholeSign)).toEqual({ intercepted: [], duplicated: [] });
  });
});

describe('computeNatalPositions — 하우스 (Swiss Ephemeris 통합)', () => {
  it('서울: Placidus로 계산하고 1하우스 시작선 = 상승궁', () => {
    const { houses, angles } = computeNatalPositions(birth({}));
    expect(houses?.system).toBe('placidus');
    expect(houses?.fallbackReason).toBeNull();
    expect(houses?.cusps).toHaveLength(12);
    expect(houses?.cusps[0].longitude).toBeCloseTo(angles?.ascendant.longitude ?? Number.NaN, 6);
  });

  it('태양 하우스: 일출 직후 12하우스, 정오 무렵 10하우스, 자정 무렵 4하우스', () => {
    expect(computeNatalPositions(birth({ hour: 6, minute: 40 })).houses?.bodyHouses.sun).toBe(12);
    expect(computeNatalPositions(birth({ hour: 12, minute: 30 })).houses?.bodyHouses.sun).toBe(10);
    expect(computeNatalPositions(birth({ hour: 0, minute: 30 })).houses?.bodyHouses.sun).toBe(4);
  });

  it(`위도 ±${PLACIDUS_MAX_LATITUDE}° 초과(트롬쇠 69.6°N)는 Porphyry로 대체한다`, () => {
    const { houses, angles } = computeNatalPositions(
      birth({ year: 1990, month: 6, day: 21, hour: 14, minute: 0, city: TROMSO }),
    );
    expect(houses?.system).toBe('porphyry');
    expect(houses?.fallbackReason).toBe('high-latitude');
    expect(angles).not.toBeNull();
  });

  it('남반구 고위도(-77.8°)도 Porphyry로 계산된다', () => {
    const { houses } = computeNatalPositions(
      birth({ year: 2001, month: 1, day: 10, hour: 9, minute: 0, city: city('mcmurdo', -77.85, 166.67, 'Antarctica/McMurdo') }),
    );
    expect(houses?.system).toBe('porphyry');
  });

  it('출생 시간을 모르면 하우스와 상승궁은 null', () => {
    const positions = computeNatalPositions(birth({ hour: null, minute: null, timeUnknown: true }));
    expect(positions.houses).toBeNull();
    expect(positions.angles).toBeNull();
  });
});

describe('computeNatalPositions — 위치 회귀 (독립 공식과 0.015° 이내로 맞춘 값)', () => {
  it('서울 1995-08-23 06:40: 태양 149.32°(사자), 상승궁 157.75°(처녀)', () => {
    const { bodies, angles, utc } = computeNatalPositions(birth({}));
    expect(utc).toBe('1995-08-22T21:40:00.000Z');
    expect(bodies.sun.sign).toBe('leo');
    expect(bodies.sun.longitude).toBeCloseTo(149.321, 2);
    expect(angles?.ascendant.sign).toBe('virgo');
    expect(angles?.ascendant.longitude).toBeCloseTo(157.754, 2);
  });

  it('시간 모름 + 춘분일(2000-03-20): 그날 별자리가 바뀌는 태양·달을 ambiguousSigns에 담는다', () => {
    const positions = computeNatalPositions(
      birth({ year: 2000, month: 3, day: 20, hour: null, minute: null, timeUnknown: true }),
    );
    expect(positions.utc).toBe('2000-03-20T03:00:00.000Z'); // 현지 정오
    expect(positions.ambiguousSigns.sun).toEqual({ first: 'pisces', last: 'aries' });
    expect(positions.ambiguousSigns.moon).toEqual({ first: 'virgo', last: 'libra' });
  });

  it('1990년 5월: 수성 역행(실제 4/23~5/17)', () => {
    const { bodies } = computeNatalPositions(birth({ year: 1990, month: 5, day: 1, hour: 12, minute: 0 }));
    expect(bodies.mercury.retrograde).toBe(true);
    expect(bodies.sun.retrograde).toBe(false);
  });
});
