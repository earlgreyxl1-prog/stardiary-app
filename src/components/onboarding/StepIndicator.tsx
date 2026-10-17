'use client';

import { motion } from 'framer-motion';

interface StepIndicatorProps {
  /** 0부터 시작하는 현재 단계 */
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`${total}단계 중 ${current + 1}단계`}
      className="flex items-center gap-2"
    >
      {Array.from({ length: total }, (_, index) => (
        <motion.span
          key={index}
          aria-hidden
          animate={{ scale: index === current ? 1.3 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={`text-lg leading-none transition-colors ${
            index <= current ? 'text-[#ffe9a8]' : 'text-white/20'
          }`}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}
