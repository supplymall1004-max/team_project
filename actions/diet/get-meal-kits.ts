"use server";

/**
 * @file get-meal-kits.ts
 * @description 밀키트 목록 조회 Server Action
 *
 * Client Component에서 밀키트 목록을 조회하기 위한 Server Action입니다.
 * 서버 전용 함수인 getMealKits를 래핑하여 Client Component에서 사용할 수 있도록 합니다.
 */

import { getMealKits as getMealKitsService } from "@/lib/diet/meal-kit-service";
import type { MealType } from "@/types/health";

export interface GetMealKitsInput {
  category?: string;
  mealType?: MealType;
  useCoupang?: boolean;
}

/**
 * 밀키트 목록 조회 Server Action
 */
export async function getMealKits(input: GetMealKitsInput = {}) {
  console.group("[ServerAction][GetMealKits]");
  console.log("input:", input);

  try {
    const result = await getMealKitsService(input);
    console.log("result:", result.success ? "success" : "error");
    console.groupEnd();
    return result;
  } catch (error) {
    console.error("[ServerAction][GetMealKits] 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

