/**
 * GeoNames 도시 덤프를 서비스용 세계 도시 데이터(data/world-cities.geonames.json)로 가공한다.
 * 온보딩 도시 검색(GET /api/geocode)과 원소 분포 시뮬레이션이 같은 파일을 쓴다.
 *
 * 출처: GeoNames (https://www.geonames.org), CC BY 4.0 — 앱 안에 출처 표기가 필요하다(StepCity에 표시 중).
 * 원본 받기 (임시 폴더에서):
 *   curl -sSfLO https://download.geonames.org/export/dump/cities500.zip          # 인구 500명 이상 또는 행정 중심지
 *   curl -sSfLO https://download.geonames.org/export/dump/admin1CodesASCII.txt
 *   curl -sSfLO https://download.geonames.org/export/dump/alternateNamesV2.zip    # 약 200MB
 *   curl -sSfLO https://download.geonames.org/export/dump/KR.zip                  # 한국 전체 지명 (행정구역 보강용)
 *   unzip cities500.zip && unzip KR.zip
 *   unzip -p alternateNamesV2.zip alternateNamesV2.txt | awk -F'\t' '$3=="ko"' > ko-names.tsv
 * 실행 (프로젝트 루트에서):
 *   npx --yes tsx scripts/build-world-cities.ts <cities500.txt> <admin1CodesASCII.txt> <ko-names.tsv> data/world-cities.geonames.json --kr <KR.txt>
 *
 * - 타임존은 Luxon으로 열어 보고, 열리지 않는 도시는 버린다(계산 엔진이 같은 Luxon을 쓰기 때문).
 * - 한글 이름: alternateNamesV2의 ko 이름에서 역사적 이름(한양·경성 등)을 뺀다. ko로 태그된 한자·로마자 표기는
 *   대표 이름 후보에서 빼고 검색용 별칭으로만 둔다. 대표 이름 규칙은 pickDisplayName 참고.
 * - 국내(--kr): GeoNames 한국 덤프의 행정구역(시·도, 시·군·구, 일반구·읍·면·동)을 모두 넣고, 상위 행정구역을 한글 경로로 붙인다.
 *   GeoNames에 빠진 곳·한글 이름이 없는 곳은 scripts/data/kr-supplement.ts로 채운다.
 * - 국가 한글 이름은 Node 내장 Intl.DisplayNames('ko')로 채운다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DateTime } from 'luxon';
import {
  KR_ADMIN_CODES,
  KR_EXTRA_ALIASES,
  KR_EXTRA_PLACES,
  KR_HISTORIC_ALIASES,
  KR_NAME_OVERRIDES,
} from './data/kr-supplement';
import type { WorldCityFile, WorldCityKind, WorldCityRow } from '@/types/geonames';

const args = process.argv.slice(2);
const krFlag = args.indexOf('--kr');
const krPath = krFlag >= 0 ? args[krFlag + 1] : undefined;
const [citiesPath, admin1Path, koNamesPath, outputPath] = krFlag >= 0 ? args.slice(0, krFlag) : args;
if (!citiesPath || !admin1Path || !koNamesPath || !outputPath || (krFlag >= 0 && !krPath)) {
  console.error(
    '사용법: tsx scripts/build-world-cities.ts <cities500.txt> <admin1CodesASCII.txt> <ko-names.tsv> <out.json> [--kr <KR.txt>]',
  );
  process.exit(1);
}

const regionNamesKo = new Intl.DisplayNames(['ko'], { type: 'region' });
/** 대표 이름 후보: 한글(과 숫자·공백)로만 된 이름. ko로 태그된 한자(大邱)·로마자(Taegu)는 뺀다. */
const HANGUL_NAME = /^[가-힣\d\s]+$/;
const HANGUL_CHAR = /[가-힣]/;

interface KoreanNames {
  candidates: string[];
  preferred: string | null;
  all: Set<string>;
}

