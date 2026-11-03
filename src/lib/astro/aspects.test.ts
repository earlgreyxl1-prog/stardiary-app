import { describe, expect, it } from 'vitest';
import { angularSeparation, ASPECT_BODIES, ASPECT_DEFINITIONS, aspectBetween, findAspects } from '@/lib/astro/aspects';
import { computeNatalPositions } from '@/lib/astro/engine';
import type { BodyId } from '@/types/astro';

describe('설정 (CLAUDE.md 6번)', () => {
  it('메이저 5종과 허용 오차', () => {
    expect(ASPECT_DEFINITIONS.map(({ type, angle, orb, luminaryOrb }) => [type, angle, orb, luminaryOrb])).toEqual([
      ['conjunction', 0, 8, 10],
      ['opposition', 180, 8, 9],
      ['trine', 120, 7, 8],
      ['square', 90, 7, 8],
      ['sextile', 60, 5, 6],
    ]);
  });
});

describe('angularSeparation', () => {
  it('짧은 쪽 각도, 0° 경계를 넘는 경우', () => {
    expect(angularSeparation(10, 50)).toBe(40);
    expect(angularSeparation(359, 1)).toBe(2);
    expect(angularSeparation(1, 359)).toBe(2);
    expect(angularSeparation(0, 180)).toBe(180);
    expect(angularSeparation(350, 170)).toBe(180);
    expect(angularSeparation(100, 100)).toBe(0);
  });
});

describe('aspectBetween — 허용 오차 경계', () => {
  it('기본 오차: 직각 7°까지, 7.01°는 아님', () => {
    expect(aspectBetween('mars', 0, 'jupiter', 97)?.type).toBe('square');
    expect(aspectBetween('mars', 0, 'jupiter', 97.01)).toBeNull();
  });

  it('태양·달이 끼면 오차가 넓어진다: 합 10°, 육각 6°', () => {
    expect(aspectBetween('sun', 0, 'mars', 9.5)?.type).toBe('conjunction');
    expect(aspectBetween('venus', 0, 'mars', 9.5)).toBeNull();
    expect(aspectBetween('moon', 0, 'saturn', 65.9)?.type).toBe('sextile');
    expect(aspectBetween('mercury', 0, 'saturn', 65.9)).toBeNull();
  });

  it('0°를 넘는 합', () => {
    expect(aspectBetween('sun', 358, 'mercury', 3)).toMatchObject({ type: 'conjunction', separation: 5, deviation: 5, orb: 10 });
  });

  it('결과 값', () => {
    expect(aspectBetween('venus', 10, 'neptune', 131)).toMatchObject({
      a: 'venus',
      b: 'neptune',
      type: 'trine',
      separation: 121,
      deviation: 1,
      orb: 7,
    });
  });

  it('겹치는 범위에서는 더 정확한 쪽', () => {
    const wide = ASPECT_DEFINITIONS.map((definition) => ({ ...definition, orb: 20, luminaryOrb: 20 }));
    expect(aspectBetween('mars', 0, 'jupiter', 78, wide)?.type).toBe('square'); // 육각 18° vs 직각 12°
  });
});

describe('findAspects', () => {
  const base = Object.fromEntries(ASPECT_BODIES.map((body, index) => [body, index * 33 + 7])) as Record<BodyId, number>;

  it('쌍 앞뒤는 천체 순서를 따르고, 정확한 순으로 정렬된다', () => {
    const aspects = findAspects(base);
    for (const aspect of aspects) {
      expect(ASPECT_BODIES.indexOf(aspect.a)).toBeLessThan(ASPECT_BODIES.indexOf(aspect.b));
    }
    const deviations = aspects.map((aspect) => aspect.deviation);
    expect(deviations).toEqual([...deviations].sort((x, y) => x - y));
  });

  it('같은 쌍은 한 번만', () => {
    const pairs = findAspects(base).map((aspect) => `${aspect.a}-${aspect.b}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('실제 차트(서울 1995-08-23 06:40)에서 개수가 시뮬레이션 평균대(약 14~15개)에 든다', () => {
    const positions = computeNatalPositions({
      nickname: 't',
      year: 1995,
      month: 8,
      day: 23,
      hour: 6,
      minute: 40,
      timeUnknown: false,
      city: { id: 'seoul', nameKo: '서울', nameEn: 'Seoul', country: '대한민국', countryCode: 'KR', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' },
    });
    const longitudes = Object.fromEntries(ASPECT_BODIES.map((body) => [body, positions.bodies[body].longitude])) as Record<BodyId, number>;
    const aspects = findAspects(longitudes);
    expect(aspects.length).toBeGreaterThanOrEqual(5);
    expect(aspects.length).toBeLessThanOrEqual(30);
    for (const aspect of aspects) expect(aspect.deviation).toBeLessThanOrEqual(aspect.orb);
  });
});
