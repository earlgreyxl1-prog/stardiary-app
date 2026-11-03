import { BODY_BY_ID, glyph } from '@/lib/astro/bodies';
import { ELEMENT_BY_ID, formatDegree, ZODIAC_ORDER, ZODIAC_SIGNS } from '@/lib/astro/zodiac';
import type { NatalReport } from '@/lib/report/buildReport';
import { polar, spreadLongitudes, wheelAngle } from '@/lib/report/wheel';

interface WheelChartProps {
  report: NatalReport;
}

const SIZE = 340;
/** ASC·MC 글자가 바깥 원 밖에 붙으므로 그만큼 여백을 둔다 */
const PAD = 16;
const C = SIZE / 2;
const R_OUTER = 162; // 별자리 띠 바깥
const R_SIGNS = 136; // 별자리 띠 안쪽
const R_SIGN_LABEL = 149;
const R_PLANET = 116; // 천체 기호
const R_TICK = 128; // 실제 위치 눈금
const R_HOUSE_LABEL = 76;
const R_INNER = 66; // 애스펙트 원

const TONE_COLOR: Record<'harmonious' | 'tense' | 'neutral', string> = {
  harmonious: '#a8d8ff',
  tense: '#ffb3c7',
  neutral: '#ffe9a8',
};

/** 네이탈 휠 차트 (SVG). 같은 내용을 아래 목록이 글로 보여주므로 스크린 리더에는 요약만 읽힌다. */
export function WheelChart({ report }: WheelChartProps) {
  const ascendant = report.angles?.ascendant.longitude ?? null;
  const angleOf = (longitude: number) => wheelAngle(longitude, ascendant);
  const at = (radius: number, longitude: number) => polar(C, C, radius, angleOf(longitude));

  const planetLongitudes = report.planets.map((planet) => planet.position.longitude);
  const labelLongitudes = spreadLongitudes(planetLongitudes, 9);
  const summary = report.planets
    .map((planet) => `${BODY_BY_ID[planet.body].nameKo} ${ZODIAC_SIGNS[planet.position.sign].nameKo} ${formatDegree(planet.position.degree)}`)
    .join(', ');

  return (
    <figure className="mx-auto w-full max-w-[340px]">
      <svg viewBox={`${-PAD} ${-PAD} ${SIZE + PAD * 2} ${SIZE + PAD * 2}`} role="img" aria-labelledby="wheel-title wheel-desc" className="h-auto w-full">
        <title id="wheel-title">네이탈 차트</title>
        <desc id="wheel-desc">{summary}</desc>

        <circle cx={C} cy={C} r={R_OUTER} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.25)" />
        <circle cx={C} cy={C} r={R_SIGNS} fill="rgba(20,17,46,0.6)" stroke="rgba(255,255,255,0.25)" />
        <circle cx={C} cy={C} r={R_INNER} fill="none" stroke="rgba(255,255,255,0.12)" />

        {/* 별자리 띠: 30°마다 경계, 가운데에 기호 (원소 색) */}
        {ZODIAC_ORDER.map((sign, index) => {
          const start = at(R_SIGNS, index * 30);
          const end = at(R_OUTER, index * 30);
          const label = at(R_SIGN_LABEL, index * 30 + 15);
          return (
            <g key={sign}>
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.25)" />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="15"
                fill={ELEMENT_BY_ID[ZODIAC_SIGNS[sign].element].color}
              >
                {glyph(ZODIAC_SIGNS[sign].symbol)}
              </text>
            </g>
          );
        })}

        {/* 하우스 시작선과 번호 (출생 시간을 알 때만) */}
        {report.houses?.map((house, index, houses) => {
          const next = houses[(index + 1) % 12].cusp.longitude;
          const span = (((next - house.cusp.longitude) % 360) + 360) % 360;
          const inner = at(R_INNER, house.cusp.longitude);
          const outer = at(R_SIGNS, house.cusp.longitude);
          const label = at(R_HOUSE_LABEL, house.cusp.longitude + span / 2);
          const isAngle = house.house === 1 || house.house === 10 || house.house === 4 || house.house === 7;
          return (
            <g key={house.house}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={isAngle ? 'rgba(255,233,168,0.7)' : 'rgba(255,255,255,0.18)'}
                strokeWidth={isAngle ? 1.5 : 1}
              />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="rgba(199,210,254,0.6)">
                {house.house}
              </text>
            </g>
          );
        })}

        {/* ASC·MC 표시 */}
        {report.angles &&
          (
            [
              ['ASC', report.angles.ascendant.longitude],
              ['MC', report.angles.midheaven.longitude],
            ] as const
          ).map(([name, longitude]) => {
            const point = at(R_OUTER + 10, longitude);
            return (
              <text key={name} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="#ffe9a8">
                {name}
              </text>
            );
          })}

        {/* 애스펙트 선 (정확할수록 진하게) */}
        {report.aspects.map(({ aspect, tone }) => {
          const from = at(R_INNER, report.planets.find((planet) => planet.body === aspect.a)?.position.longitude ?? 0);
          const to = at(R_INNER, report.planets.find((planet) => planet.body === aspect.b)?.position.longitude ?? 0);
          const opacity = 0.25 + 0.6 * (1 - aspect.deviation / aspect.orb);
          return (
            <line
              key={`${aspect.a}-${aspect.b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={TONE_COLOR[tone]}
              strokeOpacity={opacity}
              strokeWidth={1.2}
              strokeDasharray={tone === 'tense' ? '4 3' : undefined}
            />
          );
        })}

        {/* 천체: 실제 위치 눈금 + 겹치지 않게 벌린 기호 */}
        {report.planets.map((planet, index) => {
          const tickOuter = at(R_SIGNS, planet.position.longitude);
          const tickInner = at(R_TICK, planet.position.longitude);
          const label = at(R_PLANET, labelLongitudes[index]);
          return (
            <g key={planet.body}>
              <line x1={tickOuter.x} y1={tickOuter.y} x2={tickInner.x} y2={tickInner.y} stroke="#ffffff" strokeWidth={1.5} />
              <line x1={tickInner.x} y1={tickInner.y} x2={label.x} y2={label.y} stroke="rgba(255,255,255,0.2)" />
              <circle cx={label.x} cy={label.y} r={9.5} fill="#231b52" stroke="rgba(255,255,255,0.3)" />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#ffffff">
                {glyph(BODY_BY_ID[planet.body].symbol)}
              </text>
              {planet.position.retrograde && (
                <text x={label.x + 9} y={label.y - 8} fontSize="7" fill="#ffc6e0">
                  R
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-indigo-200/70">
        <span>
          <span className="mr-1 inline-block h-0.5 w-4 align-middle bg-[#a8d8ff]" />
          조화
        </span>
        <span>
          <span className="mr-1 inline-block h-0.5 w-4 border-t border-dashed border-[#ffb3c7] align-middle" />
          긴장
        </span>
        <span>
          <span className="mr-1 inline-block h-0.5 w-4 align-middle bg-[#ffe9a8]" />
          합
        </span>
        {report.timeUnknown && <span>출생 시간을 몰라 양자리 0°를 왼쪽에 두었어요</span>}
      </figcaption>
    </figure>
  );
}
