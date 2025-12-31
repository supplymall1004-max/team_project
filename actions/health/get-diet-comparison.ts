/**
 * @file actions/health/get-diet-comparison.ts
 * @description 식단 비교 데이터 조회 Server Action
 */

"use server";

import { getActualDietRecordsByDate } from "@/lib/storage/actual-diet-storage";
import { getDietPlan } from "@/lib/storage/diet-storage";
import type { NutritionInfo } from "@/types/health";

export interface DietComparisonData {
  recommended: NutritionInfo;
  actual: NutritionInfo;
  differences: Array<{
    nutrient: keyof NutritionInfo;
    name: string;
    recommended: number;
    actual: number;
    difference: number;
    percentage: number;
    status: "good" | "warning" | "excess";
  }>;
}

export async function getDietComparisonAction(
  userId: string,
  date: string
): Promise<{
  success: boolean;
  data?: DietComparisonData;
  error?: string;
}> {
  try {
    // 추천 식단 조회
    const recommendedPlan = await getDietPlan(userId, date);

    // 실제 섭취 식단 조회
    const actualRecords = await getActualDietRecordsByDate(userId, date);

    if (!recommendedPlan || actualRecords.length === 0) {
      return {
        success: false,
        error: "비교할 데이터가 없습니다",
      };
    }

    // 실제 섭취 영양소 집계
    const actualNutrition: NutritionInfo = actualRecords.reduce(
      (acc, record) => ({
        calories: (acc.calories || 0) + (record.nutrition.calories || 0),
        protein: (acc.protein || 0) + (record.nutrition.protein || 0),
        carbohydrates: (acc.carbohydrates || 0) + (record.nutrition.carbohydrates || 0),
        fat: (acc.fat || 0) + (record.nutrition.fat || 0),
        sodium: (acc.sodium || 0) + (record.nutrition.sodium || 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
      }
    );

    // 추천 영양소
    const recommendedNutrition: NutritionInfo =
      recommendedPlan.totalNutrition || {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
      };

    // 차이 계산
    const nutrients: Array<{
      key: keyof NutritionInfo;
      name: string;
      unit: string;
    }> = [
      { key: "calories", name: "칼로리", unit: "kcal" },
      { key: "protein", name: "단백질", unit: "g" },
      { key: "carbohydrates", name: "탄수화물", unit: "g" },
      { key: "fat", name: "지방", unit: "g" },
      { key: "sodium", name: "나트륨", unit: "mg" },
    ];

    const differences = nutrients
      .filter((n) => recommendedNutrition[n.key] > 0)
      .map(({ key, name }) => {
        const recommended = recommendedNutrition[key] || 0;
        const actual = actualNutrition[key] || 0;
        const difference = actual - recommended;
        const percentage = recommended > 0 ? (actual / recommended) * 100 : 0;

        let status: "good" | "warning" | "excess";
        if (percentage >= 90 && percentage <= 110) {
          status = "good";
        } else if (percentage < 70 || percentage > 130) {
          status = "excess";
        } else {
          status = "warning";
        }

        return {
          nutrient: key,
          name,
          recommended,
          actual,
          difference,
          percentage: Math.round(percentage),
          status,
        };
      });

    return {
      success: true,
      data: {
        recommended: recommendedNutrition,
        actual: actualNutrition,
        differences,
      },
    };
  } catch (error) {
    console.error("[GetDietComparison] 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

