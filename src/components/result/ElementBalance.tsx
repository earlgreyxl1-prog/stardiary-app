'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ELEMENTS, ELEMENT_BY_ID } from '@/lib/astro/zodiac';
import type { ElementId } from '@/types/astro';

interface ElementBalanceProps {
  elements: Record<ElementId, number>;
  dominant: ElementId;
  comment: string;
}

/** 4원소(불/흙/바람/물) 비중을 막대로 보여준다. */
export function ElementBalance({ elements, dominant, comment }: ElementBalanceProps) {
  const reduceMotion = useReducedMotion();
  const dominantMeta = ELEMENT_BY_ID[dominant];

  return (
    <section
      aria-labelledby="element-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur"
    >
      <h2 id="element-title" className="text-lg font-bold text-white">
        나의 4원소 밸런스
      </h2>
      <p className="mt-1 text-sm text-indigo-200/80">
        가장 강한 원소는{' '}
        <strong className="font-bold text-[#ffe9a8]">
          {dominantMeta.emoji} {dominantMeta.nameKo}
        </strong>
        이에요.
      </p>

      <ul className="mt-5 space-y-3.5">
        {ELEMENTS.map((element, index) => {
          const percent = elements[element.id];
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

      <p className="mt-5 rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-indigo-100">{comment}</p>
    </section>
  );
}
