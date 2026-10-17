'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';

/**
 * OS의 '동작 줄이기' 설정을 켠 사용자에게는 framer-motion의 이동·확대 애니메이션을 끈다.
 * (투명도 변화는 유지된다.) CSS 애니메이션은 globals.css의 미디어 쿼리가 담당한다.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
