import { describe, expect, it } from 'vitest';
import {
  computeElementBalanceFromSigns,
  ELEMENT_COMMENT_RULES,
  ELEMENT_WEIGHTS,
  planElementComments,
  toWholePercentages,
} from '@/lib/astro/elements';
import type { ElementPointSource, ZodiacSignId } from '@/types/astro';

type Placements = Partial<Record<ElementPointSource, ZodiacSignId>>;

/** 사용자가 처음 준 예시 차트 (CLAUDE.md 5번 검증 기준) */
const EXAMPLE_CHART: Placements = {
  sun: 'leo',
  moon: 'cancer',
  ascendant: 'taurus',
  mercury: 'virgo',
  venus: 'libra',
  mars: 'aries',
  jupiter: 'sagittarius',
  saturn: 'capricorn',
  midheaven: 'capricorn',
  uranus: 'sagittarius',
  neptune: 'capricorn',
  pluto: 'scorpio',
};

/** 불 4 = 흙 4 동점. 태양·달 자리만 바꿔 동점 해소 방향을 확인한다. */
const TIE_BASE: Placements = {
  mercury: 'leo',
  venus: 'virgo',
  mars: 'gemini',
  jupiter: 'libra',
  saturn: 'aquarius',
  uranus: 'sagittarius',
  neptune: 'capricorn',
  pluto: 'scorpio',
};

