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
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
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

    // 저장 전 데이터 검증
    for (const record of planRecords) {
      if (!record.user_id || !record.plan_date || !record.meal_type || !record.recipe_title) {
        console.error("❌ 필수 필드 누락:", record);
        console.groupEnd();
        return NextResponse.json(
          { 
            error: "Invalid diet plan record",
            details: "필수 필드(user_id, plan_date, meal_type, recipe_title)가 누락되었습니다."
          },
          { status: 400 }
        );
      }
    }

    console.log(`💾 ${planRecords.length}개 식단 레코드 저장 시도...`);
    console.log("💾 저장할 데이터 샘플:", JSON.stringify(planRecords[0], null, 2));

    // 저장 시도 (기존 레코드는 이미 삭제했으므로 insert 사용)
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
      
      // 외래 키 제약조건 위반 시 사용자 친화적인 메시지 제공
      // PostgreSQL 에러 코드 23503 = Foreign key violation
      let errorMessage = insertError.message;
      let userFriendlyMessage = "식단 저장에 실패했습니다.";
      
      if (insertError.code === '23503') {
        // Foreign key violation - 외래 키 제약조건 위반
        if (insertError.message.includes('recipe_id')) {
          userFriendlyMessage = "선택한 레시피를 찾을 수 없습니다. 레시피가 삭제되었을 수 있습니다.";
          errorMessage = "레시피를 찾을 수 없습니다. 레시피가 삭제되었거나 존재하지 않습니다.";
        } else if (insertError.message.includes('user_id')) {
          userFriendlyMessage = "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.";
          errorMessage = "사용자 정보를 찾을 수 없습니다.";
        } else if (insertError.message.includes('family_member_id')) {
          userFriendlyMessage = "가족 구성원 정보를 찾을 수 없습니다.";
          errorMessage = "가족 구성원 정보를 찾을 수 없습니다.";
        } else if (insertError.message.includes('weekly_diet_plan_id')) {
          userFriendlyMessage = "주간 식단 정보를 찾을 수 없습니다.";
          errorMessage = "주간 식단 정보를 찾을 수 없습니다.";
        }
      } else if (insertError.code === '23505') {
        // Unique violation - 중복 데이터
        userFriendlyMessage = "이미 같은 날짜의 식단이 존재합니다.";
        errorMessage = "중복된 식단 데이터입니다.";
      } else if (insertError.code === '23502') {
        // Not null violation - 필수 필드 누락
        userFriendlyMessage = "필수 정보가 누락되었습니다. 다시 시도해주세요.";
        errorMessage = "필수 필드가 누락되었습니다.";
      }
      
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "식단 저장 실패",
          message: userFriendlyMessage, // 사용자 친화적인 메시지
          details: errorMessage, // 개발자를 위한 상세 메시지
          code: insertError.code,
          hint: insertError.hint,
          // 개발 환경에서만 상세 정보 제공
          ...(process.env.NODE_ENV === "development" && {
            attemptedData: planRecords.slice(0, 1), // 첫 번째 레코드만 샘플로 제공
          }),
        },
        { status: 500 }
      );
    }

    console.log(`✅ ${insertedData?.length || planRecords.length}개 식단 레코드 저장 완료`);

    // 레시피 사용 이력 기록
    // recipe_id를 함께 전달하여 데이터 무결성 향상
    console.log("레시피 사용 이력 기록 중...");
    for (const record of planRecords) {
      await trackRecipeUsage(supabaseUserId, record.recipe_title, {
        recipeId: record.recipe_id || undefined, // 새로 추가: 레시피 ID 전달
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
 * 
 * @param userId - 사용자 ID (UUID)
 * @param planDate - 식단 날짜 (YYYY-MM-DD)
 * @param mealType - 식사 타입 (breakfast, lunch, dinner, snack)
 * @param recipe - 레시피 정보
 * @param isUnified - 통합 식단 여부
 * @param weeklyDietPlanId - 주간 식단 계획 ID (선택적, 주간 식단 생성 시 사용)
 * @returns 데이터베이스에 저장할 레코드 객체
 * 
 * @description
 * 식단 레코드를 생성합니다. weekly_diet_plan_id가 제공되면 주간 식단과 연결됩니다.
 * 이렇게 하면 주간 식단 삭제 시 관련 일일 식단도 함께 관리할 수 있습니다.
 */
function createDietPlanRecord(
  userId: string,
  planDate: string,
  mealType: string,
  recipe: RecipeDetailForDiet,
  isUnified: boolean,
  weeklyDietPlanId?: string | null // 새로 추가된 매개변수
) {
  // recipe_id 검증: UUID 형식이 아니면 null로 저장
  const recipeId = recipe.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipe.id)
    ? recipe.id
    : null;

  // recipe_title 필수 필드 검증 및 기본값 설정
  let recipeTitle = recipe.title?.trim();
  if (!recipeTitle || recipeTitle === "") {
    recipeTitle = `레시피-${mealType}-${Date.now()}`;
    console.warn(`⚠️ ${mealType}의 recipe_title이 비어있습니다. 기본값 사용: ${recipeTitle}`);
  }

  // ingredients를 JSONB 형식으로 변환 (null 대신 빈 배열 사용)
  const ingredientsJsonb = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
    ? recipe.ingredients
    : [];

  // instructions를 문자열로 변환 (배열인 경우 join)
  const instructionsText = Array.isArray(recipe.instructions)
    ? recipe.instructions.join("\n")
    : (recipe.instructions || null);

  // 영양소 정보 검증 및 기본값 설정
  const nutrition = (recipe.nutrition || {}) as {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    fiber?: number;
    potassium?: number;
    phosphorus?: number;
    gi?: number;
  };
  
  // 필수 필드 검증
  if (!userId || !planDate || !mealType || !recipeTitle) {
    throw new Error(`식단 레코드 생성 실패: 필수 필드 누락 (userId: ${userId}, planDate: ${planDate}, mealType: ${mealType}, recipeTitle: ${recipeTitle})`);
  }

  return {
    user_id: userId,
    family_member_id: null, // 개인 식단이므로 항상 null
    plan_date: planDate,
    meal_type: mealType,
    recipe_id: recipeId,
    recipe_title: recipeTitle,
    recipe_description: recipe.description || null,
    ingredients: ingredientsJsonb,
    instructions: instructionsText,
    calories: nutrition.calories || 0,
    protein_g: nutrition.protein || 0,
    carbs_g: nutrition.carbs || 0,
    fat_g: nutrition.fat || 0,
    sodium_mg: nutrition.sodium || 0,
    fiber_g: nutrition.fiber ?? null,
    potassium_mg: nutrition.potassium ?? null,
    phosphorus_mg: nutrition.phosphorus ?? null,
    gi_index: nutrition.gi ?? null,
    is_unified: isUnified,
    weekly_diet_plan_id: weeklyDietPlanId || null, // 새로 추가된 필드: 주간 식단과 연결
  };
}

