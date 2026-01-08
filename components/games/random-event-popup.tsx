/**
 * @file components/games/random-event-popup.tsx
 * @description 랜덤 이벤트 팝업 UI
 *
 * 랜덤 이벤트 발생 시 표시되는 팝업 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 이벤트 내용 및 보상 표시
 * 2. 이벤트 완료 버튼
 * 3. 이벤트 완료 시 보상 수령 애니메이션
 *
 * @dependencies
 * - react: useState
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/lib/game/random-events: RandomEvent
 * - @/actions/game/trigger-random-event: completeRandomEvent
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Gift, Sparkles } from "lucide-react";
import type { RandomEvent } from "@/lib/game/random-events";
import { completeRandomEvent } from "@/actions/game/trigger-random-event";

interface RandomEventPopupProps {
  event: RandomEvent;
  onComplete?: (rewardPoints: number) => void;
  onClose?: () => void;
}

export function RandomEventPopup({
  event,
  onComplete,
  onClose,
}: RandomEventPopupProps) {
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const result = await completeRandomEvent(event.id);
      if (result.success && result.rewardPoints) {
        setRewardPoints(result.rewardPoints);
        setCompleted(true);
        onComplete?.(result.rewardPoints);
      }
    } catch (error) {
      console.error("이벤트 완료 실패:", error);
    } finally {
      setCompleting(false);
    }
  };

  const getRarityColor = () => {
    switch (event.rarity) {
      case "epic":
        return "border-yellow-500 bg-yellow-500/10";
      case "rare":
        return "border-purple-500 bg-purple-500/10";
      default:
        return "border-blue-500 bg-blue-500/10";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative"
        >
          <Card className={`bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-4 ${getRarityColor()} shadow-2xl min-w-[400px] max-w-[500px]`}>
            <CardContent className="p-8">
              {/* 닫기 버튼 */}
              {onClose && !completed && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* 이벤트 아이콘 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-center mb-4"
              >
                <div className="text-6xl mb-2">{event.icon}</div>
                {event.rarity === "epic" && (
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
                )}
              </motion.div>

              {/* 이벤트 제목 */}
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white text-center mb-2"
              >
                {event.title}
              </motion.h2>

              {/* 이벤트 설명 */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-center mb-6"
              >
                {event.description}
              </motion.p>

              {/* 보상 표시 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-6"
              >
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <Gift className="w-5 h-5" />
                  <span className="text-lg font-bold">
                    보상: {event.rewardPoints} 포인트
                  </span>
                </div>
              </motion.div>

              {/* 완료 버튼 */}
              {!completed && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-2"
                >
                  <Button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {completing ? "처리 중..." : "이벤트 완료하기"}
                  </Button>
                </motion.div>
              )}

              {/* 완료 메시지 */}
              {completed && rewardPoints !== null && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4 rounded-lg bg-green-500/20 border-2 border-green-500"
                >
                  <p className="text-xl font-bold text-green-400 mb-2">
                    이벤트 완료! 🎉
                  </p>
                  <p className="text-white">
                    {rewardPoints} 포인트를 획득했습니다!
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

