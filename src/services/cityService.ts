import type { City } from '@/types/city';

export class CitySearchError extends Error {
  constructor(message = '도시 검색에 실패했어요.') {
    super(message);
    this.name = 'CitySearchError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCityList(value: unknown): value is City[] {
  return (
    Array.isArray(value) &&
    value.every(
      (city) =>
        isRecord(city) &&
        typeof city.id === 'string' &&
        typeof city.nameKo === 'string' &&
        typeof city.nameEn === 'string' &&
        typeof city.country === 'string' &&
        typeof city.latitude === 'number' &&
        typeof city.longitude === 'number' &&
        typeof city.timezone === 'string',
    )
  );
}

/**
 * 검색 API 주소 판본. 예전 응답이 하루 동안 브라우저에 캐시되도록 내보낸 적이 있어(2026-10-17 이전),
 * 주소를 바꿔 그 캐시를 쓰지 않게 한다. 캐시 정책을 다시 바꾸면 올린다.
 */
const GEOCODE_API_VERSION = '2';

/**
 * 도시 검색. 서버의 GeoNames 검색 API(GET /api/geocode)를 부른다.
 * 다른 지오코딩 API로 바꿀 때도 이 함수의 시그니처(query -> City[])만 유지하면 된다.
 * 개발 환경에서 '!error'를 검색하면 서버가 실패를 돌려준다(에러 UI 확인용).
 */
export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&v=${GEOCODE_API_VERSION}`, { signal });
  if (!response.ok) throw new CitySearchError();

  const body: unknown = await response.json();
  if (!isRecord(body) || !isCityList(body.cities)) throw new CitySearchError('도시 목록 형식이 올바르지 않아요.');
  return body.cities;
}
