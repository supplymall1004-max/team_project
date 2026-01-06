/**
 * @file animated-nutrition-item.tsx
 * @description motion.div를 사용하는 영양 정보 아이템 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 
 * 서버 컴포넌트에서 사용할 수 있도록 motion.div를 클라이언트 컴포넌트로 분리
 */

"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedNutritionItemProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedNutritionItem({
  children,
  delay = 0.5,
  className,
}: AnimatedNutritionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedNutritionValueProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedNutritionValue({
  children,
  delay = 0.6,
  className,
}: AnimatedNutritionValueProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

