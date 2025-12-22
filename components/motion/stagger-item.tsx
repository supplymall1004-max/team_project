/**
 * @file stagger-item.tsx
 * @description 순차적으로 나타나는 리스트 아이템 애니메이션 컴포넌트
 * 
 * 재료 리스트, 조리 단계 등의 아이템에 순차적으로 나타나는 효과를 제공합니다.
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerItemProps {
  children: ReactNode;
  index: number;
  delay?: number;
  className?: string;
}

export function StaggerItem({
  children,
  index,
  delay = 0,
  className,
}: StaggerItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: delay + index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
