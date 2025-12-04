/**
 * @file app/api/test/diet-plans-check/route.ts
 * @description 식단 계획 데이터 검증 API
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    // 식단 계획 개수 조회
    const { count, error: countError } = await supabase
      .from("diet_plans")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // 날짜 범위 확인
    const { data: dateRange, error: dateError } = await supabase
      .from("diet_plans")
      .select("plan_date")
      .order("plan_date", { ascending: true })
      .limit(1);

    const { data: dateRangeMax, error: dateMaxError } = await supabase
      .from("diet_plans")
      .select("plan_date")
      .order("plan_date", { ascending: false })
      .limit(1);

    if (dateError || dateMaxError) {
      return NextResponse.json({
        success: true,
        count: count || 0,
        details: "날짜 범위 확인 불가",
      });
    }

    const minDate = dateRange?.[0]?.plan_date;
    const maxDate = dateRangeMax?.[0]?.plan_date;
    const dateRangeText =
      minDate && maxDate ? `${minDate} ~ ${maxDate}` : "날짜 없음";

    return NextResponse.json({
      success: true,
      count: count || 0,
      details: `날짜 범위: ${dateRangeText}`,
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


