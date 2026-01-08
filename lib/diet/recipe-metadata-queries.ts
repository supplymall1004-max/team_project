/**
 * @file lib/diet/recipe-metadata-queries.ts
 * @description 레시피 메타데이터 조회 함수
 *
 * 주요 기능:
 * 1. 메인 재료별 레시피 조회
 * 2. 변형 그룹별 레시피 조회
 * 3. 영양소 강점별 레시피 필터링
 *
 * @dependencies
 * - lib/supabase/service-role.ts: Supabase 클라이언트
 * - types/recipe.ts: RecipeMetadata, RecipeVariationGroup
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { RecipeMetadata, RecipeVariationGroup } from "@/types/recipe";

/**
 * 메인 재료별 레시피 조회
 * 
 * @param mainIngredient 메인 재료 (예: "닭고기")
 * @param limit 최대 결과 수
 * @returns 레시피 ID 목록
 */
export async function getRecipesByMainIngredient(
  mainIngredient: string,
  limit: number = 10
): Promise<string[]> {
  console.group(`🔍 메인 재료별 레시피 조회: ${mainIngredient}`);
  
  try {
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from("recipes")
      .select("id")
      .contains("main_ingredients", [mainIngredient])
      .limit(limit);
    
    if (error) {
      console.error("❌ 조회 실패:", error);
      throw error;
    }
    
    const recipeIds = (data || []).map(recipe => recipe.id);
    console.log(`✅ ${recipeIds.length}개의 레시피 발견`);
    console.groupEnd();
    
    return recipeIds;
  } catch (error) {
    console.error("❌ 메인 재료별 레시피 조회 실패:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 변형 그룹별 레시피 조회
 * 
 * @param variationGroupId 변형 그룹 ID
 * @param limit 최대 결과 수
 * @returns 레시피 ID 목록
 */
export async function getRecipesByVariationGroup(
  variationGroupId: string,
  limit: number = 10
): Promise<string[]> {
  console.group(`🔍 변형 그룹별 레시피 조회: ${variationGroupId}`);
  
  try {
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from("recipes")
      .select("id")
      .eq("variation_group_id", variationGroupId)
      .limit(limit);
    
    if (error) {
      console.error("❌ 조회 실패:", error);
      throw error;
    }
    
    const recipeIds = (data || []).map(recipe => recipe.id);
    console.log(`✅ ${recipeIds.length}개의 레시피 발견`);
    console.groupEnd();
    
    return recipeIds;
  } catch (error) {
    console.error("❌ 변형 그룹별 레시피 조회 실패:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 영양소 강점별 레시피 필터링
 * 
 * @param nutritionFocus 영양소 강점 (예: ["단백질", "칼슘"])
 * @param limit 최대 결과 수
 * @returns 레시피 ID 목록
 */
export async function getRecipesByNutritionFocus(
  nutritionFocus: string[],
  limit: number = 10
): Promise<string[]> {
  console.group(`🔍 영양소 강점별 레시피 조회: ${nutritionFocus.join(", ")}`);
  
  try {
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from("recipes")
      .select("id")
      .overlaps("nutrition_focus", nutritionFocus)
      .limit(limit);
    
    if (error) {
      console.error("❌ 조회 실패:", error);
      throw error;
    }
    
    const recipeIds = (data || []).map(recipe => recipe.id);
    console.log(`✅ ${recipeIds.length}개의 레시피 발견`);
    console.groupEnd();
    
    return recipeIds;
  } catch (error) {
    console.error("❌ 영양소 강점별 레시피 조회 실패:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 변형 그룹 조회
 * 
 * @param mainIngredient 메인 재료
 * @returns 변형 그룹 목록
 */
export async function getVariationGroupsByMainIngredient(
  mainIngredient: string
): Promise<RecipeVariationGroup[]> {
  console.group(`🔍 변형 그룹 조회: ${mainIngredient}`);
  
  try {
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from("recipe_variation_groups")
      .select("*")
      .eq("main_ingredient", mainIngredient);
    
    if (error) {
      console.error("❌ 조회 실패:", error);
      throw error;
    }
    
    const groups = (data || []) as RecipeVariationGroup[];
    console.log(`✅ ${groups.length}개의 변형 그룹 발견`);
    console.groupEnd();
    
    return groups;
  } catch (error) {
    console.error("❌ 변형 그룹 조회 실패:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 레시피 메타데이터 조회
 * 
 * @param recipeId 레시피 ID
 * @returns 메타데이터 (없으면 null)
 */
export async function getRecipeMetadata(
  recipeId: string
): Promise<RecipeMetadata | null> {
  console.group(`🔍 레시피 메타데이터 조회: ${recipeId}`);
  
  try {
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from("recipes")
      .select("id, main_ingredients, cooking_method, variation_group_id, nutrition_focus, age_group_suitable, created_at, updated_at")
      .eq("id", recipeId)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") {
        // 데이터 없음
        console.log("⚠️ 메타데이터 없음");
        console.groupEnd();
        return null;
      }
      console.error("❌ 조회 실패:", error);
      throw error;
    }
    
    if (!data) {
      console.log("⚠️ 메타데이터 없음");
      console.groupEnd();
      return null;
    }
    
    const metadata: RecipeMetadata = {
      id: data.id,
      recipe_id: data.id,
      main_ingredients: (data.main_ingredients as string[]) || [],
      cooking_method: data.cooking_method || null,
      variation_group_id: data.variation_group_id || null,
      nutrition_focus: (data.nutrition_focus as string[]) || [],
      age_group_suitable: (data.age_group_suitable as string[]) || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
    
    console.log("✅ 메타데이터 조회 완료");
    console.groupEnd();
    
    return metadata;
  } catch (error) {
    console.error("❌ 레시피 메타데이터 조회 실패:", error);
    console.groupEnd();
    return null;
  }
}

