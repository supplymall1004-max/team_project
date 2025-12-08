/**
 * @file components/diet/meal-nutrition-charts.tsx
 * @description 식단 영양소 시각화 차트 컴포넌트
 *
 * 주요 기능:
 * 1. 식단의 총 영양소를 도넛 차트와 레이더 차트로 시각화
 * 2. 기존 NutritionCharts 컴포넌트 활용
 */

"use client";

import { RecipeNutrition } from "@/types/recipe";
import { NutritionCharts } from "@/components/charts/nutrition-charts";

interface MealNutritionChartsProps {
  nutrition: RecipeNutrition;
}

export function MealNutritionCharts({
  nutrition,
}: MealNutritionChartsProps) {
  console.group("[MealNutritionCharts] 영양소 차트 렌더링");
  console.log("nutrition:", nutrition);
  console.groupEnd();

  // RecipeNutrition을 NutritionCharts가 기대하는 형식으로 변환
  const nutritionInfo = {
    calories: nutrition.calories || 0,
    carbohydrate: nutrition.carbs || 0,
    protein: nutrition.protein || 0,
    fat: nutrition.fat || 0,
    sodium: nutrition.sodium || 0,
  };

  return <NutritionCharts nutrition={nutritionInfo} />;
}













