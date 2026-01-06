/**
 * @file animated-timer.tsx
 * @description motion.div를 사용하는 타이머 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.div를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTimerProps {
  children: ReactNode;
  step?: number;
  className?: string;
}

export function AnimatedTimer({
  children,
  step = 1,
  className,
}: AnimatedTimerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.5 + (step - 1) * 0.1,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

