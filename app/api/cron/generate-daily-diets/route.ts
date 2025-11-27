/**
 * @file app/api/cron/generate-daily-diets/route.ts
 * @description 자동 식단 생성 Cron Job
 * 
 * 매일 저녁 8시(20:00)에 실행되어 다음 날 식단을 자동 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { generateFamilyDiet } from "@/lib/diet/family-diet-generator";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";
import { trackRecipeUsage } from "@/lib/diet/recipe-history";
import type { MealComposition, RecipeDetailForDiet } from "@/types/recipe";

/**
 * GET /api/cron/generate-daily-diets
 * Cron Job - 자동 식단 생성
 */
export async function GET(request: NextRequest) {
  try {
    console.group("⏰ Cron Job: 자동 식단 생성");
    
    // Cron Secret 검증
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("❌ CRON_SECRET 환경 변수 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // 다음 날 날짜 계산
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split("T")[0];

    console.log("대상 날짜:", targetDate);

    // 모든 활성 사용자 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id");

    if (usersError) {
      console.error("❌ 사용자 조회 실패:", usersError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log("⚠️ 사용자 없음");
      console.groupEnd();
      return NextResponse.json({
        message: "No users found",
        generated: 0,
      });
    }

    console.log(`📋 ${users.length}명의 사용자 식단 생성 시작`);

    const results = {
      total: users.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of users) {
      try {
        console.log(`\n👤 사용자 ${user.id} 처리 중...`);

        // 건강 프로필 조회
        const { data: profile } = await supabase
          .from("user_health_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile) {
          console.warn(`⚠️ 건강 프로필 없음 - 건너뜀`);
          results.failed++;
          results.errors.push(`User ${user.id}: No health profile`);
          continue;
        }

        // 가족 구성원 조회
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("*")
          .eq("user_id", user.id);

        // 가족이 있으면 가족 식단, 없으면 개인 식단
        if (familyMembers && familyMembers.length > 0) {
          console.log(`👨‍👩‍👧‍👦 가족 식단 생성 (구성원: ${familyMembers.length}명)`);
          
          const familyDiet = await generateFamilyDiet(
            user.id,
            profile,
            familyMembers,
            targetDate,
            true
          );

          // 식단 저장 (간소화)
          await saveFamilyDietToDatabase(supabase, user.id, targetDate, familyDiet);
        } else {
          console.log(`🧍 개인 식단 생성`);
          
          const personalDiet = await generatePersonalDiet(
            user.id,
            profile,
            targetDate
          );

          // 식단 저장 (간소화)
          await savePersonalDietToDatabase(supabase, user.id, targetDate, personalDiet);
        }

        results.success++;
        console.log(`✅ 사용자 ${user.id} 식단 생성 완료`);
      } catch (error: any) {
        console.error(`❌ 사용자 ${user.id} 실패:`, error);
        results.failed++;
        results.errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    console.log(`\n📊 실행 결과:`);
    console.log(`  - 성공: ${results.success}명`);
    console.log(`  - 실패: ${results.failed}명`);
    console.groupEnd();

    return NextResponse.json({
      message: "Daily diets generated",
      targetDate,
      ...results,
    });
  } catch (error: any) {
    console.error("❌ Cron Job 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 가족 식단 저장 (완전한 버전)
 */
async function saveFamilyDietToDatabase(
  supabase: any,
  userId: string,
  targetDate: string,
  familyDiet: any
) {
  console.log("[CronJob] 가족 식단 저장 시작");
  console.log("familyDiet 구조:", Object.keys(familyDiet));

  // 기존 식단 삭제
  await supabase
    .from("diet_plans")
    .delete()
    .eq("user_id", userId)
    .eq("plan_date", targetDate);

  const allRecords: any[] = [];

  // 개인별 식단 저장
  if (familyDiet.individualPlans) {
    for (const [memberId, dietPlan] of Object.entries<any>(familyDiet.individualPlans)) {
      const familyMemberId = memberId === "user" ? null : memberId;

      // 각 식사별로 저장
      const meals = [
        { type: "breakfast", plan: dietPlan.breakfast },
        { type: "lunch", plan: dietPlan.lunch },
        { type: "dinner", plan: dietPlan.dinner },
        { type: "snack", plan: dietPlan.snack }
      ];

      for (const meal of meals) {
        if (meal.plan?.recipe) {
          allRecords.push({
            user_id: userId,
            family_member_id: familyMemberId,
            plan_date: targetDate,
            meal_type: meal.type,
            recipe_id: meal.plan.recipe.id,
            recipe_title: meal.plan.recipe.title,
            recipe_description: meal.plan.recipe.description || "",
            calories: meal.plan.nutrition?.calories || meal.plan.recipe.calories,
            carbohydrates: meal.plan.nutrition?.carbohydrates || meal.plan.recipe.carbohydrates,
            protein: meal.plan.nutrition?.protein || meal.plan.recipe.protein,
            fat: meal.plan.nutrition?.fat || meal.plan.recipe.fat,
            sodium: meal.plan.nutrition?.sodium || meal.plan.recipe.sodium,
            is_unified: false,
          });
        }
      }
    }
  }

  // 통합 식단 저장
  if (familyDiet.unifiedPlan) {
    console.log("[CronJob] 통합 식단 저장");
    const unifiedMeals = [
      { type: "breakfast", plan: familyDiet.unifiedPlan.breakfast },
      { type: "lunch", plan: familyDiet.unifiedPlan.lunch },
      { type: "dinner", plan: familyDiet.unifiedPlan.dinner },
      { type: "snack", plan: familyDiet.unifiedPlan.snack }
    ];

    for (const meal of unifiedMeals) {
      if (meal.plan?.recipe) {
        allRecords.push({
          user_id: userId,
          family_member_id: null, // 통합 식단은 가족 전체
          plan_date: targetDate,
          meal_type: meal.type,
          recipe_id: meal.plan.recipe.id,
          recipe_title: meal.plan.recipe.title,
          recipe_description: meal.plan.recipe.description || "",
          calories: meal.plan.nutrition?.calories || meal.plan.recipe.calories,
          carbohydrates: meal.plan.nutrition?.carbohydrates || meal.plan.recipe.carbohydrates,
          protein: meal.plan.nutrition?.protein || meal.plan.recipe.protein,
          fat: meal.plan.nutrition?.fat || meal.plan.recipe.fat,
          sodium: meal.plan.nutrition?.sodium || meal.plan.recipe.sodium,
          is_unified: true,
        });
      }
    }
  }

  console.log(`[CronJob] 저장할 레코드 수: ${allRecords.length}`);
  if (allRecords.length > 0) {
    const { error: insertError } = await supabase.from("diet_plans").insert(allRecords);
    if (insertError) {
      console.error("[CronJob] 식단 저장 실패:", insertError);
      throw insertError;
    }
    console.log("[CronJob] 가족 식단 저장 완료");
  }
}

/**
 * 개인 식단 저장 (완전한 버전)
 */
async function savePersonalDietToDatabase(
  supabase: any,
  userId: string,
  targetDate: string,
  personalDiet: any
) {
  console.log("[CronJob] 개인 식단 저장 시작");

  // 기존 식단 삭제
  await supabase
    .from("diet_plans")
    .delete()
    .eq("user_id", userId)
    .eq("plan_date", targetDate);

  const records: any[] = [];

  // 각 식사별로 저장
  const meals = [
    { type: "breakfast", plan: personalDiet.breakfast },
    { type: "lunch", plan: personalDiet.lunch },
    { type: "dinner", plan: personalDiet.dinner },
    { type: "snack", plan: personalDiet.snack }
  ];

  for (const meal of meals) {
    if (meal.plan?.recipe) {
      records.push({
        user_id: userId,
        family_member_id: null,
        plan_date: targetDate,
        meal_type: meal.type,
        recipe_id: meal.plan.recipe.id,
        recipe_title: meal.plan.recipe.title,
        recipe_description: meal.plan.recipe.description || "",
        calories: meal.plan.nutrition?.calories || meal.plan.recipe.calories,
        carbohydrates: meal.plan.nutrition?.carbohydrates || meal.plan.recipe.carbohydrates,
        protein: meal.plan.nutrition?.protein || meal.plan.recipe.protein,
        fat: meal.plan.nutrition?.fat || meal.plan.recipe.fat,
        sodium: meal.plan.nutrition?.sodium || meal.plan.recipe.sodium,
        is_unified: false,
      });
    }
  }

  console.log(`[CronJob] 개인 식단 저장할 레코드 수: ${records.length}`);
  if (records.length > 0) {
    const { error: insertError } = await supabase.from("diet_plans").insert(records);
    if (insertError) {
      console.error("[CronJob] 개인 식단 저장 실패:", insertError);
      throw insertError;
    }
    console.log("[CronJob] 개인 식단 저장 완료");
  }
}

