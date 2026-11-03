# CLAUDE.md — 별자리 서비스 (가칭 stardiary)

서양 점성술(Astrology)을 한국 유저 친화적으로 풀어낸 감성 웹/앱 서비스. 바이브코딩으로 개발한다.
너는 10년 차 수석 풀스택 개발자이자 UX 디자이너로서, UX와 안정적인 코드 구조를 함께 고려해 작업한다.

## 서비스 컨셉과 UX 전략 (Progressive Disclosure)

생소한 점성술을 MBTI처럼 친근하고 아기자기하게 제공해 진입장벽을 낮춘 뒤, 깊은 탐구를 원하는 유저에게 정밀 리포트를 제공한다.

1. 1단계 (무료): 귀여운 캐릭터와 카드 뉴스 형태의 핵심 3대 요소(태양/달/상승궁) 요약, 4대 요소(불/흙/바람/물) 분석
2. 2단계 (유료/상세): 네이탈 차트(Wheel Chart), 12개 하우스 해석, 행성 간 각도(Aspect)를 시각화한 정밀 진단 대시보드

## 기술 스택

- Next.js (App Router, `src/` 디렉토리) + React + TypeScript
- Tailwind CSS (create-next-app 기본값 기준, v4면 `@import "tailwindcss"`)
- lucide-react (아이콘), framer-motion (애니메이션)
- 데이터: 초기에는 프론트엔드 Mock Data. 실제 API로 바꿀 때 서비스 함수의 시그니처만 유지하면 되도록 `services/`에 분리해 둔다.

## 디자인 방향

- 톤앤매너: 포스텔러처럼 아기자기한 UI, 밤하늘/별자리 모티프의 은은한 감성
- 인터랙션: 카드 뒤집기, 부드러운 호버 효과, 즉각적인 마이크로 인터랙션 (`prefers-reduced-motion` 존중)
- 모바일 퍼스트 반응형
- 현재 팔레트: 배경 `#14112e → #231b52 → #3a2866`, 포인트 `#ffe9a8`(별빛 노랑) / `#ffc6e0`(핑크) / 에러 `#ffb3c7`
- 안내 캐릭터 이름은 '달토리'(🌙). 말투는 반말 친근체, UI 문구는 해요체. 에러 문구는 사과하지 말고 무엇이 문제이고 어떻게 고치는지 알려준다.

## 개발 규칙 (반드시 지킬 것)

1. **완결성**: `// TODO`, `...` 같은 생략 없이 실행 가능한 전체 코드를 작성한다.
2. **예외 상태**: 비동기 처리에는 로딩(Skeleton UI), 에러(재시도 버튼), 데이터 부재(Empty State) UI를 반드시 구현한다.
3. **타입 엄격화**: TypeScript `any` 금지. Interface/타입으로 명확히 정의한다. 외부 입력(sessionStorage 등)은 `unknown`으로 받아 타입 가드로 좁힌다.
4. **모듈화**: UI 컴포넌트(`components/`)와 비즈니스 로직(Custom Hooks `hooks/`, 순수 함수 `lib/`)을 분리한다.
5. 경로 별칭 `@/*` → `src/*` 를 사용한다.

## ★ 점성술 계산 관련 특별 규칙

네이탈 차트 계산, 행성 좌표 추적, 하우스 구분 등 천문 계산을 프론트엔드 코드만으로 정확히 구현하기 어렵다면, **임의로 그럴듯한 코드를 만들지 말고 즉시 작업을 멈춘다.**
그리고 사용자에게 필요한 수학적/천문학적 공식, 외부 API, 라이브러리(예: Swiss Ephemeris)를 명확히 나열해 질문한다.

- 태양 별자리는 날짜만으로 근사할 수 있지만 경계일(별자리 전환 시각)은 정확한 계산이 필요하다.
- 달 별자리, 상승궁, 하우스, 애스펙트는 천문력(ephemeris)이 필요하므로 아래 "미결정 사항"이 정해지기 전에는 계산 로직을 만들지 않는다.
- 결과 화면 UI는 Mock Data로 먼저 만들 수 있다. 단, 목업임을 코드와 UI에서 분명히 하고, 실제 계산 결과와 같은 인터페이스(타입)를 사용해 나중에 교체만 하면 되게 한다.

