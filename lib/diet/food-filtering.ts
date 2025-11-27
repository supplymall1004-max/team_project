/**
 * @file lib/diet/food-filtering.ts
 * @description 질병 및 알레르기 기반 음식 필터링
 *
 * 핵심 기능:
 * 1. 질병별 제외 음식 조회 (family-recommendation.ts와 연동)
 * 2. 레시피 호환성 검사 (재료 + 키워드)
 * 3. 나트륨 제한 확인
 */

import {
  getExcludedFoods as getExcludedFoodsFromRecommendation,
  filterRecipesByExcludedFoods,
  isRecipeExcludedForDisease as checkRecipeExclusion
} from "@/lib/diet/family-recommendation";
import type { ExcludedFood } from "@/lib/diet/family-recommendation";
import type { RecipeDetailForDiet } from "@/types/recipe";

// 하위 호환성을 위한 타입 별칭
export type DiseaseExcludedFood = ExcludedFood;

/**
 * 질병별 제외 음식 조회 (새로운 family-recommendation.ts 사용)
 */
export async function getExcludedFoods(diseases: string[]): Promise<DiseaseExcludedFood[]> {
  return getExcludedFoodsFromRecommendation(diseases);
}

/**
 * 레시피가 제외 음식을 포함하는지 확인
 *
 * @returns true: 레시피 사용 가능, false: 제외해야 함
 */
export function isRecipeCompatible(
  recipe: RecipeDetailForDiet,
  excludedFoods: DiseaseExcludedFood[]
): boolean {
  if (excludedFoods.length === 0) return true;

  console.group(`🔍 레시피 호환성 체크: ${recipe.title}`);

  // 새로운 로직 사용
  const result = isRecipeExcludedForDisease(recipe, excludedFoods);

  console.groupEnd();
  return !result.excluded;
}

/**
 * 레시피가 질병에 대해 제외되는지 확인 (새로운 함수)
 */
export function isRecipeExcludedForDisease(
  recipe: RecipeDetailForDiet,
  excludedFoods: ExcludedFood[]
): { excluded: boolean; reason?: string; severity?: string } {
  // family-recommendation.ts에서 import한 함수 사용
  return checkRecipeExclusion(recipe, excludedFoods);
}

/**
 * 레시피 목록에서 호환 가능한 레시피만 필터링
 */
export function filterCompatibleRecipes(
  recipes: RecipeDetailForDiet[],
  diseases: string[],
  excludedFoods: DiseaseExcludedFood[]
): RecipeDetailForDiet[] {
  console.group(`🔍 레시피 필터링: 총 ${recipes.length}개`);

  // 새로운 필터링 함수 사용
  const compatible = filterRecipesByExcludedFoods(recipes, excludedFoods);

  console.log(`✅ 호환 가능: ${compatible.length}개`);
  console.groupEnd();

  return compatible;
}

/**
 * 나트륨 제한 확인
 */
export function checkSodiumLimit(
  recipe: RecipeDetailForDiet,
  diseases?: string[]
): boolean {
  if (!diseases || diseases.length === 0) return true;
  if (!recipe.nutrition.sodium) return true;  // 나트륨 정보 없으면 통과

  const lowSodiumDiseases = ["hypertension", "kidney_disease", "heart_disease"];
  const hasLowSodiumRequirement = diseases.some(d => lowSodiumDiseases.includes(d));

  if (hasLowSodiumRequirement) {
    // 식사당 나트륨 권장량: 약 600-700mg (하루 2000mg ÷ 3식)
    const MAX_SODIUM_PER_MEAL = 700;
    
    if (recipe.nutrition.sodium > MAX_SODIUM_PER_MEAL) {
      console.warn(`⚠️ 나트륨 과다: ${recipe.nutrition.sodium}mg (권장: ${MAX_SODIUM_PER_MEAL}mg 이하)`);
      return false;
    }
  }

  return true;
}

/**
 * 알레르기 체크
 */
export function checkAllergyCompatibility(
  recipe: RecipeDetailForDiet,
  allergies: string[]
): boolean {
  if (!allergies || allergies.length === 0) return true;

  console.group(`🔍 알레르기 체크: ${recipe.title}`);

  for (const ingredient of recipe.ingredients) {
    const ingredientName = ingredient.name.toLowerCase();
    
    for (const allergy of allergies) {
      const allergyKeyword = allergy.toLowerCase();
      if (ingredientName.includes(allergyKeyword)) {
        console.warn(`⚠️ 알레르기 성분 발견: ${ingredient.name} (알레르기: ${allergy})`);
        console.groupEnd();
        return false;
      }
    }
  }

  console.log(`✅ 알레르기 성분 없음`);
  console.groupEnd();
  return true;
}

