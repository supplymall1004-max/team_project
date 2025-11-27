/**
 * @file lib/diet/nutrition-totals.ts
 * @description 영양소 합계 계산 및 배율 적용 헬퍼
 */

import type { NutritionInfo } from "@/types/health";

export const EMPTY_NUTRITION_TOTALS: NutritionInfo = {
  calories: 0,
  carbohydrates: 0,
  protein: 0,
  fat: 0,
  sodium: null,
};

const toNumber = (value: number | null | undefined): number => {
  const numericValue = value ?? 0;
  return Number.isFinite(numericValue) ? Number(numericValue) : 0;
};

/**
 * 주어진 영양소 합계를 특정 인원 수만큼 확장합니다.
 *  - 칼로리는 정수로 반올림
 *  - 탄/단/지는 소수 첫째 자리까지 유지
 *  - 나트륨은 null이 아닌 경우에만 계산
 */
export function scaleNutritionTotals(
  totals: NutritionInfo | null | undefined,
  multiplier: number,
): NutritionInfo {
  if (!totals) {
    return { ...EMPTY_NUTRITION_TOTALS };
  }

  const safeMultiplier = Number.isFinite(multiplier) && multiplier >= 0 ? multiplier : 0;

  const calories = Math.round(toNumber(totals.calories) * safeMultiplier);
  const carbohydrates = Number((toNumber(totals.carbohydrates) * safeMultiplier).toFixed(1));
  const protein = Number((toNumber(totals.protein) * safeMultiplier).toFixed(1));
  const fat = Number((toNumber(totals.fat) * safeMultiplier).toFixed(1));
  const sodiumValue = totals.sodium ?? null;
  const sodium = sodiumValue === null
    ? null
    : Math.round(toNumber(sodiumValue) * safeMultiplier);

  return {
    calories,
    carbohydrates,
    protein,
    fat,
    sodium,
  };
}


