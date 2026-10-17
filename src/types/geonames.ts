/**
 * GeoNames 가공 도시 파일(data/world-cities.geonames.json)의 형식.
 * 파일 크기를 줄이려고 도시 한 곳을 객체 대신 고정 순서 배열로 저장한다.
 * 출처: GeoNames (https://www.geonames.org), CC BY 4.0. 만드는 법은 scripts/build-world-cities.ts.
 */

/**
 * - city: GeoNames cities500의 도시(인구 500명 이상 또는 행정 중심지). 인구 비례 시뮬레이션은 이것만 쓴다.
 * - admin: 국내 행정구역(시·도, 시·군·구, 일반구, 읍·면·동). 인구가 도시와 겹치므로 시뮬레이션 가중치에서 뺀다.
 * - extra: GeoNames에 아직 없는 국내 행정구역(최근 신설·복원). 좌표는 같은 구역 안 GeoNames 지점에서 빌려 왔다.
 */
export type WorldCityKind = 'city' | 'admin' | 'extra';

export type WorldCityRow = [
  id: string,
  nameEn: string,
  /** 대표 한글 이름 (없으면 빈 문자열) */
  nameKo: string,
  /** 검색용 다른 이름들, '|'로 구분 (예: '서울특별시|서울시'). 없으면 빈 문자열 */
  koAliases: string,
  countryCode: string,
  /** 상위 행정구역. 국내는 한글 경로(예: '경기도 성남시'), 해외는 1단계 행정구역 영문 이름. 없으면 빈 문자열 */
  region: string,
  latitude: number,
  longitude: number,
  timezone: string,
  population: number,
  kind: WorldCityKind,
];

export interface WorldCityFile {
  source: string;
  license: string;
  generatedAt: string;
  columns: string[];
  /** 국가 코드 → 한글 국가명 */
  countryNamesKo: Record<string, string>;
  rows: WorldCityRow[];
}
