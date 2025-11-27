/**
 * @file lib/diet/family-recommendation.ts
 * @description 가족 맞춤 식단 추천 시스템 - 질병별 제외 음식 관리
 *
 * 이 모듈은 가족 구성원들의 건강 상태(질병, 알레르기 등)를 고려하여
 * 적합한 식단을 추천하는 알고리즘을 제공합니다.
 *
 * 주요 기능:
 * 1. 질병별 제외 음식 조회 및 필터링
 * 2. 레시피 호환성 검사
 * 3. 가족 구성원별 맞춤 추천
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { RecipeDetailForDiet } from "@/types/recipe";

export interface ExcludedFood {
  id: string;
  disease: string;
  excluded_food_name: string;
  excluded_type: 'ingredient' | 'recipe_keyword';
  reason?: string;
  severity: 'mild' | 'moderate' | 'severe';
}

/**
 * 질병별 제외 음식 목록 조회
 */
export async function getExcludedFoods(diseases: string[]): Promise<ExcludedFood[]> {
  console.group("🔍 질병별 제외 음식 조회");
  console.log("질병 목록:", diseases);

  if (!diseases || diseases.length === 0) {
    console.log("질병 없음 - 빈 목록 반환");
    console.groupEnd();
    return [];
  }

  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("disease_excluded_foods")
      .select("*")
      .in("disease", diseases);

    if (error) {
      console.error("❌ 제외 음식 조회 실패:", error);
      console.groupEnd();
      return [];
    }

    console.log(`✅ ${data?.length || 0}개의 제외 음식 발견`);
    console.groupEnd();
    return data || [];

  } catch (error) {
    console.error("❌ 제외 음식 조회 오류:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 레시피가 질병에 대해 제외되는지 확인
 */
export function isRecipeExcludedForDisease(
  recipe: RecipeDetailForDiet,
  excludedFoods: ExcludedFood[]
): { excluded: boolean; reason?: string; severity?: string } {
  if (!excludedFoods || excludedFoods.length === 0) {
    return { excluded: false };
  }

  // 레시피의 텍스트 정보들 추출
  const recipeTexts = [
    recipe.title,
    recipe.description,
    ...(recipe.ingredients?.map(ing => ing.name) || []),
  ].filter(Boolean).join(' ').toLowerCase();

  console.log(`🔍 레시피 "${recipe.title}" 제외 검사 중...`);

  for (const excludedFood of excludedFoods) {
    const searchTerm = excludedFood.excluded_food_name.toLowerCase();

    if (excludedFood.excluded_type === 'recipe_keyword') {
      // 레시피 키워드 매칭 (제목, 설명에서 검색)
      const keywordTexts = [recipe.title, recipe.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (keywordTexts.includes(searchTerm)) {
        console.log(`⚠️ 제외: ${excludedFood.excluded_food_name} (키워드 매칭)`);
        return {
          excluded: true,
          reason: excludedFood.reason || `${excludedFood.excluded_food_name} 포함`,
          severity: excludedFood.severity
        };
      }
    } else if (excludedFood.excluded_type === 'ingredient') {
      // 재료 매칭
      if (recipeTexts.includes(searchTerm)) {
        console.log(`⚠️ 제외: ${excludedFood.excluded_food_name} (재료 매칭)`);
        return {
          excluded: true,
          reason: excludedFood.reason || `${excludedFood.excluded_food_name} 재료 포함`,
          severity: excludedFood.severity
        };
      }
    }
  }

  console.log(`✅ 레시피 "${recipe.title}" 제외되지 않음`);
  return { excluded: false };
}

/**
 * 제외 음식 기반 레시피 필터링
 */
export function filterRecipesByExcludedFoods(
  recipes: RecipeDetailForDiet[],
  excludedFoods: ExcludedFood[]
): RecipeDetailForDiet[] {
  console.group(`🔽 제외 음식 필터링 (전체 ${recipes.length}개 레시피)`);

  if (!excludedFoods || excludedFoods.length === 0) {
    console.log("제외 음식 없음 - 모든 레시피 통과");
    console.groupEnd();
    return recipes;
  }

  const filtered = recipes.filter(recipe => {
    const result = isRecipeExcludedForDisease(recipe, excludedFoods);
    return !result.excluded;
  });

  const excludedCount = recipes.length - filtered.length;
  console.log(`✅ 필터링 완료: ${filtered.length}개 통과, ${excludedCount}개 제외`);
  console.groupEnd();

  return filtered;
}

/**
 * 질병별 제외 음식 통계를 계산
 */
export function getExcludedFoodsStats(excludedFoods: ExcludedFood[]): {
  byDisease: Record<string, number>;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  const byDisease: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  excludedFoods.forEach(food => {
    // 질병별 카운트
    byDisease[food.disease] = (byDisease[food.disease] || 0) + 1;

    // 유형별 카운트
    byType[food.excluded_type] = (byType[food.excluded_type] || 0) + 1;

    // 심각도별 카운트
    bySeverity[food.severity] = (bySeverity[food.severity] || 0) + 1;
  });

  return { byDisease, byType, bySeverity };
}

/**
 * 제외 음식 검색 (관리자용)
 */
export async function searchExcludedFoods(
  query?: string,
  disease?: string,
  type?: 'ingredient' | 'recipe_keyword'
): Promise<ExcludedFood[]> {
  console.group("🔍 제외 음식 검색");

  try {
    const supabase = await createClerkSupabaseClient();
    let queryBuilder = supabase.from("disease_excluded_foods").select("*");

    if (query) {
      queryBuilder = queryBuilder.ilike("excluded_food_name", `%${query}%`);
    }

    if (disease) {
      queryBuilder = queryBuilder.eq("disease", disease);
    }

    if (type) {
      queryBuilder = queryBuilder.eq("excluded_type", type);
    }

    const { data, error } = await queryBuilder.order("disease", { ascending: true });

    if (error) {
      console.error("❌ 검색 실패:", error);
      console.groupEnd();
      return [];
    }

    console.log(`✅ ${data?.length || 0}개 검색 결과`);
    console.groupEnd();
    return data || [];

  } catch (error) {
    console.error("❌ 검색 오류:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 제외 음식 추가 (관리자용)
 */
export async function addExcludedFood(
  disease: string,
  excludedFoodName: string,
  excludedType: 'ingredient' | 'recipe_keyword',
  reason?: string,
  severity: 'mild' | 'moderate' | 'severe' = 'moderate'
): Promise<{ success: boolean; error?: string }> {
  console.group("➕ 제외 음식 추가");

  try {
    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase
      .from("disease_excluded_foods")
      .insert({
        disease,
        excluded_food_name: excludedFoodName,
        excluded_type: excludedType,
        reason,
        severity
      });

    if (error) {
      console.error("❌ 추가 실패:", error);
      console.groupEnd();
      return { success: false, error: error.message };
    }

    console.log(`✅ 제외 음식 추가: ${disease} - ${excludedFoodName}`);
    console.groupEnd();
    return { success: true };

  } catch (error) {
    console.error("❌ 추가 오류:", error);
    console.groupEnd();
    return { success: false, error: "서버 오류" };
  }
}

/**
 * 제외 음식 삭제 (관리자용)
 */
export async function removeExcludedFood(id: string): Promise<{ success: boolean; error?: string }> {
  console.group("🗑️ 제외 음식 삭제");

  try {
    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase
      .from("disease_excluded_foods")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ 삭제 실패:", error);
      console.groupEnd();
      return { success: false, error: error.message };
    }

    console.log(`✅ 제외 음식 삭제: ${id}`);
    console.groupEnd();
    return { success: true };

  } catch (error) {
    console.error("❌ 삭제 오류:", error);
    console.groupEnd();
    return { success: false, error: "서버 오류" };
  }
}
