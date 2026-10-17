import { normalizeLongitude, ZODIAC_ORDER } from '@/lib/astro/zodiac';
import type { HouseNumber, NatalHouses, SignPosition, ZodiacSignId } from '@/types/astro';

/**
 * 하우스 시스템 정책 (2026-10-17 사용자 결정).
 * Placidus가 기본. 위도가 ±66°를 넘으면(백야·극야 지역) 처음부터 Porphyry로 계산하고,
 * 그 안쪽이라도 Placidus 계산이 실패하면 Porphyry, 그것도 안 되면 Whole Sign으로 바꾼다.
 */
export const PLACIDUS_MAX_LATITUDE = 66;

const HOUSE_NUMBERS: readonly HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** 시작선 a에서 황도 순방향으로 b까지의 거리 (0 이상 360 미만) */
function forwardDistance(from: number, to: number): number {
  return normalizeLongitude(to - from);
}

/** 황경이 몇 하우스에 있는지. 하우스 n은 n번째 시작선부터 다음 시작선 직전까지다. */
export function houseOfLongitude(longitude: number, cusps: readonly SignPosition[]): HouseNumber {
  for (let index = 0; index < 12; index += 1) {
    const start = cusps[index].longitude;
    const end = cusps[(index + 1) % 12].longitude;
    if (forwardDistance(start, longitude) < forwardDistance(start, end)) return HOUSE_NUMBERS[index];
  }
  // 부동소수 오차로 어디에도 안 걸리면(시작선과 정확히 같은 값 등) 가장 가까운 앞쪽 시작선의 하우스로 본다.
  let best = 0;
  for (let index = 1; index < 12; index += 1) {
    if (forwardDistance(cusps[index].longitude, longitude) < forwardDistance(cusps[best].longitude, longitude)) {
      best = index;
    }
  }
  return HOUSE_NUMBERS[best];
}

/**
 * 인터셉션(시작선을 하나도 얻지 못한 별자리)과 중복 시작선(두 하우스 시작선을 차지한 별자리)을 찾는다.
 * 하우스 크기가 고르지 않은 Placidus·Porphyry에서만 생기고, Whole Sign에서는 항상 비어 있다.
 */
export function findInterceptions(
  cusps: readonly SignPosition[],
): Pick<NatalHouses, 'intercepted' | 'duplicated'> {
  const cuspSigns = new Set<ZodiacSignId>(cusps.map((cusp) => cusp.sign));

  const intercepted = ZODIAC_ORDER.filter((sign) => !cuspSigns.has(sign)).map((sign) => {
    // 별자리 한가운데(15°)가 들어 있는 하우스 = 그 별자리를 통째로 품은 하우스
    const middle = ZODIAC_ORDER.indexOf(sign) * 30 + 15;
    return { sign, house: houseOfLongitude(middle, cusps) };
  });

  const duplicated: NatalHouses['duplicated'] = [];
  for (let index = 0; index < 12; index += 1) {
    const next = (index + 1) % 12;
    if (cusps[index].sign === cusps[next].sign) {
      duplicated.push({ sign: cusps[index].sign, houses: [HOUSE_NUMBERS[index], HOUSE_NUMBERS[next]] });
    }
  }

  return { intercepted, duplicated };
}
