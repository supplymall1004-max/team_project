/**
 * @file app/api/test/ingredients-check/route.ts
 * @description 레시피 재료 데이터 검증 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    // 재료 개수 조회
    const { count, error: countError } = await supabase
      .from("recipe_ingredients")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // 레시피별 재료 개수 확인
    const { data: recipeIngredients, error: dataError } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id")
      .limit(100);

    if (dataError) {
      return NextResponse.json(
        { success: false, error: dataError.message },
        { status: 500 }
      );
    }

    const recipeCount = new Set(recipeIngredients?.map((ri) => ri.recipe_id) || []).size;

    return NextResponse.json({
      success: true,
      count: count || 0,
      details: `${recipeCount}개 레시피에 재료가 연결됨`,
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


