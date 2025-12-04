/**
 * @file app/api/diet/personal/route.ts
 * @description 개인 식단 생성 API
 * 
 * POST /api/diet/personal - 식단 생성 및 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";
import { trackRecipeUsage } from "@/lib/diet/recipe-history";
import { clearDietPlanCache } from "@/lib/cache/diet-plan-cache";
import type { MealComposition, RecipeDetailForDiet } from "@/types/recipe";

/**
 * POST /api/diet/personal
 * 개인 식단 생성
 * 
 * Body: { targetDate: 'YYYY-MM-DD' }
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🍱 POST /api/diet/personal");
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetDate = body.targetDate || new Date().toISOString().split("T")[0];
    
    console.log("대상 날짜:", targetDate);

    const supabase = await createClerkSupabaseClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;

    // 건강 프로필 조회
    const { data: profile } = await supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    if (!profile) {
      console.error("❌ 건강 프로필 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "Health profile not found. Please create one first." },
        { status: 404 }
      );
    }

    // 식단 생성
    console.log("식단 생성 중...");
    const dietPlan = await generatePersonalDiet(supabaseUserId, profile, targetDate);

    // 데이터베이스에 저장
    console.log("데이터베이스 저장 중...");
    
    // 기존 식단 삭제
    await supabase
      .from("diet_plans")
      .delete()
      .eq("user_id", supabaseUserId)
      .eq("plan_date", targetDate)
      .eq("is_unified", false);

    // 새 식단 저장
    const planRecords = [];

    // 아침
    if (dietPlan.breakfast) {
      const breakfastRecords = extractMealRecords(
        supabaseUserId,
        targetDate,
        "breakfast",
        dietPlan.breakfast,
        false
      );
      planRecords.push(...breakfastRecords);
    }

    // 점심
    if (dietPlan.lunch) {
      const lunchRecords = extractMealRecords(
        supabaseUserId,
        targetDate,
        "lunch",
        dietPlan.lunch,
        false
      );
      planRecords.push(...lunchRecords);
    }

    // 저녁
    if (dietPlan.dinner) {
      const dinnerRecords = extractMealRecords(
        supabaseUserId,
        targetDate,
        "dinner",
        dietPlan.dinner,
        false
      );
      planRecords.push(...dinnerRecords);
    }

    // 간식
    if (dietPlan.snack) {
      planRecords.push({
        user_id: supabaseUserId,
        plan_date: targetDate,
        meal_type: "snack",
        recipe_title: dietPlan.snack.title,
        recipe_description: dietPlan.snack.description,
        ingredients: dietPlan.snack.ingredients,
        instructions: dietPlan.snack.instructions,
        calories: dietPlan.snack.nutrition.calories,
        protein_g: dietPlan.snack.nutrition.protein,
        carbs_g: dietPlan.snack.nutrition.carbs,
        fat_g: dietPlan.snack.nutrition.fat,
        sodium_mg: dietPlan.snack.nutrition.sodium,
        fiber_g: dietPlan.snack.nutrition.fiber,
        potassium_mg: dietPlan.snack.nutrition.potassium ?? null,
        phosphorus_mg: dietPlan.snack.nutrition.phosphorus ?? null,
        gi_index: dietPlan.snack.nutrition.gi ?? null,
        is_unified: false,
      });
    }

    const { error: insertError } = await supabase
      .from("diet_plans")
      .insert(planRecords);

    if (insertError) {
      console.error("❌ 저장 실패:", insertError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to save diet plan" },
        { status: 500 }
      );
    }

    // 레시피 사용 이력 기록
    console.log("레시피 사용 이력 기록 중...");
    for (const record of planRecords) {
      await trackRecipeUsage(supabaseUserId, record.recipe_title, {
        mealType: record.meal_type as any,
        usedDate: targetDate,
      });
    }

    console.log("✅ 식단 생성 및 저장 완료");
    console.groupEnd();

    return NextResponse.json({ dietPlan }, { status: 201 });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 식사 데이터에서 데이터베이스 레코드 추출
 */
function extractMealRecords(
  userId: string,
  planDate: string,
  mealType: "breakfast" | "lunch" | "dinner",
  meal: MealComposition | RecipeDetailForDiet,
  isUnified: boolean
): any[] {
  const records: any[] = [];

  // MealComposition인 경우 (밥+반찬+국)
  if ("rice" in meal && "sides" in meal) {
    const composition = meal as MealComposition;

    // 밥
    if (composition.rice) {
      records.push(createDietPlanRecord(
        userId,
        planDate,
        mealType,
        composition.rice,
        isUnified
      ));
    }

    // 반찬들
    for (const side of composition.sides) {
      records.push(createDietPlanRecord(
        userId,
        planDate,
        mealType,
        side,
        isUnified
      ));
    }

    // 국/찌개
    if (composition.soup) {
      records.push(createDietPlanRecord(
        userId,
        planDate,
        mealType,
        composition.soup,
        isUnified
      ));
    }
  }
  // RecipeDetailForDiet인 경우 (간식 등)
  else {
    const recipe = meal as RecipeDetailForDiet;
    records.push(createDietPlanRecord(
      userId,
      planDate,
      mealType,
      recipe,
      isUnified
    ));
  }

  return records;
}

/**
 * 식단 레코드 생성
 */
function createDietPlanRecord(
  userId: string,
  planDate: string,
  mealType: string,
  recipe: RecipeDetailForDiet,
  isUnified: boolean
) {
  return {
    user_id: userId,
    plan_date: planDate,
    meal_type: mealType,
    recipe_id: recipe.id,
    recipe_title: recipe.title,
    recipe_description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    calories: recipe.nutrition.calories,
    protein_g: recipe.nutrition.protein,
    carbs_g: recipe.nutrition.carbs,
    fat_g: recipe.nutrition.fat,
    sodium_mg: recipe.nutrition.sodium,
    fiber_g: recipe.nutrition.fiber,
    potassium_mg: recipe.nutrition.potassium ?? null,
    phosphorus_mg: recipe.nutrition.phosphorus ?? null,
    gi_index: recipe.nutrition.gi ?? null,
    is_unified: isUnified,
  };
}