/** 국내 행정구역 접미사. '서울특별시'처럼 공식 이름이 길면 접미사를 뗀 이름이 있을 때 그쪽을 보여준다. */
const ADMIN_SUFFIX = /\s*(특별시|광역시|특별자치시|특별자치도|시|군|구)$/;
/** '오사카 시'처럼 띄어 쓴 ' 시'는 외국 도시 이름에 붙은 것이라 후보에 없어도 뗀다. */
const SPACED_CITY_SUFFIX = /\s+시$/;
/** 국내 행정구역 영문 접미사 → 한글 접미사. 오정동처럼 '오정구'·'오정동'이 함께 태그된 경우 맞는 쪽을 고른다. */
const ROMAN_TO_HANGUL_SUFFIX: Array<[RegExp, string]> = [
  [/-dong$/i, '동'],
  [/-gu$/i, '구'],
  [/-si$/i, '시'],
  [/-gun$/i, '군'],
  [/-eup$/i, '읍'],
  [/-myeon$/i, '면'],
  [/-ri$/i, '리'],
  [/-do$/i, '도'],
];

/**
 * 대표 한글 이름 고르기 (해외 도시·국내 cities500 도시):
 * 1. GeoNames 선호 이름(isPreferredName)이 있으면 그것. 단, 행정구역 접미사를 뗀 이름이 후보에 있으면 그쪽(서울특별시 → 서울).
 * 2. 없으면 가장 짧은 후보(뉴욕 시·뉴욕 → 뉴욕).
 * 예: 로스앤젤레스(선호) > 엘에이(짧은 이름), 도쿄 > 동경, 베이징 > 북경.
 */
function pickDisplayName(names: KoreanNames): string {
  if (names.candidates.length === 0) return '';
  if (names.preferred) {
    const stripped = names.preferred.replace(ADMIN_SUFFIX, '');
    if (stripped !== '' && stripped !== names.preferred && names.candidates.includes(stripped)) return stripped;
    return names.preferred.replace(SPACED_CITY_SUFFIX, '');
  }
  const shortest = [...names.candidates].sort((a, b) => a.length - b.length)[0];
  return shortest.replace(SPACED_CITY_SUFFIX, '') || shortest;
}

/**
 * 국내 행정구역의 한글 이름:
 * - 영문 접미사(-gu, -dong …)와 같은 한글 접미사로 끝나는 후보 중 가장 짧은 것(용산 대신 용산구, '아산시 온양동' 대신 온양동).
 * - 맞는 후보가 없으면 가장 긴 후보. 시·도(Seoul, Gyeonggi-do)는 공식 이름(서울특별시, 경기도)이 되도록 가장 긴 후보.
 */
function pickAdminName(names: KoreanNames | undefined, englishName: string, isProvince: boolean): string {
  if (!names || names.candidates.length === 0) return '';
  // 시·도는 현재 공식 이름(제주특별자치도, 강원특별자치도)이 되도록 가장 긴 후보. 'Jeju-do'의 -do로 '제주도'를 고르지 않게.
  if (isProvince) return [...names.candidates].sort((a, b) => b.length - a.length)[0];
  const suffix = ROMAN_TO_HANGUL_SUFFIX.find(([pattern]) => pattern.test(englishName))?.[1];
  const shortestFirst = [...names.candidates].sort((a, b) => a.length - b.length);
  const withSuffix = suffix ? shortestFirst.find((name) => name.endsWith(suffix)) : undefined;
  return withSuffix ?? shortestFirst[shortestFirst.length - 1];
}

// alternateNamesV2 열: 0 altId, 1 geonameId, 2 언어, 3 이름, 4 isPreferredName, 5 isShortName, 6 isColloquial, 7 isHistoric
const koreanNames = new Map<string, KoreanNames>();
for (const line of readFileSync(koNamesPath, 'utf8').split('\n')) {
  const cols = line.split('\t');
  const [, geonameId, language, rawName] = cols;
  const name = rawName?.trim();
  if (!geonameId || language !== 'ko' || !name) continue;
  const entry = koreanNames.get(geonameId) ?? { candidates: [], preferred: null, all: new Set<string>() };
  // 역사적 이름(한양·경성 등)은 대표 이름 후보에서 빼고 검색 별칭으로만 둔다(옛 이름으로 찾는 사용자를 위해).
  entry.all.add(name);
  const historic = cols[7] === '1';
  if (!historic && cols[6] !== '1' && HANGUL_NAME.test(name)) {
    entry.candidates.push(name);
    if (cols[4] === '1' && entry.preferred === null) entry.preferred = name;
  }
  koreanNames.set(geonameId, entry);
}

const admin1Names = new Map<string, string>();
for (const line of readFileSync(admin1Path, 'utf8').split('\n')) {
  const [code, , asciiName] = line.split('\t');
  if (code && asciiName) admin1Names.set(code, asciiName);
}

