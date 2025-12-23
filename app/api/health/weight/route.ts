/**
 * @file app/api/health/weight/route.ts
 * @description 체중 기록 API
 *
 * GET: 체중 기록 조회
 * POST: 체중 기록 추가/수정
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/weight
 * 체중 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/weight");

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
      .from("weight_logs")
      .select("*")
      .eq("user_id", userData.id)
      .is("family_member_id", null)
      .order("date", { ascending: false });

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 체중 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "체중 기록 조회 실패", message: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ 체중 기록 조회 완료: ${data?.length || 0}건`);
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
 * POST /api/health/weight
 * 체중 기록 추가/수정
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/weight");

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
    const { date, weight_kg, body_fat_percentage, muscle_mass_kg, notes } = body;

    if (!date || !weight_kg) {
      return NextResponse.json(
        { error: "날짜와 체중은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 기존 기록 확인
    const { data: existing } = await supabase
      .from("weight_logs")
      .select("id")
      .eq("user_id", userData.id)
      .is("family_member_id", null)
      .eq("date", date)
      .maybeSingle();

    const weightData: any = {
      user_id: userData.id,
      family_member_id: null,
      date,
      weight_kg,
      body_fat_percentage: body_fat_percentage || null,
      muscle_mass_kg: muscle_mass_kg || null,
      notes: notes || null,
      source: "manual",
    };

    let result;
    if (existing) {
      // 수정
      const { data, error } = await supabase
        .from("weight_logs")
        .update(weightData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log("✅ 체중 기록 수정 완료");
    } else {
      // 추가
      const { data, error } = await supabase
        .from("weight_logs")
        .insert(weightData)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log("✅ 체중 기록 추가 완료");
    }

    console.groupEnd();
    return NextResponse.json({
      success: true,
      data: result,
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
