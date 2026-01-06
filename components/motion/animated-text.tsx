/**
 * @file animated-text.tsx
 * @description motion.p를 사용하는 텍스트 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.p를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTextProps {
  children: ReactNode;
  initial?: { opacity?: number };
  animate?: { opacity?: number };
  transition?: {
    delay?: number;
    duration?: number;
  };
  className?: string;
  as?: "p" | "div" | "span";
}

export function AnimatedText({
  children,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  transition = { delay: 0.7 },
  className,
  as = "p",
}: AnimatedTextProps) {
  const MotionComponent = motion[as] as typeof motion.p;
  
  return (
    <MotionComponent
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

