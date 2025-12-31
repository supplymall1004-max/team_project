/**
 * @file actions/health/analyze-meal-photo.ts
 * @description 식사 사진 분석 Server Action
 *
 * 클라이언트에서 업로드한 식사 사진을 분석하고 결과를 저장합니다.
 */

"use server";

import { analyzeMealPhoto } from "@/lib/gemini/food-analyzer";
import {
  saveMealPhoto,
  updateMealPhotoAnalysis,
  type MealPhotoAnalysis,
} from "@/lib/storage/meal-photo-storage";
import { saveActualDietRecord } from "@/lib/storage/actual-diet-storage";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

export interface AnalyzeMealPhotoResult {
  success: boolean;
  photoId?: string;
  analysis?: MealPhotoAnalysis;
  error?: string;
}

/**
 * 식사 사진 분석 및 저장
 */
export async function analyzeMealPhotoAction(
  imageBase64: string,
  date: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
): Promise<AnalyzeMealPhotoResult> {
  try {
    // 사용자 인증 확인
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "인증이 필요합니다",
      };
    }

    const supabase = await createClerkSupabaseClient();
    
    // 사용자 ID 조회 (Clerk ID를 Supabase user_id로 변환)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    const userId = userData.id;

    // 1. 이미지를 임시 파일로 변환하여 저장 (클라이언트에서 이미 Base64로 변환됨)
    // 여기서는 분석만 수행하고, 실제 저장은 클라이언트에서 처리

    // 2. Gemini로 식사 사진 분석
    const analysisResult = await analyzeMealPhoto(imageBase64);

    // 3. 분석 결과를 MealPhotoAnalysis 형식으로 변환
    const mealPhotoAnalysis: MealPhotoAnalysis = {
      foods: analysisResult.foods.map((food) => ({
        name: food.name,
        confidence: food.confidence,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        sodium: food.sodium,
      })),
      totalNutrition: analysisResult.totalNutrition,
      analyzedAt: new Date().toISOString(),
    };

    // 4. 실제 섭취 식단 기록 저장 (클라이언트에서 처리하도록 변경 필요)
    // 여기서는 분석 결과만 반환

    return {
      success: true,
      analysis: mealPhotoAnalysis,
    };
  } catch (error) {
    console.error("[AnalyzeMealPhoto] 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

