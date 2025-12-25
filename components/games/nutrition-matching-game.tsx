/**
 * @file components/games/nutrition-matching-game.tsx
 * @description 영양소 맞추기 게임 UI
 *
 * 영양소와 음식을 매칭하는 게임 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 영양소와 음식 카드 표시
 * 2. 매칭 게임 로직
 * 3. 점수 및 보상 시스템
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/lib/game/quiz-system: NUTRITION_MATCHES, NutritionMatch
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Apple, Trophy, RotateCcw, CheckCircle2 } from "lucide-react";
import { NUTRITION_MATCHES, type NutritionMatch } from "@/lib/game/quiz-system";

interface NutritionMatchingGameProps {
  memberId?: string;
  onComplete?: (score: number) => void;
}

export function NutritionMatchingGame({
  memberId,
  onComplete,
}: NutritionMatchingGameProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting");
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState<NutritionMatch[]>([]);
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 게임 초기화
  const initializeGame = () => {
    // 영양소와 음식을 섞어서 게임 생성
    const shuffled = [...NUTRITION_MATCHES].sort(() => Math.random() - 0.5);
    setMatches(shuffled);
    setSelectedNutrient(null);
    setSelectedFood(null);
    setMatchedPairs(new Set());
    setScore(0);
    setGameState("playing");
  };

  // 영양소 선택
  const handleNutrientSelect = (nutrient: string) => {
    if (gameState !== "playing" || matchedPairs.has(nutrient)) return;
    setSelectedNutrient(nutrient);
    checkMatch(nutrient, selectedFood);
  };

  // 음식 선택
  const handleFoodSelect = (food: string) => {
    if (gameState !== "playing") return;
    setSelectedFood(food);
    checkMatch(selectedNutrient, food);
  };

  // 매칭 확인
  const checkMatch = (nutrient: string | null, food: string | null) => {
    if (!nutrient || !food) return;

    const match = matches.find(
      (m) => m.nutrient === nutrient && m.food === food
    );
    const correct = !!match;

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setMatchedPairs((prev) => new Set([...prev, nutrient]));
      const points = 50;
      setScore((prev) => prev + points);

      // 모든 매칭 완료 확인
      if (matchedPairs.size + 1 >= matches.length) {
        setTimeout(() => {
          setGameState("finished");
        }, 1000);
      }
    }

    setTimeout(() => {
      setSelectedNutrient(null);
      setSelectedFood(null);
      setShowResult(false);
    }, 1500);
  };

  // 게임 시작
  const handleStart = () => {
    initializeGame();
  };

  // 게임 재시작
  const handleRestart = () => {
    setGameState("waiting");
    setScore(0);
  };

  if (gameState === "waiting") {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Apple className="w-5 h-5 text-green-400" />
            영양소 맞추기 게임
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            영양소와 음식을 올바르게 매칭해보세요!
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
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-400" />
            게임 종료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">최종 점수</p>
            <p className="text-4xl font-bold text-green-400">{score}</p>
            <p className="text-gray-300 mt-4">
              모든 매칭을 완료했습니다! 🎉
            </p>
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

  const nutrients = Array.from(new Set(matches.map((m) => m.nutrient)));
  const foods = Array.from(new Set(matches.map((m) => m.food)));

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-green-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-green-400" />
            영양소 맞추기 게임
          </div>
          <div className="text-sm text-gray-400">
            점수: {score} | 완료: {matchedPairs.size} / {matches.length}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 영양소 카드 */}
        <div>
          <p className="text-white mb-2 font-bold">영양소 선택:</p>
          <div className="grid grid-cols-2 gap-2">
            {nutrients.map((nutrient) => {
              const isMatched = matchedPairs.has(nutrient);
              const isSelected = selectedNutrient === nutrient;

              return (
                <motion.button
                  key={nutrient}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNutrientSelect(nutrient)}
                  disabled={isMatched}
                  className={`p-3 rounded-lg border-2 text-left ${
                    isMatched
                      ? "bg-green-500/20 border-green-500 opacity-50"
                      : isSelected
                      ? "bg-blue-500/20 border-blue-500"
                      : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  {isMatched && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 float-right" />
                  )}
                  <p className="text-white font-bold">{nutrient}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 음식 카드 */}
        <div>
          <p className="text-white mb-2 font-bold">음식 선택:</p>
          <div className="grid grid-cols-2 gap-2">
            {foods.map((food) => {
              const isSelected = selectedFood === food;
              const isMatched = Array.from(matchedPairs).some((nutrient) => {
                const match = matches.find((m) => m.nutrient === nutrient);
                return match?.food === food;
              });

              return (
                <motion.button
                  key={food}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFoodSelect(food)}
                  disabled={isMatched}
                  className={`p-3 rounded-lg border-2 text-left ${
                    isMatched
                      ? "bg-green-500/20 border-green-500 opacity-50"
                      : isSelected
                      ? "bg-blue-500/20 border-blue-500"
                      : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  {isMatched && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 float-right" />
                  )}
                  <p className="text-white font-bold">{food}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 결과 표시 */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              isCorrect
                ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                : "bg-red-500/20 border-2 border-red-500 text-red-400"
            }`}
          >
            <p className="text-lg font-bold text-center">
              {isCorrect ? "정답입니다! 🎉" : "틀렸습니다 😢"}
            </p>
            {isCorrect && selectedNutrient && (
              <p className="text-sm text-center mt-2 text-gray-300">
                {matches.find((m) => m.nutrient === selectedNutrient)?.description}
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

