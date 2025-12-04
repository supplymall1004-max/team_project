/**
 * @file app/api/test/weekly-diet-check/route.ts
 * @description 주간 식단 데이터 검증 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    // 주간 식단 메타데이터 개수
    const { count: weeklyCount, error: weeklyError } = await supabase
      .from("weekly_diet_plans")
      .select("*", { count: "exact", head: true });

    // 주간 장보기 리스트 개수
    const { count: shoppingCount, error: shoppingError } = await supabase
      .from("weekly_shopping_lists")
      .select("*", { count: "exact", head: true });

    // 주간 영양 통계 개수
    const { count: statsCount, error: statsError } = await supabase
      .from("weekly_nutrition_stats")
      .select("*", { count: "exact", head: true });

    if (weeklyError || shoppingError || statsError) {
      return NextResponse.json(
        {
          success: false,
          error: weeklyError?.message || shoppingError?.message || statsError?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: weeklyCount || 0,
      details: `주간 식단: ${weeklyCount || 0}개, 장보기 리스트: ${shoppingCount || 0}개, 영양 통계: ${statsCount || 0}개`,
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


