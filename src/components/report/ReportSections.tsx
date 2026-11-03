'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { BODY_BY_ID, glyph } from '@/lib/astro/bodies';
import { ZODIAC_SIGNS } from '@/lib/astro/zodiac';
import type { NatalReport, ReportAspect } from '@/lib/report/buildReport';
import { formatDegreeMinutes } from '@/lib/report/format';
import type { AspectType } from '@/types/astro';

const SECTION = 'rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur';

const signLabel = (sign: keyof typeof ZODIAC_SIGNS) => `${glyph(ZODIAC_SIGNS[sign].symbol)} ${ZODIAC_SIGNS[sign].nameKo}`;

/** 천체 10개: 별자리·도수·역행·하우스·한 줄 해석 */
export function PlanetSection({ report }: { report: NatalReport }) {
  return (
    <section aria-labelledby="planets-title" className={SECTION}>
      <h2 id="planets-title" className="text-lg font-bold text-white">
        행성이 놓인 자리
      </h2>
      <ul className="mt-4 divide-y divide-white/10">
        {report.planets.map((planet) => {
          const meta = BODY_BY_ID[planet.body];
          return (
            <li key={planet.body} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-base font-bold text-white">
                  <span aria-hidden className="mr-1 text-[#ffe9a8]">
                    {glyph(meta.symbol)}
                  </span>
                  {meta.nameKo}
                </span>
                <span className="text-sm text-indigo-100">
                  {signLabel(planet.position.sign)} {formatDegreeMinutes(planet.position.degree)}
                </span>
                {planet.house !== null && <span className="text-xs text-indigo-200/70">{planet.house}하우스</span>}
                {planet.position.retrograde && (
                  <span className="rounded-full bg-[#ffc6e0]/15 px-2 py-0.5 text-[11px] font-medium text-[#ffd9ea]">역행</span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-indigo-100/90">{planet.text}</p>
              {planet.ambiguous && (
                <p className="mt-1 text-xs text-indigo-200/60">
                  태어난 시각에 따라 {ZODIAC_SIGNS[planet.ambiguous.first].nameKo}일 수도, {ZODIAC_SIGNS[planet.ambiguous.last].nameKo}일
                  수도 있어요. 정오 기준으로 보여드려요.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const FALLBACK_LABEL = {
  'high-latitude': '극지방에 가까운 출생지라 Porphyry 방식으로 하우스를 계산했어요.',
  'calculation-failed': 'Placidus 방식으로 계산할 수 없는 시각이라 다른 방식으로 하우스를 계산했어요.',
} as const;

/** 12하우스: 시작 별자리·영역·들어간 행성·갇힌 별자리 */
export function HouseSection({ report }: { report: NatalReport }) {
  if (!report.houses) {
    return (
      <section aria-labelledby="houses-title" className={`${SECTION} border-dashed`}>
        <h2 id="houses-title" className="text-lg font-bold text-white">
          12하우스
        </h2>
        <div className="mt-3 flex gap-2 text-sm leading-relaxed text-indigo-200/80">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>하우스는 태어난 시각과 장소로 나누기 때문에, 출생 시간을 알아야 볼 수 있어요.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="houses-title" className={SECTION}>
      <h2 id="houses-title" className="text-lg font-bold text-white">
        12하우스
      </h2>
      <p className="mt-1 text-sm text-indigo-200/80">하늘을 열두 영역으로 나눠, 행성이 어느 삶의 영역에서 힘을 쓰는지 봐요.</p>
      {report.houseSystem?.fallbackReason && (
        <p className="mt-3 rounded-2xl bg-[#ffe9a8]/10 px-3 py-2 text-xs leading-relaxed text-[#fff1c7]">
          {FALLBACK_LABEL[report.houseSystem.fallbackReason]}
        </p>
      )}
      <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {report.houses.map((house) => (
          <li key={house.house} className="rounded-2xl bg-white/5 p-3">
            <p className="text-sm font-bold text-white">
              {house.house}하우스 <span className="font-normal text-indigo-200/80">· {house.area}</span>
            </p>
            <p className="mt-0.5 text-xs text-indigo-200/70">
              {signLabel(house.cusp.sign)} {formatDegreeMinutes(house.cusp.degree)}에서 시작
            </p>
            {house.bodies.length > 0 && (
              <p className="mt-1.5 text-sm text-indigo-100">
                {house.bodies.map((body) => `${glyph(BODY_BY_ID[body].symbol)} ${BODY_BY_ID[body].nameKo}`).join(' · ')}
              </p>
            )}
            {house.intercepted.length > 0 && (
              <p className="mt-1.5 text-xs text-[#ffd9ea]">
                갇힌 별자리: {house.intercepted.map((sign) => ZODIAC_SIGNS[sign].nameKo).join(', ')}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

const ASPECT_SYMBOL: Record<AspectType, string> = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '⚹',
};

const TONE_BADGE: Record<ReportAspect['tone'], string> = {
  harmonious: 'bg-[#a8d8ff]/15 text-[#cfe8ff]',
  tense: 'bg-[#ffb3c7]/15 text-[#ffd3df]',
  neutral: 'bg-[#ffe9a8]/15 text-[#fff1c7]',
};

const INITIAL_ASPECTS = 8;

/** 애스펙트: 정확한 순으로 앞의 8개, 나머지는 펼쳐 보기 */
export function AspectSection({ report }: { report: NatalReport }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? report.aspects : report.aspects.slice(0, INITIAL_ASPECTS);

  return (
    <section aria-labelledby="aspects-title" className={SECTION}>
      <h2 id="aspects-title" className="text-lg font-bold text-white">
        행성끼리 맺은 각도
      </h2>
      <p className="mt-1 text-sm text-indigo-200/80">정확하게 맞물린 것부터 보여드려요. 오차가 작을수록 영향이 또렷해요.</p>
      {report.timeUnknown && (
        <p className="mt-2 text-xs text-indigo-200/60">출생 시간을 몰라 하루에 크게 움직이는 달의 각도는 조금 다를 수 있어요.</p>
      )}
      {report.aspects.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/20 p-4 text-center text-sm text-indigo-200/80">
          기준 안에 드는 각도가 없어요. 행성들이 저마다 자기 길을 가는 차트예요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map(({ aspect, label, tone, text }) => (
            <li key={`${aspect.a}-${aspect.b}`} className="rounded-2xl bg-white/5 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {glyph(BODY_BY_ID[aspect.a].symbol)} {BODY_BY_ID[aspect.a].nameKo}
                  <span aria-hidden className="mx-1.5 text-indigo-200/70">
                    {glyph(ASPECT_SYMBOL[aspect.type])}
                  </span>
                  {glyph(BODY_BY_ID[aspect.b].symbol)} {BODY_BY_ID[aspect.b].nameKo}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_BADGE[tone]}`}>{label}</span>
                <span className="text-[11px] text-indigo-200/60">오차 {formatDegreeMinutes(aspect.deviation)}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-indigo-100/90">{text}</p>
            </li>
          ))}
        </ul>
      )}
      {report.aspects.length > INITIAL_ASPECTS && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 w-full rounded-2xl border border-white/15 py-2.5 text-sm text-indigo-100 transition hover:bg-white/10 active:scale-[0.98]"
        >
          {expanded ? '접기' : `모두 보기 (${report.aspects.length}개)`}
        </button>
      )}
    </section>
  );
}
