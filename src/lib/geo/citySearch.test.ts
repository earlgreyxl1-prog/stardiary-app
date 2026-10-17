import { describe, expect, it } from 'vitest';
import { createCityIndex, getCityIndex, normalizeForSearch, searchCityIndex } from '@/lib/geo/citySearch';
import type { WorldCityFile, WorldCityRow } from '@/types/geonames';

const row = (
  id: string,
  nameEn: string,
  nameKo: string,
  population: number,
  options: { aliases?: string; country?: string; region?: string } = {},
): WorldCityRow => [
  id,
  nameEn,
  nameKo,
  options.aliases ?? '',
  options.country ?? 'XX',
  options.region ?? '',
  0,
  0,
  'UTC',
  population,
  'city',
];

/** 순위 규칙만 보려고 만든 작은 데이터 */
const SAMPLE: WorldCityFile = {
  source: 'test',
  license: 'test',
  generatedAt: 'test',
  columns: [],
  countryNamesKo: { XX: '테스트국' },
  rows: [
    row('1', 'Paris', '파리', 2_000_000, { region: 'Ile-de-France' }),
    row('2', 'Paris', '파리', 25_000, { region: 'Texas' }),
    row('3', 'Parisot', '', 900),
    row('4', 'Comeillas-en-Parisis', '코르메유장파리지', 50_000),
    row('5', 'Seoul', '서울', 10_000_000, { aliases: '서울특별시|서울시|경성' }),
    row('6', 'Sao Paulo', '상파울루', 12_000_000),
    row('7', 'Jeongja-dong', '정자동', 0, { region: '경기도 성남시' }),
    row('8', 'Jeongja-dong', '삼정자동', 0),
  ],
};
const sampleIndex = createCityIndex(SAMPLE);
const names = (query: string, limit = 8) => searchCityIndex(sampleIndex, query, limit).map((city) => city.nameKo);

describe('normalizeForSearch', () => {
  it('대소문자·악센트·공백·문장부호를 무시한다', () => {
    expect(normalizeForSearch('São Paulo')).toBe('saopaulo');
    expect(normalizeForSearch("  Saint-Jean d'Arc  ")).toBe('saintjeandarc');
  });

  it('한글 음절은 그대로 두고 공백만 뗀다', () => {
    expect(normalizeForSearch('뉴 욕')).toBe('뉴욕');
    expect(normalizeForSearch('서울')).toBe('서울');
  });
});

describe('searchCityIndex — 순위 규칙 (작은 데이터)', () => {
  it('완전 일치 > 앞부분 일치 > 중간 포함, 같은 순위는 인구 많은 순', () => {
    expect(names('paris')).toEqual(['파리', '파리', 'Parisot', '코르메유장파리지']);
    expect(searchCityIndex(sampleIndex, 'paris', 1)[0].region).toBe('Ile-de-France');
  });

  it('별칭(옛 이름 포함)으로도 찾는다', () => {
    expect(names('서울특별시')).toEqual(['서울']);
    expect(names('경성')).toEqual(['서울']);
  });

  it('악센트 없이 쳐도 찾는다', () => {
    expect(names('sao paulo')).toEqual(['상파울루']);
  });

  it('인구가 같으면(0) 이름이 짧은 쪽이 먼저', () => {
    expect(names('정자')).toEqual(['정자동', '삼정자동']);
  });

  it('한 글자 검색어는 중간 포함으로 찾지 않는다', () => {
    expect(names('울')).toEqual([]);
  });

  it('빈 검색어는 결과가 없고, limit을 지킨다', () => {
    expect(names('   ')).toEqual([]);
    expect(names('paris', 2)).toHaveLength(2);
  });

  it('한글 이름이 없으면 영문 이름을 대신 쓰고, 국가는 한글로 바꾼다', () => {
    const [parisot] = searchCityIndex(sampleIndex, 'parisot', 1);
    expect(parisot.nameKo).toBe('Parisot');
    expect(parisot.country).toBe('테스트국');
  });
});

describe('searchCityIndex — 실제 데이터 (data/world-cities.geonames.json)', () => {
  const index = getCityIndex();
  const first = (query: string) => searchCityIndex(index, query, 8)[0];
  const all = (query: string) => searchCityIndex(index, query, 8);

  it('대표 도시', () => {
    expect(first('서울')).toMatchObject({ nameKo: '서울', countryCode: 'KR' });
    expect(first('서울특별시')?.nameKo).toBe('서울');
    expect(first('파리')).toMatchObject({ nameKo: '파리', countryCode: 'FR' });
    expect(first('Tromso')).toMatchObject({ nameKo: '트롬쇠', countryCode: 'NO', timezone: 'Europe/Oslo' });
    expect(first('로스앤젤레스')?.countryCode).toBe('US');
    expect(first('엘에이')?.nameKo).toBe('로스앤젤레스');
  });

  it('구를 몰라도 시로 찾는다 (용인시 / 용인)', () => {
    expect(first('용인시')).toMatchObject({ nameKo: '용인시', region: '경기도' });
    expect(first('용인')?.nameKo).toBe('용인시');
  });

  it('동명 행정구역은 지역으로 구분된다 (중구)', () => {
    const regions = all('중구')
      .filter((city) => city.nameKo === '중구')
      .map((city) => city.region);
    expect(regions).toEqual(expect.arrayContaining(['서울특별시', '부산광역시', '인천광역시']));
  });

  it('신설·복원 구와 읍·면·동', () => {
    expect(first('검단구')).toMatchObject({ nameKo: '검단구', region: '인천광역시' });
    expect(first('동탄구')).toMatchObject({ nameKo: '동탄구', region: '경기도 화성시' });
    expect(first('원미구')).toMatchObject({ nameKo: '원미구', region: '경기도 부천시' });
    expect(first('분당구')).toMatchObject({ nameKo: '분당구', region: '경기도 성남시' });
    expect(first('왜관')).toMatchObject({ nameKo: '왜관읍', region: '경상북도 칠곡군' });
    expect(first('상계동')).toMatchObject({ nameKo: '상계동', region: '서울특별시 노원구' });
  });

  it('옛 지명으로 찾으면 지금 행정구역이 나온다', () => {
    expect(first('진해')?.nameKo).toBe('진해구');
    expect(first('충무')?.nameKo).toBe('통영시');
    expect(first('이리')?.nameKo).toBe('익산시');
    expect(first('삼천포')?.nameKo).toBe('사천시');
    expect(first('경성')?.nameKo).toBe('서울');
    expect(all('마산').map((city) => city.nameKo)).toEqual(expect.arrayContaining(['마산회원구', '마산합포구']));
  });

  it('모든 국내 항목은 한글 이름이 있고 타임존은 Asia/Seoul', () => {
    const korean = index.entries.filter((entry) => entry.row[4] === 'KR');
    expect(korean.length).toBeGreaterThan(6_000);
    expect(korean.filter((entry) => entry.row[2] === '')).toEqual([]);
    expect(korean.filter((entry) => entry.row[8] !== 'Asia/Seoul')).toEqual([]);
  });
});