## 현재 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx              폰트(Noto Sans KR), 메타데이터, 뷰포트
│  ├─ globals.css             별 반짝임/마스코트 애니메이션
│  ├─ page.tsx                / → /onboarding 리다이렉트
│  └─ onboarding/page.tsx     온보딩 페이지. 제출 시 sessionStorage 저장 후 /result로 이동
├─ components/
│  ├─ ui/                     StarBackground, NumberField, FieldError, inputStyles
│  └─ onboarding/             Mascot, StepIndicator, StepNickname/Date/Time/City, OnboardingForm
├─ hooks/                     useBirthForm(폼 상태/단계/제출), useCitySearch(디바운스 검색)
├─ services/                  cityService(GET /api/geocode 호출. 개발 환경에서 "!error" 검색 시 실패 → 에러 UI 확인용)
├─ lib/                       validators(단계별 검증), birthStorage(sessionStorage + 타입 가드)
├─ mocks/                     chart(결과 목업). 예전 cities(도시 30개)는 GeoNames로 바꾸며 삭제했다
└─ types/                     birth(BirthInput 등), city
```

추가됨: `app/result/`, `components/result/`(PlacementCard, LockedRisingCard, ElementBalance, ResultStates, ResultView), `components/ui/MotionProvider`, `hooks/useChartResult`, `hooks/useSavedBirthInput`, `services/chartService`, `lib/astro/zodiac`(별자리·원소 사전 데이터), `mocks/chart`, `types/astro`(ChartSummary, NatalPositions 등), `app/api/chart/route.ts`, `lib/astro/engine`(서버 전용), `lib/astro/time`, `lib/birthGuards`(타입 가드 + 서버용 범위 검증), `lib/astro/elements`, `lib/astro/houses`, `app/api/geocode/route.ts`, `lib/geo/citySearch`(서버 전용 도시 검색 인덱스), `types/geonames`, `components/onboarding/GeoNamesAttribution`(출처 표기). 프로젝트 루트 `data/world-cities.geonames.json`(GeoNames 가공 데이터, 약 20MB, 생성물). `scripts/`(시뮬레이션·데이터 가공 스크립트), `docs/`(분포 보고서, 작가 안내). 결과 화면 구조(2026-10-18): `lib/summary/buildChartSummary`·`elementTitles`, `lib/content/`(rules·csv·convertContent), `lib/text/korean`(조사), `content/freeStage`(해석 문구, 지금은 AI 초안), `types/content`, `scripts/convert-content.ts`. 유료 리포트(2026-11-03, 브랜치 `feat/paid-report`): `app/report/page.tsx`, `components/report/`(WheelChart, ReportSections, ReportStates, ReportView), `components/result/ReportTeaser`, `hooks/useNatalReport`·`useReportAccess`, `services/reportService`, `lib/astro/aspects`·`bodies`, `lib/report/`(buildReport, reportText, wheel, format), `content/paidStage`.

### 서비스 전체 목표 구조 (1·2단계 포함, `*`는 아직 없음)

```
src/
├─ app/
│  ├─ onboarding/             1단계 입력
│  ├─ result/                 1단계 무료 결과 (카드 뉴스 + 4원소)
│  ├─ report/*                2단계 유료 리포트 (결제 확인 후 접근)
│  │  ├─ page.tsx             대시보드 개요
│  │  ├─ houses/page.tsx      12하우스 해석
│  │  └─ aspects/page.tsx     애스펙트 해석
│  └─ api/                    Route Handler (계산 엔진은 서버 전용)
│     ├─ chart/route.ts       BirthInput → NatalPositions (구현됨)
│     └─ geocode/route.ts     GeoNames 도시 검색 (구현됨)
├─ components/
│  ├─ ui/                     공용 (버튼, 입력, 배경, 모션 설정)
│  ├─ onboarding/
│  ├─ result/
│  └─ report/*                WheelChart(SVG), HouseList, AspectGrid, PaywallGate
├─ hooks/                     useBirthForm, useCitySearch, useChartResult, useNatalChart*
├─ services/                  cityService, chartService, paymentService* — 외부 의존은 여기서만
├─ lib/
│  ├─ astro/                  zodiac(사전 데이터·황경→별자리), engine(계산 어댑터), time(현지→UTC), elements(원소 점수), houses(하우스 판정·인터셉션)
│  ├─ validators.ts
│  └─ birthStorage.ts         (로그인 도입 시 서버 저장으로 교체)
├─ content/*                  해석 문구 (별자리×천체, 하우스, 애스펙트). 코드와 분리해 관리
├─ mocks/
└─ types/                     birth, city, astro (+ NatalChart, House, Aspect*)
```

## 현재 상태

- 완료: 온보딩 입력 폼 (이름 → 생년월일 → 출생 시간 → 출생 도시, 4단계)
  - 출생 시간을 모르면 `hour`/`minute`가 `null`이고 `timeUnknown: true` → 상승궁은 계산 불가로 처리해야 한다.
  - 날짜는 양력 기준. 음력 입력은 지원하지 않는다(안내 문구만 있음).
- 검증 완료 (2026-10-17): `tsc`, `lint`, `build` 통과. Next.js 16 / React 19 / Tailwind v4 기준.
  - `react-hooks/set-state-in-effect` 규칙 때문에 effect 안에서 동기로 setState 하지 않는다. 비동기 결과는 `{ key, ... }` 형태로 저장하고, 현재 요청 key와 비교해 로딩 상태를 파생한다(`useCitySearch`, `useChartResult` 참고).
- 완료: `/result` 무료 결과 페이지 (**Mock Data**)
  - `useChartResult` → sessionStorage를 `useSyncExternalStore`로 읽고 `chartService.getChartSummary()` 호출
  - 상태: 로딩(Skeleton) / 빈 상태(온보딩으로) / 에러(재시도) / 성공. 닉네임을 `!error`로 입력하면 에러 UI를 확인할 수 있다.
  - 태양/달/상승궁 뒤집기 카드, 4원소 막대, `timeUnknown`이면 상승궁 잠금 카드
  - 레이아웃은 세로로 쌓인 카드로 확정했다(2026-10-17 사용자 결정). 좌우 스와이프 카드 뉴스로 바꾸지 않는다.
  - 결과 값은 입력과 무관한 고정 목업(`mocks/chart.ts`)이고, 화면 상단에 "미리보기용 예시 결과" 안내가 뜬다(`source: 'mock'`).
- 완료 (2026-10-18): **결과 화면 구조** — 작가 납품 즉시 실제 계산으로 바꿀 수 있게 준비했다.
  - `ChartSummary` = `source` + `contentOrigin`('ai-draft' | 'writer') + 태양/달/상승궁 `Placement`(별자리·도수 + 해석 문구) + `elements: ElementSummary`(`percentages`, `view`, `excluded`). 예전 `elementComment`(문자열 하나)·`dominantElement`는 없앴다.
  - `ElementSummaryView`: `{ kind: 'balanced', text }` 또는 `{ kind: 'leaning', strong: { elements, comment }, lacking: [{ element, text }…] }`. `toElementSummaryView`가 `commentPlan`에 문구를 채운다.
  - 조립은 한 곳: `buildChartSummary({ source, bigThree, balance, content })`. 목업도 실제 계산과 같은 경로(`computeElementBalanceFromSigns` → `buildChartSummary`)를 지난다. 실제 연결 때는 `/api/chart`의 `positions`(태양·달·상승궁)와 `elementBalance`를 넘기기만 하면 된다.
  - 원소 UI(`ElementBalance`): 제목은 서비스 템플릿(`elementTitles`, 조사는 `lib/text/korean`) — "가장 강한 원소는 💧 물이에요" / "🔥 불과 🌿 흙이 똑같이 강해요" / "🌿 흙, 🍃 바람과 💧 물이 적은 편이에요" / "네 원소가 고르게 섞여 있어요". 적은 편 코멘트는 차례로 이어 붙인다. 시간 모름이면 "상승궁과 천정(MC)은 빼고 계산했어요" 안내 + `/onboarding?step=time` 링크.
  - 상단 안내(`PreviewNotice`): 목업이면 "미리보기용 예시 결과", 실제 계산이지만 문구가 AI 초안이면 "해석 문구는 검수 전 임시 문구". 둘 다 아니면 숨는다.
  - **목업 장면 (개발용 닉네임)**: `!balanced`(균형형), `!tie`(불·흙 동점, 태양이 있는 흙 코멘트, 물 적음), `!lacking0`(적은 편 없음), `!lacking3`(적은 편 3개), 그 밖은 기본(물 강함·바람 적음). 출생 시간 모름으로 입력하면 상승궁·MC를 빼고 계산한다. `!error`는 그대로 에러 화면.
  - 브라우저 확인(375px): 다섯 장면 + 시간 모름 모두 의도대로, 가로 넘침·콘솔 오류 없음. AI 초안의 적은 편 코멘트가 제목("○○이 적은 편이에요")을 되풀이해 이어 붙이면 반복처럼 보이는 문제를 찾아 작가 안내(`docs/content-brief-elements.md`)에 "제목과 겹치지 않게"를 추가했다.
- 완료 (2026-11-03, `feat/paid-report`): **2단계 유료 리포트 `/report`** — 실제 계산(`/api/chart`) 결과를 보여준다. 결제·로그인은 아직 없다(사용자 결정: 잠금 화면만).
  - 진입: `/result` 맨 아래 `ReportTeaser` 카드 → `/report`. 상태: 로딩(Skeleton) / 빈 상태(입력 없음) / 잠금 / 에러(재시도·다시 입력) / 성공.
  - 잠금(`ReportPaywall`): 포함 항목 4개 + 비활성 버튼 "정밀 리포트 열기 / 결제 기능을 준비하고 있어요". **개발 환경에서만** "개발용 잠금 해제" 버튼이 보인다(`REPORT_DEV_UNLOCK_AVAILABLE = NODE_ENV !== 'production'`, sessionStorage `stardiary:report-dev-unlocked:v1`). 리포트 하단 "개발용: 다시 잠그기"로 되돌린다. 잠금은 클라이언트 화면 처리일 뿐이고 `/api/chart`는 누구나 호출할 수 있다 — 결제를 붙일 때 서버에서 권한을 확인해야 한다.
  - `useNatalReport`: 잠금이 풀렸을 때만 `reportService.getNatalReport()`(→ `/api/chart` → 응답 타입 가드 → `buildNatalReport`) 호출. settled-key 패턴 + AbortController.
  - 화면 순서: 머리(ASC·MC 도수) → AI 초안 안내 → 시간 모름 안내(+ `/onboarding?step=time`) → 휠 차트 → 행성 10개(별자리·도수·하우스·역행·문구, 시간 모름이면 그날 별자리가 바뀐 천체에 안내) → 12하우스(시작선·들어 있는 행성·인터셉션, Porphyry/Whole Sign 대체 배지, 시간 모름이면 잠금 안내) → 애스펙트(정확도 순 상위 8개 + "모두 보기").
  - 휠 차트(`WheelChart`, SVG): ASC를 왼쪽(9시)에 두고 황경이 반시계로 커진다(`wheelAngle`). 시간 모름이면 양자리 0°를 왼쪽에 둔다. 별자리 띠는 원소 색, 각 하우스(1·4·7·10) 시작선 강조, 애스펙트 선은 조화(파랑)·긴장(분홍 점선)·합(노랑)이고 정확할수록 진하다. 천체 기호는 `spreadLongitudes`로 9° 이상 벌려 겹치지 않게 하고 실제 위치는 눈금으로 표시. viewBox에 여백(PAD 16)을 둬 ASC·MC 글자가 잘리지 않게 했다.
  - 문구: `content/paidStage.ts`(`PaidStageContent`, origin `'ai-draft'`) — **키워드 조합 AI 가안**(사용자 결정). 천체 테마 10 + 별자리 결 12 + 하우스 영역 12 + 애스펙트 5종 문장 틀. 행성: "{테마}이/가 {결} 드러나요. 특히 {영역}에서 그 기운이 잘 느껴져요."(시간 모름이면 둘째 문장 없음). 애스펙트: `{a|과/와} {b|이/가}` 조사 자리표시자(`fillTemplate`). 무료 단계와 마찬가지로 사용자가 나중에 고친다. 변환 스크립트·엑셀은 아직 없다.
  - 브라우저 확인(375px): 서울 1995-08-23 06:40, 같은 날 시간 모름, 트롬쇠 1990-06-21 14:00(Porphyry 배지) — 가로 넘침·콘솔 오류 없음, "모두 보기/접기" 동작.
  - 차트 파워(10번)는 이번에 넣지 않았다(사용자 결정).
- 완료: `/onboarding` 재방문 시 저장된 값으로 폼을 채운다. `?step=time`처럼 단계를 지정해 들어올 수 있다(상승궁 잠금 카드의 링크가 사용). URL 해시는 클라이언트 이동 시 첫 렌더 뒤에 반영되므로 쓰지 않는다.
- `prefers-reduced-motion`: CSS 애니메이션은 `globals.css`, framer-motion은 `MotionProvider`(`MotionConfig reducedMotion="user"`)가 처리한다.
- 완료 (2026-10-17): **계산 어댑터 + `POST /api/chart`** (Swiss Ephemeris). 아직 결과 화면에는 연결하지 않았다(미결정 7·8 보류 중).
  - 응답: `ChartApiResponse { positions: NatalPositions, elementBalance: ElementBalance }`. `positions.houses`에 12하우스 시작선, 천체별 하우스, 인터셉션이 들어 있다(시간 모름이면 null).
  - 하우스 검증: 서울 일출 직후 태양 12하우스·정오 10하우스·자정 4하우스, 트롬쇠(69.6°N)·66.3°N·남극(-77.8°) Porphyry 대체, 레이캬비크(64.1°N) Placidus 인터셉션, 사용자 예시(양 25°→쌍둥이 2° ⇒ 황소 1하우스 포획, 반대편 전갈 7하우스 포획) 확인.
  - (수정됨) 이전에는 ASC를 Placidus로만 구해서 위도 약 69° 이상 출생자는 500 오류가 났다.
  - 흐름: `BirthInput` → `findBirthInputProblem`(서버 재검증) → `localToUtc`(Luxon, IANA) → `swe_utc_to_jd` → `swe_calc_ut`(10천체, 트로피컬, 지구 중심) + `swe_houses`(ASC·MC) → `NatalPositions`
  - 시간 모름: 천체는 현지 정오 기준(7번 결정), `angles`는 null, 그날 0:00~23:59 사이에 별자리가 바뀌는 천체는 `ambiguousSigns`에 담는다.
  - 존재하지 않는 시각(서머타임 시작으로 건너뛴 시각)은 한 시간 뒤로 밀린다. 1987-05-10 02:30 서울 → 03:30 KDT.
  - 검증: 서울(서머타임·UTC+8:30 포함)/뉴욕/시드니/레이캬비크 5건을 독립 공식(Meeus 태양, GMST + 상승궁 공식)과 비교해 태양·ASC·MC 오차 0.015° 이하. 2000-03-20(춘분일) 시간 모름 → 태양 물고기→양 모호 표시 확인. 운영 빌드(`next start`)에서도 동일 결과.
  - `next.config.ts`: `serverExternalPackages: ["swisseph-v2"]`(네이티브 모듈 번들 금지), `/api/chart`에 `ephe/` 데이터 파일 포함.
- Windows에서 `swisseph-v2` 설치 조건 (재설치·다른 PC 세팅 시):
  - `package.json`의 `overrides`로 node-gyp를 12.4 이상으로 올려 둔다(패키지 기본 node-gyp 10은 VS 2026을 못 찾는다).
  - 패키지가 VS 2022 툴셋(`v143`)을 고정해 쓰므로, Build Tools 2026에 **MSVC v143 개별 구성 요소**도 설치돼 있어야 한다.

## 저장소 (git)

- 2026-10-17 시작. 첫 커밋 `4e2d492`(main). 원격 저장소는 아직 없다(GitHub 등에 올릴지 미정).
- 커밋 작성자는 이 저장소에만 설정했다(`git config user.name earlgreyxl1`, `user.email (개인 메일)`). 전역 git 설정은 건드리지 않았다.
- 작업은 브랜치에서 하고 main에 합친다. 커밋·푸시는 사용자가 요청할 때만 한다.
- 포함하는 것: 소스, `scripts/`, `docs/`, `.claude/launch.json`, 생성 데이터 `data/world-cities.geonames.json`(약 23MB, 사용자 결정: 배포·다른 PC에서 바로 동작하도록 커밋). 데이터를 다시 만들 때마다 저장소가 약 23MB씩 커지므로 자주 다시 만들지 않는다.
- 빼는 것(`.gitignore`): `node_modules`, `.next`, `.env*`, `*.pem`, `*.tsbuildinfo`, `next-env.d.ts`, `/.claude/settings.local.json`(개인 권한 설정).
- `.gitattributes`: 줄바꿈을 LF로 통일한다. 생성 데이터(`data/*.json`, `docs/element-distribution.json`)는 diff로 보여 주지 않는다.
- `AGENTS.md`는 `next dev`가 다시 써 넣는 파일이다. 내용이 바뀌어도 그대로 커밋한다.
- `src/content/freeStage.ts`(+ `src/types/content.ts`)는 무료 단계 해석 문구다. 지금은 **AI 가안 v2**(`origin: 'ai-draft'`). 사용자가 `docs/content/free-stage-draft.xlsx`를 고쳐 변환하면 `origin: 'reviewed'`로 바뀐다. 편집 엑셀(.xlsx)도 커밋한다.

## 단위 테스트 (Vitest, 2026-10-18)

- 실행: `npm test`(한 번) / `npm run test:watch`(감시). 설정은 `vitest.config.mts`: `@/` 별칭, `server-only`를 빈 모듈(`test/stubs/server-only.ts`)로 바꿔 서버 코드를 Node에서 직접 테스트한다. 테스트 파일은 `src/**/*.test.ts`(대상 파일 옆).
- `@types/node`를 ^24로 올렸다(vitest 5가 22 이상을 요구, 실제 Node도 24).
- 범위 (398개, 결과 화면 구조 작업으로 35개, 유료 리포트로 24개 추가):
  - `lib/astro/aspects.test.ts` — 각도 거리(0/360 경계), 종류별 orb와 해·달 가산 경계값, 한 쌍에 하나만, 정렬, 실제 차트
  - `lib/report/report.test.ts` — 조사 자리표시자, 모든 천체×별자리×하우스·애스펙트 문구 조립(빈 자리표시자 없음), 시간 앎/모름/트롬쇠 리포트, 휠 각도·기호 벌리기
  - `lib/astro/elements.test.ts` — 가중치표, 사용자 예시 차트(15.5점), 시간 모름(12점), 정수 %·동점, 코멘트 규칙(균형형·강한 편 동점 양방향·적은 편 없음/0점 동점/한 원소 100%·정확한 비율 비교)
  - `lib/astro/houses.test.ts` — 하우스 판정(0° 경계·시작선), 인터셉션(사용자 예시), 엔진 통합(Placidus, 일출·정오·자정 태양 하우스, 트롬쇠·남극 Porphyry, 시간 모름 null), 위치 회귀(서울 1995 태양·ASC, 춘분일 ambiguousSigns, 수성 역행)
  - `lib/astro/time.test.ts` — 한국 UTC+9 / 서머타임 +10 / +8:30, 없는 시각 보정, 뉴욕·시드니·카트만두(+5:45), 잘못된 타임존 오류 문구
  - `lib/geo/citySearch.test.ts` — 정규화, 순위 규칙(작은 가짜 데이터), 실제 데이터 검색(서울·파리·트롬쇠·용인시·중구·신설 구·읍면동·옛 지명), 국내 항목 한글 이름·타임존
  - `lib/summary/buildChartSummary.test.ts` — 목업 장면별 상태, 문구 조립, 시간 모름, 제목 템플릿(조사 포함), `getChartSummary`(가짜 타이머)
  - `lib/content/convertContent.test.ts` — CSV(따옴표·줄바꿈·BOM), 시트 → 문구 왕복(원본과 동일), 영문 머리글·키워드 3칸, AI 행 거부, 누락·알 수 없는·중복 키, 글자 수·키워드 수·제목 금지어, 지금 문구(AI 초안)가 규칙 오류 0
  - `lib/text/korean.test.ts` — 받침 판별, 조사, 'A, B와 C' 잇기
  - `lib/geo/koreaCoverage.test.ts` — **국내 행정구역 전수 회귀**: 시·군·구 230 + 일반구 39 + 시·도 17을 실제 데이터로 검색. 도시 데이터를 다시 만들면 반드시 돌린다. 행정구역이 바뀌면 이 파일의 목록도 고친다.
- 테스트가 잡는지 확인: 수성 가중치 1.5 → 1, Placidus 한계 66° → 70°로 바꾸면 각각 실패하는 것을 확인했다.
- 엔진(swisseph)·도시 데이터를 직접 읽는 통합 테스트라 `node_modules`의 swisseph 빌드와 `data/world-cities.geonames.json`이 있어야 한다.

## 검증 절차 (변경 후 매번)

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm test` (Vitest, 약 3초. 아래 '단위 테스트' 참고)
4. `npm run build` (`next/font/google`이 빌드 때 Google Fonts에 접속하므로 네트워크가 필요하다)
5. `npm run dev` 후 모바일 폭에서 직접 확인한다. dev 서버는 프로젝트당 하나만 뜬다.
   - `/onboarding`: 이름 → 날짜(자동 포커스 이동) → 시간("몰라요" 체크 포함) → 도시 검색(로딩/결과 없음/`!error` 에러+재시도, 출처 표기 보임)
   - 도시 검색 API를 터미널에서 확인할 때 Windows Git Bash의 curl은 한글 인자를 UTF-8로 보내지 않아 400/빈 결과가 난다. `node`의 `fetch` + `encodeURIComponent`로 확인한다.
   - `/result`: 로딩 → 카드 뒤집기, 시간 모름이면 상승궁 잠금, 닉네임 `!error`면 에러+재시도, 저장값 없으면 빈 상태

