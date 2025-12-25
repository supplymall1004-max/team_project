/**
 * @file components/games/medication-memory-game.tsx
 * @description 약물 복용 기억력 게임
 *
 * 약물 복용 시간과 종류를 기억하는 게임으로 실제 약물 복용 습관 개선에 도움을 줍니다.
 *
 * 주요 기능:
 * 1. 약물 카드 기억 게임
 * 2. 시간대별 약물 복용 순서 맞추기
 * 3. 점수 및 보상 시스템
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/actions/game/save-minigame-record: 게임 기록 저장
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Clock, Trophy, RotateCcw } from "lucide-react";
import { saveMinigameRecord } from "@/actions/game/save-minigame-record";

interface MedicationCard {
  id: string;
  name: string;
  time: string; // "아침", "점심", "저녁", "취침전"
  color: string;
}

interface MedicationMemoryGameProps {
  memberId?: string;
  onComplete?: (score: number) => void;
}

const MEDICATION_TIMES = ["아침", "점심", "저녁", "취침전"] as const;
const COLORS = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"];

export function MedicationMemoryGame({ memberId, onComplete }: MedicationMemoryGameProps) {
  const [gameState, setGameState] = useState<"waiting" | "memorizing" | "playing" | "finished">("waiting");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [medications, setMedications] = useState<MedicationCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [correctOrder, setCorrectOrder] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 게임 초기화
  const initializeGame = () => {
    const numMedications = Math.min(3 + level, 6); // 레벨에 따라 약물 수 증가
    const newMedications: MedicationCard[] = [];

    for (let i = 0; i < numMedications; i++) {
      const timeIndex = i % MEDICATION_TIMES.length;
      newMedications.push({
        id: `med-${i}`,
        name: `약물 ${i + 1}`,
        time: MEDICATION_TIMES[timeIndex],
        color: COLORS[timeIndex],
      });
    }

    // 시간대별로 정렬된 순서 저장
    const sorted = [...newMedications].sort((a, b) => {
      const timeOrder = MEDICATION_TIMES.indexOf(a.time as typeof MEDICATION_TIMES[number]) - 
                       MEDICATION_TIMES.indexOf(b.time as typeof MEDICATION_TIMES[number]);
      return timeOrder;
    });
    setCorrectOrder(sorted.map(m => m.id));
    setMedications(newMedications);
    setSelectedCards([]);
    setGameState("memorizing");
  };

  // 카드 선택
  const handleCardSelect = (cardId: string) => {
    if (gameState !== "playing" || selectedCards.includes(cardId)) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    // 모든 카드를 선택했을 때 결과 확인
    if (newSelected.length === medications.length) {
      checkAnswer(newSelected);
    }
  };

  // 정답 확인
  const checkAnswer = (selected: string[]) => {
    const isCorrectAnswer = selected.every((id, index) => id === correctOrder[index]);
    setIsCorrect(isCorrectAnswer);
    setShowResult(true);

    if (isCorrectAnswer) {
      const points = medications.length * 10 * level;
      setScore(prev => prev + points);
      
      // 게임 기록 저장
      if (memberId) {
        saveMinigameRecord({
          memberId,
          gameType: "medication_memory",
          score: points,
          completed: true,
        }).catch(console.error);
      }
    }

    setTimeout(() => {
      if (isCorrectAnswer) {
        setLevel(prev => prev + 1);
        initializeGame();
      } else {
        setGameState("finished");
      }
    }, 2000);
  };

  // 게임 시작
  const handleStart = () => {
    initializeGame();
  };

  // 게임 재시작
  const handleRestart = () => {
    setLevel(1);
    setScore(0);
    setGameState("waiting");
    setShowResult(false);
  };

  // 암기 시간 종료 후 게임 시작
  useEffect(() => {
    if (gameState === "memorizing") {
      const timer = setTimeout(() => {
        setGameState("playing");
        // 카드 순서 섞기
        setMedications(prev => [...prev].sort(() => Math.random() - 0.5));
      }, 3000 + level * 1000); // 레벨이 올라갈수록 암기 시간 증가

      return () => clearTimeout(timer);
    }
  }, [gameState, level]);

  if (gameState === "waiting") {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Pill className="w-5 h-5 text-purple-400" />
            약물 복용 기억력 게임
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            약물 복용 시간대별 순서를 기억하고 맞춰보세요!
          </p>
          <Button onClick={handleStart} className="w-full">
            게임 시작
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameState === "finished") {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-400" />
            게임 종료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">최종 점수</p>
            <p className="text-4xl font-bold text-purple-400">{score}</p>
            <p className="text-gray-300 mt-4">레벨 {level - 1} 달성!</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRestart} className="flex-1" variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 시작
            </Button>
            {onComplete && (
              <Button onClick={() => onComplete(score)} className="flex-1">
                완료
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-400" />
            약물 복용 기억력 게임
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>레벨 {level}</span>
            <span>점수: {score}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "memorizing" && (
          <div className="text-center py-8">
            <p className="text-xl font-bold text-white mb-4">약물 순서를 기억하세요!</p>
            <div className="grid grid-cols-2 gap-4">
              {medications.map((med, index) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${med.color} p-4 rounded-lg text-white text-center`}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-bold">{med.name}</p>
                  <p className="text-sm">{med.time}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div>
            <p className="text-center text-white mb-4">
              시간대별 순서대로 카드를 선택하세요
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence>
                {medications.map((med) => {
                  const isSelected = selectedCards.includes(med.id);
                  return (
                    <motion.button
                      key={med.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCardSelect(med.id)}
                      disabled={isSelected}
                      className={`${med.color} p-4 rounded-lg text-white text-center transition-opacity ${
                        isSelected ? "opacity-50" : "opacity-100"
                      }`}
                    >
                      <Pill className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-bold">{med.name}</p>
                      {isSelected && (
                        <p className="text-sm mt-1">
                          {selectedCards.indexOf(med.id) + 1}번째
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-4 rounded-lg ${
              isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            <p className="text-xl font-bold">
              {isCorrect ? "정답입니다! 🎉" : "틀렸습니다 😢"}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

