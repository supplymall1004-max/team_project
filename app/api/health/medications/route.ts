/**
 * @file app/api/health/medications/route.ts
 * @description 약물 복용 기록 관리 API
 * 
 * GET /api/health/medications - 약물 복용 기록 조회
 * POST /api/health/medications - 약물 복용 기록 추가
 * PUT /api/health/medications/:id - 약물 복용 기록 수정
 * DELETE /api/health/medications/:id - 약물 복용 기록 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { saveMedicationRecords } from "@/lib/health/medication-records-sync";
import type { MedicationRecord } from "@/types/health-data-integration";

/**
 * GET /api/health/medications
 * 약물 복용 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/medications");

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

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get("family_member_id") || undefined;
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;
    const activeOnly = searchParams.get("active_only") === "true";

    // 3. 약물 복용 기록 조회
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("medication_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("start_date", { ascending: false });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }
    if (startDate) {
      query = query.gte("start_date", startDate);
    }
    if (endDate) {
      query = query.lte("start_date", endDate);
    }
    if (activeOnly) {
      // 종료일이 없거나 미래인 약물만 조회
      const today = new Date().toISOString().split("T")[0];
      query = query.or(`end_date.is.null,end_date.gte.${today}`);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error("❌ 약물 복용 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch medication records",
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 약물 복용 기록 조회 완료: ${records?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: records || [],
      count: records?.length || 0,
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
 * POST /api/health/medications
 * 약물 복용 기록 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/medications");

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
    const {
      family_member_id,
      medication_name,
      medication_code,
      active_ingredient,
      dosage,
      frequency,
      start_date,
      end_date,
      reminder_times,
      reminder_enabled,
      hospital_record_id,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!medication_name || !dosage || !frequency || !start_date) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "약물명, 용량, 복용 빈도, 시작일은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 약물 복용 기록 저장
    const record: Partial<MedicationRecord> = {
      user_id: premiumCheck.userId,
      family_member_id: family_member_id || null,
      medication_name: medication_name,
      medication_code: medication_code || null,
      active_ingredient: active_ingredient || null,
      dosage: dosage,
      frequency: frequency,
      start_date: start_date,
      end_date: end_date || null,
      reminder_times: Array.isArray(reminder_times) ? reminder_times : [],
      reminder_enabled: reminder_enabled !== undefined ? reminder_enabled : true,
      hospital_record_id: hospital_record_id || null,
      data_source_id: null,
      is_auto_synced: false,
      notes: notes || null,
    };

    const result = await saveMedicationRecords([record], premiumCheck.userId);

    if (result.errors > 0) {
      console.error("❌ 약물 복용 기록 저장 실패");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to save medication record",
          message: "약물 복용 기록 저장에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    console.log("✅ 약물 복용 기록 저장 완료");
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        message: "약물 복용 기록이 저장되었습니다.",
      },
      { status: 201 }
    );
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

