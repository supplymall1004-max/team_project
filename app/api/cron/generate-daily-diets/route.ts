/**
 * @file app/api/cron/generate-daily-diets/route.ts
 * @description 자동 식단 생성 Cron Job
 * 
 * 매일 오후 6시(18:00)에 실행되어 오늘 날짜의 일일 식단과 다음 주 주간 식단을 자동 생성
 * - 오후 6시에 오늘 식단을 생성하여 사용자가 당일 식단을 확인할 수 있도록 함
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { generateFamilyDiet } from "@/lib/diet/family-diet-generator";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";
import { generateWeeklyDiet, getNextMonday } from "@/lib/diet/weekly-diet-generator";
import { trackRecipeUsage } from "@/lib/diet/recipe-history";
import type { MealComposition, RecipeDetailForDiet } from "@/types/recipe";
import type { WeeklyDietGenerationOptions } from "@/types/weekly-diet";

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

    // 오늘 날짜 계산 (홈페이지에서 오늘 식단을 조회하므로 오늘 날짜로 생성)
    const today = new Date();
    const targetDate = today.toISOString().split("T")[0];

    console.log("대상 날짜 (오늘):", targetDate);

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
      weeklyDietsGenerated: 0,
      weeklyDietsFailed: 0,
    };

    // 다음 주 월요일 날짜 계산 (주간 식단용)
    const nextMonday = getNextMonday();
    const dayOfWeek = today.getDay(); // 0=일요일, 6=토요일
    const isSunday = dayOfWeek === 0;
    
    console.log(`📅 다음 주 월요일: ${nextMonday}`);
    console.log(`📅 오늘 요일: ${dayOfWeek === 0 ? '일요일' : dayOfWeek === 6 ? '토요일' : '평일'}`);

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

        // 1. 일일 식단 생성 (오늘)
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

        // 2. 주간 식단 생성 (일요일 오후 6시에만 다음 주 식단 생성)
        if (isSunday) {
          try {
            console.log(`\n📅 주간 식단 생성 시작 (다음 주: ${nextMonday})`);
            
            // 기존 주간 식단 확인
            const serviceSupabase = getServiceRoleClient();
            const { data: existingWeekly } = await serviceSupabase
              .from("weekly_diet_plans")
              .select("id")
              .eq("user_id", user.id)
              .eq("week_start_date", nextMonday)
              .maybeSingle();

            if (existingWeekly) {
              console.log(`⚠️ 이미 주간 식단이 존재함 - 건너뜀`);
            } else {
              // 주간 식단 생성 옵션
              const weeklyOptions: WeeklyDietGenerationOptions = {
                userId: user.id,
                weekStartDate: nextMonday,
                profile,
                familyMembers: familyMembers || undefined,
                avoidRecentRecipes: true,
                diversityLevel: "high", // 주간 식단은 다양성 강화
              };

              const weeklyDiet = await generateWeeklyDiet(weeklyOptions);

              // 주간 식단 저장
              await saveWeeklyDietToDatabase(serviceSupabase, user.id, weeklyDiet);
              
              results.weeklyDietsGenerated++;
              console.log(`✅ 주간 식단 생성 완료`);
            }
          } catch (weeklyError: any) {
            console.error(`❌ 주간 식단 생성 실패:`, weeklyError);
            results.weeklyDietsFailed++;
            results.errors.push(`User ${user.id} weekly: ${weeklyError.message}`);
            // 주간 식단 실패해도 일일 식단은 성공으로 처리
          }
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
    console.log(`  - 일일 식단 성공: ${results.success}명`);
    console.log(`  - 일일 식단 실패: ${results.failed}명`);
    if (isSunday) {
      console.log(`  - 주간 식단 생성: ${results.weeklyDietsGenerated}명`);
      console.log(`  - 주간 식단 실패: ${results.weeklyDietsFailed}명`);
    }
    console.groupEnd();

    return NextResponse.json({
      message: "Diets generated",
      targetDate,
      nextMonday: isSunday ? nextMonday : null,
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

  const buildCompositionSummary = (plan: any): string[] => {
    // MealComposition 형태면 rice/sides/soup를 items로 정리
    if (plan?.totalNutrition) {
      const items: string[] = [];
      if (plan.rice?.title) items.push(plan.rice.title);
      if (Array.isArray(plan.sides) && plan.sides.length > 0) {
        items.push(...plan.sides.map((s: any) => s?.title).filter(Boolean));
      }
      if (plan.soup?.title) items.push(plan.soup.title);
      return items;
    }

    // RecipeDetailForDiet 형태면 title 하나
    if (plan?.recipe?.title) return [plan.recipe.title];
    if (plan?.title) return [plan.title];
    return [];
  };

  const buildMacros = (plan: any): { calories: number; carbs: number; protein: number; fat: number; sodium: number } => {
    // MealComposition(our generator) uses totalNutrition.{calories, protein, carbs, fat, sodium}
    if (plan?.totalNutrition) {
      return {
        calories: plan.totalNutrition.calories || 0,
        carbs: plan.totalNutrition.carbs || 0,
        protein: plan.totalNutrition.protein || 0,
        fat: plan.totalNutrition.fat || 0,
        sodium: plan.totalNutrition.sodium || 0,
      };
    }

    // Some legacy shapes might be nutrition.{calories, carbs, protein, fat, sodium}
    if (plan?.nutrition) {
      return {
        calories: plan.nutrition.calories || 0,
        carbs: plan.nutrition.carbs || 0,
        protein: plan.nutrition.protein || 0,
        fat: plan.nutrition.fat || 0,
        sodium: plan.nutrition.sodium || 0,
      };
    }

    // Fallback: recipe-like
    return {
      calories: plan?.recipe?.calories || 0,
      carbs: plan?.recipe?.carbs || 0,
      protein: plan?.recipe?.protein || 0,
      fat: plan?.recipe?.fat || 0,
      sodium: plan?.recipe?.sodium || 0,
    };
  };

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
        if (!meal.plan) continue;
        const compositionSummary = buildCompositionSummary(meal.plan);
        const macros = buildMacros(meal.plan);
        const recipeTitle = compositionSummary.length > 0 ? compositionSummary.join(" · ") : `${meal.type} 식사`;

        // MealComposition or Recipe-like: always persist with consistent schema (carbs_g, etc)
        if (compositionSummary.length > 0) {
          allRecords.push({
            user_id: userId,
            family_member_id: familyMemberId,
            plan_date: targetDate,
            meal_type: meal.type,
            recipe_id: null,
            recipe_title: recipeTitle,
            recipe_description: `${meal.type} 식사 구성`,
            calories: macros.calories,
            carbs_g: macros.carbs,
            protein_g: macros.protein,
            fat_g: macros.fat,
            sodium_mg: macros.sodium,
            composition_summary: compositionSummary,
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
      if (!meal.plan) continue;
      const compositionSummary = buildCompositionSummary(meal.plan);
      const macros = buildMacros(meal.plan);
      const recipeTitle = compositionSummary.length > 0 ? compositionSummary.join(" · ") : `${meal.type} 식사`;

      if (compositionSummary.length > 0) {
        allRecords.push({
          user_id: userId,
          family_member_id: null, // 통합 식단은 가족 전체
          plan_date: targetDate,
          meal_type: meal.type,
          recipe_id: null,
          recipe_title: recipeTitle,
          recipe_description: `${meal.type} 식사 구성`,
          calories: macros.calories,
          carbs_g: macros.carbs,
          protein_g: macros.protein,
          fat_g: macros.fat,
          sodium_mg: macros.sodium,
          composition_summary: compositionSummary,
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

  const buildCompositionSummary = (plan: any): string[] => {
    if (plan?.totalNutrition) {
      const items: string[] = [];
      if (plan.rice?.title) items.push(plan.rice.title);
      if (Array.isArray(plan.sides) && plan.sides.length > 0) {
        items.push(...plan.sides.map((s: any) => s?.title).filter(Boolean));
      }
      if (plan.soup?.title) items.push(plan.soup.title);
      return items;
    }
    if (plan?.title) return [plan.title];
    return [];
  };

  const buildMacros = (plan: any): { calories: number; carbs: number; protein: number; fat: number; sodium: number } => {
    if (plan?.totalNutrition) {
      return {
        calories: plan.totalNutrition.calories || 0,
        carbs: plan.totalNutrition.carbs || 0,
        protein: plan.totalNutrition.protein || 0,
        fat: plan.totalNutrition.fat || 0,
        sodium: plan.totalNutrition.sodium || 0,
      };
    }
    if (plan?.nutrition) {
      return {
        calories: plan.nutrition.calories || 0,
        carbs: plan.nutrition.carbs || 0,
        protein: plan.nutrition.protein || 0,
        fat: plan.nutrition.fat || 0,
        sodium: plan.nutrition.sodium || 0,
      };
    }
    return { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 };
  };

  // 각 식사별로 저장
  const meals = [
    { type: "breakfast", plan: personalDiet.breakfast },
    { type: "lunch", plan: personalDiet.lunch },
    { type: "dinner", plan: personalDiet.dinner },
    { type: "snack", plan: personalDiet.snack }
  ];

  for (const meal of meals) {
    if (!meal.plan) continue;
    const compositionSummary = buildCompositionSummary(meal.plan);
    const macros = buildMacros(meal.plan);
    const recipeTitle = compositionSummary.length > 0 ? compositionSummary.join(" · ") : `${meal.type} 식사`;

    // MealComposition 기반 저장
    if (compositionSummary.length > 0) {
      records.push({
        user_id: userId,
        family_member_id: null,
        plan_date: targetDate,
        meal_type: meal.type,
        recipe_id: null,
        recipe_title: recipeTitle,
        recipe_description: `${meal.type} 식사 구성`,
        calories: macros.calories,
        carbs_g: macros.carbs,
        protein_g: macros.protein,
        fat_g: macros.fat,
        sodium_mg: macros.sodium,
        composition_summary: compositionSummary,
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

/**
 * 주간 식단 저장 (크론 작업용)
 */
