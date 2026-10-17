import { getCityIndex, searchCityIndex } from '@/lib/geo/citySearch';
import type { City } from '@/types/city';

export interface GeocodeResponse {
  cities: City[];
}

export interface GeocodeError {
  error: string;
}

const MAX_RESULTS = 8;
const MAX_QUERY_LENGTH = 50;
/** 에러 UI 확인용. 개발 환경에서만 이 검색어로 실패를 낸다. */
const DEV_FAILURE_QUERY = '!error';

/** GET /api/geocode?q=서울 — GeoNames 세계 도시 검색 (CC BY 4.0) */
export async function GET(request: Request): Promise<Response> {
  const query = (new URL(request.url).searchParams.get('q') ?? '').trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: `검색어는 ${MAX_QUERY_LENGTH}자 이하로 입력해 주세요` } satisfies GeocodeError, {
      status: 400,
    });
  }
  if (process.env.NODE_ENV !== 'production' && query.toLowerCase() === DEV_FAILURE_QUERY) {
    return Response.json({ error: '개발용 실패 응답이에요' } satisfies GeocodeError, { status: 500 });
  }

  try {
    const index = getCityIndex();
    // 캐시: 데이터 판본이 들어간 ETag로 매번 확인한다(바뀌지 않았으면 304로 본문 없이 끝난다).
    // 예전의 하루짜리 캐시(max-age=86400)는 데이터를 보강한 뒤에도 브라우저가 옛 '결과 없음'을 계속 보여주는 원인이었다.
    const etag = `W/"${index.version}|${encodeURIComponent(query.toLowerCase())}"`;
    const headers = { 'Cache-Control': 'no-cache', ETag: etag };
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers });
    }
    const cities = searchCityIndex(index, query, MAX_RESULTS);
    return Response.json({ cities } satisfies GeocodeResponse, { headers });
  } catch (error: unknown) {
    console.error('[api/geocode]', error);
    return Response.json({ error: '도시 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' } satisfies GeocodeError, {
      status: 500,
    });
  }
}
