/**
 * 국내 행정구역 보정 데이터 (build-world-cities.ts에서 GeoNames 한국 전체 덤프 KR.txt와 함께 쓴다).
 *
 * 기준: 한국어 위키백과 '대한민국의 기초자치단체 목록'(2026-07-01 기준 227곳)과 '대한민국의 구 목록'(일반구 39곳, 2026-02-01 기준)을
 * GeoNames와 대조해(2026-10-17) 빠지거나 한글 이름이 없는 곳만 여기서 채운다.
 * 좌표는 손으로 적지 않고, 같은 구역 안에 있는 GeoNames 지점의 좌표를 빌려 온다(coordinatesFrom).
 */

/** GeoNames에 한글 이름이 없는 행정구역의 대표 한글 이름 (geonameId → 이름) */
export const KR_NAME_OVERRIDES: Record<string, string> = {
  // 일반구 (상위 시는 GeoNames 행정 코드로 확인)
  '8659214': '북구', // 포항시
  '8659215': '남구', // 포항시
  '8659216': '덕진구', // 전주시
  '8659217': '완산구', // 전주시
  '8659222': '수지구', // 용인시
  '8659224': '처인구', // 용인시
  '8659227': '덕양구', // 고양시
  '8659228': '단원구', // 안산시
  '8659229': '상록구', // 안산시
  '8659233': '동안구', // 안양시
  '8659234': '만안구', // 안양시
  '8659236': '중원구', // 성남시
  '8659237': '수정구', // 성남시
  '8659238': '영통구', // 수원시
  '8659239': '팔달구', // 수원시
  '8659240': '권선구', // 수원시
  '8659241': '장안구', // 수원시
  // 광역·기초
  '8659242': '세종특별자치시',
  '8417631': '계양구', // GeoNames 한글 이름이 '계양'뿐이라 '구'를 붙인다
  // 행정동 (GeoNames 로마자 표기 + 상위 행정구역으로 확인)
  '8691104': '교현안림동', // 충주시
  '8691105': '목행용탄동', // 충주시
  '8691135': '성내충인동', // 충주시
  '8691204': '칠금금릉동', // 충주시
  '8691209': '호암직동', // 충주시
  '8691226': '성화개신죽림동', // 청주시
  '8691242': '율량사천동', // 청주시
  '8691205': '봉명동', // 청주시 흥덕구
  '8691218': '운천신봉동', // 청주시 흥덕구
  '8691235': '용담명암산성동', // 청주시 상당구
  '8691240': '탑대성동', // 청주시 상당구
  '8692146': '도화동', // 인천 미추홀구
  '8692148': '용현동', // 인천 미추홀구
  '8692149': '숭의동', // 인천 미추홀구
  '8692177': '송림동', // 인천 동구
  '8692182': '송현동', // 인천 동구
  '8692184': '화수동', // 인천 동구
  '8692219': '수성동', // 대구 수성구
  '8692254': '비산동', // 대구 서구
  '8692260': '안심동', // 대구 동구
  '8692268': '불로봉무동', // 대구 동구
  '8692274': '신천동', // 대구 동구
  '8692692': '상계동', // 서울 노원구
  '8692732': '상계동', // 서울 노원구
  '8692731': '중계동', // 서울 노원구
  '8692799': '면목동', // 서울 중랑구
  '8692842': '금호동', // 서울 성동구
  // 종로구의 'Jongno-dong' 두 곳은 행정동(종로1·2·3·4가동 / 종로5·6가동) 중 어느 쪽인지 GeoNames만으로 가릴 수 없어 '종로동'으로 둔다.
  '8692891': '종로동',
  '8692892': '종로동',
};

export interface KrHistoricAlias {
  /** 지금은 쓰지 않는 옛 이름들 (검색용) */
  names: string[];
  /** 그 이름으로 찾았을 때 보여줄 현재 행정구역: 대표 한글 이름 + 상위 행정구역에 들어 있어야 할 글자 */
  target: { nameKo: string; regionIncludes: string };
}

/**
 * 통폐합·개칭으로 사라진 시·군 이름 (검색 전용 별칭). 나이 든 사용자는 출생지를 옛 이름으로 기억한다.
 * 옛 구역이 지금 어디에 속하는지만 적었다. 경계가 정확히 일치하지 않는 곳(예: 청원군 → 청주시)도 있다.
 */
