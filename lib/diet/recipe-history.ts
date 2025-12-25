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
  try {
    const supabase = await createClerkSupabaseClient();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

    let query = supabase
      .from("recipe_usage_history")
      .select("id")
      .eq("user_id", userId)
      .eq("recipe_title", recipeTitle)
      .gte("used_date", cutoffDate);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("❌ 레시피 이력 조회 실패:");
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
      return false;
    }

    return data !== null;
  } catch (err) {
    console.error("❌ 레시피 이력 조회 중 예외 발생:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

/**
 * 레시피 사용 기록
 * 
 * @param userId - 사용자 ID (UUID)
 * @param recipeTitle - 레시피 제목
 * @param options - 추가 옵션
 * @param options.recipeId - 레시피 ID (선택적, 제공 시 직접 사용)
 * @param options.familyMemberId - 가족 구성원 ID (선택적)
 * @param options.recipeUrl - 레시피 URL (선택적)
 * @param options.mealType - 식사 타입 (선택적)
 * @param options.usedDate - 사용 날짜 (YYYY-MM-DD, 기본값은 오늘)
 * 
 * @description
 * 레시피 사용 이력을 기록합니다. recipe_id가 제공되면 직접 사용하고,
 * 제공되지 않으면 recipe_title로 레시피를 조회하여 recipe_id를 찾습니다.
 * 이렇게 하면 레시피 ID로 직접 참조할 수 있어 데이터 무결성이 향상됩니다.
 */
export async function trackRecipeUsage(
  userId: string,
  recipeTitle: string,
  options: {
    recipeId?: string; // 새로 추가: 레시피 ID (선택적)
    familyMemberId?: string;
    recipeUrl?: string;
    mealType?: MealType;
    usedDate?: string; // 'YYYY-MM-DD', 기본값은 오늘
  } = {}
): Promise<void> {
  try {
    const supabase = await createClerkSupabaseClient();
    
    const usedDate = options.usedDate || new Date().toISOString().split("T")[0];

    // recipe_id가 제공된 경우 직접 사용, 제공되지 않은 경우 레시피 제목으로 조회 시도
    let recipeId: string | null = options.recipeId || null;
    
    // recipe_id가 없고 recipe_title이 있는 경우 레시피 ID 조회 시도
    if (!recipeId && recipeTitle) {
      console.log(`[RecipeHistory] 레시피 ID 조회 시도: ${recipeTitle}`);
      
      const { data: recipe, error: lookupError } = await supabase
        .from("recipes")
        .select("id")
        .eq("title", recipeTitle)
        .maybeSingle();
      
      if (lookupError) {
        console.warn(`⚠️ 레시피 ID 조회 실패 (무시하고 계속 진행): ${lookupError.message}`);
      } else if (recipe?.id) {
        recipeId = recipe.id;
        console.log(`✅ 레시피 ID 조회 성공: ${recipeId}`);
      } else {
        console.log(`ℹ️ 레시피 ID를 찾을 수 없음 (제목만 저장): ${recipeTitle}`);
      }
    }

    // 데이터베이스에 저장 (recipe_id 포함)
    const { error } = await supabase
      .from("recipe_usage_history")
      .insert({
        user_id: userId,
        recipe_id: recipeId, // 새로 추가된 필드
        family_member_id: options.familyMemberId,
        recipe_title: recipeTitle,
        recipe_url: options.recipeUrl,
        meal_type: options.mealType,
        used_date: usedDate,
      });

    if (error) {
      console.error("❌ 레시피 사용 기록 실패:");
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 레시피 제목:", recipeTitle);
      console.error("  - 레시피 ID:", recipeId || "없음");
      console.error("  - 사용 날짜:", usedDate);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
    } else {
      console.log(`✅ 레시피 사용 기록: ${recipeTitle} (${usedDate})${recipeId ? ` [ID: ${recipeId}]` : ""}`);
    }
  } catch (err) {
    console.error("❌ 레시피 사용 기록 중 예외 발생:", err instanceof Error ? err.message : String(err));
  }
}

/**
 * 90일 이상 된 이력 삭제
 */
export async function cleanOldHistory(): Promise<number> {
  try {
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
      console.error("❌ 이력 정리 실패:");
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 기준 날짜:", cutoffDate);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log(`🗑️ ${deletedCount}개의 오래된 레시피 이력 삭제 (${cutoffDate} 이전)`);
    
    return deletedCount;
  } catch (err) {
    console.error("❌ 이력 정리 중 예외 발생:", err instanceof Error ? err.message : String(err));
    return 0;
  }
}

/**
 * 특정 사용자의 최근 사용 레시피 목록 조회 (중복 방지용)
 */
export async function getRecentlyUsedRecipes(
  userId: string,
  familyMemberId?: string,
  days: number = 30
): Promise<string[]> {
  try {
    console.groupCollapsed(`[RecipeHistory] 최근 사용 레시피 조회`);
    console.log("사용자 ID:", userId);
    console.log("가족 구성원 ID:", familyMemberId || "없음");
    console.log("조회 기간:", days, "일");

    // Supabase 클라이언트 생성
    let supabase;
    try {
      supabase = await createClerkSupabaseClient();
      console.log("✅ Supabase 클라이언트 생성 완료");
    } catch (clientError) {
      console.error("❌ Supabase 클라이언트 생성 실패:");
      console.error("  - 에러:", clientError instanceof Error ? clientError.message : String(clientError));
      console.groupEnd();
      return [] as string[];
    }

    if (!supabase) {
      console.error("❌ Supabase 클라이언트가 null입니다");
      console.groupEnd();
      return [] as string[];
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];
    console.log("기준 날짜:", cutoffDateStr);

    let query = supabase
      .from("recipe_usage_history")
      .select("recipe_title")
      .eq("user_id", userId)
      .gte("used_date", cutoffDateStr);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }

    console.log("📡 데이터베이스 쿼리 실행 중...");
    const { data, error } = await query as { data: { recipe_title: string }[] | null; error: any };

    if (error) {
      // 에러 객체를 안전하게 직렬화
      const errorInfo: Record<string, unknown> = {
        message: error.message || "에러 메시지 없음",
        code: error.code || "에러 코드 없음",
        details: error.details || "상세 정보 없음",
        hint: error.hint || "힌트 없음",
      };

      // 에러 객체의 모든 속성을 안전하게 추출
      try {
        Object.keys(error).forEach((key) => {
          if (!errorInfo[key]) {
            try {
              errorInfo[key] = (error as Record<string, unknown>)[key];
            } catch {
              // 직렬화 불가능한 속성은 무시
            }
          }
        });
      } catch {
        // 에러 객체 순회 실패 시 무시
      }

      console.error("❌ 최근 사용 레시피 조회 실패:");
      console.error("  - 에러 메시지:", errorInfo.message);
      console.error("  - 에러 코드:", errorInfo.code);
      console.error("  - 에러 상세:", errorInfo.details);
      console.error("  - 에러 힌트:", errorInfo.hint);
      console.error("  - 사용자 ID:", userId);
      console.error("  - 기준 날짜:", cutoffDateStr);
      console.error("  - 전체 에러 정보:", JSON.stringify(errorInfo, null, 2));
      console.groupEnd();
      return [] as string[];
    }

    const uniqueTitles: string[] = [...new Set(data?.map((d: { recipe_title: string }) => d.recipe_title) || [])];
    console.log(`✅ 최근 ${days}일 사용 레시피: ${uniqueTitles.length}개`);
    if (uniqueTitles.length > 0) {
      console.log("  - 레시피 목록:", uniqueTitles.slice(0, 10));
    }
    console.groupEnd();
    
    return uniqueTitles;
  } catch (err) {
    // 예외 발생 시 안전하게 처리
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    const errorType = err instanceof Error ? err.constructor.name : typeof err;

    console.error("❌ 최근 사용 레시피 조회 중 예외 발생:");
    console.error("  - 에러 타입:", errorType);
    console.error("  - 에러 메시지:", errorMessage);
    console.error("  - 에러 스택:", errorStack);
    
    // 에러 객체를 안전하게 직렬화 시도
    try {
      const errorObj: Record<string, unknown> = {};
      if (err && typeof err === "object") {
        Object.getOwnPropertyNames(err).forEach((key) => {
          try {
            errorObj[key] = (err as Record<string, unknown>)[key];
          } catch {
            // 직렬화 불가능한 속성은 무시
          }
        });
      }
      console.error("  - 에러 객체:", JSON.stringify(errorObj, null, 2));
    } catch {
      console.error("  - 에러 객체 직렬화 실패");
    }
    
    return [] as string[];
  }
}

