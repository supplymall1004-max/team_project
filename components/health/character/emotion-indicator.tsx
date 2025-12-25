/**
 * @file components/health/character/emotion-indicator.tsx
 * @description 감정 표시 컴포넌트
 *
 * 캐릭터의 현재 감정 상태를 아이콘과 게이지로 표시합니다.
 *
 * @dependencies
 * - @/types/character: EmotionState
 * - @/lib/animations/character-animations: emotionColors
 * - lucide-react: 아이콘들
 */

"use client";

import { motion } from "framer-motion";
import {
  Smile,
  Frown,
  Heart,
  Moon,
  UtensilsCrossed,
  Coffee,
  Sparkles,
  AlertTriangle,
  Angry,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmotionState } from "@/types/character";
import { emotionColors } from "@/lib/animations/character-animations";

interface EmotionIndicatorProps {
  emotion: EmotionState;
  size?: "sm" | "md" | "lg";
  showIntensity?: boolean; // 강도 게이지 표시 여부
  className?: string;
}

/**
 * 감정별 아이콘 매핑
 */
const emotionIcons = {
  happy: Smile,
  sad: Frown,
  sick: Heart,
  tired: Moon,
  hungry: UtensilsCrossed,
  full: Coffee,
  excited: Sparkles,
  worried: AlertTriangle,
  angry: Angry,
  neutral: Circle,
};

/**
 * 크기별 클래스
 */
const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * 감정 표시 컴포넌트
 */
export function EmotionIndicator({
  emotion,
  size = "md",
  showIntensity = true,
  className,
}: EmotionIndicatorProps) {
  const Icon = emotionIcons[emotion.emotion];
  const colors = emotionColors[emotion.emotion];
  const intensity = emotion.intensity;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 감정 아이콘 */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: emotion.emotion === "excited" ? [0, 10, -10, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "relative",
          "flex items-center justify-center",
          "rounded-full",
          colors.bg,
          "p-1.5",
          "border-2",
          colors.border
        )}
        style={{
          boxShadow: `0 0 10px ${colors.glow}`,
        }}
      >
        <Icon className={cn(sizeClasses[size], colors.text)} />
      </motion.div>

      {/* 강도 게이지 */}
      {showIntensity && (
        <div className="flex-1 min-w-[60px]">
          <div className="flex items-center gap-1">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${intensity}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full", colors.bg.replace("bg-", "bg-").replace("-50", "-400"))}
                style={{
                  boxShadow: `0 0 8px ${colors.glow}`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[30px] text-right">
              {intensity}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

