/**
 * @file components/health/character/speech-bubble.tsx
 * @description 게임 스타일 말풍선 컴포넌트
 *
 * 캐릭터의 감정 상태를 말풍선으로 표시합니다.
 * Framer Motion을 사용하여 나타나기/사라지기 애니메이션을 적용합니다.
 *
 * @dependencies
 * - framer-motion: motion
 * - @/types/character: EmotionState
 * - @/lib/animations/character-animations: emotionColors
 * - lucide-react: X
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { EmotionState } from "@/types/character";
import { emotionColors } from "@/lib/animations/character-animations";

interface SpeechBubbleProps {
  emotion: EmotionState;
  memberName: string;
  healthScore?: number;
  autoHide?: boolean; // 자동으로 사라지기 (기본: true)
  autoHideDelay?: number; // 자동 사라지기 지연 시간 (ms, 기본: 5000)
  onClose?: () => void;
  className?: string;
}

/**
 * 게임 스타일 말풍선 컴포넌트
 */
export function SpeechBubble({
  emotion,
  memberName,
  healthScore,
  autoHide = true,
  autoHideDelay = 5000,
  onClose,
  className,
}: SpeechBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const colors = emotionColors[emotion.emotion];

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose?.();
        }, 300); // 애니메이션 완료 후 콜백 호출
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className={cn(
            "absolute -top-20 left-1/2 -translate-x-1/2 z-50",
            "min-w-[200px] max-w-[300px]",
            "bg-white dark:bg-gray-800",
            "rounded-lg shadow-lg",
            "border-2",
            colors.border,
            "p-3",
            "relative",
            className
          )}
          style={{
            boxShadow: `0 4px 20px ${colors.glow}`,
          }}
        >
          {/* 말풍선 꼬리 */}
          <div
            className={cn(
              "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full",
              "w-0 h-0",
              "border-l-[10px] border-r-[10px] border-t-[10px]",
              "border-l-transparent border-r-transparent",
              "border-t-white dark:border-t-gray-800"
            )}
          />

          {/* 닫기 버튼 */}
          {!autoHide && onClose && (
            <button
              onClick={handleClose}
              className={cn(
                "absolute top-1 right-1",
                "w-5 h-5 rounded-full",
                "flex items-center justify-center",
                "bg-gray-200 dark:bg-gray-700",
                "hover:bg-gray-300 dark:hover:bg-gray-600",
                "transition-colors",
                "text-gray-600 dark:text-gray-300"
              )}
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* 메시지 내용 */}
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", colors.text)}>
              {emotion.message}
            </p>
            {emotion.reason && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {emotion.reason}
              </p>
            )}
          </div>

          {/* 감정 강도 표시 (선택적) */}
          {emotion.intensity >= 70 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${emotion.intensity}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn("h-full", colors.bg.replace("bg-", "bg-").replace("-50", "-400"))}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {emotion.intensity}%
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

