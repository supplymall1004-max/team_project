/**
 * @file actions/health/get-weekly-nutrition-analysis.ts
 * @description 일주일간 영양소 분석 Server Action
 */

"use server";

import { analyzeWeeklyNutrition } from "@/lib/health/weekly-nutrition-analysis";
import { getUserHealthProfile } from "@/lib/diet/queries";

export async function getWeeklyNutritionAnalysisAction(
  userId: string,
  weekStartDate: string
) {
  try {
    // 건강 프로필 조회
    const healthProfile = await getUserHealthProfile(userId);
    if (!healthProfile) {
      return {
        success: false,
        error: "건강 프로필을 찾을 수 없습니다",
      };
    }

    // 일주일간 영양소 분석
    const analysis = await analyzeWeeklyNutrition(
      userId,
      weekStartDate,
      healthProfile
    );

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error("[GetWeeklyNutritionAnalysis] 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

