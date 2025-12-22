/**
 * @file animated-badge.tsx
 * @description 애니메이션이 적용된 배지 컴포넌트
 * 
 * 숫자 배지나 상태 배지에 scale 애니메이션을 적용합니다.
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedBadgeProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedBadge({
  children,
  delay = 0,
  className,
}: AnimatedBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
