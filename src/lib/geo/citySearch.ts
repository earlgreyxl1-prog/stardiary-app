import 'server-only';

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { City } from '@/types/city';
import type { WorldCityFile, WorldCityRow } from '@/types/geonames';

/**
 * GeoNames 세계 도시 검색 (서버 전용).
 * 데이터: data/world-cities.geonames.json (약 23만 개 도시, 약 20MB). 브라우저로 보내지 않는다.
 * 출처: GeoNames (https://www.geonames.org), CC BY 4.0 — 화면에 출처를 표기한다(StepCity).
 */

const DATA_PATH = path.join(process.cwd(), 'data', 'world-cities.geonames.json');

/** 검색어와 비교하려고 소문자로 바꾸고, 악센트·공백·문장부호를 뗀다. 한글 음절은 그대로 둔다. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\-'’.,()·]/g, '');
}

interface IndexEntry {
  row: WorldCityRow;
  /** 정규화한 검색 키 (영문 이름, 한글 대표 이름, 한글 별칭) */
  keys: string[];
}

export interface CityIndex {
  entries: IndexEntry[];
  countryNamesKo: Record<string, string>;
  /** 데이터 판본(파일의 generatedAt). 검색 응답의 ETag에 넣어, 데이터가 바뀌면 브라우저 캐시가 무효가 되게 한다. */
  version: string;
}

export function createCityIndex(file: WorldCityFile): CityIndex {
  const entries = file.rows.map((row) => {
    const [, nameEn, nameKo, koAliases] = row;
    const names = [nameEn, nameKo, ...(koAliases ? koAliases.split('|') : [])];
    const keys = [...new Set(names.map(normalizeForSearch).filter((key) => key !== ''))];
    return { row, keys };
  });
  return { entries, countryNamesKo: file.countryNamesKo, version: file.generatedAt };
}

let cached: { index: CityIndex; modifiedMs: number } | null = null;

/**
 * 파일을 읽어 메모리 인덱스를 만들고, 파일이 다시 만들어지면(수정 시각이 바뀌면) 새로 읽는다.
 * 예전에는 서버를 다시 켜기 전까지 옛 데이터로 답해서, 데이터를 보강한 뒤에도 검색에 안 나오는 문제가 있었다.
 */
export function getCityIndex(): CityIndex {
  const modifiedMs = statSync(DATA_PATH).mtimeMs;
  if (cached === null || cached.modifiedMs !== modifiedMs) {
    const file = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as WorldCityFile;
    cached = { index: createCityIndex(file), modifiedMs };
  }
  return cached.index;
}

function toCity(row: WorldCityRow, countryNamesKo: Record<string, string>): City {
  const [id, nameEn, nameKo, , countryCode, region, latitude, longitude, timezone] = row;
  return {
    id,
    nameKo: nameKo || nameEn,
    nameEn,
    country: countryNamesKo[countryCode] ?? countryCode,
    countryCode,
    region,
    latitude,
    longitude,
    timezone,
  };
}

/** 일치 정도: 3 완전 일치 > 2 앞부분 일치 > 1 중간 포함(검색어 2자 이상일 때만) > 0 불일치 */
function matchScore(keys: readonly string[], query: string): number {
  let best = 0;
  for (const key of keys) {
    if (key === query) return 3;
    if (key.startsWith(query)) best = Math.max(best, 2);
    else if (best < 1 && query.length >= 2 && key.includes(query)) best = 1;
  }
  return best;
}

/**
 * 도시를 검색한다. 일치 정도가 같으면 인구가 많은 도시부터, 인구도 같으면(국내 읍·면·동은 대부분 0) 이름이 짧은 쪽부터.
 * 같은 이름의 작은 마을보다 큰 도시가 먼저 나오게 하려는 것이다(예: '파리' → 프랑스 파리, '수원' → 수원시).
 */
export function searchCityIndex(index: CityIndex, rawQuery: string, limit: number): City[] {
  const query = normalizeForSearch(rawQuery);
  if (query === '') return [];

  const matches: Array<{ entry: IndexEntry; score: number }> = [];
  for (const entry of index.entries) {
    const score = matchScore(entry.keys, query);
    if (score > 0) matches.push({ entry, score });
  }
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.entry.row[9] - a.entry.row[9] ||
      (a.entry.row[2] || a.entry.row[1]).length - (b.entry.row[2] || b.entry.row[1]).length,
  );
  return matches.slice(0, limit).map(({ entry }) => toCity(entry.row, index.countryNamesKo));
}
