# stardiary (가칭)

서양 점성술을 한국 사용자에게 친근하게 풀어낸 모바일 우선 웹 서비스예요. 개인 포트폴리오 프로젝트입니다.

## 화면

| 단계 | 주소 | 내용 |
|---|---|---|
| 입력 | `/onboarding` | 이름 → 생년월일 → 출생 시간(몰라도 됨) → 출생 도시(전 세계 + 국내 읍·면·동까지 검색) |
| 무료 결과 | `/result` | 태양·달·상승궁 뒤집기 카드, 4원소(불·흙·바람·물) 비율과 코멘트 |
| 무료 정밀 차트 | `/report` | 네이탈 휠 차트(SVG), 행성 10개의 자리, 12하우스, 행성끼리 맺은 각도 |
| 심화 리포트 | `/report/deep` | 주제별 긴 해설(준비 중). 지금은 예시 리포트와 '결제 준비 중' 화면 |

해석 문구는 아직 사람이 검수하기 전의 임시 문구이고, 화면에 그렇게 안내해요.

## 기술

- Next.js 16(App Router) · React 19 · TypeScript · Tailwind CSS v4 · framer-motion
- 행성 계산: [Swiss Ephemeris](https://www.astro.com/swisseph/)(`swisseph-v2`, 서버 Route Handler에서만 실행). 트로피컬 조디악, Placidus 하우스(고위도는 Porphyry → Whole Sign으로 대체)
- 현지 시각 → UTC: Luxon + IANA 타임존(한국 서머타임·UTC+8:30 시기 반영)
- 도시 검색: [GeoNames](https://www.geonames.org) 데이터를 가공한 서버 검색 API(`data/world-cities.geonames.json`, CC BY 4.0)
- 테스트: Vitest

## 실행

```bash
npm install
npm run dev
```

- `swisseph-v2`는 네이티브 모듈이라 설치할 때 C++ 빌드 도구가 필요해요(Windows는 Visual Studio Build Tools의 C++ 데스크톱 개발 + MSVC v143).
- 검사: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`

## 라이선스

- 이 프로젝트의 코드는 [GNU AGPL-3.0](LICENSE)(또는 그 이후 버전)으로 공개해요. Swiss Ephemeris를 AGPL 조건으로 사용하기 때문이에요.
- 도시 데이터: GeoNames, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · 일부 가공
