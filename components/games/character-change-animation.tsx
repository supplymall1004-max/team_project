/**
 * @file components/games/character-change-animation.tsx
 * @description 캐릭터 변화 애니메이션 컴포넌트
 *
 * 캐릭터의 외형 변화를 시각적으로 표현하는 애니메이션 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 레벨업 시 캐릭터 변화 애니메이션
 * 2. 스킨 변경 시 캐릭터 변화 애니메이션
 * 3. 건강 상태 개선 시 캐릭터 변화 애니메이션
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Heart, TrendingUp } from "lucide-react";

interface CharacterChangeAnimationProps {
  changeType: "level_up" | "skin_change" | "health_improvement" | "stat_increase";
  oldImageUrl?: string;
  newImageUrl?: string;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export function CharacterChangeAnimation({
  changeType,
  oldImageUrl,
  newImageUrl,
  message,
  onComplete,
  duration = 2000,
}: CharacterChangeAnimationProps) {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<"fade_out" | "transition" | "fade_in">("fade_out");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("transition"), duration / 3);
    const timer2 = setTimeout(() => setPhase("fade_in"), (duration * 2) / 3);
    const timer3 = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [duration, onComplete]);

  if (!show) return null;

  const getChangeIcon = () => {
    switch (changeType) {
      case "level_up":
        return <Zap className="w-12 h-12 text-yellow-400" />;
      case "skin_change":
        return <Sparkles className="w-12 h-12 text-purple-400" />;
      case "health_improvement":
        return <Heart className="w-12 h-12 text-red-400" />;
      case "stat_increase":
        return <TrendingUp className="w-12 h-12 text-green-400" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "level_up":
        return "from-yellow-900/95 to-orange-900/95 border-yellow-500";
      case "skin_change":
        return "from-purple-900/95 to-pink-900/95 border-purple-500";
      case "health_improvement":
        return "from-red-900/95 to-pink-900/95 border-red-500";
      case "stat_increase":
        return "from-green-900/95 to-emerald-900/95 border-green-500";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-gradient-to-br ${getChangeColor()} border-4 rounded-lg p-8 shadow-2xl text-center min-w-[400px]`}
        >
          {/* 아이콘 */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mb-4 flex justify-center"
          >
            {getChangeIcon()}
          </motion.div>

          {/* 메시지 */}
          {message && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-bold text-white mb-4"
            >
              {message}
            </motion.p>
          )}

          {/* 캐릭터 이미지 전환 */}
          {(oldImageUrl || newImageUrl) && (
            <div className="relative w-32 h-32 mx-auto">
              <AnimatePresence mode="wait">
                {phase === "fade_out" && oldImageUrl && (
                  <motion.img
                    key="old"
                    src={oldImageUrl}
                    alt="Old character"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                {phase === "transition" && (
                  <motion.div
                    key="transition"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Sparkles className="w-16 h-16 text-yellow-400 animate-spin" />
                  </motion.div>
                )}
                {phase === "fade_in" && newImageUrl && (
                  <motion.img
                    key="new"
                    src={newImageUrl}
                    alt="New character"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

