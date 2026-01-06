/**
 * @file animated-alert-wrapper.tsx
 * @description motion.div를 사용하는 Alert 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.div를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion, type Transition } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedAlertWrapperProps {
  children: ReactNode;
  initial?: { opacity?: number; scale?: number };
  animate?: { opacity?: number; scale?: number };
  transition?: Transition;
  className?: string;
}

export function AnimatedAlertWrapper({
  children,
  initial = { opacity: 0, scale: 0.9 },
  animate = { opacity: 1, scale: 1 },
  transition = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    delay: 0.2,
  },
  className,
}: AnimatedAlertWrapperProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

