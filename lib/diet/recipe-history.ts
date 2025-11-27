/**
 * @file lib/diet/recipe-history.ts
 * @description 레시피 사용 이력 관리 - 중복 방지
 * 
 * 핵심 기능:
 * 1. 최근 30일 사용 여부 확인
 * 2. 레시피 사용 기록
 * 3. 90일 이상 이력 자동 삭제
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { MealType } from "@/types/recipe";

/**
 * 최근 30일 내 사용한 레시피인지 확인
 * 
 * @returns true: 최근 사용됨 (중복), false: 사용 가능
 */
export async function checkRecentlyUsed(
  userId: string,
  recipeTitle: string,
  familyMemberId?: string
): Promise<boolean> {
  const supabase = await createClerkSupabaseClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("recipe_usage_history")
    .select("id")
    .eq("user_id", userId)
    .eq("recipe_title", recipeTitle)
    .gte("used_date", thirtyDaysAgo.toISOString().split("T")[0])
    .maybeSingle();

  if (error) {
    console.error("레시피 이력 조회 실패:", error);
    return false;
  }

  return data !== null;
}

/**
 * 레시피 사용 기록
 */
export async function trackRecipeUsage(
  userId: string,
  recipeTitle: string,
  options: {
    familyMemberId?: string;
    recipeUrl?: string;
    mealType?: MealType;
    usedDate?: string; // 'YYYY-MM-DD', 기본값은 오늘
  } = {}
): Promise<void> {
  const supabase = await createClerkSupabaseClient();
  
  const usedDate = options.usedDate || new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("recipe_usage_history")
    .insert({
      user_id: userId,
      family_member_id: options.familyMemberId,
      recipe_title: recipeTitle,
      recipe_url: options.recipeUrl,
      meal_type: options.mealType,
      used_date: usedDate,
    });

  if (error) {
    console.error("레시피 사용 기록 실패:", error);
  } else {
    console.log(`✅ 레시피 사용 기록: ${recipeTitle} (${usedDate})`);
  }
}

/**
 * 90일 이상 된 이력 삭제
 */
export async function cleanOldHistory(): Promise<number> {
  const supabase = await createClerkSupabaseClient();
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoffDate = ninetyDaysAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("recipe_usage_history")
    .delete()
    .lt("used_date", cutoffDate)
    .select("id");

  if (error) {
    console.error("이력 정리 실패:", error);
    return 0;
  }

  const deletedCount = data?.length || 0;
  console.log(`🗑️ ${deletedCount}개의 오래된 레시피 이력 삭제 (${cutoffDate} 이전)`);
  
  return deletedCount;
}

/**
 * 특정 사용자의 최근 사용 레시피 목록 조회 (중복 방지용)
 */
export async function getRecentlyUsedRecipes(
  userId: string,
  familyMemberId?: string,
  days: number = 30
): Promise<string[]> {
  const supabase = await createClerkSupabaseClient();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let query = supabase
    .from("recipe_usage_history")
    .select("recipe_title")
    .eq("user_id", userId)
    .gte("used_date", cutoffDate.toISOString().split("T")[0]);

  if (familyMemberId) {
    query = query.eq("family_member_id", familyMemberId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("최근 사용 레시피 조회 실패:", error);
    return [];
  }

  const uniqueTitles = [...new Set(data?.map(d => d.recipe_title) || [])];
  console.log(`📋 최근 ${days}일 사용 레시피: ${uniqueTitles.length}개`);
  
  return uniqueTitles;
}

