/**
 * @file scroll-progress.tsx
 * @description 페이지 스크롤 진행도를 표시하는 컴포넌트
 * 
 * 페이지 상단에 고정되어 스크롤 진행도를 시각적으로 표시합니다.
 */

'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 bg-orange-500 origin-left z-50"
      aria-hidden="true"
    />
  );
}
