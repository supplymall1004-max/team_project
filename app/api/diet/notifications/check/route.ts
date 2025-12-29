/**
 * @file app/api/diet/notifications/check/route.ts
 * @description 알림 표시 여부 확인 API
 *
 * GET /api/diet/notifications/check
 * 오늘 식단 알림을 표시해야 하는지 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/diet/notifications/check
 * 알림 표시 여부 확인
 */
export async function GET(request: NextRequest) {
  try {
    console.group("🔔 알림 표시 여부 확인");

    const authResult = await auth();
    console.log("🔍 Auth result:", {
      userId: authResult.userId,
      hasUserId: !!authResult.userId,
      userIdType: typeof authResult.userId,
      userIdLength: authResult.userId?.length
    });

    const { userId } = authResult;

    if (!userId) {
      console.error("❌ 인증 실패 - userId가 없음");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 프로덕션에서 PGRST301 방지:
    // - Clerk 토큰 기반 Supabase 클라이언트는 환경변수/키 설정에 따라 PostgREST가 'No suitable key'를 낼 수 있습니다.
    // - 알림 확인은 서버 전용 API이므로 service-role을 사용해 안정적으로 조회합니다.
    const supabase = getServiceRoleClient();

    console.log("🔍 Supabase client 생성됨, users 테이블 조회 시도...");
    console.log("🔍 조회할 clerk_id:", userId);

    // 사용자의 Supabase user_id 조회 (없으면 자동 동기화)
    let userData: { id: string; name: string } | null = null;
    let userError: { message: string; code?: string; details?: string | null; hint?: string | null } | null = null;
    
    try {
      userData = await ensureSupabaseUser();
      if (!userData) {
        userError = { message: "user_not_found" };
      }
    } catch (ensureError) {
      console.error("❌ ensureSupabaseUser 예외 발생:", ensureError);
      const error = ensureError as Error;
      
      // 환경변수 누락 오류인 경우 명확한 메시지 제공
      if (error.message.includes("환경변수가 누락되었습니다") || error.message.includes("missing")) {
        userError = {
          message: "database_configuration_error",
          code: "ENV_MISSING",
          details: error.message,
          hint: "Vercel Dashboard → Settings → Environment Variables에서 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요."
        };
      } else {
        userError = {
          message: error.message || "user_sync_failed",
          code: "UNKNOWN_ERROR",
          details: error.message,
        };
      }
    }

    console.log("🔍 조회 결과:", {
      data: userData,
      error: userError,
      hasData: !!userData,
      errorCode: userError?.code,
      errorMessage: userError?.message,
      errorDetails: userError?.details,
      errorHint: userError?.hint
    });

    // 사용자가 없거나 조회 실패 시 팝업 표시하지 않음
    if (userError || !userData) {
      if (userError) {
        console.error("❌ 사용자 조회 오류:", userError);
        
        // PGRST301 또는 환경변수 오류인 경우 더 명확한 로깅
        if (userError.code === "PGRST301" || userError.code === "ENV_MISSING") {
          console.error("  ⚠️ 데이터베이스 설정 오류로 인해 알림을 확인할 수 없습니다.");
          console.error("  → Vercel 환경변수 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.");
        }
      } else {
        console.log("⚠️ 사용자를 찾을 수 없음 - 팝업 표시하지 않음");
      }
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: userError?.code === "ENV_MISSING" ? "database_config_error" : "user_not_found",
        ...(process.env.NODE_ENV === "development" && userError ? { error: userError } : {})
      });
    }

    const supabaseUserId = userData.id;

    // 알림 설정 조회
    const { data: notificationSettings, error: settingsError } = await supabase
      .from("diet_notification_settings")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    // 설정 조회 실패 시 데이터베이스 연결 문제로 간주하고 팝업 표시하지 않음
    if (settingsError) {
      console.error("❌ 알림 설정 조회 실패:", settingsError);
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "settings_lookup_error",
        error: settingsError.message
      });
    }

    const settings = notificationSettings || {
      popup_enabled: true,
      browser_enabled: false,
      last_notification_date: null,
      last_dismissed_date: null,
    };

    console.log("알림 설정:", {
      popup_enabled: settings.popup_enabled,
      browser_enabled: settings.browser_enabled,
      last_notification_date: settings.last_notification_date,
      last_dismissed_date: settings.last_dismissed_date,
    });

    // 팝업 알림이 비활성화되어 있으면 표시하지 않음
    if (!settings.popup_enabled) {
      console.log("⚠️ 팝업 알림 비활성화됨");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "popup_disabled"
      });
    }

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    // 오늘 이미 알림을 표시했거나 닫았다면 표시하지 않음
    if (settings.last_notification_date === today || settings.last_dismissed_date === today) {
      console.log("⚠️ 오늘 이미 알림 표시됨 또는 닫힘");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: settings.last_notification_date === today ? "already_shown_today" : "dismissed_today"
      });
    }

    // 현재 시간 확인 (KST 기준 오전 5시 이후인지)
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC to KST
    const currentHour = kstNow.getHours();

    if (currentHour < 5) {
      console.log("⚠️ 아직 오전 5시 이전:", currentHour, "시");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "too_early",
        currentHour
      });
    }

    // 오늘 식단 존재 여부 확인
    const { data: todaysDiets, error: dietError } = await supabase
      .from("diet_plans")
      .select("id")
      .eq("user_id", supabaseUserId)
      .eq("plan_date", today)
      .limit(1);

    if (dietError) {
      console.error("❌ 식단 조회 실패:", dietError);
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "diet_check_error"
      });
    }

    if (!todaysDiets || todaysDiets.length === 0) {
      console.log("⚠️ 오늘 식단이 없음");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "no_diet_today"
      });
    }

    // 모든 조건 만족 - 알림 표시
    console.log("✅ 알림 표시 조건 만족");
    
    // 오늘 식단 데이터 가져오기 (팝업에 표시하기 위해)
    console.log("📋 오늘 식단 데이터 조회 중...");
    try {
      const { getDailyDietPlan } = await import("@/lib/diet/queries");
      const dailyDietPlan = await getDailyDietPlan(supabaseUserId, today);
      
      // 가족 식단도 확인 (통합 식단 포함)
      const { data: familyPlans, error: familyError } = await supabase
        .from("diet_plans")
        .select("*")
        .eq("user_id", supabaseUserId)
        .eq("plan_date", today)
        .order("created_at", { ascending: true });

      // plans 형식으로 변환 (FamilyDietPlan 형식)
      const plans: Record<string, any> = {};
      
      if (dailyDietPlan) {
        // 개인 식단 추가
        plans.user = {
          breakfast: dailyDietPlan.breakfast ? [{
            recipe_id: dailyDietPlan.breakfast.recipe_id,
            title: dailyDietPlan.breakfast.recipe?.title || dailyDietPlan.breakfast.compositionSummary?.[0] || '아침 식사',
            description: '',
            ingredients: [],
            instructions: [],
            nutrition: {
              calories: dailyDietPlan.breakfast.calories || 0,
              protein: dailyDietPlan.breakfast.protein || 0,
              carbs: dailyDietPlan.breakfast.carbohydrates || 0,
              fat: dailyDietPlan.breakfast.fat || 0,
              sodium: dailyDietPlan.breakfast.sodium || 0,
              fiber: 0,
            },
          }] : null,
          lunch: dailyDietPlan.lunch ? [{
            recipe_id: dailyDietPlan.lunch.recipe_id,
            title: dailyDietPlan.lunch.recipe?.title || dailyDietPlan.lunch.compositionSummary?.[0] || '점심 식사',
            description: '',
            ingredients: [],
            instructions: [],
            nutrition: {
              calories: dailyDietPlan.lunch.calories || 0,
              protein: dailyDietPlan.lunch.protein || 0,
              carbs: dailyDietPlan.lunch.carbohydrates || 0,
              fat: dailyDietPlan.lunch.fat || 0,
              sodium: dailyDietPlan.lunch.sodium || 0,
              fiber: 0,
            },
          }] : null,
          dinner: dailyDietPlan.dinner ? [{
            recipe_id: dailyDietPlan.dinner.recipe_id,
            title: dailyDietPlan.dinner.recipe?.title || dailyDietPlan.dinner.compositionSummary?.[0] || '저녁 식사',
            description: '',
            ingredients: [],
            instructions: [],
            nutrition: {
              calories: dailyDietPlan.dinner.calories || 0,
              protein: dailyDietPlan.dinner.protein || 0,
              carbs: dailyDietPlan.dinner.carbohydrates || 0,
              fat: dailyDietPlan.dinner.fat || 0,
              sodium: dailyDietPlan.dinner.sodium || 0,
              fiber: 0,
            },
          }] : null,
          snack: dailyDietPlan.snack ? [{
            recipe_id: dailyDietPlan.snack.recipe_id,
            title: dailyDietPlan.snack.recipe?.title || dailyDietPlan.snack.compositionSummary?.[0] || '간식',
            description: '',
            ingredients: [],
            instructions: [],
            nutrition: {
              calories: dailyDietPlan.snack.calories || 0,
              protein: dailyDietPlan.snack.protein || 0,
              carbs: dailyDietPlan.snack.carbohydrates || 0,
              fat: dailyDietPlan.snack.fat || 0,
              sodium: dailyDietPlan.snack.sodium || 0,
              fiber: 0,
            },
          }] : null,
        };
      }

      // 통합 식단 확인
      if (familyPlans && familyPlans.length > 0) {
        const unifiedPlans = familyPlans.filter(p => p.is_unified === true);
        if (unifiedPlans.length > 0) {
          const unifiedMeals: Record<string, any[]> = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: [],
          };
          
          unifiedPlans.forEach(plan => {
            const mealType = plan.meal_type;
            if (mealType && unifiedMeals[mealType]) {
              unifiedMeals[mealType].push({
                recipe_id: plan.recipe_id,
                title: plan.recipe_title || `${mealType} 식사`,
                description: plan.recipe_description || '',
                ingredients: plan.ingredients || [],
                instructions: plan.instructions || [],
                nutrition: {
                  calories: plan.calories || 0,
                  protein: plan.protein_g || plan.protein || 0,
                  carbs: plan.carbs_g || plan.carbohydrates || 0,
                  fat: plan.fat_g || plan.fat || 0,
                  sodium: plan.sodium_mg || plan.sodium || 0,
                  fiber: plan.fiber_g || 0,
                },
              });
            }
          });
          
          plans.unified = {
            breakfast: unifiedMeals.breakfast.length > 0 ? unifiedMeals.breakfast : null,
            lunch: unifiedMeals.lunch.length > 0 ? unifiedMeals.lunch : null,
            dinner: unifiedMeals.dinner.length > 0 ? unifiedMeals.dinner : null,
            snack: unifiedMeals.snack.length > 0 ? unifiedMeals.snack : null,
          };
        }
      }

      console.log("✅ 식단 데이터 조회 완료:", {
        hasUserPlan: !!plans.user,
        hasUnifiedPlan: !!plans.unified,
      });

      console.groupEnd();
      return NextResponse.json({
        shouldShow: true,
        today,
        date: today,
        dietsCount: todaysDiets.length,
        plans,
      });
    } catch (dietDataError) {
      console.error("❌ 식단 데이터 조회 실패:", dietDataError);
      // 식단 데이터 조회 실패해도 알림은 표시 (데이터 없이)
      console.groupEnd();
      return NextResponse.json({
        shouldShow: true,
        today,
        date: today,
        dietsCount: todaysDiets.length,
        plans: {},
      });
    }

  } catch (error) {
    console.error("❌ 알림 확인 오류:", error);
    console.error("  - 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("  - 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("  - 에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
}
