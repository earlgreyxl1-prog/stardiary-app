'use client';

import { useState } from 'react';
import { MapPin, RefreshCw, Search, SearchX } from 'lucide-react';
import { FieldError } from '@/components/ui/FieldError';
import { INPUT_CLASS } from '@/components/ui/inputStyles';
import { GeoNamesAttribution } from '@/components/onboarding/GeoNamesAttribution';
import { useCitySearch } from '@/hooks/useCitySearch';
import type { BirthStepProps } from '@/types/birth';
import type { City } from '@/types/city';

/**
 * 같은 이름의 도시를 구분할 수 있게 영문 이름·지역·국가를 한 줄로 만든다.
 * - 한글 이름이 없으면(이미 영문으로 보이므로) 영문 이름을 뺀다.
 * - 국내 지명은 지역이 한글 경로(경기도 성남시)라 영문 로마자 표기(Bundang-gu)를 뺀다.
 * - 영문 이름과 같은 지역명(Gwangju · Gwangju)은 뺀다.
 */
function formatCityDetail(city: City): string {
  const nameEn = city.nameKo !== city.nameEn && city.countryCode !== 'KR' ? city.nameEn : '';
  const region = city.region && city.region !== city.nameEn ? city.region : '';
  return [nameEn, region, city.country].filter((part) => part !== '').join(' · ');
}

function CityResultSkeleton() {
  return (
    <ul aria-busy="true" aria-label="도시를 찾는 중이에요" className="mt-3 space-y-2">
      {[0, 1, 2].map((index) => (
        <li key={index} className="h-14 animate-pulse rounded-2xl bg-white/10" />
      ))}
    </ul>
  );
}

export function StepCity({ values, errors, setField }: BirthStepProps) {
  const [query, setQuery] = useState('');
  const selected = values.city;
  const { status, results, retry } = useCitySearch(selected ? '' : query);
  const invalid = Boolean(errors.city);

  if (selected) {
    return (
      <div>
        <p className="text-lg font-bold text-white">태어난 도시를 골랐어요</p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#ffe9a8]/50 bg-[#ffe9a8]/10 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-[#ffe9a8]" aria-hidden />
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{selected.nameKo}</p>
              <p className="truncate text-xs text-indigo-200/80">{formatCityDetail(selected)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setField('city', null);
              setQuery('');
            }}
            className="shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-sm text-indigo-100 transition hover:bg-white/20 active:scale-95"
          >
            다시 고르기
          </button>
        </div>
        <GeoNamesAttribution />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="birth-city" className="text-lg font-bold text-white">
        어디에서 태어났나요?
      </label>
      <p className="mt-1 text-sm text-indigo-200/80">태어난 곳의 하늘을 기준으로 별자리를 계산해요.</p>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-200/50"
          aria-hidden
        />
        <input
          id="birth-city"
          type="text"
          autoComplete="off"
          placeholder="도시 이름 (예: 서울, 도쿄, 뉴욕)"
          value={query}
          aria-invalid={invalid}
          aria-describedby={invalid ? 'city-error' : undefined}
          onChange={(event) => setQuery(event.target.value)}
          className={`${INPUT_CLASS} pl-12`}
        />
      </div>

      {status === 'idle' && (
        <p className="mt-3 text-sm text-indigo-200/70">한글이나 영문으로 도시 이름을 입력하면 후보가 나와요.</p>
      )}

      {status === 'loading' && <CityResultSkeleton />}

      {status === 'error' && (
        <div role="alert" className="mt-3 rounded-2xl border border-[#ffb3c7]/40 bg-[#ffb3c7]/10 p-4">
          <p className="text-sm text-[#ffd3df]">도시 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            다시 시도
          </button>
        </div>
      )}

      {status === 'success' && results.length === 0 && (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-white/20 px-4 py-6 text-center">
          <SearchX className="h-7 w-7 text-indigo-200/60" aria-hidden />
          <p className="mt-2 text-sm font-medium text-white">“{query.trim()}” 도시를 찾지 못했어요</p>
          <p className="mt-1 text-xs text-indigo-200/70">
            철자를 확인하거나, 영문 이름이나 가까운 큰 도시로 검색해 보세요. 작은 동네는 시·군 이름으로 찾아보세요.
          </p>
        </div>
      )}

      {status === 'success' && results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => setField('city', city)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-left transition hover:border-[#ffe9a8]/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <MapPin className="h-4 w-4 shrink-0 text-[#ffc6e0]" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-white">{city.nameKo}</span>
                  <span className="block truncate text-xs text-indigo-200/70">{formatCityDetail(city)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <FieldError id="city-error" message={errors.city} />
      <GeoNamesAttribution />
    </div>
  );
}
