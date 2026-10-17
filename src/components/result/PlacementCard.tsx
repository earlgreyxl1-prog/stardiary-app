'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { BIG_THREE, ZODIAC_SIGNS, ELEMENT_BY_ID, formatDegree } from '@/lib/astro/zodiac';
import type { BigThreeKey, Placement } from '@/types/astro';

interface PlacementCardProps {
  kind: BigThreeKey;
  placement: Placement;
}

const FACE_CLASS =
  'absolute inset-0 flex flex-col rounded-3xl border p-5 text-left [backface-visibility:hidden]';

/** 태양/달/상승궁 카드. 누르면 뒤집혀서 자세한 해석이 나온다. */
export function PlacementCard({ kind, placement }: PlacementCardProps) {
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();
  const meta = BIG_THREE[kind];
  const sign = ZODIAC_SIGNS[placement.sign];
  const element = ELEMENT_BY_ID[sign.element];

  return (
    <motion.button
      type="button"
      aria-pressed={flipped}
      aria-label={`${meta.label} ${sign.nameKo}. ${flipped ? '앞면으로 돌아가기' : '눌러서 해석 보기'}`}
      onClick={() => setFlipped((value) => !value)}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className="block w-full rounded-3xl [perspective:1200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe9a8]/60"
    >
      <motion.span
        className="relative block h-72 [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        <span
          aria-hidden={flipped}
          className={`${FACE_CLASS} border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur`}
        >
          <span className="flex items-center justify-between text-sm text-indigo-200/80">
            <span>
              {meta.emoji} {meta.label}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
              {element.emoji} {element.nameKo}
            </span>
          </span>
          <span className="mt-4 flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] text-3xl text-[#2a2260] shadow-[0_0_28px_rgba(255,214,150,0.35)]"
            >
              {/* U+FE0E: 이모지 대신 글자 모양 기호로 그려서 카드 색과 어울리게 한다. */}
              {`${sign.symbol}︎`}
            </span>
            <span className="block">
              <span className="block text-2xl font-bold text-white">{sign.nameKo}</span>
              <span className="block text-sm text-indigo-200/70">{formatDegree(placement.degree)}</span>
            </span>
          </span>
          <span className="mt-5 block text-lg font-bold text-[#ffe9a8]">“{placement.headline}”</span>
          <span className="mt-1 block text-sm text-indigo-200/80">{meta.caption}</span>
          <span className="mt-auto block text-center text-xs text-indigo-200/60">눌러서 해석 보기</span>
        </span>

        <span
          aria-hidden={!flipped}
          className={`${FACE_CLASS} border-[#ffe9a8]/30 bg-[linear-gradient(160deg,#2f2470,#231b52)] shadow-[0_20px_60px_rgba(10,6,40,0.45)] [transform:rotateY(180deg)]`}
        >
          <span className="block text-sm text-indigo-200/80">
            {meta.emoji} {meta.label} · {sign.nameKo}
          </span>
          <span className="mt-3 block text-[15px] leading-relaxed text-indigo-50">{placement.description}</span>
          <span className="mt-4 flex flex-wrap gap-2">
            {placement.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-[#ffc6e0]/15 px-3 py-1 text-xs font-medium text-[#ffd9ea]">
                #{keyword}
              </span>
            ))}
          </span>
          <span className="mt-auto flex items-center justify-center gap-1 text-xs text-indigo-200/60">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            눌러서 앞면 보기
          </span>
        </span>
      </motion.span>
    </motion.button>
  );
}
