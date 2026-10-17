import 'server-only';

import path from 'node:path';
import swisseph from 'swisseph-v2';
import { findInterceptions, houseOfLongitude, PLACIDUS_MAX_LATITUDE } from '@/lib/astro/houses';
import { localToUtc, type UtcBirthTime } from '@/lib/astro/time';
import { longitudeToSign } from '@/lib/astro/zodiac';
import type {
  BodyId,
  BodyPosition,
  HouseNumber,
  HouseSystemId,
  NatalHouses,
  NatalPositions,
  SignRange,
} from '@/types/astro';
import type { BirthInput } from '@/types/birth';

/**
 * Swiss Ephemeris 계산 어댑터. 네이티브 모듈이라 서버(Route Handler)에서만 import 한다.
 * 트로피컬 황도(서양 점성술 표준), 지구 중심(geocentric) 좌표를 쓴다.
 */

// 패키지에 함께 들어 있는 천문력 파일(sepl/semo/seas_18.se1, 1800~2400년). 없으면 정밀도가 낮은 Moshier로 계산된다.
swisseph.swe_set_ephe_path(path.join(process.cwd(), 'node_modules', 'swisseph-v2', 'ephe'));

const CALC_FLAGS = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

/** Swiss Ephemeris 하우스 방식 코드. 시도하는 순서대로. ASC·MC는 방식과 상관없이 같다. */
const HOUSE_SYSTEM_CODES: Record<HouseSystemId, string> = {
  placidus: 'P',
  porphyry: 'O',
  'whole-sign': 'W',
};

const BODY_IDS: Record<BodyId, number> = {
  sun: swisseph.SE_SUN,
  moon: swisseph.SE_MOON,
  mercury: swisseph.SE_MERCURY,
  venus: swisseph.SE_VENUS,
  mars: swisseph.SE_MARS,
  jupiter: swisseph.SE_JUPITER,
  saturn: swisseph.SE_SATURN,
  uranus: swisseph.SE_URANUS,
  neptune: swisseph.SE_NEPTUNE,
  pluto: swisseph.SE_PLUTO,
};

const BODIES = Object.keys(BODY_IDS) as BodyId[];

/**
 * 출생 시간을 모를 때 천체 위치를 대표하는 현지 시각 (2026-10-17 사용자 결정: 정오 기준).
 * 정오면 그날 실제 위치와의 차이가 최대 반나절로 가장 작다.
 */
const UNKNOWN_TIME_HOUR = 12;

export class EphemerisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EphemerisError';
  }
}

function toJulianDayUt(utc: UtcBirthTime): number {
  const result = swisseph.swe_utc_to_jd(
    utc.year,
    utc.month,
    utc.day,
    utc.hour,
    utc.minute,
    utc.second,
    swisseph.SE_GREG_CAL,
  );
  if ('error' in result) throw new EphemerisError(`율리우스일 변환 실패: ${result.error}`);
  return result.julianDayUT;
}

function calcBody(julianDayUt: number, body: BodyId): BodyPosition {
  const result = swisseph.swe_calc_ut(julianDayUt, BODY_IDS[body], CALC_FLAGS);
  if ('error' in result) throw new EphemerisError(`${body} 위치 계산 실패: ${result.error}`);
  // SEFLG_EQUATORIAL을 주지 않았으므로 황도 좌표가 와야 한다.
  if (!('longitude' in result)) throw new EphemerisError(`${body} 황도 좌표를 받지 못했어요`);
  return {
    ...longitudeToSign(result.longitude),
    speed: result.longitudeSpeed,
    retrograde: result.longitudeSpeed < 0,
  };
}

function calcAllBodies(julianDayUt: number): Record<BodyId, BodyPosition> {
  return Object.fromEntries(BODIES.map((body) => [body, calcBody(julianDayUt, body)])) as Record<
    BodyId,
    BodyPosition
  >;
}

