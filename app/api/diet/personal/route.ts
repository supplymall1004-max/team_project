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
    const includeFavorites = body.includeFavorites === true; // 찜한 식단 포함 여부
    
    console.log("대상 날짜:", targetDate);
    console.log("찜한 식단 포함:", includeFavorites);

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
    const dietPlan = await generatePersonalDiet(
      supabaseUserId,
      profile,
      targetDate,
      undefined, // availableRecipes
      undefined, // usedByCategory
      undefined, // preferredRiceType
      undefined, // premiumFeatures
      includeFavorites // 찜한 식단 포함 여부
    );

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
      planRecords.push(createDietPlanRecord(
        supabaseUserId,
        targetDate,
        "snack",
        dietPlan.snack,
        false
      ));
    }

    if (planRecords.length === 0) {
      console.warn("⚠️ 저장할 식단 레코드가 없습니다");
      console.groupEnd();
      return NextResponse.json(
        { error: "No diet plan records to save" },
        { status: 400 }
      );
    }

    console.log(`💾 ${planRecords.length}개 식단 레코드 저장 시도...`);
    console.log("💾 저장할 데이터 샘플:", JSON.stringify(planRecords[0], null, 2));

    const { error: insertError, data: insertedData } = await supabase
      .from("diet_plans")
      .insert(planRecords)
      .select();

    if (insertError) {
      console.error("❌ 저장 실패:", insertError);
      console.error("❌ 저장 오류 상세:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      console.error("❌ 저장하려던 데이터:", JSON.stringify(planRecords, null, 2));
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Failed to save diet plan",
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log(`✅ ${insertedData?.length || planRecords.length}개 식단 레코드 저장 완료`);

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
  // recipe_id 검증: UUID 형식이 아니면 null로 저장
  const recipeId = recipe.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipe.id)
    ? recipe.id
    : null;

  // recipe_title 필수 필드 검증
  const recipeTitle = recipe.title?.trim() || `레시피-${mealType}`;
  if (!recipeTitle || recipeTitle.trim() === "") {
    console.error(`❌ ${mealType}의 recipe_title이 비어있습니다. 기본값 사용: 레시피-${mealType}`);
  }

  // ingredients를 JSONB 형식으로 변환
  const ingredientsJsonb = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
    ? recipe.ingredients
    : null;

  // instructions를 문자열로 변환 (배열인 경우 join)
  const instructionsText = Array.isArray(recipe.instructions)
    ? recipe.instructions.join("\n")
    : recipe.instructions || null;

  return {
    user_id: userId,
    plan_date: planDate,
    meal_type: mealType,
    recipe_id: recipeId,
    recipe_title: recipeTitle,
    recipe_description: recipe.description || null,
    ingredients: ingredientsJsonb,
    instructions: instructionsText,
    calories: recipe.nutrition.calories || 0,
    protein_g: recipe.nutrition.protein || 0,
    carbs_g: recipe.nutrition.carbs || 0,
    fat_g: recipe.nutrition.fat || 0,
    sodium_mg: recipe.nutrition.sodium || 0,
    fiber_g: recipe.nutrition.fiber ?? null,
    potassium_mg: recipe.nutrition.potassium ?? null,
    phosphorus_mg: recipe.nutrition.phosphorus ?? null,
    gi_index: recipe.nutrition.gi ?? null,
    is_unified: isUnified,
  };
}

