import { afterEach, describe, expect, it, vi } from 'vitest';
import { FREE_STAGE_CONTENT } from '@/content/freeStage';
import { computeElementBalanceFromSigns } from '@/lib/astro/elements';
import { longitudeToSign } from '@/lib/astro/zodiac';
import { buildChartSummary, toElementSummaryView } from '@/lib/summary/buildChartSummary';
import { elementTitles } from '@/lib/summary/elementTitles';
import { MOCK_CHARTS, pickMockChart, type MockChartId } from '@/mocks/chart';
import { getChartSummary } from '@/services/chartService';
import type { ElementPointSource, ZodiacSignId } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

const balanceOf = (id: MockChartId, timeUnknown = false) => {
  const placements: Partial<Record<ElementPointSource, ZodiacSignId>> = { ...MOCK_CHARTS[id].placements };
  if (timeUnknown) {
    delete placements.ascendant;
    delete placements.midheaven;
  }
  return computeElementBalanceFromSigns(placements);
};

describe('목업 장면이 의도한 화면 상태를 만든다', () => {
  it.each([
    ['default', { kind: 'leaning', strong: ['water'], lacking: ['air'] }],
    ['balanced', { kind: 'balanced' }],
    ['tie', { kind: 'leaning', strong: ['fire', 'earth'], lacking: ['water'] }],
    ['lacking0', { kind: 'leaning', strong: ['fire'], lacking: [] }],
    ['lacking3', { kind: 'leaning', strong: ['fire'], lacking: ['earth', 'air', 'water'] }],
  ] as const)('%s', (id, expected) => {
    const plan = balanceOf(id).commentPlan;
    expect(plan.kind).toBe(expected.kind);
    if (plan.kind === 'leaning' && expected.kind === 'leaning') {
      expect(plan.strong.elements).toEqual(expected.strong);
      expect(plan.lacking).toEqual(expected.lacking);
    }
  });

  it('닉네임으로 장면을 고른다', () => {
    expect(pickMockChart('!balanced')).toBe('balanced');
    expect(pickMockChart(' !tie ')).toBe('tie');
    expect(pickMockChart('별이')).toBe('default');
  });
});

describe('buildChartSummary', () => {
  const bigThree = {
    sun: longitudeToSign(353.4), // 물고기 23.4°
    moon: longitudeToSign(128.1), // 사자 8.1°
    rising: longitudeToSign(164.7), // 처녀 14.7°
  };

  it('별자리 위치에 해석 문구를 붙이고 원소 요약을 만든다', () => {
    const summary = buildChartSummary({ source: 'mock', bigThree, balance: balanceOf('default'), content: FREE_STAGE_CONTENT });
    expect(summary.source).toBe('mock');
    expect(summary.contentOrigin).toBe(FREE_STAGE_CONTENT.origin);
    expect(summary.sun).toMatchObject({ sign: 'pisces', ...FREE_STAGE_CONTENT.placements.sun.pisces });
    expect(summary.sun.degree).toBeCloseTo(23.4, 6);
    expect(summary.moon.headline).toBe(FREE_STAGE_CONTENT.placements.moon.leo.headline);
    expect(summary.rising?.sign).toBe('virgo');
    expect(summary.elements.view).toEqual({
      kind: 'leaning',
      strong: { elements: ['water'], comment: { element: 'water', text: FREE_STAGE_CONTENT.elements.dominant.water } },
      lacking: [{ element: 'air', text: FREE_STAGE_CONTENT.elements.lacking.air }],
    });
    expect(summary.elements.excluded).toEqual([]);
  });

  it('상승궁이 없으면 rising null', () => {
    const summary = buildChartSummary({
      source: 'computed',
      bigThree: { ...bigThree, rising: null },
      balance: balanceOf('default', true),
      content: FREE_STAGE_CONTENT,
    });
    expect(summary.rising).toBeNull();
    expect(summary.elements.excluded).toEqual(['ascendant', 'midheaven']);
  });

  it('균형형은 균형형 문구 하나', () => {
    expect(toElementSummaryView(balanceOf('balanced'), FREE_STAGE_CONTENT)).toEqual({
      kind: 'balanced',
      text: FREE_STAGE_CONTENT.elements.balanced,
    });
  });

  it('동점이면 코멘트는 하나, 적은 편이 셋이면 문구도 셋', () => {
    const tie = toElementSummaryView(balanceOf('tie'), FREE_STAGE_CONTENT);
    expect(tie.kind === 'leaning' && tie.strong.comment).toEqual({ element: 'earth', text: FREE_STAGE_CONTENT.elements.dominant.earth });
    const three = toElementSummaryView(balanceOf('lacking3'), FREE_STAGE_CONTENT);
    expect(three.kind === 'leaning' && three.lacking.map((comment) => comment.element)).toEqual(['earth', 'air', 'water']);
  });
});

describe('elementTitles (서비스가 만드는 제목)', () => {
  const titlesOf = (id: MockChartId) => elementTitles(toElementSummaryView(balanceOf(id), FREE_STAGE_CONTENT));

  it('균형형', () => {
    expect(titlesOf('balanced')).toEqual({ main: '네 원소가 고르게 섞여 있어요', lacking: null });
  });

  it('강한 편 하나 + 적은 편 하나', () => {
    expect(titlesOf('default')).toEqual({ main: '가장 강한 원소는 💧 물이에요', lacking: '🍃 바람이 적은 편이에요' });
  });

  it('동점이면 모두 이름 붙인다', () => {
    expect(titlesOf('tie').main).toBe('🔥 불과 🌿 흙이 똑같이 강해요');
  });

  it('적은 편이 없으면 null, 셋이면 셋 다', () => {
    expect(titlesOf('lacking0').lacking).toBeNull();
    expect(titlesOf('lacking3').lacking).toBe('🌿 흙, 🍃 바람과 💧 물이 적은 편이에요');
  });
});

describe('chartService.getChartSummary (목업)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const input = (overrides: Partial<BirthInput>): BirthInput => ({
    nickname: '별이',
    year: 1995,
    month: 8,
    day: 23,
    hour: 6,
    minute: 40,
    timeUnknown: false,
    city: { id: 'seoul', nameKo: '서울', nameEn: 'Seoul', country: '대한민국', countryCode: 'KR', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' },
    ...overrides,
  });

  const run = async (overrides: Partial<BirthInput>) => {
    vi.useFakeTimers();
    const promise = getChartSummary(input(overrides));
    await vi.runAllTimersAsync();
    return promise;
  };

  it('시간 모름이면 상승궁 null, 원소는 상승궁·MC 빼고', async () => {
    const summary = await run({ hour: null, minute: null, timeUnknown: true });
    expect(summary.source).toBe('mock');
    expect(summary.rising).toBeNull();
    expect(summary.elements.excluded).toEqual(['ascendant', 'midheaven']);
  });

  it('!balanced 닉네임은 균형형 장면', async () => {
    expect((await run({ nickname: '!balanced' })).elements.view.kind).toBe('balanced');
  });

  it('!error 닉네임은 실패', async () => {
    vi.useFakeTimers();
    const promise = getChartSummary(input({ nickname: '!error' }));
    const assertion = expect(promise).rejects.toThrow('별자리를 계산하지 못했어요.');
    await vi.runAllTimersAsync();
    await assertion;
  });
});
