/**
 * 4원소 점수 분포 시뮬레이션.
 * 실제 계산 엔진(Swiss Ephemeris)과 원소 계산(lib/astro/elements)으로 무작위 출생 데이터를 돌려
 * '적은 편'·'균형형'·동점 규칙을 정할 근거가 되는 분포를 뽑는다.
 *
 * 세계 도시: data/world-cities.geonames.json (GeoNames, CC BY 4.0). 없으면 scripts/build-world-cities.ts로 먼저 만든다.
 *
 * 실행 (프로젝트 루트에서, engine의 'server-only' 가드를 통과시키려고 react-server 조건을 준다):
 *   npx --yes tsx --conditions=react-server scripts/simulate-element-distribution.ts [표본 수] [출력 JSON 경로]
 *
 * 같은 시드면 같은 결과가 나온다. 가중치를 바꾸면 다시 돌려서 분포를 갱신한다.
 */
import { writeFileSync } from 'node:fs';
import { loadWorldCities } from './data/load-world-cities';
import { computeElementBalance } from '@/lib/astro/elements';
import { computeNatalPositions } from '@/lib/astro/engine';
import { ELEMENTS } from '@/lib/astro/zodiac';
import type { ElementBalance, ElementId } from '@/types/astro';
import type { BirthInput } from '@/types/birth';
import type { City } from '@/types/city';

const ELEMENT_IDS: readonly ElementId[] = ELEMENTS.map((element) => element.id);
const PERCENTILES = [5, 10, 25, 50, 75, 90, 95] as const;

interface Scenario {
  id: string;
  label: string;
  fromYear: number;
  toYear: number;
  cities: readonly City[];
  /** 있으면 도시를 이 누적 가중치(인구)에 비례해 뽑는다. 없으면 도시마다 같은 확률. */
  cumulativeWeights?: readonly number[];
  sampleSize: number;
  seed: number;
}

function toCumulative(weights: readonly number[]): number[] {
  let sum = 0;
  return weights.map((weight) => (sum += Math.max(0, weight)));
}

function pickCity(random: () => number, scenario: Scenario): City {
  const cumulative = scenario.cumulativeWeights;
  if (!cumulative) return scenario.cities[Math.floor(random() * scenario.cities.length)];
  const target = random() * cumulative[cumulative.length - 1];
  let low = 0;
  let high = cumulative.length - 1;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (cumulative[mid] > target) high = mid;
    else low = mid + 1;
  }
  return scenario.cities[low];
}

/** 재현 가능한 난수 (mulberry32) */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBirth(random: () => number, scenario: Scenario): Omit<BirthInput, 'hour' | 'minute' | 'timeUnknown'> & {
  hour: number;
  minute: number;
} {
  const start = Date.UTC(scenario.fromYear, 0, 1);
  const end = Date.UTC(scenario.toYear + 1, 0, 1);
  const day = new Date(start + Math.floor(random() * ((end - start) / 86_400_000)) * 86_400_000);
  const minuteOfDay = Math.floor(random() * 1440);
  return {
    nickname: 'sim',
    year: day.getUTCFullYear(),
    month: day.getUTCMonth() + 1,
    day: day.getUTCDate(),
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
    city: pickCity(random, scenario),
  };
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function percentileTable(values: number[]): Record<string, number> {
  const sorted = [...values].sort((a, b) => a - b);
  const table: Record<string, number> = {
    mean: values.reduce((sum, v) => sum + v, 0) / values.length,
  };
  for (const p of PERCENTILES) table[`p${p}`] = percentile(sorted, p);
  return table;
}

const share = (count: number, total: number) => (count / total) * 100;
const round1 = (value: number) => Math.round(value * 10) / 10;

function roundTable(table: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(table).map(([key, value]) => [key, round1(value)]));
}

