/**
 * @file favorite-meals.ts
 * @description 즐겨찾기한 식단 관리 서비스 (Server Actions)
 *
 * 주요 기능:
 * 1. 즐겨찾기 추가/삭제
 * 2. 사용자별 즐겨찾기 목록 조회
 * 3. 즐겨찾기 여부 확인
 */

'use server';

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { FavoriteMeal } from "@/types/diet";
import type { MealType } from "@/types/health";

/**
 * 즐겨찾기 추가
 */
export async function addFavoriteMeal(
  recipeId: string | null,
  recipeTitle: string,
  mealType: MealType | null,
  nutrition: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  },
  notes?: string
): Promise<{ success: boolean; favoriteId?: string; error?: string }> {
  console.group("[FavoriteMeals] 즐겨찾기 추가");
  console.log("recipeId:", recipeId);
  console.log("recipeTitle:", recipeTitle);
  console.log("mealType:", mealType);

  try {
    // 1. 사용자 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 인증 실패");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    console.log("✅ 사용자 확인:", user.id);

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 즐겨찾기 추가 (upsert로 중복 방지)
    const { data, error } = await supabase
      .from("favorite_meals")
      .upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          recipe_title: recipeTitle,
          meal_type: mealType,
          calories: nutrition.calories ?? null,
          protein: nutrition.protein ?? null,
          carbs: nutrition.carbs ?? null,
          fat: nutrition.fat ?? null,
          notes: notes ?? null,
        },
        {
          onConflict: "user_id,recipe_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ 즐겨찾기 추가 실패:", error);
      console.groupEnd();
      return { success: false, error: "즐겨찾기 추가에 실패했습니다." };
    }

    console.log("✅ 즐겨찾기 추가 성공:", data.id);
    console.groupEnd();
    return { success: true, favoriteId: data.id };
  } catch (error) {
    console.error("❌ 즐겨찾기 추가 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 즐겨찾기 삭제
 */
export async function removeFavoriteMeal(
  recipeId: string
): Promise<{ success: boolean; error?: string }> {
  console.group("[FavoriteMeals] 즐겨찾기 삭제");
  console.log("recipeId:", recipeId);

  try {
    // 1. 사용자 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 인증 실패");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    console.log("✅ 사용자 확인:", user.id);

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 즐겨찾기 삭제
    const { error } = await supabase
      .from("favorite_meals")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);

    if (error) {
      console.error("❌ 즐겨찾기 삭제 실패:", error);
      console.groupEnd();
      return { success: false, error: "즐겨찾기 삭제에 실패했습니다." };
    }

    console.log("✅ 즐겨찾기 삭제 성공");
    console.groupEnd();
    return { success: true };
  } catch (error) {
    console.error("❌ 즐겨찾기 삭제 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 즐겨찾기 여부 확인
 */
export async function isFavoriteMeal(recipeId: string): Promise<boolean> {
  console.groupCollapsed("[FavoriteMeals] 즐겨찾기 여부 확인");
  console.log("recipeId:", recipeId);

  try {
    // 1. 사용자 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      console.log("❌ 사용자 인증 실패");
      console.groupEnd();
      return false;
    }

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 즐겨찾기 조회
    const { data, error } = await supabase
      .from("favorite_meals")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId)
      .maybeSingle();

    if (error) {
      console.error("❌ 즐겨찾기 조회 실패:", error);
      console.groupEnd();
      return false;
    }

    const isFavorite = data !== null;
    console.log("✅ 즐겨찾기 여부:", isFavorite);
    console.groupEnd();
    return isFavorite;
  } catch (error) {
    console.error("❌ 즐겨찾기 조회 오류:", error);
    console.groupEnd();
    return false;
  }
}

/**
 * 사용자별 즐겨찾기 목록 조회
 */
export async function getFavoriteMeals(): Promise<{
  success: boolean;
  favorites?: FavoriteMeal[];
  error?: string;
}> {
  console.group("[FavoriteMeals] 즐겨찾기 목록 조회");

  try {
    // 1. 사용자 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 인증 실패");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    console.log("✅ 사용자 확인:", user.id);

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 즐겨찾기 목록 조회 (최신순)
    const { data, error } = await supabase
      .from("favorite_meals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 즐겨찾기 목록 조회 실패:", error);
      console.groupEnd();
      return { success: false, error: "즐겨찾기 목록 조회에 실패했습니다." };
    }

    console.log("✅ 즐겨찾기 목록 조회 성공:", data?.length || 0, "개");
    console.groupEnd();
    return { success: true, favorites: data as FavoriteMeal[] };
  } catch (error) {
    console.error("❌ 즐겨찾기 목록 조회 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

