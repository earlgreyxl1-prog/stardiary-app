import type { Aspect, AspectType, BodyId } from '@/types/astro';

/**
 * 애스펙트 설정 (CLAUDE.md 6번, 2026-10-17 결정). orb는 점성술 해석상의 서비스 기본값이며 외부 표준이 아니다.
 * 이 객체 한 곳만 고치면 판정이 바뀐다.
 * - angle: 정확한 각도
 * - orb: 기본 허용 오차 / luminaryOrb: 두 천체 중 하나라도 태양·달이면 쓰는 허용 오차
 */
export interface AspectDefinition {
  type: AspectType;
  angle: number;
  orb: number;
  luminaryOrb: number;
}

export const ASPECT_DEFINITIONS: readonly AspectDefinition[] = [
  { type: 'conjunction', angle: 0, orb: 8, luminaryOrb: 10 },
  { type: 'opposition', angle: 180, orb: 8, luminaryOrb: 9 },
  { type: 'trine', angle: 120, orb: 7, luminaryOrb: 8 },
  { type: 'square', angle: 90, orb: 7, luminaryOrb: 8 },
  { type: 'sextile', angle: 60, orb: 5, luminaryOrb: 6 },
];

/** 판정 순서와 쌍의 앞뒤를 정하는 천체 순서 */
export const ASPECT_BODIES: readonly BodyId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

const LUMINARIES: ReadonlySet<BodyId> = new Set<BodyId>(['sun', 'moon']);

/** 두 황경 사이의 각도 (짧은 쪽, 0 이상 180 이하). 359°와 1°는 2°다. */
export function angularSeparation(a: number, b: number): number {
  const difference = Math.abs((((a - b) % 360) + 360) % 360);
  return difference > 180 ? 360 - difference : difference;
}

/**
 * 한 쌍의 애스펙트를 판정한다. 허용 오차 안에 드는 각도가 둘 이상이면(오차를 넓게 잡은 경우) 더 정확한 쪽을 고른다.
 * 해당 없으면 null.
 */
export function aspectBetween(
  a: BodyId,
  longitudeA: number,
  b: BodyId,
  longitudeB: number,
  definitions: readonly AspectDefinition[] = ASPECT_DEFINITIONS,
): Aspect | null {
  const separation = angularSeparation(longitudeA, longitudeB);
  const luminary = LUMINARIES.has(a) || LUMINARIES.has(b);
  let best: Aspect | null = null;
  for (const definition of definitions) {
    const orb = luminary ? definition.luminaryOrb : definition.orb;
    const deviation = Math.abs(separation - definition.angle);
    if (deviation <= orb && (best === null || deviation < best.deviation)) {
      best = { a, b, type: definition.type, separation, deviation, orb };
    }
  }
  return best;
}

/** 10천체 사이의 모든 메이저 애스펙트를 찾아 정확한 순(오차가 작은 순)으로 돌려준다. */
export function findAspects(
  longitudes: Readonly<Record<BodyId, number>>,
  definitions: readonly AspectDefinition[] = ASPECT_DEFINITIONS,
): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < ASPECT_BODIES.length; i += 1) {
    for (let j = i + 1; j < ASPECT_BODIES.length; j += 1) {
      const a = ASPECT_BODIES[i];
      const b = ASPECT_BODIES[j];
      const aspect = aspectBetween(a, longitudes[a], b, longitudes[b], definitions);
      if (aspect) aspects.push(aspect);
    }
  }
  return aspects.sort((x, y) => x.deviation - y.deviation);
}
