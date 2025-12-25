/**
 * @file components/health/character/status-bars.tsx
 * @description 게임 스타일 상태 바 컴포넌트
 *
 * RPG 게임의 HP/MP 바처럼 건강 점수와 에너지를 표시합니다.
 *
 * @dependencies
 * - framer-motion: motion
 * - @/lib/utils: cn
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  label: string;
  value: number; // 0-100
  maxValue?: number; // 기본값: 100
  color?: "green" | "blue" | "yellow" | "red" | "purple";
  showValue?: boolean; // 값 표시 여부
  className?: string;
}

/**
 * 게임 스타일 상태 바 컴포넌트
 */
export function StatusBar({
  label,
  value,
  maxValue = 100,
  color = "green",
  showValue = true,
  className,
}: StatusBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  const colorClasses = {
    green: {
      bg: "bg-gradient-to-r from-green-500 to-green-400",
      glow: "rgba(34, 197, 94, 0.6)",
      text: "text-green-400",
    },
    blue: {
      bg: "bg-gradient-to-r from-blue-500 to-blue-400",
      glow: "rgba(59, 130, 246, 0.6)",
      text: "text-blue-400",
    },
    yellow: {
      bg: "bg-gradient-to-r from-yellow-500 to-yellow-400",
      glow: "rgba(234, 179, 8, 0.6)",
      text: "text-yellow-400",
    },
    red: {
      bg: "bg-gradient-to-r from-red-500 to-red-400",
      glow: "rgba(239, 68, 68, 0.6)",
      text: "text-red-400",
    },
    purple: {
      bg: "bg-gradient-to-r from-purple-500 to-purple-400",
      glow: "rgba(168, 85, 247, 0.6)",
      text: "text-purple-400",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        {showValue && (
          <span className={cn("text-sm font-bold", colors.text)}>
            {Math.round(value)}/{maxValue}
          </span>
        )}
      </div>
      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full", colors.bg)}
          style={{
            boxShadow: `0 0 10px ${colors.glow}`,
          }}
        />
        {/* 게이지 내부 패턴 효과 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
          }}
        />
      </div>
    </div>
  );
}

interface StatusBarsProps {
  healthScore: number; // HP 바
  energy?: number; // MP/에너지 바 (활동량 기반, 선택적)
  className?: string;
}

/**
 * 건강 점수와 에너지를 표시하는 상태 바 그룹
 */
export function StatusBars({ healthScore, energy, className }: StatusBarsProps) {
  // 에너지는 활동량 기반으로 계산 (기본값: 건강 점수와 동일)
  const energyValue = energy ?? healthScore;

  return (
    <div className={cn("space-y-3", className)}>
      <StatusBar
        label="건강 점수 (HP)"
        value={healthScore}
        color={healthScore >= 80 ? "green" : healthScore >= 60 ? "blue" : healthScore >= 40 ? "yellow" : "red"}
        showValue={true}
      />
      {energy !== undefined && (
        <StatusBar
          label="에너지 (MP)"
          value={energyValue}
          color="purple"
          showValue={true}
        />
      )}
    </div>
  );
}

