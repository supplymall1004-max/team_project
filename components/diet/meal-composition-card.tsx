/**
 * @file components/diet/meal-composition-card.tsx
 * @description 식사 구성 카드 컴포넌트 (밥+반찬+국)
 */

"use client";

import { useState } from "react";
import type { MealComposition, MealType } from "@/types/recipe";
import { MealCompositionDetailModal } from "./meal-composition-detail-modal";

interface MealCompositionCardProps {
  mealType: MealType;
  composition: MealComposition;
}

export function MealCompositionCard({
  mealType,
  composition,
}: MealCompositionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 디버깅 로그
  console.log(`[MealCompositionCard] ${mealType} composition:`, {
    rice: composition.rice?.title,
    sides: composition.sides?.map(s => s.title),
    soup: composition.soup?.title,
    compositionSummary: composition.compositionSummary,
  });

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 밥 */}
          {composition.rice && (
            <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-950">
              <p className="mb-1 text-sm font-medium text-amber-700 dark:text-amber-300">
                🍚 밥
              </p>
              <p className="font-semibold">{composition.rice.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {composition.rice.nutrition.calories}kcal
              </p>
            </div>
          )}

          {/* 반찬 */}
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
              🥬 반찬 ({composition.sides.length}개)
            </p>
            <div className="space-y-2">
              {composition.sides.map((side, index) => (
                <div
                  key={index}
                  className="rounded-md bg-green-50 p-3 dark:bg-green-950"
                >
                  <p className="font-semibold">{side.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {side.nutrition.calories}kcal
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 국/찌개 */}
        {composition.soup && (
          <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950">
            <p className="mb-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              🥣 국/찌개
            </p>
            <p className="font-semibold">{composition.soup.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {composition.soup.nutrition.calories}kcal
            </p>
          </div>
        )}

        {/* 총 영양 정보 */}
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            📊 총 영양 정보
          </p>
          <div className="grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">칼로리</p>
              <p className="text-lg font-bold">
                {Math.round(composition.totalNutrition.calories)}
              </p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">탄수화물</p>
              <p className="text-lg font-bold">
                {Math.round(composition.totalNutrition.carbs)}
              </p>
              <p className="text-xs text-gray-500">g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">단백질</p>
              <p className="text-lg font-bold">
                {Math.round(composition.totalNutrition.protein)}
              </p>
              <p className="text-xs text-gray-500">g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">지방</p>
              <p className="text-lg font-bold">
                {Math.round(composition.totalNutrition.fat)}
              </p>
              <p className="text-xs text-gray-500">g</p>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          클릭하여 상세 정보 보기 →
        </p>
      </div>

      {/* 상세 모달 */}
      <MealCompositionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mealType={mealType}
        composition={composition}
      />
    </>
  );
}

