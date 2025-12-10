/**
 * @file app/api/family/diet/generate/route.ts
 * @description 가족 식단 생성 API
 * 
 * POST /api/family/diet/generate - 가족 식단 생성 및 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { generateFamilyDiet } from "@/lib/diet/family-diet-generator";
import { trackRecipeUsage } from "@/lib/diet/recipe-history";
import type { MealComposition, RecipeDetailForDiet } from "@/types/recipe";

/**
 * POST /api/family/diet/generate
 * 가족 식단 생성
 * 
 * Body: { targetDate: 'YYYY-MM-DD', includeUnified: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    console.group("👨‍👩‍👧‍👦 POST /api/family/diet/generate");
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetDate = body.targetDate || new Date().toISOString().split("T")[0];
    const includeUnified = body.includeUnified ?? true;
    
    console.log("대상 날짜:", targetDate);
    console.log("통합 식단 포함:", includeUnified);

    // 사용자 정보 확인 및 자동 동기화
    console.log("🔍 사용자 정보 확인 중...");
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자 정보 없음 (동기화 실패)");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found. Please try again after user synchronization." },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 정보 확인 완료:", userData.id);
    const supabaseUserId = userData.id;

    const supabase = await createClerkSupabaseClient();

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
        { error: "Health profile not found" },
        { status: 404 }
      );
    }

    // 가족 구성원 조회
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", supabaseUserId);

    if (!familyMembers || familyMembers.length === 0) {
      console.warn("⚠️ 가족 구성원 없음 - 개인 식단만 생성");
    }

    // 가족 식단 생성
    console.log("가족 식단 생성 중...");
    const familyDietPlan = await generateFamilyDiet(
      supabaseUserId,
      profile,
      familyMembers || [],
      targetDate,
      includeUnified
    );

    // 데이터베이스에 저장
    console.log("데이터베이스 저장 중...");
    
    // 기존 식단 삭제
    await supabase
      .from("diet_plans")
      .delete()
      .eq("user_id", supabaseUserId)
      .eq("plan_date", targetDate);

    const allRecords: any[] = [];

    // 개인별 식단 저장
    for (const [memberId, dietPlan] of Object.entries(familyDietPlan.individualPlans)) {
      const familyMemberId = memberId === "user" ? null : memberId;

      // 아침
      if (dietPlan.breakfast) {
        const breakfastRecords = extractMealRecords(
          supabaseUserId,
          familyMemberId,
          targetDate,
          "breakfast",
          dietPlan.breakfast,
          false
        );
        allRecords.push(...breakfastRecords);
      }

      // 점심
      if (dietPlan.lunch) {
        const lunchRecords = extractMealRecords(
          supabaseUserId,
          familyMemberId,
          targetDate,
          "lunch",
          dietPlan.lunch,
          false
        );
        allRecords.push(...lunchRecords);
      }

      // 저녁
      if (dietPlan.dinner) {
        const dinnerRecords = extractMealRecords(
          supabaseUserId,
          familyMemberId,
          targetDate,
          "dinner",
          dietPlan.dinner,
          false
        );
        allRecords.push(...dinnerRecords);
      }

      // 간식
      if (dietPlan.snack) {
        allRecords.push(createDietPlanRecord(
          supabaseUserId,
          familyMemberId,
          targetDate,
          "snack",
          dietPlan.snack,
          false
        ));
      }
    }

    // 통합 식단 저장
    if (familyDietPlan.unifiedPlan) {
      const unified = familyDietPlan.unifiedPlan;

      if (unified.breakfast) {
        const records = extractMealRecords(
          supabaseUserId,
          null,
          targetDate,
          "breakfast",
          unified.breakfast,
          true
        );
        allRecords.push(...records);
      }

      if (unified.lunch) {
        const records = extractMealRecords(
          supabaseUserId,
          null,
          targetDate,
          "lunch",
          unified.lunch,
          true
        );
        allRecords.push(...records);
      }

      if (unified.dinner) {
        const records = extractMealRecords(
          supabaseUserId,
          null,
          targetDate,
          "dinner",
          unified.dinner,
          true
        );
        allRecords.push(...records);
      }

      if (unified.snack) {
        allRecords.push(createDietPlanRecord(
          supabaseUserId,
          null,
          targetDate,
          "snack",
          unified.snack,
          true
        ));
      }
    }

    const { error: insertError } = await supabase
      .from("diet_plans")
      .insert(allRecords);

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
    for (const record of allRecords) {
      await trackRecipeUsage(supabaseUserId, record.recipe_title, {
        familyMemberId: record.family_member_id,
        mealType: record.meal_type as any,
        usedDate: targetDate,
      });
    }

    console.log("✅ 가족 식단 생성 및 저장 완료");
    console.groupEnd();

    return NextResponse.json({ familyDietPlan }, { status: 201 });
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
  familyMemberId: string | null,
  planDate: string,
  mealType: "breakfast" | "lunch" | "dinner",
  meal: MealComposition | RecipeDetailForDiet,
  isUnified: boolean
): any[] {
  const records: any[] = [];

  // MealComposition인 경우
  if ("rice" in meal && "sides" in meal) {
    const composition = meal as MealComposition;

    if (composition.rice) {
      records.push(createDietPlanRecord(
        userId,
        familyMemberId,
        planDate,
        mealType,
        composition.rice,
        isUnified
      ));
    }

    for (const side of composition.sides) {
      records.push(createDietPlanRecord(
        userId,
        familyMemberId,
        planDate,
        mealType,
        side,
        isUnified
      ));
    }

    if (composition.soup) {
      records.push(createDietPlanRecord(
        userId,
        familyMemberId,
        planDate,
        mealType,
        composition.soup,
        isUnified
      ));
    }
  }
  // RecipeDetailForDiet인 경우
  else {
    const recipe = meal as RecipeDetailForDiet;
    records.push(createDietPlanRecord(
      userId,
      familyMemberId,
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
  familyMemberId: string | null,
  planDate: string,
  mealType: string,
  recipe: RecipeDetailForDiet,
  isUnified: boolean
) {
  return {
    user_id: userId,
    family_member_id: familyMemberId,
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

