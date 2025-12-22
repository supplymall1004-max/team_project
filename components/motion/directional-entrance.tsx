/**
 * @file directional-entrance.tsx
 * @description 방향별 진입 애니메이션 컴포넌트
 * 
 * 위, 아래, 왼쪽, 오른쪽에서 진입하며 동시에 확대/축소 효과를 적용합니다.
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { Variants, Transition } from 'framer-motion';
import {
  slideDownScale,
  slideUpScale,
  slideRightScale,
  slideLeftScale,
  scaleFromCenter,
  rotateInScale,
  slowSpringTransition,
} from '@/lib/animations';

type Direction = 'up' | 'down' | 'left' | 'right' | 'center' | 'rotate';

interface DirectionalEntranceProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  transition?: Transition;
}

const directionVariants: Record<Direction, Variants> = {
  up: slideUpScale,
  down: slideDownScale,
  left: slideLeftScale,
  right: slideRightScale,
  center: scaleFromCenter,
  rotate: rotateInScale,
};

export function DirectionalEntrance({
  children,
  direction = 'up',
  delay = 0,
  className,
  once = true,
  amount = 0.3,
  transition,
}: DirectionalEntranceProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  const variants = directionVariants[direction];
  const finalTransition = transition || {
    ...slowSpringTransition,
    delay,
  };

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      exit="exit"
      variants={variants}
      transition={finalTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
