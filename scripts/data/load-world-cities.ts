import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { City } from '@/types/city';
import type { WorldCityFile } from '@/types/geonames';

export interface WorldCities {
  source: string;
  cities: City[];
  /**
   * cities와 같은 순서의 인구. 인구 비례 추출에 쓴다.
   * 국내 행정구역(kind admin/extra)은 도시 인구와 겹치므로 0으로 둔다(도시 균등 추출에서는 그대로 뽑힌다).
   */
  populations: number[];
}

/**
 * scripts/build-world-cities.ts가 만든 GeoNames 가공 파일을 읽는다 (프로젝트 루트에서 실행한다고 가정).
 * 서비스의 도시 검색(/api/geocode)과 같은 파일이다.
 */
export function loadWorldCities(
  filePath = path.join(process.cwd(), 'data', 'world-cities.geonames.json'),
): WorldCities {
  const file = JSON.parse(readFileSync(filePath, 'utf8')) as WorldCityFile;
  const cities: City[] = [];
  const populations: number[] = [];
  for (const [id, nameEn, nameKo, , countryCode, region, latitude, longitude, timezone, population, kind] of file.rows) {
    cities.push({
      id,
      nameKo: nameKo || nameEn,
      nameEn,
      country: file.countryNamesKo[countryCode] ?? countryCode,
      countryCode,
      region,
      latitude,
      longitude,
      timezone,
    });
    populations.push(kind === 'city' ? population : 0);
  }
  return { source: file.source, cities, populations };
}