function julianDayAtLocal(input: BirthInput, hour: number, minute: number): { jd: number; utc: UtcBirthTime } {
  const utc = localToUtc({
    year: input.year,
    month: input.month,
    day: input.day,
    hour,
    minute,
    timezone: input.city.timezone,
  });
  return { jd: toJulianDayUt(utc), utc };
}

/** 그날 현지 0:00과 23:59 사이에 별자리가 바뀌는 천체를 찾는다. */
function findAmbiguousSigns(input: BirthInput): Partial<Record<BodyId, SignRange>> {
  const dayStart = calcAllBodies(julianDayAtLocal(input, 0, 0).jd);
  const dayEnd = calcAllBodies(julianDayAtLocal(input, 23, 59).jd);

  const ranges: Partial<Record<BodyId, SignRange>> = {};
  for (const body of BODIES) {
    if (dayStart[body].sign !== dayEnd[body].sign) {
      ranges[body] = { first: dayStart[body].sign, last: dayEnd[body].sign };
    }
  }
  return ranges;
}

interface HouseCalculation {
  system: HouseSystemId;
  fallbackReason: NatalHouses['fallbackReason'];
  cusps: number[];
  ascendant: number;
  midheaven: number;
}

/** Placidus로 계산하고, 고위도이거나 실패하면 Porphyry → Whole Sign 순으로 바꾼다. */
function calcHouses(julianDayUt: number, latitude: number, longitude: number): HouseCalculation {
  const highLatitude = Math.abs(latitude) > PLACIDUS_MAX_LATITUDE;
  const candidates: HouseSystemId[] = highLatitude
    ? ['porphyry', 'whole-sign']
    : ['placidus', 'porphyry', 'whole-sign'];

  const errors: string[] = [];
  for (const system of candidates) {
    const result = swisseph.swe_houses(julianDayUt, latitude, longitude, HOUSE_SYSTEM_CODES[system]);
    if ('error' in result) {
      errors.push(`${system}: ${result.error}`);
      continue;
    }
    const fallbackReason: NatalHouses['fallbackReason'] =
      system === 'placidus' ? null : highLatitude ? 'high-latitude' : 'calculation-failed';
    return {
      system,
      fallbackReason,
      cusps: result.house,
      ascendant: result.ascendant,
      midheaven: result.mc,
    };
  }
  throw new EphemerisError(`하우스 계산 실패 (${errors.join(' / ')})`);
}

function buildHouses(calculation: HouseCalculation, bodies: Record<BodyId, BodyPosition>): NatalHouses {
  const cusps = calculation.cusps.map((cusp) => longitudeToSign(cusp));
  const bodyHouses = Object.fromEntries(
    BODIES.map((body) => [body, houseOfLongitude(bodies[body].longitude, cusps)]),
  ) as Record<BodyId, HouseNumber>;

  return {
    system: calculation.system,
    fallbackReason: calculation.fallbackReason,
    cusps,
    ...findInterceptions(cusps),
    bodyHouses,
  };
}

/** 출생 정보로 10천체, 상승궁·MC, 12하우스를 계산한다. */
export function computeNatalPositions(input: BirthInput): NatalPositions {
  const knownTime = !input.timeUnknown && input.hour !== null && input.minute !== null;
  const { jd, utc } = knownTime
    ? julianDayAtLocal(input, input.hour ?? 0, input.minute ?? 0)
    : julianDayAtLocal(input, UNKNOWN_TIME_HOUR, 0);

  const bodies = calcAllBodies(jd);

  let angles: NatalPositions['angles'] = null;
  let houses: NatalHouses | null = null;
  if (knownTime) {
    const calculation = calcHouses(jd, input.city.latitude, input.city.longitude);
    angles = {
      ascendant: longitudeToSign(calculation.ascendant),
      midheaven: longitudeToSign(calculation.midheaven),
    };
    houses = buildHouses(calculation, bodies);
  }

  return {
    utc: utc.iso,
    utcOffsetMinutes: utc.offsetMinutes,
    julianDayUt: jd,
    timeUnknown: !knownTime,
    bodies,
    angles,
    houses,
    ambiguousSigns: knownTime ? {} : findAmbiguousSigns(input),
  };
}
