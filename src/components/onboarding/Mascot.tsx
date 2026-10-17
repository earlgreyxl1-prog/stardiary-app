'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface MascotProps {
  message: string;
}

/** 안내 캐릭터 '달토리'. 단계가 바뀔 때마다 말풍선이 새로 떠오른다. */
export function Mascot({ message }: MascotProps) {
  return (
    <div className="flex items-end gap-3">
      <div
        aria-hidden
        className="mascot-float flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] text-3xl shadow-[0_0_28px_rgba(255,214,150,0.4)]"
      >
        🌙
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          aria-live="polite"
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-indigo-50 backdrop-blur"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