const timezoneValidity = new Map<string, boolean>();
const isValidZone = (zone: string): boolean => {
  const cached = timezoneValidity.get(zone);
  if (cached !== undefined) return cached;
  const valid = zone !== '' && DateTime.fromObject({ year: 1990, month: 1, day: 1 }, { zone }).isValid;
  timezoneValidity.set(zone, valid);
  return valid;
};

const countryNameKo = (code: string): string => {
  try {
    return regionNamesKo.of(code) ?? code;
  } catch {
    return code;
  }
};

/** 행 하나와 병합에 필요한 정보 */
interface Draft {
  row: WorldCityRow;
  admin1Code: string;
  admin2Code: string;
  aliases: Set<string>;
  /** GeoNames alternatenames 열 (국내 도시에 한글 이름이 없을 때 대신 쓴다) */
  altNames?: string;
}

/**
 * 국내 지명이 같은 곳을 가리키는지. 접미사를 한쪽만 떼서도 비교한다.
 * 양쪽을 다 떼면 '대구'(도시) → '대'처럼 이름 자체가 망가지므로 그렇게 하지 않는다.
 */
function sameKoreanPlaceName(a: string, b: string): boolean {
  if (a === '' || b === '') return false;
  const strip = (name: string) => name.replace(/\s*(특별시|광역시|특별자치시|특별자치도|시|군|구|읍|면|동)$/, '');
  return a === b || strip(a) === b || a === strip(b) || (strip(a) === strip(b) && strip(a).length >= 2);
}

/** 두 좌표 사이 거리 (km, 대원 거리) */
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** 행정구역과 도시를 같은 곳으로 볼 최대 거리. 시·도는 대표 좌표가 도 중심이라 거리 조건을 두지 않는다. */
const MERGE_MAX_KM = 10;

/** 로마자 지명 비교용: 소문자, 행정 접미사(-eup, -dong …)·기호 제거 */
function romanBase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-\s](si|gun|gu|eup|myeon|dong|ri)$/, '')
    .replace(/[^a-z]/g, '');
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

/**
 * 한글 이름이 없는 도시를 행정구역과 합쳐도 되는지: 로마자 이름이 거의 같아야 한다(Naeso ≈ Naeseo-eup, Waegwan ≈ Waegwan-eup).
 * 거리만 보면 '내서'가 이웃 '마산회원구'에 합쳐지는 일이 생긴다.
 */
function similarRomanName(a: string, b: string): boolean {
  const x = romanBase(a);
  const y = romanBase(b);
  if (x.length < 3 || y.length < 3) return false;
  return x === y || editDistance(x, y) <= Math.max(1, Math.floor(Math.min(x.length, y.length) / 4));
}

function makeRow(
  draft: Omit<Draft, 'row' | 'aliases'> & { aliases?: Iterable<string> },
  fields: {
    id: string;
    nameEn: string;
    nameKo: string;
    countryCode: string;
    region: string;
    latitude: number;
    longitude: number;
    timezone: string;
    population: number;
    kind: WorldCityKind;
  },
): Draft {
  return {
    admin1Code: draft.admin1Code,
    admin2Code: draft.admin2Code,
    altNames: draft.altNames,
    aliases: new Set(draft.aliases ?? []),
    row: [
      fields.id,
      fields.nameEn,
      fields.nameKo,
      '',
      fields.countryCode,
      fields.region,
      fields.latitude,
      fields.longitude,
      fields.timezone,
      fields.population,
      fields.kind,
    ],
  };
}

const drafts: Draft[] = [];
let skippedZone = 0;
let skippedMalformed = 0;

// 1) 세계 도시 (cities500)
for (const line of readFileSync(citiesPath, 'utf8').split('\n')) {
  if (line.trim() === '') continue;
  const cols = line.split('\t');
  // GeoNames 열: 0 id, 1 name, 2 asciiname, 3 alternatenames, 4 lat, 5 lon, 8 country, 10 admin1, 11 admin2, 14 population, 17 timezone
  const [id, , asciiName, , lat, lon] = cols;
  const countryCode = cols[8];
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!id || !asciiName || !countryCode || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    skippedMalformed += 1;
    continue;
  }
  if (!isValidZone(cols[17])) {
    skippedZone += 1;
    continue;
  }
  const korean = koreanNames.get(id);
  const population = Number(cols[14]);
  drafts.push(
    makeRow(
      { admin1Code: cols[10], admin2Code: cols[11], aliases: korean?.all, altNames: cols[3] },
      {
        id,
        nameEn: asciiName,
        // 속칭만 있는 도시는 대표 이름 없이 별칭으로만 검색되게 한다.
        nameKo: korean ? pickDisplayName(korean) : '',
        countryCode,
        region: admin1Names.get(`${countryCode}.${cols[10]}`) ?? '',
        latitude,
        longitude,
        timezone: cols[17],
        population: Number.isFinite(population) ? population : 0,
        kind: 'city',
      },
    ),
  );
}

