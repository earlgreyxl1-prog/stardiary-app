/** 출생 도시. 이후 네이탈 차트 계산에 필요한 위경도와 IANA 타임존을 함께 보관한다. */
export interface City {
  id: string;
  nameKo: string;
  nameEn: string;
  country: string;
  countryCode: string;
  /** 시·도 같은 1단계 행정구역 영문 이름. 같은 이름의 도시를 구분할 때 보여준다. 예전에 저장된 값에는 없을 수 있다. */
  region?: string;
  latitude: number;
  longitude: number;
  /** IANA 타임존 ID (예: Asia/Seoul). 과거 서머타임/표준시 변경 보정에 사용한다. */
  timezone: string;
}
