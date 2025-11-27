/**
 * @file components/diet/daily-diet-view.tsx
 * @description 하루 식단 뷰 컴포넌트 - 아침/점심/저녁/간식 표시
 */

"use client";

import type { DailyDietPlan, MealComposition, RecipeDetailForDiet } from "@/types/recipe";
import { MealCompositionCard } from "./meal-composition-card";
import { MealCard } from "./meal-card";

interface DailyDietViewProps {
  diet: DailyDietPlan;
}

export function DailyDietView({ diet }: DailyDietViewProps) {
  return (
    <div className="space-y-6">
      {/* 총 영양 정보 */}
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950 dark:to-indigo-950">
        <h3 className="mb-3 text-lg font-semibold">오늘의 총 영양 정보</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">칼로리</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {diet.totalNutrition.calories}
              <span className="text-sm font-normal">kcal</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">단백질</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round(diet.totalNutrition.protein)}
              <span className="text-sm font-normal">g</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">탄수화물</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(diet.totalNutrition.carbs)}
              <span className="text-sm font-normal">g</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">지방</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(diet.totalNutrition.fat)}
              <span className="text-sm font-normal">g</span>
            </p>
          </div>
        </div>
      </div>

      {/* 아침 식사 */}
      {diet.breakfast && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span>🌅</span>
            <span>아침</span>
          </h3>
          {"rice" in diet.breakfast ? (
            <MealCompositionCard
              mealType="breakfast"
              composition={diet.breakfast as MealComposition}
            />
          ) : (
            <MealCard recipe={diet.breakfast as RecipeDetailForDiet} />
          )}
        </div>
      )}

      {/* 점심 식사 */}
      {diet.lunch && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span>☀️</span>
            <span>점심</span>
          </h3>
          {"rice" in diet.lunch ? (
            <MealCompositionCard mealType="lunch" composition={diet.lunch as MealComposition} />
          ) : (
            <MealCard recipe={diet.lunch as RecipeDetailForDiet} />
          )}
        </div>
      )}

      {/* 저녁 식사 */}
      {diet.dinner && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span>🌙</span>
            <span>저녁</span>
          </h3>
          {"rice" in diet.dinner ? (
            <MealCompositionCard mealType="dinner" composition={diet.dinner as MealComposition} />
          ) : (
            <MealCard recipe={diet.dinner as RecipeDetailForDiet} />
          )}
        </div>
      )}

      {/* 간식 */}
      {diet.snack && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span>🍎</span>
            <span>간식</span>
          </h3>
          <MealCard recipe={diet.snack} />
        </div>
      )}
    </div>
  );
}

