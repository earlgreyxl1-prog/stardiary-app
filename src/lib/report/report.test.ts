import { describe, expect, it } from 'vitest';
import { PAID_STAGE_CONTENT } from '@/content/paidStage';
import { ASPECT_BODIES, findAspects } from '@/lib/astro/aspects';
import { BODIES } from '@/lib/astro/bodies';
import { computeElementBalance } from '@/lib/astro/elements';
import { computeNatalPositions } from '@/lib/astro/engine';
import { ZODIAC_ORDER } from '@/lib/astro/zodiac';
import { buildNatalReport } from '@/lib/report/buildReport';
import { aspectText, bodyText, fillTemplate } from '@/lib/report/reportText';
import { spreadLongitudes, wheelAngle } from '@/lib/report/wheel';
import type { AspectType, BodyId, ChartApiResponse, HouseNumber } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

const SEOUL = { id: 'seoul', nameKo: '서울', nameEn: 'Seoul', country: '대한민국', countryCode: 'KR', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' };
const birth = (overrides: Partial<BirthInput> = {}): BirthInput => ({
  nickname: 't', year: 1995, month: 8, day: 23, hour: 6, minute: 40, timeUnknown: false, city: SEOUL, ...overrides,
});

/** /api/chart와 같은 응답을 만든다 (route.ts와 같은 조합) */
function chartFor(input: BirthInput): ChartApiResponse {
  const positions = computeNatalPositions(input);
  const longitudes = Object.fromEntries(ASPECT_BODIES.map((body) => [body, positions.bodies[body].longitude])) as Record<BodyId, number>;
  return { positions, elementBalance: computeElementBalance(positions), aspects: findAspects(longitudes) };
}

describe('fillTemplate', () => {
  it('이름과 받침에 맞는 조사를 채운다', () => {
    expect(fillTemplate('{a|과/와} {b|이/가} 만나요', { a: '태양', b: '달' })).toBe('태양과 달이 만나요');
    expect(fillTemplate('{a|과/와} {b|이/가}', { a: '바다', b: '나무' })).toBe('바다와 나무가');
  });

  it('모르는 자리표시는 그대로 남긴다', () => {
    expect(fillTemplate('{a} {c}', { a: '태양' })).toBe('태양 {c}');
  });
});

describe('유료 문구 조합 (AI 가안)', () => {
  const HOUSES: HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it('천체 10 × 별자리 12 × 하우스 12 모든 조합이 자리표시 없이 끝난다', () => {
    for (const { id } of BODIES) {
      for (const sign of ZODIAC_ORDER) {
        for (const house of [...HOUSES, null]) {
          const text = bodyText(PAID_STAGE_CONTENT, id, sign, house);
          expect(text).not.toMatch(/[{}]|undefined/);
          expect(text.endsWith('요.')).toBe(true);
        }
      }
    }
  });

  it('조사가 받침에 맞는다', () => {
    expect(bodyText(PAID_STAGE_CONTENT, 'sun', 'leo', 10)).toBe(
      '나다운 모습이 당당하고 따뜻하게 드러나요. 특히 일과 사회적 역할에서 그 기운이 잘 느껴져요.',
    );
    expect(bodyText(PAID_STAGE_CONTENT, 'neptune', 'pisces', null)).toBe('꿈과 상상이 말랑하고 섬세하게 드러나요.');
    expect(bodyText(PAID_STAGE_CONTENT, 'mars', 'aries', null)).toBe('움직이고 도전하는 힘이 거침없고 솔직하게 드러나요.');
  });

  it('애스펙트 5종 × 모든 천체 쌍이 자리표시 없이 끝난다', () => {
    const types = Object.keys(PAID_STAGE_CONTENT.aspects) as AspectType[];
    expect(types).toHaveLength(5);
    for (const type of types) {
      for (let i = 0; i < ASPECT_BODIES.length; i += 1) {
        for (let j = i + 1; j < ASPECT_BODIES.length; j += 1) {
          const text = aspectText(PAID_STAGE_CONTENT, { a: ASPECT_BODIES[i], b: ASPECT_BODIES[j], type });
          expect(text).not.toMatch(/[{}]/);
        }
      }
    }
    expect(aspectText(PAID_STAGE_CONTENT, { a: 'sun', b: 'moon', type: 'trine' })).toMatch(/^태양과 달이 /);
  });
});

describe('buildNatalReport', () => {
  it('시간을 알면: 천체 10개(하우스 포함), 하우스 12개, 애스펙트 정확한 순', () => {
    const chart = chartFor(birth());
    const report = buildNatalReport(chart, PAID_STAGE_CONTENT);
    expect(report.timeUnknown).toBe(false);
    expect(report.contentOrigin).toBe('ai-draft');
    expect(report.houseSystem).toEqual({ system: 'placidus', fallbackReason: null });
    expect(report.planets.map((planet) => planet.body)).toEqual(BODIES.map((body) => body.id));
    expect(report.planets.every((planet) => planet.house !== null)).toBe(true);
    expect(report.planets.find((planet) => planet.body === 'sun')).toMatchObject({ house: 12, ambiguous: null });
    expect(report.houses).toHaveLength(12);
    // 하우스마다 들어간 천체를 합하면 10개
    expect(report.houses?.flatMap((house) => house.bodies)).toHaveLength(10);
    expect(report.houses?.[0].cusp.longitude).toBeCloseTo(report.angles?.ascendant.longitude ?? Number.NaN, 6);
    expect(report.aspects.length).toBe(chart.aspects.length);
    expect(report.aspects.every((row) => row.text.length > 0 && row.label.length > 0)).toBe(true);
  });

  it('시간을 모르면: 하우스 없음, 천체 문장에 하우스 문장 없음, 정오 기준 모호 표시', () => {
    const report = buildNatalReport(
      chartFor(birth({ year: 2000, month: 3, day: 20, hour: null, minute: null, timeUnknown: true })),
      PAID_STAGE_CONTENT,
    );
    expect(report.timeUnknown).toBe(true);
    expect(report.houses).toBeNull();
    expect(report.houseSystem).toBeNull();
    expect(report.angles).toBeNull();
    expect(report.planets.every((planet) => planet.house === null && !planet.text.includes('특히'))).toBe(true);
    expect(report.planets.find((planet) => planet.body === 'moon')?.ambiguous).toEqual({ first: 'virgo', last: 'libra' });
  });

  it('고위도(트롬쇠)는 Porphyry 대체 정보가 그대로 온다', () => {
    const report = buildNatalReport(
      chartFor(birth({ year: 1990, month: 6, day: 21, hour: 14, minute: 0, city: { ...SEOUL, id: 'tromso', latitude: 69.6496, longitude: 18.956, timezone: 'Europe/Oslo' } })),
      PAID_STAGE_CONTENT,
    );
    expect(report.houseSystem).toEqual({ system: 'porphyry', fallbackReason: 'high-latitude' });
  });
});

describe('wheel', () => {
  it('상승궁이 왼쪽(180°), 황경이 커지면 시계 반대 방향', () => {
    expect(wheelAngle(100, 100)).toBe(180);
    expect(wheelAngle(130, 100)).toBe(210);
    expect(wheelAngle(70, 100)).toBe(150);
    expect(wheelAngle(0, null)).toBe(180);
  });

  const minDistance = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    let min = 360;
    for (let i = 0; i < sorted.length; i += 1) {
      const next = sorted[(i + 1) % sorted.length] + (i + 1 === sorted.length ? 360 : 0);
      min = Math.min(min, next - sorted[i]);
    }
    return min;
  };

  it('떨어져 있으면 그대로, 몰려 있으면 최소 간격으로 벌린다', () => {
    expect(spreadLongitudes([10, 100, 200], 6)).toEqual([10, 100, 200]);
    const spread = spreadLongitudes([50, 51, 52, 53], 6);
    expect(minDistance(spread)).toBeGreaterThanOrEqual(6 - 1e-9);
    // 묶음 가운데(51.5)를 유지한다
    expect(spread.reduce((sum, value) => sum + value, 0) / 4).toBeCloseTo(51.5, 6);
    // 순서를 지킨다
    expect([...spread]).toEqual([...spread].sort((a, b) => a - b));
  });

  it('0°를 걸친 묶음도 벌린다', () => {
    const spread = spreadLongitudes([358, 359, 1, 2], 6);
    expect(minDistance(spread)).toBeGreaterThanOrEqual(6 - 1e-9);
  });

  it('묶음끼리 다시 겹치면 합쳐서 벌린다', () => {
    const spread = spreadLongitudes([10, 11, 12, 20, 21], 6);
    expect(minDistance(spread)).toBeGreaterThanOrEqual(6 - 1e-9);
  });

  it('실제 차트 10천체에 적용해도 간격이 지켜진다', () => {
    const chart = chartFor(birth());
    const spread = spreadLongitudes(BODIES.map(({ id }) => chart.positions.bodies[id].longitude), 7);
    expect(minDistance(spread)).toBeGreaterThanOrEqual(7 - 1e-9);
  });
});
