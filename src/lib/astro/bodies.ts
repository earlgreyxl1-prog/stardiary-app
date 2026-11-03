import type { BodyId } from '@/types/astro';

export interface BodyMeta {
  id: BodyId;
  nameKo: string;
  /** 천문 기호. 화면에 쓸 때는 이모지 모양이 되지 않게 U+FE0E를 붙인다(glyph). */
  symbol: string;
}

/** 10천체 사전 데이터. 순서는 화면 표시 순서(태양 → 명왕성)다. */
export const BODIES: readonly BodyMeta[] = [
  { id: 'sun', nameKo: '태양', symbol: '☉' },
  { id: 'moon', nameKo: '달', symbol: '☽' },
  { id: 'mercury', nameKo: '수성', symbol: '☿' },
  { id: 'venus', nameKo: '금성', symbol: '♀' },
  { id: 'mars', nameKo: '화성', symbol: '♂' },
  { id: 'jupiter', nameKo: '목성', symbol: '♃' },
  { id: 'saturn', nameKo: '토성', symbol: '♄' },
  { id: 'uranus', nameKo: '천왕성', symbol: '♅' },
  { id: 'neptune', nameKo: '해왕성', symbol: '♆' },
  { id: 'pluto', nameKo: '명왕성', symbol: '♇' },
];

export const BODY_BY_ID = Object.fromEntries(BODIES.map((body) => [body.id, body])) as Record<BodyId, BodyMeta>;

/** 기호를 텍스트 모양으로 그리게 한다(일부 기기에서 이모지로 바뀌는 것 방지). */
export const glyph = (symbol: string): string => `${symbol}︎`;
