/**
 * @file app/api/test/recipes-check/route.ts
 * @description 레시피 데이터 검증 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    // 레시피 개수 조회
    const { count, error: countError } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // 최근 레시피 5개 조회
    const { data: recentRecipes, error: dataError } = await supabase
      .from("recipes")
      .select("id, slug, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (dataError) {
      return NextResponse.json(
        { success: false, error: dataError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      details: recentRecipes
        ? `최근 레시피: ${recentRecipes.map((r) => r.title).join(", ")}`
        : "레시피 없음",
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


