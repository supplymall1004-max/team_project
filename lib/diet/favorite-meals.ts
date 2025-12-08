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
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { FavoriteMeal } from "@/types/diet";
import type { MealType } from "@/types/health";

/**
 * UUID 형식인지 확인하는 함수
 */
function isValidUUID(str: string | null): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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

    // 2. recipeId가 UUID 형식인지 확인
    // UUID가 아닌 경우 (임시 ID 등) null로 처리
    const validRecipeId = recipeId && isValidUUID(recipeId) ? recipeId : null;
    if (recipeId && !validRecipeId) {
      console.warn("⚠️ recipeId가 UUID 형식이 아님:", recipeId);
      console.warn("⚠️ recipe_id를 null로 설정하고 recipe_title로 저장합니다.");
    }

    // 3. Supabase 클라이언트 생성
    // 개발 환경에서는 Service Role 클라이언트 사용 (RLS 우회)
    const supabase = process.env.NODE_ENV === 'development' 
      ? getServiceRoleClient()
      : await createClerkSupabaseClient();

    // 4. 즐겨찾기 추가 (upsert로 중복 방지)
    // recipe_id가 null인 경우 UNIQUE 제약조건 문제를 피하기 위해 별도 처리
    const insertData = {
      user_id: user.id,
      recipe_id: validRecipeId,
      recipe_title: recipeTitle,
      meal_type: mealType,
      calories: nutrition.calories ?? null,
      protein: nutrition.protein ?? null,
      carbs: nutrition.carbs ?? null,
      fat: nutrition.fat ?? null,
      notes: notes ?? null,
    };

    console.log("📝 저장할 데이터:", insertData);

    let data, error;
    
    if (validRecipeId) {
      // recipe_id가 유효한 UUID인 경우: upsert 사용 (중복 방지)
      console.log("📝 recipe_id가 유효한 UUID, upsert 사용");
      const result = await supabase
        .from("favorite_meals")
        .upsert(insertData, {
          onConflict: "user_id,recipe_id",
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // recipe_id가 null인 경우: 먼저 중복 확인 후 insert
      console.log("📝 recipe_id가 null, 중복 확인 후 insert");
      
      // 중복 확인: 같은 사용자가 같은 제목과 식사 타입으로 이미 저장했는지 확인
      const { data: existing } = await supabase
        .from("favorite_meals")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_title", recipeTitle)
        .eq("meal_type", mealType)
        .is("recipe_id", null)
        .maybeSingle();
      
      if (existing) {
        console.log("⚠️ 이미 존재하는 즐겨찾기:", existing.id);
        // 이미 존재하면 기존 데이터 반환
        const { data: existingData } = await supabase
          .from("favorite_meals")
          .select("*")
          .eq("id", existing.id)
          .single();
        data = existingData;
        error = null;
      } else {
        // 없으면 새로 insert
        const result = await supabase
          .from("favorite_meals")
          .insert(insertData)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }
    }

    if (error) {
      console.error("❌ 즐겨찾기 추가 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.error("  - 저장 시도한 데이터:", insertData);
      console.groupEnd();
      
      // 개발 환경에서는 더 자세한 에러 메시지 제공
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `즐겨찾기 추가에 실패했습니다: ${error.message} (코드: ${error.code})`
        : "즐겨찾기 추가에 실패했습니다.";
      
      return { success: false, error: errorMessage };
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

    // 2. recipeId가 UUID 형식인지 확인
    const validRecipeId = recipeId && isValidUUID(recipeId) ? recipeId : null;
    if (!validRecipeId) {
      console.warn("⚠️ recipeId가 UUID 형식이 아님:", recipeId);
      console.warn("⚠️ UUID가 없어 즐겨찾기 삭제 불가");
      console.groupEnd();
      return { success: false, error: "유효하지 않은 레시피 ID입니다." };
    }

    // 3. Supabase 클라이언트 생성
    // 개발 환경에서는 Service Role 클라이언트 사용 (RLS 우회)
    const supabase = process.env.NODE_ENV === 'development' 
      ? getServiceRoleClient()
      : await createClerkSupabaseClient();

    // 4. 즐겨찾기 삭제
    const { error } = await supabase
      .from("favorite_meals")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", validRecipeId);

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

    // 2. recipeId가 UUID 형식인지 확인
    const validRecipeId = recipeId && isValidUUID(recipeId) ? recipeId : null;
    if (!validRecipeId) {
      console.log("⚠️ recipeId가 UUID 형식이 아님:", recipeId);
      console.log("⚠️ UUID가 없어 즐겨찾기 조회 불가");
      console.groupEnd();
      return false;
    }

    // 3. Supabase 클라이언트 생성
    // 개발 환경에서는 Service Role 클라이언트 사용 (RLS 우회)
    const supabase = process.env.NODE_ENV === 'development' 
      ? getServiceRoleClient()
      : await createClerkSupabaseClient();

    // 4. 즐겨찾기 조회
    const { data, error } = await supabase
      .from("favorite_meals")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", validRecipeId)
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
    // 개발 환경에서는 Service Role 클라이언트 사용 (RLS 우회)
    // 프로덕션에서는 Clerk 클라이언트 사용
    const supabase = process.env.NODE_ENV === 'development' 
      ? getServiceRoleClient()
      : await createClerkSupabaseClient();

    // 3. user_id가 UUID 형식인지 확인
    const userId = user.id;
    console.log("🔍 사용자 ID 타입 확인:", typeof userId, userId);

    // 4. 즐겨찾기 목록 조회 (최신순)
    const { data, error } = await supabase
      .from("favorite_meals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 즐겨찾기 목록 조회 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.error("  - 사용자 ID:", user.id);
      console.groupEnd();
      
      // 개발 환경에서는 더 자세한 에러 메시지 제공
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `즐겨찾기 목록 조회에 실패했습니다: ${error.message} (코드: ${error.code})`
        : "즐겨찾기 목록 조회에 실패했습니다.";
      
      return { success: false, error: errorMessage };
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

