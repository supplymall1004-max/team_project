/**
 * @file motion-wrapper.tsx
 * @description 뷰포트 진입 시 애니메이션을 적용하는 래퍼 컴포넌트
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { Variants, Transition } from 'framer-motion';

interface MotionWrapperProps {
  children: ReactNode;
  variants?: Variants;
  transition?: Transition;
  className?: string;
  once?: boolean;
  amount?: number;
}

export function MotionWrapper({
  children,
  variants,
  transition,
  className,
  once = true,
  amount = 0.3,
}: MotionWrapperProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  const defaultVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const defaultTransition = {
    duration: 1.2,
    ease: [0.16, 1, 0.3, 1] as const, // 커스텀 easing (더 부드러운 곡선)
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants || defaultVariants}
      transition={transition || defaultTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