async function saveWeeklyDietToDatabase(
  supabase: any,
  userId: string,
  weeklyDiet: any
) {
  console.log("[CronJob] 주간 식단 저장 시작");

  try {
    // 1. 기존 주간 식단 삭제 (같은 주차)
    const { error: deleteError } = await supabase
      .from("weekly_diet_plans")
      .delete()
      .eq("user_id", userId)
      .eq("week_year", weeklyDiet.metadata.week_year)
      .eq("week_number", weeklyDiet.metadata.week_number);

    if (deleteError) {
      console.warn("⚠️ 기존 주간 식단 삭제 실패 (무시):", deleteError);
    } else {
      console.log("✅ 기존 주간 식단 삭제 완료");
    }

    // 2. 주간 식단 메타데이터 저장
    const { data: savedPlan, error: savePlanError } = await supabase
      .from("weekly_diet_plans")
      .insert({
        user_id: userId,
        week_start_date: weeklyDiet.metadata.week_start_date,
        week_year: weeklyDiet.metadata.week_year,
        week_number: weeklyDiet.metadata.week_number,
        is_family: weeklyDiet.metadata.is_family,
        total_recipes_count: weeklyDiet.metadata.total_recipes_count,
        generation_duration_ms: weeklyDiet.metadata.generation_duration_ms,
      })
      .select()
      .single();

    if (savePlanError || !savedPlan) {
      console.error("❌ 주간 식단 메타데이터 저장 실패:", savePlanError);
      throw savePlanError || new Error("Failed to save weekly plan metadata");
    }

    const weeklyPlanId = savedPlan.id;
    console.log("주간 식단 ID:", weeklyPlanId);

    // 3. 일별 식단 저장 (diet_plans 테이블에)
    const shouldPersistDailyPlans = weeklyDiet.dailyPlansPersisted !== true;
    if (shouldPersistDailyPlans) {
      const dietPlanRecords: any[] = [];
      for (const [date, dailyPlan] of Object.entries(weeklyDiet.dailyPlans)) {
        const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

        for (const mealType of meals) {
          const meal = (dailyPlan as any)[mealType];
          if (!meal) continue;

          // MealComposition 또는 RecipeDetailForDiet 처리
          if (meal.recipe) {
            dietPlanRecords.push({
              user_id: userId,
              plan_date: date,
              meal_type: mealType,
              recipe_id: meal.recipe.id || null,
              recipe_title: meal.recipe.title || `${mealType} 식사`,
              recipe_description: meal.recipe.description || "",
              calories: meal.nutrition?.calories || meal.recipe.calories || 0,
              carbohydrates: meal.nutrition?.carbs || meal.recipe.carbs || 0,
              protein: meal.nutrition?.protein || meal.recipe.protein || 0,
              fat: meal.nutrition?.fat || meal.recipe.fat || 0,
              sodium: meal.nutrition?.sodium || meal.recipe.sodium || 0,
              is_unified: false,
              weekly_diet_plan_id: weeklyPlanId, // 주간 식단 ID 연결
            });
          } else if (meal.totalNutrition) {
            // MealComposition 처리
            const summaryItems: string[] = [];
            if (meal.rice?.title) summaryItems.push(meal.rice.title);
            if (meal.sides?.length) summaryItems.push(...meal.sides.map((s: any) => s.title));
            if (meal.soup?.title) summaryItems.push(meal.soup.title);

            dietPlanRecords.push({
              user_id: userId,
              plan_date: date,
              meal_type: mealType,
              recipe_id: meal.rice?.id || meal.sides?.[0]?.id || null,
              recipe_title: summaryItems.length > 0 ? summaryItems.join(" · ") : `${mealType} 식사`,
              recipe_description: `${mealType} 식사 구성`,
              calories: meal.totalNutrition.calories || 0,
              carbohydrates: meal.totalNutrition.carbs || 0,
              protein: meal.totalNutrition.protein || 0,
              fat: meal.totalNutrition.fat || 0,
              sodium: meal.totalNutrition.sodium || 0,
              composition_summary: JSON.stringify({
                items: summaryItems,
                rice: meal.rice?.title ? [meal.rice.title] : [],
                sides: (meal.sides || []).map((s: any) => s.title),
                soup: meal.soup?.title ? [meal.soup.title] : [],
              }),
              is_unified: false,
              weekly_diet_plan_id: weeklyPlanId, // 주간 식단 ID 연결
            });
          }
        }
      }

      if (dietPlanRecords.length > 0) {
        const { error: dietPlanError } = await supabase
          .from("diet_plans")
          .insert(dietPlanRecords);

        if (dietPlanError) {
          console.error("⚠️ 일별 식단 저장 실패:", dietPlanError);
        } else {
          console.log(`✅ 일별 식단 ${dietPlanRecords.length}개 저장 완료`);
        }
      }
    }

    // 4. 장보기 리스트 저장
    if (weeklyDiet.shoppingList && weeklyDiet.shoppingList.length > 0) {
      const shoppingRecords = weeklyDiet.shoppingList.map((item: any) => ({
        weekly_diet_plan_id: weeklyPlanId,
        ingredient_name: item.ingredient_name,
        total_quantity: item.total_quantity,
        unit: item.unit,
        category: item.category,
        recipes_using: item.recipes_using,
        is_purchased: false,
      }));

      const { error: shoppingError } = await supabase
        .from("weekly_shopping_lists")
        .insert(shoppingRecords);

      if (shoppingError) {
        console.error("⚠️ 장보기 리스트 저장 실패:", shoppingError);
      } else {
        console.log(`✅ 장보기 리스트 ${shoppingRecords.length}개 저장 완료`);
      }
    }

    // 5. 영양 통계 저장
    if (weeklyDiet.nutritionStats && weeklyDiet.nutritionStats.length > 0) {
      const statsRecords = weeklyDiet.nutritionStats.map((stat: any) => ({
        weekly_diet_plan_id: weeklyPlanId,
        day_of_week: stat.day_of_week,
        date: stat.date,
        total_calories: stat.total_calories,
        total_carbohydrates: stat.total_carbohydrates,
        total_protein: stat.total_protein,
        total_fat: stat.total_fat,
        total_sodium: stat.total_sodium,
        meal_count: stat.meal_count,
      }));

      const { error: statsError } = await supabase
        .from("weekly_nutrition_stats")
        .insert(statsRecords);

      if (statsError) {
        console.error("⚠️ 영양 통계 저장 실패:", statsError);
      } else {
        console.log(`✅ 영양 통계 ${statsRecords.length}개 저장 완료`);
      }
    }

    console.log("[CronJob] 주간 식단 저장 완료");
  } catch (error: any) {
    console.error("[CronJob] 주간 식단 저장 실패:", error);
    throw error;
  }
}