/** 정확한 비율(%). 표시용 정수 %가 아니라 규칙 설계용 원값을 쓴다. */
function exactPercentages(balance: ElementBalance): Record<ElementId, number> {
  return Object.fromEntries(
    ELEMENT_IDS.map((id) => [id, (balance.scores[id] / balance.totalPoints) * 100]),
  ) as Record<ElementId, number>;
}

/**
 * 확정된 원소 코멘트 규칙(lib/astro/elements의 commentPlan)으로 결과 화면이 어떻게 갈리는지 센다.
 * 규칙 자체는 라이브러리에만 있고, 여기서는 결과를 분류만 한다.
 */
type RuleOutcome =
  | 'balanced'
  | 'dominantSingle'
  | 'dominantTie'
  | 'dominantTieUnresolved'
  | 'lackingNone'
  | 'lackingSingle'
  | 'lackingTie2'
  | 'lackingTie3'
  | 'lackingIncludesZero';

function classifyByRecommendedRules(balance: ElementBalance): RuleOutcome[] {
  const plan = balance.commentPlan;
  if (plan.kind === 'balanced') return ['balanced'];

  const outcomes: RuleOutcome[] = [];
  const { elements, commentElement } = plan.strong;
  if (elements.length === 1) {
    outcomes.push('dominantSingle');
  } else {
    outcomes.push('dominantTie');
    // 동점 해소가 규칙대로 됐는지: 코멘트 원소가 동점 원소 중 하나이고 dominant와 같아야 한다.
    if (!elements.includes(commentElement) || commentElement !== balance.dominant) {
      outcomes.push('dominantTieUnresolved');
    }
  }

  if (plan.lacking.length === 0) {
    outcomes.push('lackingNone');
    return outcomes;
  }
  outcomes.push(plan.lacking.length === 1 ? 'lackingSingle' : plan.lacking.length === 2 ? 'lackingTie2' : 'lackingTie3');
  if (balance.scores[plan.lacking[0]] === 0) outcomes.push('lackingIncludesZero');
  return outcomes;
}

function ruleOutcomeShares(balances: ElementBalance[]): Record<RuleOutcome, number> {
  const counts: Record<RuleOutcome, number> = {
    balanced: 0,
    dominantSingle: 0,
    dominantTie: 0,
    dominantTieUnresolved: 0,
    lackingNone: 0,
    lackingSingle: 0,
    lackingTie2: 0,
    lackingTie3: 0,
    lackingIncludesZero: 0,
  };
  for (const balance of balances) for (const outcome of classifyByRecommendedRules(balance)) counts[outcome] += 1;
  return Object.fromEntries(
    Object.entries(counts).map(([key, count]) => [key, round1(share(count, balances.length))]),
  ) as Record<RuleOutcome, number>;
}

const LATITUDE_BANDS = [
  { id: 'tropics(<23.5)', min: 0, max: 23.5 },
  { id: 'mid(23.5-45)', min: 23.5, max: 45 },
  { id: 'high(45-60)', min: 45, max: 60 },
  { id: 'subpolar(60-66)', min: 60, max: 66 },
  { id: 'polar(>=66, Porphyry 대체)', min: 66, max: 91 },
] as const;