## 미결정 사항 (사용자 결정 필요 — 결정 전에는 해당 계산 로직 작성 금지)

1. ✅ **행성 계산 엔진 (2026-10-17 결정)**: `swisseph-v2`(Swiss Ephemeris의 Node 네이티브 바인딩)를 서버(Route Handler)에서만 쓴다. 브라우저 번들에 넣지 않는다.
   - 네이티브 모듈이라 Windows 로컬 개발에는 Visual Studio Build Tools(C++ 데스크톱 개발)가 필요하다.
   - 라이선스: AGPL 또는 상용. 유료 서비스로 공개하기 전에 상용 라이선스 구매 또는 소스 공개 중 하나를 정해야 한다(미결).
   - 시간 변환은 `luxon`(설치됨)으로 현지 시각 → UTC를 구한 뒤 Swiss Ephemeris에 넘긴다.
   - `swisseph-v2` 패키지 코드 자체는 GPL v2다. 위 Swiss Ephemeris 라이선스 결정 때 같이 확인한다.
   - **라이선스 결정 기준 (2026-10-17 정리, 미결 유지)**: Astrodienst 안내 페이지(https://www.astro.com/swisseph/swephinfo_e.htm)는 라이선스를 "공개 서비스를 시작하기 전에" 골라야 한다고 적고 있다. 개발 중인 지금은 막지 않고, **공개 베타/출시 전까지의 게이트**로 둔다.
     - A. AGPL 채택: 프로젝트 전체를 AGPL(또는 호환 라이선스)로 공개해야 한다고 안내 페이지에 적혀 있다.
     - B. 상용(Professional) 라이선스: Astrodienst와 계약한다. 가격·적용 범위는 안내 페이지에 없어 확인하지 못했다 → 구매 페이지 또는 order@astro.com에서 확인한다.
     - C. MIT 라이선스 라이브러리로 교체: `astronomy-engine`(MIT, 태양~명왕성, 정확도 ±1 arcminute ≈ 0.017°). 트로피컬 황경 변환 지원 여부와 상승궁·하우스 계산은 확인하지 못했으므로 직접 구현·검증이 필요하다. 별자리 경계 근처 오차를 기존 검증 기준(0.015°)과 비교해 본다.
     - 지금 할 일: 개발은 계속한다. 계산을 `lib/astro/engine` 어댑터 뒤에 가둔 구조를 유지하고, Swiss Ephemeris 타입이 어댑터 밖으로 새지 않게 한다. 상용 라이선스 가격 문의 메일을 미리 보낸다.
     - 이 정리는 법률 자문이 아니다. 출시 전에 라이선스 해석을 직접 확인한다.
2. ✅ **도시 검색 / 지오코딩 (2026-10-17 결정)**: 외부 지오코딩 API 대신 **GeoNames 정적 데이터 + 서버 검색 API** (`GET /api/geocode?q=`).
   - 데이터: `data/world-cities.geonames.json` (약 23MB, 242,892행) — GeoNames cities500(인구 500명 이상 또는 행정 중심지) 236,278개 도시 + 국내 행정구역. 246개 국가·지역, 394개 IANA 타임존(전부 Luxon에서 열림), 위도 54.9°S~78.2°N. 행마다 `kind`(city / admin / extra). 만드는 법(원본 다운로드 포함)은 `scripts/build-world-cities.ts` 머리말(`--kr KR.txt` 필수). 생성물이라 저장소에 넣을지는 git을 붙일 때 정한다.
   - 한글 이름: alternateNamesV2의 ko 이름 중 한글로만 된 것을 대표 이름 후보로 쓴다(ko로 태그된 한자 大邱·로마자 Taegu는 별칭으로만). 대표 이름은 GeoNames 선호 이름을 쓰되 행정 접미사를 뗀 이름이 있으면 그쪽(서울특별시 → 서울), 띄어 쓴 ' 시'는 뗀다(오사카 시 → 오사카), 선호 이름이 없으면 가장 짧은 이름. 나머지는 검색용 별칭(서울특별시·서울시, 엘에이·로스엔젤레스, 동경, 북경). 역사적 이름(한양·경성)은 대표 이름에서 빼고 검색 별칭으로만 둔다(경성 → 서울). 한글 이름이 있는 항목은 약 14,600개이고 나머지 해외 도시는 영문으로 검색·표시한다. 국가 한글명은 Intl.DisplayNames('ko').
   - **국내 행정구역 전수 (2026-10-17, 사용자 요청 "대한민국 도시는 빼놓지 않고")**: GeoNames 한국 전체 덤프(KR.zip)의 행정구역 시·도(ADM1)·시·군·구(ADM2)·일반구·읍·면·동(ADM3)·일반구 아래 동(ADM4)을 모두 넣었다. 국내 6,927개 항목(이전 312개), 한글 이름 없는 항목 0개.
     - 대조 검증: 한국어 위키백과 '대한민국의 기초자치단체 목록'(2026-07-01, 시 75·군 82·구 70 = 227) + 제주 행정시 2 + 세종 + '대한민국의 구 목록'의 일반구 39(2026-02-01) = 269곳을 한글 이름·상위 행정구역으로 대조해 **누락 0**.
     - GeoNames에 없던 곳은 `scripts/data/kr-supplement.ts`에서 채웠다: 인천 개편 자치구 4(검단·영종·제물포·서해구, 2026-07-01), 부천 일반구 3(원미·소사·오정구, 2024 복원), 화성 일반구 4(동탄·병점·효행·만세구, 2026 신설). 좌표는 손으로 적지 않고 같은 구역 안 GeoNames 지점에서 빌렸다(예: 동탄구 ← 동탄1동). 만세구만 대표 지점을 확인하지 못해 화성시 좌표다.
     - 한글 이름이 없던 47곳(일반구 17, 세종, 계양구, 행정동 29)은 같은 파일의 `KR_NAME_OVERRIDES`로 채웠다. 종로구의 'Jongno-dong' 2곳은 어느 행정동인지 가릴 수 없어 '종로동'으로 뒀다.
     - 옛 이름 검색(`KR_HISTORIC_ALIASES`): 마산·진해 → 창원 마산합포·마산회원·진해구, 충무 → 통영, 이리 → 익산, 온양 → 아산, 삼천포 → 사천, 장승포 → 거제, 여천 → 여수, 동광양 → 광양, 점촌 → 문경, 송정 → 광산구, 영일 → 포항, 청원군 → 청주 등 23개. 인천 '남구'(2018 미추홀구로 개칭)도 포함.
     - 같은 곳 병합: cities500 도시와 행정구역이 같은 곳이면 하나로 합친다(서울특별시 ↔ 서울, 용인시, 거제시). 시·도는 특별시·광역시·특별자치시가 같은 이름의 도시일 때만(도·특별자치도는 같은 이름의 시보다 넓어서 따로 둔다: 제주특별자치도 ≠ 제주시 — 단위 테스트가 찾아내 2026-10-18 수정), 시·군·구는 시/군/구 접미사만 뗀 이름이 같고 같은 코드이거나 10km 이내일 때, 한글 이름 없는 도시는 같은 시·군·구 안 10km 이내이고 로마자 이름이 거의 같을 때(Naeso ≈ Naeseo-eup → 내서읍)만 합친다. 군과 그 읍(영월군/영월읍)은 다른 행정구역이라 따로 둔다. 그래도 한글 이름이 없는 국내 도시 10곳(Eisen=영천, Nangen=남원, Kyosai=거제 같은 일제강점기 독음 등)은 같은 곳의 행정구역 항목이 있어 뺐다.
     - 국내 항목의 둘째 줄은 한글 경로(경기도 성남시 분당구)이고 로마자 표기는 보이지 않는다. 시·도는 현재 공식 이름(제주특별자치도, 강원특별자치도, 전북특별자치도). 군위군(2023년 대구 편입)·전남·광주(위키백과는 2026-07-01 통합특별시로 표기)는 GeoNames의 예전 소속으로 나온다. 출생 당시 소속과 맞는 경우가 많아 그대로 둔다.
     - 시뮬레이션: 행정구역(kind admin/extra)은 도시 인구와 겹치므로 인구 비례 추출에서 가중치 0. 국내 데이터 보강 후 다시 돌린 결과는 이전과 0.1%p 이내로 같다.
   - 검색(`lib/geo/citySearch.ts`, 서버 전용): 첫 요청 때 파일을 읽어 메모리 인덱스를 만든다(약 1초). 이후 요청 16~40ms. 데이터 파일의 수정 시각이 바뀌면 다음 요청 때 다시 읽는다(서버를 다시 켜지 않아도 됨). 소문자·악센트 제거·공백 무시로 비교(São Paulo = sao paulo, '뉴 욕' = 뉴욕). 순위: 완전 일치 > 앞부분 일치 > 중간 포함(2자 이상) → 같은 순위는 인구 많은 순. 최대 8개, 검색어 50자 제한.
   - 캐시 (2026-10-17 수정): `Cache-Control: no-cache` + 데이터 판본(generatedAt)이 들어간 ETag. 브라우저는 매번 확인하고, 바뀌지 않았으면 304로 끝난다. **예전에는 `max-age=86400`(하루)이라, 국내 행정구역을 보강한 뒤에도 브라우저가 옛 '결과 없음'(용인·용인시 등)을 계속 보여 줬다.** 그 캐시를 피하려고 클라이언트 요청 주소에 `&v=2`(`GEOCODE_API_VERSION`)를 붙였다. 캐시 정책을 다시 바꾸면 이 값을 올린다.
   - 시·군과 시·도도 검색된다: 공식 목록의 시·군·구 230곳과 시·도 17곳을 이름 그대로 / 접미사 뺀 이름(용인시 / 용인, 경기도 / 경기)으로 검색해 모두 그 행정구역이 결과에 나오는 것을 확인했다(한 글자 검색어 '중'·'동'처럼 결과 8개 안에 다 못 드는 경우만 예외).
   - 화면: 결과마다 둘째 줄에 (해외) 영문 이름 · 지역 · 국가 / (국내) 한글 행정 경로 · 대한민국을 보여 동명 도시를 구분한다(중구 서울특별시 / 중구 인천광역시). `City.region`(선택 필드) 추가. 예전 형식(region 없음)으로 저장된 값도 그대로 읽힌다. 인구가 같으면(국내 읍·면·동은 대부분 0) 이름이 짧은 쪽부터 보여준다.
   - **출처 표기(CC BY 4.0 필수)**: 도시 단계 하단에 "도시 정보: GeoNames · CC BY 4.0 · 일부 가공해 사용해요"(`GeoNamesAttribution`, geonames.org와 라이선스 링크). 도시 데이터를 다른 화면에 보여주게 되면 그곳에도 붙인다.
   - `!error` 실패 응답은 개발 환경에서만 동작한다(운영에서는 빈 결과).
   - 배포: `next.config.ts`의 `outputFileTracingIncludes`에 데이터 파일을 넣어 서버리스에서도 읽히게 했다. 운영 빌드(`next start`)에서 검색 확인.
   - 한계: 국내는 읍·면·동까지 있고 리(里) 단위 마을은 없다(읍·면 이름으로 찾으면 된다). 해외는 인구 500명 미만 마을이 없다(가까운 시·군으로 검색하라고 안내 문구를 넣었다). 해외 도시 한글 별칭은 GeoNames 기여 수준이라 빠진 표기가 있을 수 있다. 행정구역 개편은 GeoNames 갱신 시점에 따라 늦게 반영되므로, 데이터를 다시 만들 때 위키백과 목록과 다시 대조한다(대조 스크립트는 남겨 두지 않았으니 필요하면 다시 만든다).
3. ✅ **현지 시각 → UTC 변환**: Luxon + IANA 타임존 DB로 구현했다(`lib/astro/time.ts`). 한국 서머타임(1948~51, 1955~60, 1987~88년)과 UTC+8:30(1954~61년)이 반영되는 것을 확인했다. 단, 1908년 이전 같은 지방 평균시(LMT) 시기는 IANA가 도시별이 아니라 타임존 대표 도시 기준이라 오차가 있을 수 있다(현재 입력은 1900년 이후만 받음).
4. ✅ **하우스 시스템 (2026-10-17 결정)**: **Placidus** 기본. 위도 ±66° 초과면 처음부터 **Porphyry**, 그 안쪽이라도 Placidus 계산이 실패하면 Porphyry → **Whole Sign** 순으로 대체 (`lib/astro/houses.ts`, `engine.ts`의 `calcHouses`).
   - Swiss Ephemeris는 Placidus가 안 되는 위도(약 69° 부근부터)에서 스스로 대체하지 않고 오류만 돌려준다. 그래서 대체 순서를 직접 구현했다.
   - 응답의 `houses.system`과 `fallbackReason`('high-latitude' | 'calculation-failed')으로 대체 여부를 알 수 있다. 유료 리포트에 대체 안내 배지를 띄울 것.
   - 인터셉션(`intercepted`: 시작선이 없는 별자리와 그 별자리를 품은 하우스)과 중복 시작선(`duplicated`)을 계산해 둔다. Porphyry에서도 생길 수 있다. 고위도에서는 한 별자리가 시작선 3개를 차지하기도 하며, 그때는 `duplicated`에 연속된 쌍이 두 개 들어간다.
   - 인터셉션·하우스 해석 문구는 8번(콘텐츠, 보류)에 속한다.
5. ✅ **4원소 비율 계산법 (2026-10-17 결정, 같은 날 가중치 교체)**: **Kerykeion v6 기본 가중치**를 우리가 계산하는 12개 지점에 적용한다 (`lib/astro/elements.ts`).
   - 근거: Kerykeion 6.0.5 소스 `kerykeion/charts/utils.py`의 `DEFAULT_WEIGHTED_POINT_WEIGHTS`를 직접 확인했다(문서: kerykeion.net의 element_quality_distribution). Kerykeion은 AGPL-3.0이라 숫자만 참고하고 코드는 옮기지 않았다.
   - 태양·달·상승궁 2점 / 수성·금성·화성·MC 1.5점 / 목성·토성 1점 / 천왕성·해왕성·명왕성 0.5점 → 총 15.5점. 원소 비율 = 원소 점수 ÷ 총점.
   - Kerykeion v6 기본 활성 지점과의 차이: 우리는 True North Node(0.5)와 Chiron(0.6)을 넣지 않는다. 그래서 Kerykeion 기본 출력과 숫자가 완전히 같지는 않다.
   - 이전 기준(13.5점 체계, 개인 행성·MC 1점)은 "Astro.com/Pullen 표준"으로 전달받았지만 자료 작성자가 수치를 임의로 합성했다고 정정해서 폐기했다. UI·마케팅 문구에 "Astro.com과 같은 계산" 같은 표현을 쓰지 않는다.
   - 출생 시간 모름: 상승궁·MC를 빼고 남은 12점으로 계산한다(`excluded`에 표시). 천체 별자리는 정오 기준.
   - **원소 코멘트 규칙 (2026-10-17 결정, `ELEMENT_COMMENT_RULES`·`planElementComments`, 응답의 `elementBalance.commentPlan`)**: 외부 표준이 아니라 **서비스 자체 기준**이다. 근거는 실제 엔진으로 돌린 분포 시뮬레이션(`docs/element-distribution.md`). 이전의 "과다/부족 같은 숫자 기준은 쓰지 않는다"는 이 결정으로 대체됐다. UI·마케팅에서 "표준"이라고 표현하지 않는다.
     - 균형형: 네 원소가 모두 15% 이상 35% 이하 → 균형형 코멘트 하나만 보여준다(강한 편·적은 편 생략). 약 9%.
     - 강한 편: 점수가 가장 높은 원소. 동점이면 제목에 모두 쓰고("불과 흙이 똑같이 강해요"), 코멘트는 가장 무거운 지점을 가진 원소 것 하나만. 무거운 지점 순서(`POINT_PRIORITY`): 태양 > 달 > 상승궁 > 수성 > 금성 > 화성 > MC > 목성 > 토성 > 천왕성 > 해왕성 > 명왕성. `dominant`도 같은 규칙으로 정한다(예전에는 불·흙·바람·물 고정 순서였다).
     - 적은 편: 가장 낮은 원소가 15% 미만일 때만 보여준다(약 75~85%). 동점이면 모두 제목에 쓰고 각 원소의 '적은 편' 코멘트를 이어 붙인다(0점끼리 동점이 많아 가를 근거가 없다).
     - 비교는 표시용 정수 %가 아니라 정확한 비율(점수 ÷ 총점)로 한다. 비율이 계단식이라 실제 균형형 범위는 16.1~32.3%(시간 앎) / 16.7~33.3%(모름)이다.
     - 검증: 라이브러리 구현으로 시뮬레이션을 다시 돌려 제안 단계 결과와 24만 건 모두 일치, 강한 편 동점 해소 실패 0건. 경계 사례(균형형, 동점 양방향, 0점 2개 동점, 한 원소 100%, 적은 편 없음) 확인.
   - 표시용 정수 %는 최대 잔여법. 동점 원소는 같은 %로 맞추므로 합이 99일 수 있다.
   - 검증: 예시 차트(사자 태양·게 달·황소 ASC 등) → 15.5점, 불 5·흙 6.5·바람 1.5·물 2.5 (32·42·10·16%) 수기 계산과 일치. 서울 1995-08-23 06:40 실제 차트도 API 결과와 수기 계산 일치.
   - **원소 비율(모듈 A)에는 품계·하우스·애스펙트 보정을 넣지 않는다 (2026-10-17 확정).** 설명 가능성과 결과 안정성을 위해서다.
6. ✅ **애스펙트 기준 (2026-10-17 결정)**: 메이저 5개만 쓴다. orb는 **서비스 기본 설정**이며, `lib/astro/aspects.ts`의 설정 객체 한 곳에서만 정의해 코드 수정 없이 바꿀 수 있게 한다.
   - 합(0°): 기본 8° / 태양·달 포함 시 10°
   - 대립(180°): 기본 8° / 태양·달 포함 시 9°
   - 삼각(120°): 기본 7° / 태양·달 포함 시 8°
   - 직각(90°): 기본 7° / 태양·달 포함 시 8°
   - 육각(60°): 기본 5° / 태양·달 포함 시 6°
   - 두 천체 중 하나라도 태양 또는 달이면 "태양·달 포함 시" 값을 쓴다(합 +2°, 나머지 +1°). 천체별 개별 orb는 두지 않는다.
   - 마이너 각도(30°·45°·135°·150° 등)는 넣지 않는다. 필요해지면 설정에 추가한다.
   - 근거: 각도는 Wikipedia·Kerykeion과 일치한다. orb 숫자는 표준이 없고(여러 출처가 "단일 표준 없음"이라고 설명), 위 값은 Augurine·Wikipedia가 제시하는 범위 안의 조합이다. 해·달 가산(+1~2°)의 구체 수치는 어느 출처에도 없는 서비스 규칙이므로 UI·마케팅에서 "표준"이라고 표현하지 않는다. orb는 천문 계산이 아니라 점성술 해석상의 임계값이다.
   - 시뮬레이션(10천체 무작위 황경 가정): 이 표는 한 차트당 평균 약 14~15개 애스펙트가 잡힌다. 촘촘한 세트(합8·충8·삼각6·직각6·육각4)는 약 12개로 차이가 작다. 화면에서는 오차가 작은 순(정확도 순)으로 정렬해 상위 N개만 보여준다.
   - 각도 판정은 천문력 없이 두 황경의 차이로 하는 순수 함수다. 황경 입력은 `NatalPositions`에서 받는다.
   - ✅ 구현 (2026-11-03): `lib/astro/aspects.ts`의 `ASPECT_DEFINITIONS`(위 표), `findAspects`(10천체 쌍, 한 쌍에 가장 정확한 각도 하나, 오차 작은 순). `/api/chart` 응답에 `aspects: Aspect[]`(a, b, type, separation, deviation, orb)를 더했다. 상승궁·MC와의 애스펙트는 넣지 않았다.
7. ✅ **출생 시간을 모를 때 (2026-10-17 결정)**: **현지 정오 기준**으로 계산한 별자리 하나를 보여준다. 달·태양이 그날 별자리를 바꿔도 "두 별자리 중 하나"로 보여주지 않는다.
   - 엔진은 이미 정오 기준으로 계산한다(`UNKNOWN_TIME_HOUR = 12`). 원소 비율도 이 위치로 계산하고, 상승궁·MC는 뺀다(5번).
   - `ambiguousSigns`(그날 별자리가 바뀐 천체)는 계속 응답에 담는다. 지금 화면에서는 쓰지 않지만, 나중에 "출생 시간을 알면 달 별자리가 달라질 수 있어요" 같은 안내를 붙일 때 쓸 수 있다.
8. 🔶 **(진행 중)** **해석 문구(콘텐츠)**: 12별자리×천체, 12하우스, 애스펙트 해석을 누가 어떤 톤으로 쓰고 어디서 관리할지(`content/` 파일, CMS 등).
   - **변경 (2026-10-19): 작가 협업 무산 → AI 가안을 사용자가 직접 고쳐 확정한다.** (아래 2026-10-17 작가 의뢰 관련 항목은 기록으로 남긴다. 의뢰서·입력 시트·계약 조건은 더 이상 진행하지 않는다.)
     - AI 가안 v2: `src/content/freeStage.ts`(origin `'ai-draft'`). 45개 모두 규칙 오류·경고 0. v1 대비: 원소 코멘트가 서비스 제목("💧 물이 적은 편이에요")을 되풀이하지 않게 다시 씀, 끝맺음 '~해 보세요' 반복 줄임, 태양/상승궁 사수자리 중복 문장 정리, 카드 각도 통일(태양 = 본모습·삶의 방향 / 달 = 속마음·충전 방식 / 상승궁 = 첫인상).
     - 편집 파일: `docs/content/free-stage-draft.xlsx` — '문구' 시트(45행, 노란 칸만 편집, 글자 수·키워드 개수 수식과 기준 이탈 시 빨간 표시, 출처 칸 'AI 가안'/'검수' 목록), '사용법' 시트(규칙 요약, 반영 절차, 검수한 행 수·기준 이탈 칸 수). 실제 Excel(16.0)로 열어 수식 오류 0·글자 수 일치·이탈 표시 반응을 확인했다.
     - 반영: 엑셀에서 'CSV UTF-8(쉼표로 분리)'로 저장 → `npx --yes tsx scripts/convert-content.ts <파일.csv>`(검사) → `--out src/content/freeStage.ts`(반영, origin `'reviewed'`). 'AI 가안' 출처가 남은 행이 있으면 거부한다. 그냥 'CSV(쉼표로 분리)'로 저장해 한글이 깨지면(U+FFFD) 다시 저장하라고 알려준다. Excel로 저장한 CSV로 왕복 확인: 미검수 45건 거부, 전부 '검수'면 오류 0·원문과 동일.
     - 용어: `ContentOrigin`을 `'ai-draft' | 'writer'` → `'ai-draft' | 'reviewed'`로 바꿨다(사람이 검수한 확정본). 화면의 "검수 전 임시 문구" 안내는 `ai-draft`일 때 뜬다.
     - 엑셀 파일 생성 스크립트는 저장소에 두지 않았다(일회성). 편집은 이 엑셀 파일을 계속 쓴다.
   - (기록) 결정(2026-10-17): 무료 단계 문구는 점성술 작가에게 의뢰한다 → 2026-10-19 무산.
   - 톤·글자 수는 의뢰서 초안 기준이며 서비스가 최종 확정한 값은 아니다: 해요체, 제목 8~16자, 해석 70~95자(2~3문장), 키워드 3개(각 2~7자), 원소 코멘트는 강한 편 40~60자·적은 편 35~55자·균형형 60~90자. 길이는 `PlacementCard`(카드 높이 고정)와 기존 목업 문구를 재서 정했다. 제목에는 별자리 이름과 '당신'을 쓰지 않는다. 태양·달·상승궁이 같은 별자리여도 카드마다 다른 각도로 쓴다.
   - 산출물: 의뢰서 "점성술 해석 문구 작가 의뢰서 (무료 단계)"(Claude 문서, 비공개)와 입력 시트 `stardiary-content-input.xlsx`(작가 전달용이라 저장소에는 넣지 않는다). 시트의 키는 `sun.{sign}`, `moon.{sign}`, `rising.{sign}`, `element.{fire|earth|air|water}.dominant`, `element.{…}.lacking`, `element.balanced`이고 `{sign}`은 `ZodiacSignId`와 같다.
   - ✅ 납품 → 코드 반영 경로 (2026-10-18 구현): 시트를 **CSV(UTF-8)로 내보내** `scripts/convert-content.ts`로 `src/content/freeStage.ts`를 만든다(xlsx 파서 의존성을 두지 않으려고 CSV로 받는다). 실제 시트 파일은 저장소·작업 폴더에서 찾지 못해 머리글을 유연하게 받게 했다(키 / 제목 / 해석 / 키워드(쉼표) 또는 키워드1~3 / 코멘트 / 출처, 영문 가능). 실제 시트를 받으면 먼저 검사만 돌려 머리글이 맞는지 본다.
     - `npx --yes tsx scripts/convert-content.ts <시트.csv>` → 검사만(오류·경고 목록). `--out src/content/freeStage.ts`를 붙이면 오류가 없을 때만 덮어쓴다(origin 'writer').
     - 오류(변환 막음): 45개 키 누락·알 수 없는 키·중복, 출처가 'AI'로 시작하는 행, 빈 칸, 글자 수(`lib/content/rules.ts`), 키워드 3개·각 2~7자, 제목에 별자리 이름·2자 이상 어간·'당신'. 경고: 해석 2~3문장 아님, 원소 코멘트의 '가장'·'압도적'·'부족' 등, 숫자·%.
     - 개발 초기에는 CMS를 붙이지 않는다.
   - 무료 단계 분량: **45개** = 태양·달·상승궁 × 12별자리 36개 + 4원소 '강한 편' 4개 + '상대적으로 적은 편' 4개 + '균형형' 1개. (이전 "약 46개"는 추정치였다.) `/result`를 실제 계산과 연결하기 전에 사용자 검수를 마친다.
   - ✅ 원소 코멘트를 고르는 규칙은 5번에서 결정·구현했다(2026-10-17). 근거: `docs/element-distribution.md` (실제 엔진, 1950~2025년생·GeoNames 236,278개 도시 인구 비례 포함 4개 시나리오 × 시간 앎/모름 = 40만 차트. 시나리오·위도대별 결과가 1%p 안팎으로 같다).
   - **문구 규칙 (원소 코멘트, 2026-10-17)**: `docs/content-brief-elements.md`(원래 작가 안내, 지금은 직접 고칠 때 기준). 요점:
     - 분량은 그대로 45개. 동점용 문구를 따로 받지 않는다. 동점 제목("불과 흙이 똑같이 강해요", "바람과 물이 적은 편이에요")은 서비스가 템플릿으로 만든다.
     - '강한 편' 코멘트는 동점일 때 다른 원소와 함께 강한 상황에서도 쓰이므로 "가장 강해요", "압도적" 같은 최상급·배타 표현을 쓰지 않는다.
     - '적은 편' 코멘트는 최대 3개가 이어 붙을 수 있으므로 각각 한 덩어리로 완결되게 쓰고, "가장 적어요", "전혀 없어요"(0점 단정) 같은 표현을 쓰지 않는다. 같은 문장 틀로 시작하지 않게 원소마다 첫머리를 다르게 한다.
     - '적은 편'은 결핍·약점 단정이 아니라 "의식해서 채우면 좋은 결" 같은 방향으로 쓴다(약 80%의 사용자가 본다).
     - '균형형' 코멘트는 단독으로 보여지므로(강한 편·적은 편 없이) 그 자체로 결과 설명이 되게 쓴다. 약 9%의 사용자만 보는 '드문 결과'라는 느낌은 줘도 되지만 우열 표현은 쓰지 않는다.
   - 유료 단계는 천체별 별자리 해석만 100개 안팎이고 하우스·애스펙트까지 합치면 수백 개다. 애스펙트는 "천체 키워드 + 각도별 문장 틀" 조합으로 줄이는 방법을 유료 단계 때 정한다.
   - 주의: 다른 사이트·책의 해석 문구를 옮기지 않는다(저작권). 납품물은 특정 출처와 비슷하지 않은지 검수한다. 운명 단정, 건강·금전·시험 결과 단언, 다른 별자리 비하, 룰러·하우스·애스펙트 용어는 금지 규칙으로 의뢰서에 적었다.
9. **조디악 방식**: 서양 점성술 표준인 트로피컬(tropical)로 가정한다. 다르면 알려줄 것.
10. **차트 파워 / 가장 센 행성 TOP 3 (모듈 B, 유료, `lib/astro/power.ts` 예정)**: 품계·하우스·애스펙트를 종합해 행성 영향력을 매긴다. 아래가 정해지기 전에는 만들지 않는다.
   - 점수 근거: Walter Pullen의 Astrolog(오픈소스) 문서·기본값을 참고한다. 앞서 받은 요약 수치(본향 +0.5/+1.0 등)는 쓰지 않는다. Astrolog는 GPL이라 **코드를 옮겨 오지 말고 수치와 개념만 참고**한다(라이선스는 1번 결정과 함께 검토).
   - 룰러십 기준: 현대(천왕성=물병, 해왕성=물고기, 명왕성=전갈) 또는 전통 중 하나로 고정.
     - 교차검증(2026-10-17): 12별자리 전통/현대 표는 Wikipedia와 일치한다. 현대식을 기본값으로 쓰는 건 합리적이지만 "현대식이 대중 표준"이라는 근거는 약하다(현대 점성가 상당수가 전갈=화성 주 + 명왕성 보조 같은 공동 지배성을 쓰고, 베딕은 전통식). 구현은 `{ modern, traditional }` 두 필드를 가진 데이터로 두고 설정으로 고르게 한다. 최종 선택은 아직 미결이다.
   - 외행성 고양(exaltation)은 정설이 없으므로 넣지 않는다. 품계는 행성에만 적용하고 상승궁·MC에는 적용하지 않는다.
   - 애스펙트 점수: 6번(orb)이 2026-10-17에 확정됐다. 남은 것은 점수 체계(Astrolog 참고)와 룰러십 선택이다.

## 다음 작업 후보

- 문구 검수(8번) 후: 편집 엑셀을 CSV로 저장해 `scripts/convert-content.ts`로 변환하고, `chartService.getChartSummary()`가 `/api/chart`를 호출해 `positions`(태양·달·상승궁)와 `elementBalance`를 `buildChartSummary`에 넘기도록 바꾼다(`source: 'computed'`). 화면 구조는 이미 준비돼 있다(2026-10-18).
- 결과 카드 공유(이미지 저장) 기능
- 유료 리포트 후속: 결제·로그인(서버에서 권한 확인), 유료 문구 검수 경로(엑셀·변환), 차트 파워(10번), 하우스 대체 시 리포트 안내 문구 다듬기