export const KR_HISTORIC_ALIASES: KrHistoricAlias[] = [
  { names: ['마산', '마산시'], target: { nameKo: '마산합포구', regionIncludes: '창원시' } },
  { names: ['마산', '마산시'], target: { nameKo: '마산회원구', regionIncludes: '창원시' } },
  { names: ['진해', '진해시'], target: { nameKo: '진해구', regionIncludes: '창원시' } },
  { names: ['충무', '충무시'], target: { nameKo: '통영시', regionIncludes: '경상남도' } },
  { names: ['이리', '이리시'], target: { nameKo: '익산시', regionIncludes: '전북' } },
  { names: ['온양', '온양시'], target: { nameKo: '아산시', regionIncludes: '충청남도' } },
  { names: ['삼천포', '삼천포시'], target: { nameKo: '사천시', regionIncludes: '경상남도' } },
  { names: ['장승포', '장승포시'], target: { nameKo: '거제시', regionIncludes: '경상남도' } },
  { names: ['여천', '여천시', '여천군'], target: { nameKo: '여수시', regionIncludes: '전라남도' } },
  { names: ['동광양', '동광양시'], target: { nameKo: '광양시', regionIncludes: '전라남도' } },
  { names: ['점촌', '점촌시'], target: { nameKo: '문경시', regionIncludes: '경상북도' } },
  { names: ['송정', '송정시'], target: { nameKo: '광산구', regionIncludes: '광주' } },
  { names: ['영일', '영일군'], target: { nameKo: '포항시', regionIncludes: '경상북도' } },
  { names: ['청원군'], target: { nameKo: '청주시', regionIncludes: '충청북도' } },
  { names: ['금릉군'], target: { nameKo: '김천시', regionIncludes: '경상북도' } },
  { names: ['선산군'], target: { nameKo: '구미시', regionIncludes: '경상북도' } },
  { names: ['명주군'], target: { nameKo: '강릉시', regionIncludes: '강원' } },
  { names: ['춘성군'], target: { nameKo: '춘천시', regionIncludes: '강원' } },
  { names: ['원성군'], target: { nameKo: '원주시', regionIncludes: '강원' } },
  { names: ['중원군'], target: { nameKo: '충주시', regionIncludes: '충청북도' } },
  { names: ['제원군'], target: { nameKo: '제천시', regionIncludes: '충청북도' } },
  { names: ['천원군'], target: { nameKo: '천안시', regionIncludes: '충청남도' } },
  { names: ['남구'], target: { nameKo: '미추홀구', regionIncludes: '인천' } }, // 2018년 개칭
];

/** 검색용 별칭 추가 (geonameId → 이름들). 행정구역 이름이 바뀐 경우 옛 이름·새 이름을 함께 찾게 한다. */
export const KR_EXTRA_ALIASES: Record<string, string[]> = {
  '8417631': ['계양'],
};

export interface KrExtraPlace {
  /** 데이터 안에서 겹치지 않는 id (GeoNames id가 아니다) */
  id: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  /** 상위 행정구역 (화면 둘째 줄) */
  region: string;
  /** 좌표를 빌려 올 GeoNames 지점 id. 같은 구역 안에 있는 곳을 고른다. */
  coordinatesFrom: string;
  note: string;
}

/** GeoNames에 아직 없는 행정구역 (최근 신설·복원) */
export const KR_EXTRA_PLACES: KrExtraPlace[] = [
  // 인천 행정체제 개편 (2026-07-01 자치구 신설·개편)
  { id: 'kr-incheon-geomdan-gu', nameKo: '검단구', nameEn: 'Geomdan-gu', aliases: [], region: '인천광역시', coordinatesFrom: '10252766', note: '좌표: 검단1동' },
  { id: 'kr-incheon-yeongjong-gu', nameKo: '영종구', nameEn: 'Yeongjong-gu', aliases: [], region: '인천광역시', coordinatesFrom: '8692187', note: '좌표: 영종동' },
  { id: 'kr-incheon-jemulpo-gu', nameKo: '제물포구', nameEn: 'Jemulpo-gu', aliases: [], region: '인천광역시', coordinatesFrom: '8417655', note: '좌표: 옛 동구(제물포구에 포함)' },
  { id: 'kr-incheon-seohae-gu', nameKo: '서해구', nameEn: 'Seohae-gu', aliases: [], region: '인천광역시', coordinatesFrom: '8417630', note: '좌표: 옛 서구' },
  // 부천시 일반구 (2016 폐지 → 2024-01-01 복원)
  { id: 'kr-bucheon-wonmi-gu', nameKo: '원미구', nameEn: 'Wonmi-gu', aliases: [], region: '경기도 부천시', coordinatesFrom: '8691748', note: '좌표: 원미1동' },
  { id: 'kr-bucheon-sosa-gu', nameKo: '소사구', nameEn: 'Sosa-gu', aliases: [], region: '경기도 부천시', coordinatesFrom: '8691750', note: '좌표: 소사동' },
  { id: 'kr-bucheon-ojeong-gu', nameKo: '오정구', nameEn: 'Ojeong-gu', aliases: [], region: '경기도 부천시', coordinatesFrom: '8617128', note: '좌표: 오정동' },
  // 화성시 일반구 (2026-02-01 신설)
  { id: 'kr-hwaseong-dongtan-gu', nameKo: '동탄구', nameEn: 'Dongtan-gu', aliases: [], region: '경기도 화성시', coordinatesFrom: '8691427', note: '좌표: 동탄1동' },
  { id: 'kr-hwaseong-byeongjeom-gu', nameKo: '병점구', nameEn: 'Byeongjeom-gu', aliases: [], region: '경기도 화성시', coordinatesFrom: '8691433', note: '좌표: 병점1동' },
  { id: 'kr-hwaseong-hyohaeng-gu', nameKo: '효행구', nameEn: 'Hyohaeng-gu', aliases: [], region: '경기도 화성시', coordinatesFrom: '8604923', note: '좌표: 봉담읍' },
  { id: 'kr-hwaseong-manse-gu', nameKo: '만세구', nameEn: 'Manse-gu', aliases: [], region: '경기도 화성시', coordinatesFrom: '8604734', note: '좌표: 화성시(구역 대표 지점을 확인하지 못해 시 좌표)' },
];

/** 포함할 GeoNames 행정구역 단계: 시·도, 시·군·구, 일반구·읍·면·동, 일반구 아래 동 (역사적 구역 *H는 제외) */
export const KR_ADMIN_CODES = new Set(['ADM1', 'ADM2', 'ADM3', 'ADM4']);
