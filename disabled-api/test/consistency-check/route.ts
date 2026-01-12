/**
 * @file app/api/test/consistency-check/route.ts
 * @description 데이터 일관성 검증 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const issues: string[] = [];

    // 1. 레시피와 재료 연결 확인
    const { data: orphanIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id")
      .limit(1);

    if (ingredientsError) {
      issues.push(`재료 조회 오류: ${ingredientsError.message}`);
    }

    // 2. 레시피와 단계 연결 확인
    const { data: orphanSteps, error: stepsError } = await supabase
      .from("recipe_steps")
      .select("recipe_id")
      .limit(1);

    if (stepsError) {
      issues.push(`단계 조회 오류: ${stepsError.message}`);
    }

    // 3. 식단 계획과 주간 식단 연결 확인
    const { data: weeklyPlans, error: weeklyError } = await supabase
      .from("weekly_diet_plans")
      .select("id")
      .limit(1);

    if (weeklyError) {
      issues.push(`주간 식단 조회 오류: ${weeklyError.message}`);
    }

    // 4. 가족 구성원과 식단 계획 연결 확인
    const { data: familyDietPlans, error: familyDietError } = await supabase
      .from("diet_plans")
      .select("family_member_id")
      .not("family_member_id", "is", null)
      .limit(1);

    if (familyDietError) {
      issues.push(`가족 식단 조회 오류: ${familyDietError.message}`);
    }

    const isValid = issues.length === 0;

    return NextResponse.json({
      success: true,
      isValid,
      details: isValid
        ? "모든 데이터 일관성 확인됨"
        : `발견된 문제: ${issues.join(", ")}`,
      issues: issues.length > 0 ? issues : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


