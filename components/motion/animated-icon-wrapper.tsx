/**
 * @file animated-icon-wrapper.tsx
 * @description motion.div를 사용하는 아이콘 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.div를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedIconWrapperProps {
  children: ReactNode;
  initial?: { opacity?: number; scale?: number; rotate?: number };
  animate?: { opacity?: number; scale?: number; rotate?: number };
  transition?: Transition;
  className?: string;
}

export function AnimatedIconWrapper({
  children,
  initial = { opacity: 0, scale: 0, rotate: -180 },
  animate = { opacity: 1, scale: 1, rotate: 0 },
  transition = {
    type: "spring",
    stiffness: 200,
    damping: 15,
    delay: 0.3,
  },
  className,
}: AnimatedIconWrapperProps) {
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