// 2) 국내 행정구역 보강 (KR.txt)
const krStats = {
  adminAdded: 0,
  mergedIntoCity: 0,
  cityNamedFromAltNames: 0,
  droppedNamelessCities: [] as string[],
  historicAliases: 0,
  extraAdded: 0,
  withoutKoreanName: 0,
};
if (krPath) {
  const krRows = readFileSync(krPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split('\t'));
  const coordinatesById = new Map(krRows.map((cols) => [cols[0], { latitude: Number(cols[4]), longitude: Number(cols[5]) }]));
  // 상위 단계부터 처리해야 이름 없는 도시가 시·군·구와 먼저 합쳐진다(ADM1 → ADM4).
  const admins = krRows
    .filter((cols) => cols[6] === 'A' && KR_ADMIN_CODES.has(cols[7]))
    .sort((a, b) => a[7].localeCompare(b[7]));
  const mergedCities = new Set<Draft>();

  const koreanAdminName = (cols: string[]): string => {
    const override = KR_NAME_OVERRIDES[cols[0]];
    if (override) return override;
    const tagged = pickAdminName(koreanNames.get(cols[0]), cols[2], cols[7] === 'ADM1');
    if (tagged) return tagged;
    // ko 태그가 없으면 GeoNames 대체 이름 열의 한글 이름(국내 지명이라 한글이면 한국어 표기)
    return (cols[3] ?? '').split(',').find((name) => HANGUL_NAME.test(name) && HANGUL_CHAR.test(name)) ?? '';
  };

  // 상위 행정구역 이름표 (코드 → 한글 공식 이름)
  const labels = new Map<string, string>();
  for (const cols of admins) {
    const name = koreanAdminName(cols) || cols[2];
    if (cols[7] === 'ADM1') labels.set(`1|${cols[10]}`, name);
    if (cols[7] === 'ADM2') labels.set(`2|${cols[10]}|${cols[11]}`, name);
    if (cols[7] === 'ADM3') labels.set(`3|${cols[10]}|${cols[11]}|${cols[12]}`, name);
  }
  const regionPath = (admin1: string, admin2?: string, admin3?: string): string =>
    [
      labels.get(`1|${admin1}`),
      admin2 ? labels.get(`2|${admin1}|${admin2}`) : undefined,
      admin2 && admin3 ? labels.get(`3|${admin1}|${admin2}|${admin3}`) : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join(' ');

  // 국내 cities500 도시의 상위 행정구역을 한글 경로로 바꾼다 (자기 자신과 같은 이름이면 뺀다).
  const krCities = drafts.filter((draft) => draft.row[4] === 'KR');
  for (const draft of krCities) {
    const parts = [labels.get(`1|${draft.admin1Code}`), labels.get(`2|${draft.admin1Code}|${draft.admin2Code}`)].filter(
      (part): part is string => part !== undefined && !sameKoreanPlaceName(part, draft.row[2]),
    );
    draft.row[5] = parts.join(' ');
  }

  for (const cols of admins) {
    const [id, , asciiName] = cols;
    const code = cols[7];
    const admin1 = cols[10];
    const admin2 = cols[11];
    const nameKo = koreanAdminName(cols);
    if (nameKo === '') krStats.withoutKoreanName += 1;
    const aliases = new Set([...(koreanNames.get(id)?.all ?? []), ...(KR_EXTRA_ALIASES[id] ?? [])]);

    const region =
      code === 'ADM1'
        ? ''
        : code === 'ADM2'
          ? regionPath(admin1)
          : code === 'ADM3'
            ? regionPath(admin1, admin2)
            : regionPath(admin1, admin2, cols[12]);

    // 같은 곳을 가리키는 cities500 도시가 있으면 행정구역 행을 따로 만들지 않고 그 도시에 이름만 보탠다.
    // (용인시[행정구역] + 용인[도시] → 하나. 좌표·인구는 도시 중심인 cities500 쪽을 쓴다.)
    // 같은 곳: 같은 시·도 안에서 ① 이름이 같거나 ② 도시에 한글 이름이 없고(Kinzan 같은 옛 로마자 표기),
    // 둘 다 10km 이내. 시·도(ADM1)는 이름이 같을 때만(서울특별시 ↔ 서울).
    const adminLat = Number(cols[4]);
    const adminLon = Number(cols[5]);
    // 단계별 병합 규칙:
    // - 시·도(ADM1): 이름이 같을 때만(서울특별시 ↔ 서울). 대표 좌표가 도 중심이라 거리는 보지 않는다.
    // - 시·군·구(ADM2): 시/군/구 접미사만 떼고 이름이 같고(또는 이름 없는 도시의 로마자 이름이 거의 같고), 같은 시·군·구 코드이거나 10km 이내. 이미 합쳐진 도시도 받는다(세종).
    // - 읍·면·동(ADM3·4): 한글 이름이 없는 도시(Naeso 같은 로마자 표기)만, 같은 시·군·구 안 10km 이내이고 로마자 이름이 거의 같을 때 한 번.
    //   이름이 있는 도시는 건드리지 않는다(고양동이 고양시를 덮어쓰지 않게).
    const stripSiGunGu = (name: string) => name.replace(/\s*(특별시|광역시|특별자치시|특별자치도|시|군|구)$/, '');
    const sameSiGunGuName = (a: string, b: string) =>
      a !== '' && b !== '' && (a === b || stripSiGunGu(a) === b || a === stripSiGunGu(b));
    const candidates = krCities
      .filter((draft) => draft.admin1Code === admin1)
      .map((draft) => ({ draft, distance: distanceKm(adminLat, adminLon, draft.row[6], draft.row[7]) }))
      .filter(({ draft, distance }) => {
        if (code === 'ADM1') {
          return sameSiGunGuName(draft.row[2], nameKo) || sameSiGunGuName(draft.row[2], nameKo.replace(/도$/, ''));
        }
        if (code === 'ADM2') {
          const near = draft.admin2Code === admin2 || distance <= MERGE_MAX_KM;
          // 한글 이름 없는 도시(Seogwipo, Kimje)도 로마자 이름이 거의 같으면 합친다.
          const nameless = draft.row[2] === '' && !mergedCities.has(draft) && similarRomanName(draft.row[1], asciiName);
          return near && (sameSiGunGuName(draft.row[2], nameKo) || nameless);
        }
        return (
          draft.row[2] === '' &&
          !mergedCities.has(draft) &&
          draft.admin2Code === admin2 &&
          distance <= MERGE_MAX_KM &&
          similarRomanName(draft.row[1], asciiName)
        );
      })
      .sort((a, b) => a.distance - b.distance);
    const match = nameKo === '' ? undefined : candidates[0]?.draft;
    if (match) {
      match.aliases.add(nameKo);
      for (const alias of aliases) match.aliases.add(alias);
      // 시·도는 짧은 도시 이름(서울)을 대표로 두고, 시·군·구는 행정구역 이름(용인시)을, 이름 없던 도시는 읍·면·동 이름을 대표로 한다.
      if (code === 'ADM2' || match.row[2] === '') {
        if (match.row[2] !== '') match.aliases.add(match.row[2]);
        match.row[2] = nameKo;
        match.row[5] = region;
      }
      mergedCities.add(match);
      krStats.mergedIntoCity += 1;
      continue;
    }

    const population = Number(cols[14]);
    drafts.push(
      makeRow(
        { admin1Code: admin1, admin2Code: admin2, aliases },
        {
          id,
          nameEn: asciiName,
          nameKo,
          countryCode: 'KR',
          region,
          latitude: Number(cols[4]),
          longitude: Number(cols[5]),
          timezone: cols[17] || 'Asia/Seoul',
          population: Number.isFinite(population) ? population : 0,
          kind: 'admin',
        },
      ),
    );
    krStats.adminAdded += 1;
  }

  // 행정구역과 합쳐지지 않았는데 한글 이름이 없는 국내 도시: GeoNames 대체 이름 열의 한글 이름을 쓴다.
  for (const draft of krCities) {
    if (draft.row[2] !== '') continue;
    const hangul = (draft.altNames ?? '').split(',').find((name) => HANGUL_NAME.test(name) && HANGUL_CHAR.test(name));
    if (hangul) {
      draft.row[2] = hangul;
      krStats.cityNamedFromAltNames += 1;
    }
  }
  // 그래도 한글 이름이 없는 국내 도시는 뺀다. 일제강점기 일본어 독음(Eisen=영천, Nangen=남원, Kyosai=거제) 같은
  // 옛 표기로 들어온 중복이라 한글로 검색되지 않고, 같은 곳의 행정구역 항목이 이미 있다.
  for (let index = drafts.length - 1; index >= 0; index -= 1) {
    const draft = drafts[index];
    if (draft.row[4] === 'KR' && draft.row[10] === 'city' && draft.row[2] === '') {
      krStats.droppedNamelessCities.push(`${draft.row[1]}(${draft.row[5]})`);
      drafts.splice(index, 1);
    }
  }

  // 통폐합·개칭으로 사라진 옛 이름을 현재 행정구역의 검색 별칭으로 붙인다.
  for (const historic of KR_HISTORIC_ALIASES) {
    // 거제시가 cities500에서 '거제'로 들어온 경우처럼 접미사가 없을 수 있어 같은 이름 비교를 쓰고, 인구가 많은 쪽을 고른다.
    const target = drafts
      .filter(
        (draft) =>
          draft.row[4] === 'KR' &&
          sameKoreanPlaceName(draft.row[2], historic.target.nameKo) &&
          draft.row[5].includes(historic.target.regionIncludes),
      )
      .sort((a, b) => b.row[9] - a.row[9])[0];
    if (!target) throw new Error(`옛 이름을 붙일 곳을 찾지 못했어요: ${historic.names.join('/')} → ${historic.target.nameKo}`);
    for (const name of historic.names) target.aliases.add(name);
    krStats.historicAliases += historic.names.length;
  }

  for (const extra of KR_EXTRA_PLACES) {
    const coordinates = coordinatesById.get(extra.coordinatesFrom);
    if (!coordinates) throw new Error(`좌표를 빌려 올 지점을 찾지 못했어요: ${extra.id} ← ${extra.coordinatesFrom}`);
    drafts.push(
      makeRow(
        { admin1Code: '', admin2Code: '', aliases: extra.aliases },
        {
          id: extra.id,
          nameEn: extra.nameEn,
          nameKo: extra.nameKo,
          countryCode: 'KR',
          region: extra.region,
          ...coordinates,
          timezone: 'Asia/Seoul',
          population: 0,
          kind: 'extra',
        },
      ),
    );
    krStats.extraAdded += 1;
  }
}

// 별칭 정리: 대표 이름은 빼고 '|'로 잇는다.
const rows: WorldCityRow[] = drafts.map((draft) => {
  const row = draft.row;
  row[3] = [...draft.aliases].filter((alias) => alias !== row[2] && alias !== '').join('|');
  // 세종특별자치시처럼 상위 행정구역이 자기 자신이면 지역 표시를 비운다.
  if (row[5] === row[2]) row[5] = '';
  return row;
});

const countries = new Set(rows.map((row) => row[4]));
const output: WorldCityFile = {
  source: 'GeoNames cities500 + KR + alternateNamesV2 (https://download.geonames.org/export/dump/)',
  license: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) — 가공해 사용',
  generatedAt: new Date().toISOString(),
  columns: [
    'id',
    'nameEn',
    'nameKo',
    'koAliases',
    'countryCode',
    'region',
    'latitude',
    'longitude',
    'timezone',
    'population',
    'kind',
  ],
  countryNamesKo: Object.fromEntries([...countries].sort().map((code) => [code, countryNameKo(code)])),
  rows,
};
writeFileSync(outputPath, JSON.stringify(output));

console.log(
  JSON.stringify(
    {
      rows: rows.length,
      cities: rows.filter((row) => row[10] === 'city').length,
      countries: countries.size,
      timezones: [...timezoneValidity.values()].filter(Boolean).length,
      skippedInvalidTimezone: skippedZone,
      skippedMalformed,
      withKoreanName: rows.filter((row) => row[2] !== '').length,
      korea: { total: rows.filter((row) => row[4] === 'KR').length, ...krStats },
    },
    null,
    2,
  ),
);
