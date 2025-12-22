/**
 * @file stagger-card.tsx
 * @description 순차적으로 나타나는 카드 애니메이션 컴포넌트
 * 
 * 레시피 상세페이지의 각 섹션(Card)에 순차적으로 나타나는 효과를 제공합니다.
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface StaggerCardProps {
  children: ReactNode;
  index?: number;
  delay?: number;
  className?: string;
}

export function StaggerCard({
  children,
  index = 0,
  delay = 0,
  className,
}: StaggerCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
