/**
 * @file app/api/health/medications/[id]/route.ts
 * @description 약물 복용 기록 수정/삭제 API
 * 
 * PUT /api/health/medications/:id - 약물 복용 기록 수정
 * DELETE /api/health/medications/:id - 약물 복용 기록 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * PUT /api/health/medications/:id
 * 약물 복용 기록 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] PUT /api/health/medications/:id");

    const { id } = await params;

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();

    // 3. 기록 소유권 확인 및 수정
    const supabase = getServiceRoleClient();
    const { data: record, error: fetchError } = await supabase
      .from("medication_records")
      .select("id")
      .eq("id", id)
      .eq("user_id", premiumCheck.userId)
      .single();

    if (fetchError || !record) {
      console.error("❌ 기록 조회 실패 또는 소유권 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Record not found",
          message: "약물 복용 기록을 찾을 수 없거나 권한이 없습니다.",
        },
        { status: 404 }
      );
    }

    // 4. 기록 수정
    const { data: updatedRecord, error: updateError } = await supabase
      .from("medication_records")
      .update({
        medication_name: body.medication_name,
        medication_code: body.medication_code,
        active_ingredient: body.active_ingredient,
        dosage: body.dosage,
        frequency: body.frequency,
        start_date: body.start_date,
        end_date: body.end_date,
        reminder_times: body.reminder_times,
        reminder_enabled: body.reminder_enabled,
        notes: body.notes,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ 기록 수정 실패:", updateError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to update medication record",
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ 약물 복용 기록 수정 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: updatedRecord,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
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
 * DELETE /api/health/medications/:id
 * 약물 복용 기록 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] DELETE /api/health/medications/:id");

    const { id } = await params;

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 기록 소유권 확인 및 삭제
    const supabase = getServiceRoleClient();
    const { error: deleteError } = await supabase
      .from("medication_records")
      .delete()
      .eq("id", id)
      .eq("user_id", premiumCheck.userId);

    if (deleteError) {
      console.error("❌ 기록 삭제 실패:", deleteError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to delete medication record",
          message: deleteError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ 약물 복용 기록 삭제 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "약물 복용 기록이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
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

