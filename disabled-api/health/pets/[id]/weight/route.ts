/**
 * @file app/api/health/pets/[id]/weight/route.ts
 * @description 반려동물 체중 기록 관리 API
 * 
 * GET /api/health/pets/[id]/weight - 체중 기록 조회
 * POST /api/health/pets/[id]/weight - 체중 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/pets/[id]/weight
 * 반려동물 체중 기록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`🐾 GET /api/health/pets/${id}/weight`);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 확인
    const { data: pet, error: petError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (petError || !pet) {
      console.error("❌ 반려동물 조회 실패:", petError);
      console.groupEnd();
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // 체중 기록 조회 (weight_logs 테이블 사용)
    const { data: records, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", supabaseUserId)
      .eq("family_member_id", id)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ 체중 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 최신 체중
    const latestWeight = records && records.length > 0 ? records[0].weight_kg : null;

    console.log(`✅ 체중 기록 조회 완료: ${records?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      records: records || [],
      latestWeight,
      count: records?.length || 0,
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/pets/[id]/weight
 * 반려동물 체중 기록 추가
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`➕ POST /api/health/pets/${id}/weight`);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("요청 데이터:", body);

    // 필수 필드 검증
    if (!body.date || !body.weight_kg) {
      console.error("❌ 필수 필드 누락");
      console.groupEnd();
      return NextResponse.json(
        { error: "Validation error", message: "날짜와 체중은 필수입니다." },
        { status: 400 }
      );
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 확인
    const { data: pet, error: petError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (petError || !pet) {
      console.error("❌ 반려동물 조회 실패:", petError);
      console.groupEnd();
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // 체중 기록 추가 (weight_logs 테이블 사용)
    const { data: newRecord, error } = await supabase
      .from("weight_logs")
      .insert({
        user_id: supabaseUserId,
        family_member_id: id,
        date: body.date,
        weight_kg: body.weight_kg,
        body_fat_percentage: body.body_fat_percentage || null,
        muscle_mass_kg: body.muscle_mass_kg || null,
        source: body.source || 'manual',
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 체중 기록 추가 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 반려동물 프로필의 현재 체중 업데이트
    await supabase
      .from("family_members")
      .update({ weight_kg: body.weight_kg })
      .eq("id", id);

    console.log("✅ 체중 기록 추가 완료:", { id: newRecord.id });
    console.groupEnd();

    return NextResponse.json({ record: newRecord }, { status: 201 });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

