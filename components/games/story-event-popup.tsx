/**
 * @file components/games/story-event-popup.tsx
 * @description 스토리 이벤트 UI
 *
 * 건강 관리 스토리 이벤트를 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 스토리 이벤트 팝업 표시
 * 2. 스토리 선택지 표시
 * 3. 선택 결과 표시
 * 4. 보상 표시
 *
 * @dependencies
 * - react: useState
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/lib/game/story-system: StoryEvent, StoryChoice
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Sparkles } from "lucide-react";
import type { StoryEvent, StoryChoice } from "@/lib/game/story-system";

interface StoryEventPopupProps {
  event: StoryEvent;
  onChoiceSelect?: (choice: StoryChoice) => void;
  onClose?: () => void;
}

export function StoryEventPopup({
  event,
  onChoiceSelect,
  onClose,
}: StoryEventPopupProps) {
  const [selectedChoice, setSelectedChoice] = useState<StoryChoice | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleChoiceSelect = (choice: StoryChoice) => {
    setSelectedChoice(choice);
    setShowResult(true);
    onChoiceSelect?.(choice);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
          <Card className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-4 border-purple-500 shadow-2xl min-w-[500px] max-w-[600px]">
            <CardContent className="p-8">
              {/* 닫기 버튼 */}
              {onClose && !showResult && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* 스토리 아이콘 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-center mb-4"
              >
                <div className="text-6xl mb-2">{event.icon}</div>
                <BookOpen className="w-8 h-8 mx-auto text-purple-400" />
              </motion.div>

              {/* 스토리 제목 */}
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white text-center mb-2"
              >
                {event.title}
              </motion.h2>

              {/* 스토리 설명 */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-center mb-6"
              >
                {event.description}
              </motion.p>

              {/* 선택지 또는 결과 */}
              {!showResult ? (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <p className="text-white font-bold mb-4 text-center">어떻게 하시겠어요?</p>
                  {event.choices.map((choice, index) => (
                    <Button
                      key={choice.id}
                      onClick={() => handleChoiceSelect(choice)}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-left justify-start"
                      variant="outline"
                    >
                      {choice.text}
                    </Button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4 rounded-lg bg-green-500/20 border-2 border-green-500"
                >
                  <p className="text-xl font-bold text-green-400 mb-2">
                    {selectedChoice?.result}
                  </p>
                  {selectedChoice?.rewardPoints && (
                    <p className="text-white">
                      보상: {selectedChoice.rewardPoints} 포인트 획득! 🎁
                    </p>
                  )}
                  {selectedChoice?.healthScoreChange && (
                    <p className="text-white mt-2">
                      건강 점수 +{selectedChoice.healthScoreChange}점
                    </p>
                  )}
                  {onClose && (
                    <Button
                      onClick={onClose}
                      className="mt-4"
                      variant="outline"
                    >
                      닫기
                    </Button>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

