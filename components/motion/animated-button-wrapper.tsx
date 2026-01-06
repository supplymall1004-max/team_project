/**
 * @file animated-button-wrapper.tsx
 * @description motion.div를 사용하는 버튼 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.div를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedButtonWrapperProps {
  children: ReactNode;
  whileHover?: { scale?: number; y?: number; x?: number; rotate?: number };
  whileTap?: { scale?: number };
  transition?: Transition;
  className?: string;
}

export function AnimatedButtonWrapper({
  children,
  whileHover = { scale: 1.05, y: -2 },
  whileTap = { scale: 0.95 },
  transition = {
    type: "spring",
    stiffness: 400,
    damping: 17,
  },
  className,
}: AnimatedButtonWrapperProps) {
  return (
    <motion.div
      whileHover={whileHover}
      whileTap={whileTap}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

