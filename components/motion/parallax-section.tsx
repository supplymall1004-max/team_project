/**
 * @file parallax-section.tsx
 * @description 스크롤 기반 패럴랙스 효과를 가진 섹션 컴포넌트
 * 
 * 스크롤에 따라 요소가 이동하고 스케일이 변경되는 효과를 제공합니다.
 */

'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number; // 패럴랙스 속도 (기본값: 0.5)
  scaleRange?: [number, number]; // 스케일 범위 [최소, 최대]
}

export function ParallaxSection({
  children,
  className,
  speed = 0.5,
  scaleRange = [0.95, 1],
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity, scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
