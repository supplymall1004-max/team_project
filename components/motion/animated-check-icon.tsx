/**
 * @file animated-check-icon.tsx
 * @description motion.div를 사용하는 체크 아이콘 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.div를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCheckIconProps {
  children: ReactNode;
  index?: number;
  initial?: { opacity?: number; scale?: number };
  animate?: { opacity?: number; scale?: number };
  transition?: Transition;
  className?: string;
}

export function AnimatedCheckIcon({
  children,
  index = 0,
  initial = { opacity: 0, scale: 0 },
  animate = { opacity: 1, scale: 1 },
  transition,
  className,
}: AnimatedCheckIconProps) {
  const defaultTransition = {
    type: "spring" as const,
    stiffness: 200,
    damping: 15,
    delay: 0.3 + index * 0.05,
  };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition || defaultTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

