/**
 * @file lib/health/weekly-nutrition-analysis.ts
 * @description 일주일간 실제 섭취 식단 분석
 *
 * 사용자가 실제로 먹은 식단을 일주일간 분석하여 부족한 영양소를 알려줍니다.
 */

import { getWeeklyActualNutrition } from "@/lib/storage/actual-diet-storage";
import type { NutritionInfo, UserHealthProfile } from "@/types/health";

export interface WeeklyNutritionAnalysis {
  weekStartDate: string;
  actualNutrition: {
    total: NutritionInfo;
    average: NutritionInfo;
  };
  recommendedNutrition: NutritionInfo; // 목표 영양소 (일평균)
  deficiencies: Array<{
    nutrient: "calories" | "protein" | "carbs" | "fat" | "sodium";
    name: string;
    actual: number;
    recommended: number;
    deficiency: number; // 부족량
    percentage: number; // 목표 대비 비율 (%)
  }>;
  excesses: Array<{
    nutrient: "calories" | "protein" | "carbs" | "fat" | "sodium";
    name: string;
    actual: number;
    recommended: number;
    excess: number; // 초과량
    percentage: number; // 목표 대비 비율 (%)
  }>;
  recommendations: string[]; // 개선 권장사항
}

/**
 * 일주일간 영양소 분석
 */
export async function analyzeWeeklyNutrition(
  userId: string,
  weekStartDate: string,
  healthProfile: UserHealthProfile
): Promise<WeeklyNutritionAnalysis> {
  // 실제 섭취 영양소 조회
  const actualData = await getWeeklyActualNutrition(userId, weekStartDate);

  // 목표 영양소 계산 (일평균)
  const dailyCalorieGoal = healthProfile.daily_calorie_goal || 2000;
  
  // 매크로 목표 계산 (일반적인 비율: 단백질 15%, 탄수화물 50%, 지방 35%)
  const recommendedNutrition: NutritionInfo = {
    calories: dailyCalorieGoal,
    protein: Math.round((dailyCalorieGoal * 0.15) / 4), // 1g 단백질 = 4kcal
    carbohydrates: Math.round((dailyCalorieGoal * 0.50) / 4), // 1g 탄수화물 = 4kcal
    fat: Math.round((dailyCalorieGoal * 0.35) / 9), // 1g 지방 = 9kcal
    sodium: 2000, // 일반 권장량 (mg)
  };

  // 부족/초과 분석
  const deficiencies: WeeklyNutritionAnalysis["deficiencies"] = [];
  const excesses: WeeklyNutritionAnalysis["excesses"] = [];

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

  nutrients.forEach(({ key, name }) => {
    const actual = actualData.average[key] || 0;
    const recommended = recommendedNutrition[key] || 0;

    if (recommended === 0) return; // 목표가 없는 영양소는 제외

    const percentage = (actual / recommended) * 100;
    const difference = actual - recommended;

    if (percentage < 80) {
      // 목표의 80% 미만이면 부족
      deficiencies.push({
        nutrient: key as any,
        name,
        actual,
        recommended,
        deficiency: Math.abs(difference),
        percentage: Math.round(percentage),
      });
    } else if (percentage > 120) {
      // 목표의 120% 초과면 과다
      excesses.push({
        nutrient: key as any,
        name,
        actual,
        recommended,
        excess: difference,
        percentage: Math.round(percentage),
      });
    }
  });

  // 권장사항 생성
  const recommendations: string[] = [];

  if (deficiencies.length > 0) {
    const topDeficiency = deficiencies.sort(
      (a, b) => b.deficiency - a.deficiency
    )[0];
    recommendations.push(
      `${topDeficiency.name}이(가) 부족합니다. ${topDeficiency.name}이(가) 풍부한 음식을 추가로 섭취해보세요.`
    );
  }

  if (excesses.length > 0) {
    const topExcess = excesses.sort((a, b) => b.excess - a.excess)[0];
    recommendations.push(
      `${topExcess.name} 섭취량이 목표보다 많습니다. 균형 잡힌 식단을 위해 조절이 필요합니다.`
    );
  }

  if (deficiencies.length === 0 && excesses.length === 0) {
    recommendations.push("일주일간 영양소 섭취가 목표에 잘 맞습니다! 계속 유지해주세요.");
  }

  return {
    weekStartDate,
    actualNutrition: {
      total: actualData.total,
      average: actualData.average,
    },
    recommendedNutrition,
    deficiencies,
    excesses,
    recommendations,
  };
}

