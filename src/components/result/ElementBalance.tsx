'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { ELEMENTS } from '@/lib/astro/zodiac';
import { elementTitles } from '@/lib/summary/elementTitles';
import type { ElementSummary } from '@/types/astro';

interface ElementBalanceProps {
  summary: ElementSummary;
}

const COMMENT_BOX = 'rounded-2xl bg-white/5 p-4';

/**
 * 4원소(불/흙/바람/물) 비중 막대와 코멘트.
 * 코멘트 구성은 summary.view가 정한다: 균형형 하나 / 강한 편(동점이면 제목에 여럿) + 적은 편 0~3개.
 */
export function ElementBalance({ summary }: ElementBalanceProps) {
  const reduceMotion = useReducedMotion();
  const { percentages, view, excluded } = summary;
  const titles = elementTitles(view);

  return (
    <section
      aria-labelledby="element-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur"
    >
      <h2 id="element-title" className="text-lg font-bold text-white">
        나의 4원소 밸런스
      </h2>

      <ul className="mt-5 space-y-3.5">
        {ELEMENTS.map((element, index) => {
          const percent = percentages[element.id];
          return (
            <li key={element.id} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-sm text-indigo-100">
                {element.emoji} {element.nameKo}
              </span>
              <span
                role="meter"
                aria-label={`${element.nameKo} 원소`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-3 flex-1 overflow-hidden rounded-full bg-white/10"
              >
                <motion.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: element.color }}
                  initial={{ width: reduceMotion ? `${percent}%` : '0%' }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.7, delay: 0.1 * index, ease: 'easeOut' }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-indigo-200/80">{percent}%</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 space-y-3">
        <div className={COMMENT_BOX}>
          <p className="text-sm font-bold text-[#ffe9a8]">{titles.main}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-indigo-100">
            {view.kind === 'balanced' ? view.text : view.strong.comment.text}
          </p>
        </div>

        {view.kind === 'leaning' && titles.lacking && (
          <div className={COMMENT_BOX}>
            <p className="text-sm font-bold text-[#ffc6e0]">{titles.lacking}</p>
            <div className="mt-1.5 space-y-2">
              {view.lacking.map((comment) => (
                <p key={comment.element} className="text-sm leading-relaxed text-indigo-100">
                  {comment.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {excluded.length > 0 && (
        <div className="mt-4 flex gap-2 text-xs leading-relaxed text-indigo-200/70">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>
            출생 시간을 몰라서 상승궁과 천정(MC)은 빼고 계산했어요. 시간을 알면 비율이 조금 달라질 수 있어요.{' '}
            <Link
              href="/onboarding?step=time"
              className="font-medium text-indigo-100 underline decoration-white/30 underline-offset-2 hover:text-white"
            >
              출생 시간 입력하기
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
