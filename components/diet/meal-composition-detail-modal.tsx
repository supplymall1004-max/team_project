/**
 * @file components/diet/meal-composition-detail-modal.tsx
 * @description 식사 상세 모달 - 재료 목록, 조리 방법, 영양 정보
 */

"use client";

import { X } from "lucide-react";
import type { MealComposition, MealType } from "@/types/recipe";

interface MealCompositionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  composition: MealComposition;
}

export function MealCompositionDetailModal({
  isOpen,
  onClose,
  mealType,
  composition,
}: MealCompositionDetailModalProps) {
  if (!isOpen) return null;

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: "아침",
    lunch: "점심",
    dinner: "저녁",
    snack: "간식",
  };

  const allDishes = [
    composition.rice,
    ...composition.sides,
    composition.soup,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {mealTypeLabels[mealType]} 식단 상세
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 총 영양 정보 */}
        <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950 dark:to-indigo-950">
          <h3 className="mb-3 font-semibold">총 영양 정보</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                칼로리
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {composition.totalNutrition.calories}kcal
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                단백질
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {Math.round(composition.totalNutrition.protein)}g
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                탄수화물
              </p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(composition.totalNutrition.carbs)}g
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">지방</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(composition.totalNutrition.fat)}g
              </p>
            </div>
          </div>
        </div>

        {/* 각 요리 상세 */}
        <div className="space-y-6">
          {allDishes.map((dish, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <h4 className="mb-3 text-lg font-semibold">{dish!.title}</h4>

              {/* 재료 */}
              {dish!.ingredients && dish!.ingredients.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 font-medium">재료:</p>
                  <ul className="grid grid-cols-2 gap-2 text-sm">
                    {dish!.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="text-gray-400">•</span>
                        <span>
                          {ing.name} {ing.amount} {ing.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 조리 방법 */}
              {dish!.instructions && (
                <div className="mb-3">
                  <p className="mb-2 font-medium">조리 방법:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {dish!.instructions}
                  </p>
                </div>
              )}

              {/* 영양 정보 */}
              <div className="grid grid-cols-4 gap-2 rounded-md bg-gray-50 p-3 text-center text-sm dark:bg-gray-900">
                <div>
                  <p className="text-xs text-gray-500">칼로리</p>
                  <p className="font-semibold">
                    {dish!.nutrition.calories}kcal
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">단백질</p>
                  <p className="font-semibold">
                    {Math.round(dish!.nutrition.protein)}g
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">탄수화물</p>
                  <p className="font-semibold">
                    {Math.round(dish!.nutrition.carbs)}g
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">지방</p>
                  <p className="font-semibold">
                    {Math.round(dish!.nutrition.fat)}g
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 닫기 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-6 py-2 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

