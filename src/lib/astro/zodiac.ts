import type { BigThreeKey, ElementId, SignPosition, ZodiacSign, ZodiacSignId } from '@/types/astro';

export const ZODIAC_SIGNS: Record<ZodiacSignId, ZodiacSign> = {
  aries: { id: 'aries', nameKo: '양자리', symbol: '♈', element: 'fire' },
  taurus: { id: 'taurus', nameKo: '황소자리', symbol: '♉', element: 'earth' },
  gemini: { id: 'gemini', nameKo: '쌍둥이자리', symbol: '♊', element: 'air' },
  cancer: { id: 'cancer', nameKo: '게자리', symbol: '♋', element: 'water' },
  leo: { id: 'leo', nameKo: '사자자리', symbol: '♌', element: 'fire' },
  virgo: { id: 'virgo', nameKo: '처녀자리', symbol: '♍', element: 'earth' },
  libra: { id: 'libra', nameKo: '천칭자리', symbol: '♎', element: 'air' },
  scorpio: { id: 'scorpio', nameKo: '전갈자리', symbol: '♏', element: 'water' },
  sagittarius: { id: 'sagittarius', nameKo: '사수자리', symbol: '♐', element: 'fire' },
  capricorn: { id: 'capricorn', nameKo: '염소자리', symbol: '♑', element: 'earth' },
  aquarius: { id: 'aquarius', nameKo: '물병자리', symbol: '♒', element: 'air' },
  pisces: { id: 'pisces', nameKo: '물고기자리', symbol: '♓', element: 'water' },
};

export interface ElementMeta {
  id: ElementId;
  nameKo: string;
  emoji: string;
  /** 막대 그래프 등에 쓰는 포인트 색 */
  color: string;
}

export const ELEMENTS: readonly ElementMeta[] = [
  { id: 'fire', nameKo: '불', emoji: '🔥', color: '#ffb38a' },
  { id: 'earth', nameKo: '흙', emoji: '🌿', color: '#c8e6a0' },
  { id: 'air', nameKo: '바람', emoji: '🍃', color: '#a8d8ff' },
  { id: 'water', nameKo: '물', emoji: '💧', color: '#c3b5ff' },
];

export const ELEMENT_BY_ID: Record<ElementId, ElementMeta> = {
  fire: ELEMENTS[0],
  earth: ELEMENTS[1],
  air: ELEMENTS[2],
  water: ELEMENTS[3],
};

export interface BigThreeMeta {
  label: string;
  emoji: string;
  caption: string;
}

export const BIG_THREE: Record<BigThreeKey, BigThreeMeta> = {
  sun: { label: '태양 별자리', emoji: '☀️', caption: '나의 본모습과 삶의 방향' },
  moon: { label: '달 별자리', emoji: '🌙', caption: '속마음과 감정의 결' },
  rising: { label: '상승궁', emoji: '🌅', caption: '첫인상과 세상을 대하는 태도' },
};

/** 황도 순서. 황경 0°(춘분점)부터 30°씩 이 순서로 배치된다. */
export const ZODIAC_ORDER: readonly ZodiacSignId[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

/** 황경을 0 이상 360 미만으로 맞춘다. */
export function normalizeLongitude(longitude: number): number {
  const wrapped = longitude % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** 황경(도)을 별자리와 별자리 안 도수로 바꾼다. 예: 45° → 황소자리 15° */
export function longitudeToSign(longitude: number): SignPosition {
  const normalized = normalizeLongitude(longitude);
  const index = Math.floor(normalized / 30);
  return {
    longitude: normalized,
    sign: ZODIAC_ORDER[index],
    degree: normalized - index * 30,
  };
}

/** 도수를 "14°" 처럼 표시한다. 분 단위는 무료 결과에서 보여주지 않는다. */
export function formatDegree(degree: number): string {
  return `${Math.floor(degree)}°`;
}