describe('가중치표 (Kerykeion v6 기본값)', () => {
  it('12개 지점 합계가 15.5점이다', () => {
    const total = Object.values(ELEMENT_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBe(15.5);
  });

  it('태양·달·상승궁 2, 수성·금성·화성·MC 1.5, 목성·토성 1, 외행성 0.5', () => {
    expect(ELEMENT_WEIGHTS).toEqual({
      sun: 2,
      moon: 2,
      ascendant: 2,
      mercury: 1.5,
      venus: 1.5,
      mars: 1.5,
      midheaven: 1.5,
      jupiter: 1,
      saturn: 1,
      uranus: 0.5,
      neptune: 0.5,
      pluto: 0.5,
    });
  });
});

describe('computeElementBalanceFromSigns', () => {
  it('예시 차트: 불 5 · 흙 6.5 · 바람 1.5 · 물 2.5 = 15.5점', () => {
    const balance = computeElementBalanceFromSigns(EXAMPLE_CHART);
    expect(balance.totalPoints).toBe(15.5);
    expect(balance.scores).toEqual({ fire: 5, earth: 6.5, air: 1.5, water: 2.5 });
    expect(balance.percentages).toEqual({ fire: 32, earth: 42, air: 10, water: 16 });
    expect(balance.dominant).toBe('earth');
    expect(balance.tiedWithDominant).toEqual([]);
    expect(balance.excluded).toEqual([]);
    expect(balance.contributions).toHaveLength(12);
  });

  it('출생 시간 모름: 상승궁·MC를 빼고 12점으로 계산한다', () => {
    const withoutAngles: Placements = { ...EXAMPLE_CHART };
    delete withoutAngles.ascendant;
    delete withoutAngles.midheaven;
    const balance = computeElementBalanceFromSigns(withoutAngles);
    expect(balance.totalPoints).toBe(12);
    expect(balance.scores).toEqual({ fire: 5, earth: 3, air: 1.5, water: 2.5 });
    expect(balance.excluded).toEqual(['ascendant', 'midheaven']);
  });

  it('강한 편 동점은 가장 무거운 지점(태양)이 있는 원소가 dominant가 된다 — 양방향', () => {
    const sunInEarth = computeElementBalanceFromSigns({ ...TIE_BASE, sun: 'taurus', moon: 'aries' });
    expect(sunInEarth.scores.fire).toBe(sunInEarth.scores.earth);
    expect(sunInEarth.dominant).toBe('earth');
    expect(sunInEarth.tiedWithDominant).toEqual(['fire']);

    const sunInFire = computeElementBalanceFromSigns({ ...TIE_BASE, sun: 'aries', moon: 'taurus' });
    expect(sunInFire.dominant).toBe('fire');
    expect(sunInFire.tiedWithDominant).toEqual(['earth']);
  });
});

describe('toWholePercentages', () => {
  it('합이 100이 되도록 최대 잔여법으로 나눈다', () => {
    expect(toWholePercentages({ fire: 4.5, earth: 5.5, air: 1, water: 2.5 })).toEqual({
      fire: 33,
      earth: 41,
      air: 7,
      water: 19,
    });
  });

  it('점수가 같은 원소는 같은 %가 되고, 그 대신 합이 99일 수 있다', () => {
    const tied = toWholePercentages({ fire: 4, earth: 4, air: 2, water: 3.5 });
    expect(tied.fire).toBe(tied.earth);
    expect(tied).toEqual({ fire: 29, earth: 29, air: 15, water: 26 });

    const thirds = toWholePercentages({ fire: 1, earth: 1, air: 1, water: 0 });
    expect(thirds).toEqual({ fire: 33, earth: 33, air: 33, water: 0 });
  });

  it('모두 0점이면 모두 0%', () => {
    expect(toWholePercentages({ fire: 0, earth: 0, air: 0, water: 0 })).toEqual({ fire: 0, earth: 0, air: 0, water: 0 });
  });
});

describe('원소 코멘트 규칙 (planElementComments)', () => {
  it('기준값: 균형형 15~35%, 적은 편 15% 미만', () => {
    expect(ELEMENT_COMMENT_RULES).toEqual({ balancedMin: 15, balancedMax: 35, lackingBelow: 15 });
  });

  it('네 원소가 모두 15~35%면 균형형', () => {
    const balance = computeElementBalanceFromSigns({
      sun: 'aries',
      moon: 'taurus',
      ascendant: 'gemini',
      mercury: 'cancer',
      venus: 'cancer',
      mars: 'leo',
      midheaven: 'virgo',
      jupiter: 'libra',
      saturn: 'scorpio',
      uranus: 'aquarius',
      neptune: 'capricorn',
      pluto: 'sagittarius',
    });
    expect(balance.commentPlan).toEqual({ kind: 'balanced' });
  });

  it('예시 차트: 강한 편 흙, 적은 편 바람(9.7%)', () => {
    expect(computeElementBalanceFromSigns(EXAMPLE_CHART).commentPlan).toEqual({
      kind: 'leaning',
      strong: { elements: ['earth'], commentElement: 'earth' },
      lacking: ['air'],
    });
  });

  it('강한 편 동점이면 제목용으로 모두, 코멘트는 태양이 있는 원소', () => {
    const plan = computeElementBalanceFromSigns({ ...TIE_BASE, sun: 'taurus', moon: 'aries' }).commentPlan;
    expect(plan).toEqual({
      kind: 'leaning',
      strong: { elements: ['fire', 'earth'], commentElement: 'earth' },
      lacking: ['water'],
    });
  });

  it('가장 낮은 원소가 15% 이상이면 적은 편이 없다', () => {
    const plan = computeElementBalanceFromSigns({
      sun: 'aries',
      moon: 'leo',
      ascendant: 'taurus',
      mercury: 'sagittarius',
      venus: 'gemini',
      mars: 'cancer',
      midheaven: 'virgo',
      jupiter: 'libra',
      saturn: 'scorpio',
      uranus: 'aries',
      neptune: 'pisces',
      pluto: 'capricorn',
    }).commentPlan;
    expect(plan.kind).toBe('leaning');
    if (plan.kind === 'leaning') expect(plan.lacking).toEqual([]);
  });

  it('0점 원소끼리 동점이면 적은 편에 모두 들어간다', () => {
    const plan = computeElementBalanceFromSigns({
      sun: 'aries',
      moon: 'taurus',
      mercury: 'leo',
      venus: 'virgo',
      mars: 'sagittarius',
      jupiter: 'capricorn',
      saturn: 'aries',
      uranus: 'taurus',
      neptune: 'leo',
      pluto: 'virgo',
    }).commentPlan;
    expect(plan).toEqual({
      kind: 'leaning',
      strong: { elements: ['fire'], commentElement: 'fire' },
      lacking: ['air', 'water'],
    });
  });

  it('한 원소에 모두 몰리면 나머지 셋이 적은 편', () => {
    const allFire: Placements = Object.fromEntries(
      (['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const).map(
        (point) => [point, 'aries'],
      ),
    );
    const plan = computeElementBalanceFromSigns(allFire).commentPlan;
    expect(plan).toEqual({
      kind: 'leaning',
      strong: { elements: ['fire'], commentElement: 'fire' },
      lacking: ['earth', 'air', 'water'],
    });
  });

  it('비교는 정수 %가 아니라 정확한 비율로 한다 (16.1%는 적은 편이 아님)', () => {
    // 2.5 / 15.5 = 16.1% (표시 정수는 16)
    const plan = planElementComments({ fire: 6, earth: 4, air: 3, water: 2.5 }, []);
    expect(plan.kind).toBe('leaning');
    if (plan.kind === 'leaning') expect(plan.lacking).toEqual([]);
  });
});
