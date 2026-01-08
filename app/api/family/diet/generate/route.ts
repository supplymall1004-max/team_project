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
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
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

    // 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      console.log("❌ 프리미엄 사용자가 아님 - 식단 생성 차단");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "건강식단 생성은 프리미엄 회원만 이용할 수 있습니다.",
          details: "프리미엄 구독을 통해 건강식단 생성 기능을 이용하실 수 있습니다."
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetDate = body.targetDate || new Date().toISOString().split("T")[0];
    const includeUnified = body.includeUnified ?? true;
    const useVariation = body.useVariation ?? false; // 변형 모드
    const variationLevel = (body.variationLevel || 2) as 1 | 2 | 3; // 변형 레벨
    
    console.log("대상 날짜:", targetDate);
    console.log("통합 식단 포함:", includeUnified);
    console.log("변형 모드:", useVariation, useVariation ? `(Level ${variationLevel})` : "");

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

    // 가족 구성원 조회 (반려동물 제외)
    const { data: allFamilyMembers } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", supabaseUserId);

    // 반려동물 제외 (member_type이 'pet'이 아닌 경우만)
    const familyMembers = (allFamilyMembers || []).filter(
      member => (member as any).member_type !== 'pet'
    );

    if (!familyMembers || familyMembers.length === 0) {
      console.warn("⚠️ 가족 구성원 없음 - 개인 식단만 생성");
    } else {
      const petCount = (allFamilyMembers || []).filter(
        member => (member as any).member_type === 'pet'
      ).length;
      if (petCount > 0) {
        console.log(`🐾 반려동물 ${petCount}마리 제외됨`);
      }
    }

    // 가족 식단 생성
    console.log("가족 식단 생성 중...");
    const familyDietPlan = await generateFamilyDiet(
      supabaseUserId,
      profile,
      familyMembers || [],
      targetDate,
      includeUnified,
      useVariation, // 변형 모드
      variationLevel // 변형 레벨
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

    if (allRecords.length === 0) {
      console.warn("⚠️ 저장할 식단 레코드가 없습니다");
      console.groupEnd();
      return NextResponse.json(
        { error: "No diet plan records to save" },
        { status: 400 }
      );
    }

    console.log(`💾 ${allRecords.length}개 식단 레코드 저장 시도...`);
    console.log("💾 저장할 데이터 샘플:", JSON.stringify(allRecords[0], null, 2));

    const { error: insertError, data: insertedData } = await supabase
      .from("diet_plans")
      .insert(allRecords)
      .select();

    if (insertError) {
      console.error("❌ 저장 실패:", insertError);
      console.error("❌ 저장 오류 상세:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      console.error("❌ 저장하려던 데이터:", JSON.stringify(allRecords, null, 2));
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

    console.log(`✅ ${insertedData?.length || allRecords.length}개 식단 레코드 저장 완료`);

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
    family_member_id: familyMemberId,
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