function summarize(balances: ElementBalance[], birthYears: number[], latitudes: number[]) {
  const n = balances.length;
  const pctByElement: Record<ElementId, number[]> = { fire: [], earth: [], air: [], water: [] };
  const zeroCount: Record<ElementId, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const dominantCount: Record<ElementId, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const lowestCount: Record<ElementId, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const spreads: number[] = [];
  const minPcts: number[] = [];
  const maxPcts: number[] = [];
  const lowestGaps: number[] = [];
  const topGaps: number[] = [];
  let dominantTies = 0;
  let lowestTies = 0;
  const lowestTieSizes: Record<number, number> = {};
  const decadeDominant = new Map<number, { total: number; counts: Record<ElementId, number> }>();

  balances.forEach((balance, index) => {
    const pct = exactPercentages(balance);
    const sortedPcts = ELEMENT_IDS.map((id) => pct[id]).sort((a, b) => a - b);
    for (const id of ELEMENT_IDS) {
      pctByElement[id].push(pct[id]);
      if (balance.scores[id] === 0) zeroCount[id] += 1;
    }

    // 우세: 가장 높은 점수의 원소들 (동점이면 모두 센다)
    const maxScore = Math.max(...ELEMENT_IDS.map((id) => balance.scores[id]));
    const minScore = Math.min(...ELEMENT_IDS.map((id) => balance.scores[id]));
    const top = ELEMENT_IDS.filter((id) => balance.scores[id] === maxScore);
    const bottom = ELEMENT_IDS.filter((id) => balance.scores[id] === minScore);
    for (const id of top) dominantCount[id] += 1 / top.length;
    for (const id of bottom) lowestCount[id] += 1 / bottom.length;
    if (top.length > 1) dominantTies += 1;
    if (bottom.length > 1) {
      lowestTies += 1;
      lowestTieSizes[bottom.length] = (lowestTieSizes[bottom.length] ?? 0) + 1;
    }

    spreads.push(sortedPcts[3] - sortedPcts[0]);
    minPcts.push(sortedPcts[0]);
    maxPcts.push(sortedPcts[3]);
    lowestGaps.push(sortedPcts[1] - sortedPcts[0]);
    topGaps.push(sortedPcts[3] - sortedPcts[2]);

    const decade = Math.floor(birthYears[index] / 10) * 10;
    const bucket = decadeDominant.get(decade) ?? { total: 0, counts: { fire: 0, earth: 0, air: 0, water: 0 } };
    bucket.total += 1;
    for (const id of top) bucket.counts[id] += 1 / top.length;
    decadeDominant.set(decade, bucket);
  });

  const countWhere = (values: number[], predicate: (v: number) => boolean) =>
    round1(share(values.filter(predicate).length, n));

  return {
    sampleSize: n,
    totalPoints: balances[0]?.totalPoints ?? 0,
    perElementPercent: Object.fromEntries(ELEMENT_IDS.map((id) => [id, roundTable(percentileTable(pctByElement[id]))])),
    zeroPointShare: Object.fromEntries(ELEMENT_IDS.map((id) => [id, round1(share(zeroCount[id], n))])),
    anyElementZeroShare: countWhere(minPcts, (v) => v === 0),
    dominantShare: Object.fromEntries(ELEMENT_IDS.map((id) => [id, round1(share(dominantCount[id], n))])),
    lowestShare: Object.fromEntries(ELEMENT_IDS.map((id) => [id, round1(share(lowestCount[id], n))])),
    ties: {
      dominantTieShare: round1(share(dominantTies, n)),
      lowestTieShare: round1(share(lowestTies, n)),
      lowestTieSizeShare: Object.fromEntries(
        Object.entries(lowestTieSizes).map(([size, count]) => [size, round1(share(count, n))]),
      ),
    },
    spread_maxMinusMin: roundTable(percentileTable(spreads)),
    minElementPercent: roundTable(percentileTable(minPcts)),
    maxElementPercent: roundTable(percentileTable(maxPcts)),
    gapLowestToSecond: roundTable(percentileTable(lowestGaps)),
    gapTopToSecond: roundTable(percentileTable(topGaps)),
    balancedCandidates: {
      spreadAtMost10: countWhere(spreads, (v) => v <= 10),
      spreadAtMost15: countWhere(spreads, (v) => v <= 15),
      spreadAtMost20: countWhere(spreads, (v) => v <= 20),
      spreadAtMost25: countWhere(spreads, (v) => v <= 25),
      allBetween15and35: round1(
        share(
          balances.filter((b) => {
            const pct = exactPercentages(b);
            return ELEMENT_IDS.every((id) => pct[id] >= 15 && pct[id] <= 35);
          }).length,
          n,
        ),
      ),
    },
    lackingCandidates: {
      minBelow5: countWhere(minPcts, (v) => v < 5),
      minBelow10: countWhere(minPcts, (v) => v < 10),
      minBelow15: countWhere(minPcts, (v) => v < 15),
      lowestGapAtLeast5: countWhere(lowestGaps, (v) => v >= 5),
      lowestGapAtLeast10: countWhere(lowestGaps, (v) => v >= 10),
    },
    recommendedRules: ruleOutcomeShares(balances),
    recommendedRulesByLatitude: Object.fromEntries(
      LATITUDE_BANDS.map((band) => {
        const inBand = balances.filter((_, i) => Math.abs(latitudes[i]) >= band.min && Math.abs(latitudes[i]) < band.max);
        return [band.id, inBand.length === 0 ? null : { sampleSize: inBand.length, ...ruleOutcomeShares(inBand) }];
      }),
    ),
    dominantByDecade: Object.fromEntries(
      [...decadeDominant.entries()]
        .sort(([a], [b]) => a - b)
        .map(([decade, bucket]) => [
          `${decade}s`,
          Object.fromEntries(ELEMENT_IDS.map((id) => [id, round1(share(bucket.counts[id], bucket.total))])),
        ]),
    ),
  };
}

