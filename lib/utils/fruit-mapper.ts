/**
 * @file fruit-mapper.ts
 * @description 레시피 제목에서 제철과일 ID를 찾는 유틸리티
 */

import { SEASONAL_FRUITS, type Fruit } from "@/lib/diet/seasonal-fruits";

/**
 * 레시피 제목에서 제철과일 ID 찾기
 * @param recipeTitle 레시피 제목 (예: "딸기", "사과")
 * @returns 과일 ID 또는 null
 */
export function getFruitIdFromRecipeTitle(recipeTitle: string): string | null {
  const normalizedTitle = recipeTitle.trim();
  
  // 정확한 이름 매칭
  const exactMatch = SEASONAL_FRUITS.find(
    (fruit) => fruit.name === normalizedTitle
  );
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // 부분 매칭 (예: "신선한 딸기" → "딸기")
  const partialMatch = SEASONAL_FRUITS.find(
    (fruit) => normalizedTitle.includes(fruit.name)
  );
  if (partialMatch) {
    return partialMatch.id;
  }
  
  return null;
}

/**
 * 과일 ID로 제철과일 정보 조회
 * @param fruitId 과일 ID (예: "strawberry", "apple")
 * @returns 과일 정보 또는 null
 */
export function getFruitById(fruitId: string): Fruit | null {
  return SEASONAL_FRUITS.find((fruit) => fruit.id === fruitId) || null;
}

/**
 * 레시피가 제철과일 간식인지 확인
 * @param recipeTitle 레시피 제목
 * @param source 레시피 소스 (예: "seasonal")
 * @returns 제철과일 여부
 */
export function isSeasonalFruitSnack(
  recipeTitle: string,
  source?: string
): boolean {
  // source가 "seasonal"이면 제철과일로 간주
  if (source === "seasonal") {
    return true;
  }
  
  // 레시피 제목이 제철과일 이름과 일치하면 제철과일로 간주
  return getFruitIdFromRecipeTitle(recipeTitle) !== null;
}

