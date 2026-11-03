import { BODIES } from '@/lib/astro/bodies';
import { aspectText, bodyText } from '@/lib/report/reportText';
import type {
  Aspect,
  BodyId,
  BodyPosition,
  ChartApiResponse,
  HouseNumber,
  NatalHouses,
  SignPosition,
  SignRange,
  ZodiacSignId,
} from '@/types/astro';
import type { ContentOrigin, PaidStageContent } from '@/types/content';

export interface ReportPlanet {
  body: BodyId;
  position: BodyPosition;
  /** 출생 시간을 모르면 null */
  house: HouseNumber | null;
  text: string;
  /** 출생 시간을 몰라 그날 안에 별자리가 바뀌었을 수 있는 천체 (정오 기준으로 보여준다) */
  ambiguous: SignRange | null;
}

export interface ReportHouse {
  house: HouseNumber;
  cusp: SignPosition;
  area: string;
  bodies: BodyId[];
  /** 이 하우스 안에 통째로 갇힌 별자리 (인터셉션) */
  intercepted: ZodiacSignId[];
}

export interface ReportAspect {
  aspect: Aspect;
  label: string;
  tone: 'harmonious' | 'tense' | 'neutral';
  text: string;
}

/** 유료 정밀 리포트 화면용 데이터 */
export interface NatalReport {
  contentOrigin: ContentOrigin;
  timeUnknown: boolean;
  angles: ChartApiResponse['positions']['angles'];
  /** 하우스 계산 방식. 출생 시간을 모르면 null */
  houseSystem: Pick<NatalHouses, 'system' | 'fallbackReason'> | null;
  planets: ReportPlanet[];
  /** 출생 시간을 모르면 null */
  houses: ReportHouse[] | null;
  /** 정확한 순(오차가 작은 순) */
  aspects: ReportAspect[];
}

const HOUSE_NUMBERS: readonly HouseNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** /api/chart 응답과 유료 문구로 리포트를 만든다. 순수 함수라 서버·클라이언트 어디서나 쓸 수 있다. */
export function buildNatalReport(chart: ChartApiResponse, content: PaidStageContent): NatalReport {
  const { positions } = chart;
  const houses = positions.houses;

  const planets: ReportPlanet[] = BODIES.map(({ id }) => {
    const position = positions.bodies[id];
    const house = houses ? houses.bodyHouses[id] : null;
    return {
      body: id,
      position,
      house,
      text: bodyText(content, id, position.sign, house),
      ambiguous: positions.ambiguousSigns[id] ?? null,
    };
  });

  const reportHouses: ReportHouse[] | null = houses
    ? HOUSE_NUMBERS.map((house, index) => ({
        house,
        cusp: houses.cusps[index],
        area: content.houses[house].area,
        bodies: BODIES.map(({ id }) => id).filter((id) => houses.bodyHouses[id] === house),
        intercepted: houses.intercepted.filter((item) => item.house === house).map((item) => item.sign),
      }))
    : null;

  const aspects: ReportAspect[] = chart.aspects.map((aspect) => ({
    aspect,
    label: content.aspects[aspect.type].label,
    tone: content.aspects[aspect.type].tone,
    text: aspectText(content, aspect),
  }));

  return {
    contentOrigin: content.origin,
    timeUnknown: positions.timeUnknown,
    angles: positions.angles,
    houseSystem: houses ? { system: houses.system, fallbackReason: houses.fallbackReason } : null,
    planets,
    houses: reportHouses,
    aspects,
  };
}