function runScenario(scenario: Scenario) {
  const random = createRandom(scenario.seed);
  const known: ElementBalance[] = [];
  const unknown: ElementBalance[] = [];
  const years: number[] = [];
  const latitudes: number[] = [];

  for (let i = 0; i < scenario.sampleSize; i += 1) {
    const birth = randomBirth(random, scenario);
    years.push(birth.year);
    latitudes.push(birth.city.latitude);
    known.push(computeElementBalance(computeNatalPositions({ ...birth, timeUnknown: false })));
    unknown.push(
      computeElementBalance(computeNatalPositions({ ...birth, hour: null, minute: null, timeUnknown: true })),
    );
  }

  return {
    scenario: {
      id: scenario.id,
      label: scenario.label,
      years: `${scenario.fromYear}-${scenario.toYear}`,
      cities: scenario.cities.length,
      sampleSize: scenario.sampleSize,
      seed: scenario.seed,
    },
    timeKnown: summarize(known, years, latitudes),
    timeUnknown: summarize(unknown, years, latitudes),
  };
}

const sampleSize = Number(process.argv[2] ?? 20000);
const outputPath = process.argv[3];
const world = loadWorldCities();
const worldPopulationWeights = toCumulative(world.populations);
const koreaIndexes = world.cities.flatMap((city, index) => (city.countryCode === 'KR' ? [index] : []));
const koreanCities = koreaIndexes.map((index) => world.cities[index]);
const koreanPopulationWeights = toCumulative(koreaIndexes.map((index) => world.populations[index]));

const scenarios: Scenario[] = [
  { id: 'world-pop', label: '전 세계(기준): 1950~2025년생, GeoNames 도시 인구 비례', fromYear: 1950, toYear: 2025, cities: world.cities, cumulativeWeights: worldPopulationWeights, sampleSize, seed: 20261021 },
  { id: 'world-uniform', label: '민감도: 1950~2025년생, GeoNames 도시 균등 확률(소도시·고위도 비중 큼)', fromYear: 1950, toYear: 2025, cities: world.cities, sampleSize, seed: 20261022 },
  { id: 'korea', label: '민감도: 1960~2010년생, 국내 도시 인구 비례', fromYear: 1960, toYear: 2010, cities: koreanCities, cumulativeWeights: koreanPopulationWeights, sampleSize, seed: 20261017 },
  { id: 'korea-young', label: '민감도: 1985~2010년생, 국내 도시 인구 비례', fromYear: 1985, toYear: 2010, cities: koreanCities, cumulativeWeights: koreanPopulationWeights, sampleSize, seed: 20261018 },
];

const startedAt = Date.now();
const results = scenarios.map(runScenario);
const output = { generatedAt: new Date().toISOString(), elapsedMs: Date.now() - startedAt, results };

if (outputPath) writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
