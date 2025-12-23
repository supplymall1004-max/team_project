/**
 * @file app/api/health/vital-signs/route.ts
 * @description 혈압/혈당 기록 API
 *
 * GET: 혈압/혈당 기록 조회
 * POST: 혈압/혈당 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/vital-signs
 * 혈압/혈당 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/vital-signs");

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from("vital_signs")
      .select("*")
      .eq("user_id", userData.id)
      .is("family_member_id", null)
      .order("measured_at", { ascending: false });

    if (startDate) {
      query = query.gte("measured_at", startDate);
    }
    if (endDate) {
      query = query.lte("measured_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 혈압/혈당 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "혈압/혈당 기록 조회 실패", message: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ 혈압/혈당 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "서버 오류",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/vital-signs
 * 혈압/혈당 기록 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/vital-signs");

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      measured_at,
      systolic_bp,
      diastolic_bp,
      fasting_glucose,
      postprandial_glucose,
      heart_rate,
      notes,
    } = body;

    if (!measured_at) {
      return NextResponse.json(
        { error: "측정 시간은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    const vitalData: any = {
      user_id: userData.id,
      family_member_id: null,
      measured_at,
      systolic_bp: systolic_bp || null,
      diastolic_bp: diastolic_bp || null,
      fasting_glucose: fasting_glucose || null,
      postprandial_glucose: postprandial_glucose || null,
      heart_rate: heart_rate || null,
      notes: notes || null,
      source: "manual",
    };

    const { data, error } = await supabase
      .from("vital_signs")
      .insert(vitalData)
      .select()
      .single();

    if (error) {
      console.error("❌ 혈압/혈당 기록 추가 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "혈압/혈당 기록 추가 실패", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 혈압/혈당 기록 추가 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "서버 오류",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
