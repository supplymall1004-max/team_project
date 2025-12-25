/**
 * @file components/games/level-up-animation.tsx
 * @description 레벨업 애니메이션 컴포넌트
 *
 * 레벨업 시 축하 애니메이션을 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 레벨업 축하 애니메이션 (메이플스토리 스타일)
 * 2. 현재 레벨 및 경험치 바 표시
 * 3. 다음 레벨까지 필요한 경험치 표시
 * 4. 레벨업 보상 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Progress
 * - @/lib/game/level-system: LevelData, calculateLevelProgress
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Sparkles, X } from "lucide-react";
import type { LevelData } from "@/lib/game/level-system";
import { calculateLevelProgress } from "@/lib/game/level-system";

interface LevelUpAnimationProps {
  levelData: LevelData;
  showAnimation?: boolean;
  rewardPoints?: number;
  skinId?: string;
  onClose?: () => void;
}

export function LevelUpAnimation({
  levelData,
  showAnimation = false,
  rewardPoints,
  skinId,
  onClose,
}: LevelUpAnimationProps) {
  const [show, setShow] = useState(showAnimation);
  const progress = calculateLevelProgress(levelData);

  useEffect(() => {
    setShow(showAnimation);
  }, [showAnimation]);

  // 3초 후 자동으로 닫기
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setShow(false);
          onClose?.();
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative"
        >
          <Card className="bg-gradient-to-br from-yellow-900/90 to-orange-900/90 border-4 border-yellow-500 shadow-2xl min-w-[400px]">
            <CardContent className="p-8 text-center">
              {/* 닫기 버튼 */}
              {onClose && (
                <button
                  onClick={() => {
                    setShow(false);
                    onClose();
                  }}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* 레벨업 텍스트 */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <h2 className="text-4xl font-bold text-yellow-400 mb-2">
                  LEVEL UP!
                </h2>
                <p className="text-2xl font-bold text-white">
                  레벨 {levelData.level}
                </p>
              </motion.div>

              {/* 트로피 아이콘 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <Trophy className="w-24 h-24 mx-auto text-yellow-400" />
              </motion.div>

              {/* 반짝이는 효과 */}
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
                className="absolute inset-0 pointer-events-none"
              >
                <Sparkles className="w-full h-full text-yellow-400/30" />
              </motion.div>

              {/* 보상 표시 */}
              {(rewardPoints || skinId) && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 space-y-2"
                >
                  {rewardPoints && (
                    <p className="text-lg text-yellow-300">
                      보상: {rewardPoints} 포인트 획득! 🎁
                    </p>
                  )}
                  {skinId && (
                    <p className="text-lg text-yellow-300">
                      특별 스킨 해금! ✨
                    </p>
                  )}
                </motion.div>
              )}

              {/* 경험치 바 */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-6"
              >
                <div className="mb-2 flex justify-between text-sm text-gray-300">
                  <span>경험치</span>
                  <span>
                    {levelData.experience} / {levelData.experienceToNextLevel}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-gray-400 mt-1">
                  다음 레벨까지 {levelData.experienceToNextLevel - levelData.experience} 경험치 필요
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 레벨 정보 표시 컴포넌트 (애니메이션 없이)
 */
interface LevelDisplayProps {
  levelData: LevelData;
  className?: string;
}

export function LevelDisplay({ levelData, className }: LevelDisplayProps) {
  const progress = calculateLevelProgress(levelData);

  return (
    <Card className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-white">레벨 {levelData.level}</span>
          </div>
          <span className="text-sm text-gray-400">
            {levelData.experience} / {levelData.experienceToNextLevel} EXP
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
}

