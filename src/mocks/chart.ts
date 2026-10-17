import type { ElementPointSource, ZodiacSignId } from '@/types/astro';

/**
 * 결과 화면 확인용 목업 차트. 입력한 생년월일과 무관한 고정 배치다.
 * 원소 비율·코멘트는 실제와 같은 함수(computeElementBalanceFromSigns → buildChartSummary)로 만든다.
 * 닉네임으로 장면을 고를 수 있다(목업 전용): '!balanced' '!tie' '!lacking0' '!lacking3'. 그 밖에는 기본 장면.
 * 출생 시간을 모른다고 입력하면 상승궁·MC를 빼고 계산한다.
 */
export interface MockChart {
  /** 무슨 화면을 보여주려는 장면인지 (설명용) */
  description: string;
  placements: Record<ElementPointSource, ZodiacSignId>;
  /** 태양·달·상승궁 카드에 보일 도수 */
  degrees: { sun: number; moon: number; ascendant: number };
}

export type MockChartId = 'default' | 'balanced' | 'tie' | 'lacking0' | 'lacking3';

export const MOCK_CHARTS: Record<MockChartId, MockChart> = {
  default: {
    description: '물 강함 · 바람 적음 (적은 편 1개)',
    placements: {
      sun: 'pisces',
      moon: 'leo',
      ascendant: 'virgo',
      mercury: 'aquarius',
      venus: 'pisces',
      mars: 'sagittarius',
      midheaven: 'pisces',
      jupiter: 'cancer',
      saturn: 'capricorn',
      uranus: 'capricorn',
      neptune: 'capricorn',
      pluto: 'scorpio',
    },
    degrees: { sun: 23.4, moon: 8.1, ascendant: 14.7 },
  },
  balanced: {
    description: '균형형 (네 원소 모두 15~35%)',
    placements: {
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
    },
    degrees: { sun: 2.5, moon: 17.2, ascendant: 28.9 },
  },
  tie: {
    description: '불·흙 동점 (태양이 있는 흙의 코멘트) · 물 적음',
    placements: {
      sun: 'taurus',
      moon: 'aries',
      ascendant: 'leo',
      mercury: 'virgo',
      venus: 'gemini',
      mars: 'libra',
      midheaven: 'capricorn',
      jupiter: 'aquarius',
      saturn: 'sagittarius',
      uranus: 'capricorn',
      neptune: 'scorpio',
      pluto: 'aries',
    },
    degrees: { sun: 11.0, moon: 4.6, ascendant: 20.3 },
  },
  lacking0: {
    description: '불 강함 · 적은 편 없음 (최저 원소 15% 이상)',
    placements: {
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
    },
    degrees: { sun: 15.8, moon: 26.1, ascendant: 3.3 },
  },
  lacking3: {
    description: '불만 있음 · 흙·바람·물 모두 적은 편 (적은 편 3개)',
    placements: {
      sun: 'aries',
      moon: 'leo',
      ascendant: 'sagittarius',
      mercury: 'aries',
      venus: 'leo',
      mars: 'sagittarius',
      midheaven: 'aries',
      jupiter: 'leo',
      saturn: 'sagittarius',
      uranus: 'aries',
      neptune: 'leo',
      pluto: 'sagittarius',
    },
    degrees: { sun: 7.7, moon: 12.4, ascendant: 19.0 },
  },
};

const MOCK_NICKNAMES: Record<string, MockChartId> = {
  '!balanced': 'balanced',
  '!tie': 'tie',
  '!lacking0': 'lacking0',
  '!lacking3': 'lacking3',
};

/** 닉네임으로 목업 장면을 고른다. 해당 없으면 기본 장면. */
export function pickMockChart(nickname: string): MockChartId {
  return MOCK_NICKNAMES[nickname.trim()] ?? 'default';
}
