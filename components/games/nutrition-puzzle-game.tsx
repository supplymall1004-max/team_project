/**
 * @file components/games/nutrition-puzzle-game.tsx
 * @description 영양 퍼즐 게임
 *
 * 영양소 균형을 맞추는 퍼즐 게임으로 영양 지식 습득에 도움을 줍니다.
 *
 * 주요 기능:
 * 1. 영양소 카드 매칭
 * 2. 균형잡힌 식단 만들기
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
import { Apple, Trophy, RotateCcw, CheckCircle2 } from "lucide-react";
import { saveMinigameRecord } from "@/actions/game/save-minigame-record";

interface NutritionCard {
  id: string;
  name: string;
  category: "carbohydrate" | "protein" | "fat" | "vitamin" | "mineral";
  color: string;
  icon: string;
}

interface NutritionPuzzleGameProps {
  memberId?: string;
  onComplete?: (score: number) => void;
}

const NUTRITION_CATEGORIES = [
  { id: "carbohydrate", name: "탄수화물", color: "bg-yellow-500", icon: "🍞" },
  { id: "protein", name: "단백질", color: "bg-red-500", icon: "🥩" },
  { id: "fat", name: "지방", color: "bg-orange-500", icon: "🥑" },
  { id: "vitamin", name: "비타민", color: "bg-green-500", icon: "🥬" },
  { id: "mineral", name: "미네랄", color: "bg-blue-500", icon: "🥛" },
] as const;

const FOOD_ITEMS: NutritionCard[] = [
  { id: "rice", name: "쌀밥", category: "carbohydrate", color: "bg-yellow-500", icon: "🍚" },
  { id: "bread", name: "빵", category: "carbohydrate", color: "bg-yellow-500", icon: "🍞" },
  { id: "chicken", name: "닭가슴살", category: "protein", color: "bg-red-500", icon: "🍗" },
  { id: "beef", name: "소고기", category: "protein", color: "bg-red-500", icon: "🥩" },
  { id: "avocado", name: "아보카도", category: "fat", color: "bg-orange-500", icon: "🥑" },
  { id: "nuts", name: "견과류", category: "fat", color: "bg-orange-500", icon: "🥜" },
  { id: "spinach", name: "시금치", category: "vitamin", color: "bg-green-500", icon: "🥬" },
  { id: "carrot", name: "당근", category: "vitamin", color: "bg-green-500", icon: "🥕" },
  { id: "milk", name: "우유", category: "mineral", color: "bg-blue-500", icon: "🥛" },
  { id: "cheese", name: "치즈", category: "mineral", color: "bg-blue-500", icon: "🧀" },
];

export function NutritionPuzzleGame({ memberId, onComplete }: NutritionPuzzleGameProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedFoods, setSelectedFoods] = useState<NutritionCard[]>([]);
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [shuffledFoods, setShuffledFoods] = useState<NutritionCard[]>([]);
  const [showResult, setShowResult] = useState(false);

  // 게임 초기화
  const initializeGame = () => {
    const numCategories = Math.min(3 + level, 5);
    const categories = NUTRITION_CATEGORIES.slice(0, numCategories);
    const target = categories.map((c) => c.id);
    setTargetCategories(target);

    // 각 카테고리에서 2개씩 음식 선택
    const foods: NutritionCard[] = [];
    categories.forEach((category) => {
      const categoryFoods = FOOD_ITEMS.filter((f) => f.category === category.id);
      const selected = categoryFoods.slice(0, 2);
      foods.push(...selected);
    });

    // 추가 음식 섞기
    const extraFoods = FOOD_ITEMS.filter(
      (f) => !foods.some((sf) => sf.id === f.id)
    );
    const shuffled = [...foods, ...extraFoods.slice(0, 2)].sort(
      () => Math.random() - 0.5
    );

    setShuffledFoods(shuffled);
    setSelectedFoods([]);
    setShowResult(false);
  };

  // 음식 선택
  const handleFoodSelect = (food: NutritionCard) => {
    if (gameState !== "playing" || selectedFoods.some((f) => f.id === food.id))
      return;

    const newSelected = [...selectedFoods, food];
    setSelectedFoods(newSelected);

    // 목표 카테고리 수만큼 선택했을 때 결과 확인
    if (newSelected.length === targetCategories.length) {
      checkAnswer(newSelected);
    }
  };

  // 음식 제거
  const handleFoodRemove = (foodId: string) => {
    setSelectedFoods((prev) => prev.filter((f) => f.id !== foodId));
  };

  // 정답 확인
  const checkAnswer = (selected: NutritionCard[]) => {
    const selectedCategories = selected.map((f) => f.category);
    const isCorrect =
      targetCategories.every((cat) => selectedCategories.includes(cat as NutritionCard["category"])) &&
      selectedCategories.length === targetCategories.length;

    setShowResult(true);

    if (isCorrect) {
      const points = targetCategories.length * 50 * level;
      setScore((prev) => prev + points);

      // 게임 기록 저장
      if (memberId) {
        saveMinigameRecord({
          memberId,
          gameType: "nutrition_puzzle",
          score: points,
          completed: true,
        }).catch(console.error);
      }
    }

    setTimeout(() => {
      if (isCorrect) {
        setLevel((prev) => prev + 1);
        initializeGame();
      } else {
        setGameState("finished");
      }
    }, 2000);
  };

  // 게임 시작
  const handleStart = () => {
    setLevel(1);
    setScore(0);
    initializeGame();
    setGameState("playing");
  };

  // 게임 재시작
  const handleRestart = () => {
    setLevel(1);
    setScore(0);
    setGameState("waiting");
    setShowResult(false);
  };

  if (gameState === "waiting") {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Apple className="w-5 h-5 text-blue-400" />
            영양 퍼즐 게임
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            균형잡힌 식단을 만들기 위해 필요한 영양소 카테고리를 모두 선택하세요!
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
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-400" />
            게임 종료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">최종 점수</p>
            <p className="text-4xl font-bold text-blue-400">{score}</p>
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
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-blue-400" />
            영양 퍼즐 게임
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>레벨 {level}</span>
            <span>점수: {score}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-white mb-2">필요한 영양소 카테고리:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {targetCategories.map((catId) => {
              const category = NUTRITION_CATEGORIES.find((c) => c.id === catId);
              if (!category) return null;
              const isSelected = selectedFoods.some(
                (f) => f.category === catId
              );
              return (
                <div
                  key={catId}
                  className={`${category.color} px-3 py-1 rounded-full text-white text-sm flex items-center gap-1 ${
                    isSelected ? "opacity-50" : ""
                  }`}
                >
                  {category.icon} {category.name}
                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-white mb-2">선택한 음식 ({selectedFoods.length}/{targetCategories.length}):</p>
          <div className="flex flex-wrap gap-2 mb-4 min-h-[60px]">
            <AnimatePresence>
              {selectedFoods.map((food) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`${food.color} px-3 py-2 rounded-lg text-white text-sm flex items-center gap-2 cursor-pointer`}
                  onClick={() => handleFoodRemove(food.id)}
                >
                  <span>{food.icon}</span>
                  <span>{food.name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <p className="text-white mb-2">음식 선택:</p>
          <div className="grid grid-cols-3 gap-2">
            {shuffledFoods.map((food) => {
              const isSelected = selectedFoods.some((f) => f.id === food.id);
              return (
                <motion.button
                  key={food.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFoodSelect(food)}
                  disabled={isSelected || selectedFoods.length >= targetCategories.length}
                  className={`${food.color} p-4 rounded-lg text-white text-center transition-opacity ${
                    isSelected ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <div className="text-2xl mb-1">{food.icon}</div>
                  <div className="text-xs">{food.name}</div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 rounded-lg bg-green-500/20 text-green-400"
          >
            <p className="text-xl font-bold">
              {selectedFoods.some((f) =>
                targetCategories.includes(f.category)
              )
                ? "정답입니다! 🎉"
                : "틀렸습니다 😢"}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

