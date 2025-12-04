/**
 * @file delete-all-recipes.ts
 * @description 현대 레시피북 데이터 전체 삭제 서버 액션
 *
 * 주의: 이 작업은 되돌릴 수 없습니다!
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function deleteAllRecipes(): Promise<{ success: boolean; message: string }> {
  console.group("[DeleteAllRecipes] 현대 레시피북 데이터 삭제 시작");

  try {
    const supabase = createClerkSupabaseClient();

    // 외래 키 제약조건 때문에 참조하는 테이블부터 삭제해야 함

    // 1. 레시피 평가 삭제
    console.log("레시피 평가 삭제 중...");
    const { error: ratingsError } = await supabase
      .from("recipe_ratings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // 모든 행 삭제

    if (ratingsError) {
      console.error("레시피 평가 삭제 실패:", ratingsError);
      // 계속 진행
    }

    // 2. 레시피 신고 삭제
    console.log("레시피 신고 삭제 중...");
    const { error: reportsError } = await supabase
      .from("recipe_reports")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (reportsError) {
      console.error("레시피 신고 삭제 실패:", reportsError);
      // 계속 진행
    }

    // 3. 조리 단계 삭제
    console.log("조리 단계 삭제 중...");
    const { error: stepsError } = await supabase
      .from("recipe_steps")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (stepsError) {
      console.error("조리 단계 삭제 실패:", stepsError);
      // 계속 진행
    }

    // 4. 재료 정보 삭제
    console.log("재료 정보 삭제 중...");
    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (ingredientsError) {
      console.error("재료 정보 삭제 실패:", ingredientsError);
      // 계속 진행
    }

    // 5. 레시피 기본 정보 삭제 (메인 테이블)
    console.log("레시피 기본 정보 삭제 중...");
    const { error: recipesError } = await supabase
      .from("recipes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (recipesError) {
      console.error("레시피 기본 정보 삭제 실패:", recipesError);
      throw recipesError;
    }

    console.log("✅ 현대 레시피북 데이터가 모두 삭제되었습니다.");
    console.groupEnd();

    return {
      success: true,
      message: "현대 레시피북 데이터가 모두 삭제되었습니다.",
    };
  } catch (error) {
    console.error("❌ 레시피 삭제 중 오류 발생:", error);
    console.groupEnd();

    return {
      success: false,
      message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

