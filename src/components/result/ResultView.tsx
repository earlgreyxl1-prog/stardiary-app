'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Mascot } from '@/components/onboarding/Mascot';
import { ElementBalance } from '@/components/result/ElementBalance';
import { LockedRisingCard } from '@/components/result/LockedRisingCard';
import { PlacementCard } from '@/components/result/PlacementCard';
import { ReportTeaser } from '@/components/result/ReportTeaser';
import { BackToOnboardingLink, PreviewNotice } from '@/components/result/ResultStates';
import { ZODIAC_SIGNS } from '@/lib/astro/zodiac';
import type { ChartSummary } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

interface ResultViewProps {
  input: BirthInput;
  summary: ChartSummary;
}

function formatBirth(input: BirthInput): string {
  const date = `${input.year}년 ${input.month}월 ${input.day}일`;
  const time =
    input.timeUnknown || input.hour === null || input.minute === null
      ? '시간 모름'
      : `${input.hour}시 ${String(input.minute).padStart(2, '0')}분`;
  return `${date} · ${time} · ${input.city.nameKo}`;
}

export function ResultView({ input, summary }: ResultViewProps) {
  const reduceMotion = useReducedMotion();
  const sunSign = ZODIAC_SIGNS[summary.sun.sign];

  const reveal = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay: 0.12 * index, ease: 'easeOut' as const },
        };

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white">{input.nickname}님의 별자리</h1>
        <p className="mt-1 text-sm text-indigo-200/70">{formatBirth(input)}</p>
      </header>

      <PreviewNotice mock={summary.source === 'mock'} draftContent={summary.contentOrigin === 'ai-draft'} />

      <Mascot message={`${input.nickname}의 하늘에는 ${sunSign.nameKo} 태양이 빛나고 있었어! 카드를 눌러봐.`} />

      <section aria-label="핵심 3대 요소" className="flex flex-col gap-4">
        <motion.div {...reveal(0)}>
          <PlacementCard kind="sun" placement={summary.sun} />
        </motion.div>
        <motion.div {...reveal(1)}>
          <PlacementCard kind="moon" placement={summary.moon} />
        </motion.div>
        <motion.div {...reveal(2)}>
          {summary.rising ? <PlacementCard kind="rising" placement={summary.rising} /> : <LockedRisingCard />}
        </motion.div>
      </section>

      <motion.div {...reveal(3)}>
        <ElementBalance summary={summary.elements} />
      </motion.div>

      <motion.div {...reveal(4)}>
        <ReportTeaser />
      </motion.div>

      <div className="flex justify-center pt-2">
        <BackToOnboardingLink />
      </div>
    </div>
  );
}
