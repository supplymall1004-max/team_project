/**
 * @file cooking-mode.tsx
 * @description 요리 시작 모드 컴포넌트
 *
 * 주요 기능:
 * 1. 단계별 진행 표시
 * 2. 타이머 기능
 * 3. 재료 체크리스트
 * 4. 단계 완료 체크
 */

"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, X, ArrowLeft, ArrowRight } from "lucide-react";
import { RecipeDetail } from "@/types/recipe";
import { formatCookingTime } from "@/lib/recipes/utils";
import { Button } from "@/components/ui/button";
import { RecipeStepCard } from "./recipe-step-card";

interface CookingModeProps {
  recipe: RecipeDetail;
  checkedIngredients: Set<string>;
  onIngredientToggle: (id: string) => void;
  onExit: () => void;
}

export function CookingMode({
  recipe,
  checkedIngredients,
  onIngredientToggle,
  onExit,
}: CookingModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentStep = recipe.steps[currentStepIndex];
  const hasTimer = currentStep?.timer_minutes !== null;

  // 타이머 효과
  useEffect(() => {
    if (!isTimerRunning || timerSeconds === null || timerSeconds <= 0) {
      setIsTimerRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleStartTimer = () => {
    if (currentStep?.timer_minutes) {
      console.groupCollapsed("[CookingMode] 타이머 시작");
      console.log("stepNumber", currentStep.step_number);
      console.log("minutes", currentStep.timer_minutes);
      console.groupEnd();
      setTimerSeconds(currentStep.timer_minutes * 60);
      setIsTimerRunning(true);
    }
  };

  const handleStopTimer = () => {
    console.groupCollapsed("[CookingMode] 타이머 중지");
    console.groupEnd();
    setIsTimerRunning(false);
  };

  const handleCompleteStep = () => {
    console.groupCollapsed("[CookingMode] 단계 완료");
    console.log("stepNumber", currentStep.step_number);
    console.groupEnd();
    setCompletedSteps((prev) => new Set([...prev, currentStep.step_number]));
  };

  const handleNextStep = () => {
    if (currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">요리 시작 모드</h2>
          <p className="text-muted-foreground">
            단계 {currentStepIndex + 1} / {recipe.steps.length}
          </p>
        </div>
        <Button variant="outline" onClick={onExit}>
          <X className="h-4 w-4 mr-2" />
          종료
        </Button>
      </div>

      {/* 타이머 (있는 경우) */}
      {hasTimer && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">타이머</p>
                <p className="text-2xl font-bold text-orange-600">
                  {timerSeconds !== null
                    ? formatTimer(timerSeconds)
                    : formatCookingTime(currentStep.timer_minutes!)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isTimerRunning && timerSeconds === null && (
                <Button onClick={handleStartTimer}>
                  <Clock className="h-4 w-4 mr-2" />
                  시작
                </Button>
              )}
              {isTimerRunning && (
                <Button variant="destructive" onClick={handleStopTimer}>
                  중지
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 현재 단계 카드 */}
      {currentStep && (
        <div className="space-y-4">
          <RecipeStepCard step={currentStep} />
          <div className="flex justify-center">
            <Button
              onClick={handleCompleteStep}
              disabled={completedSteps.has(currentStep.step_number)}
              variant={
                completedSteps.has(currentStep.step_number)
                  ? "secondary"
                  : "default"
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {completedSteps.has(currentStep.step_number)
                ? "완료됨"
                : "단계 완료"}
            </Button>
          </div>
        </div>
      )}

      {/* 재료 체크리스트 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">재료 체크리스트</h3>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient) => {
            const isChecked = checkedIngredients.has(ingredient.id);
            return (
              <li
                key={ingredient.id}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onIngredientToggle(ingredient.id)}
              >
                <CheckCircle2
                  className={`h-5 w-5 flex-shrink-0 ${
                    isChecked
                      ? "text-green-600 fill-green-600"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={isChecked ? "line-through text-muted-foreground" : ""}
                >
                  {ingredient.name}
                  {ingredient.quantity && ingredient.unit
                    ? ` ${ingredient.quantity}${ingredient.unit}`
                    : ingredient.quantity
                    ? ` ${ingredient.quantity}`
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          이전 단계
        </Button>
        <Button
          onClick={handleNextStep}
          disabled={currentStepIndex === recipe.steps.length - 1}
        >
          다음 단계
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

