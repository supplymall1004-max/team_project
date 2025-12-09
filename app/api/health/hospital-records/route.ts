/**
 * @file app/api/health/hospital-records/route.ts
 * @description 병원 방문 기록 관리 API
 * 
 * GET /api/health/hospital-records - 병원 방문 기록 조회
 * POST /api/health/hospital-records - 병원 방문 기록 추가 (수동 입력)
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { saveHospitalRecords } from "@/lib/health/hospital-records-sync";
import type { HospitalRecord } from "@/types/health-data-integration";

/**
 * GET /api/health/hospital-records
 * 병원 방문 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/hospital-records");

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
    const hospitalName = searchParams.get("hospital_name") || undefined;

    // 3. 병원 방문 기록 조회
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("hospital_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("visit_date", { ascending: false });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }
    if (startDate) {
      query = query.gte("visit_date", startDate);
    }
    if (endDate) {
      query = query.lte("visit_date", endDate);
    }
    if (hospitalName) {
      query = query.ilike("hospital_name", `%${hospitalName}%`);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error("❌ 병원 방문 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch hospital records",
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 병원 방문 기록 조회 완료: ${records?.length || 0}건`);
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
 * POST /api/health/hospital-records
 * 병원 방문 기록 추가 (수동 입력)
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/hospital-records");

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
      visit_date,
      hospital_name,
      hospital_code,
      department,
      diagnosis,
      diagnosis_codes,
      prescribed_medications,
      treatment_summary,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!visit_date || !hospital_name) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "방문일과 병원명은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 병원 방문 기록 저장
    const record: Partial<HospitalRecord> = {
      user_id: premiumCheck.userId,
      family_member_id: family_member_id || null,
      visit_date: visit_date,
      hospital_name: hospital_name,
      hospital_code: hospital_code || null,
      department: department || null,
      diagnosis: Array.isArray(diagnosis) ? diagnosis : [],
      diagnosis_codes: Array.isArray(diagnosis_codes) ? diagnosis_codes : [],
      prescribed_medications: Array.isArray(prescribed_medications) ? prescribed_medications : [],
      treatment_summary: treatment_summary || null,
      data_source_id: null,
      is_auto_synced: false,
      notes: notes || null,
    };

    const result = await saveHospitalRecords([record], premiumCheck.userId);

    if (result.errors > 0) {
      console.error("❌ 병원 방문 기록 저장 실패");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to save hospital record",
          message: "병원 방문 기록 저장에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    console.log("✅ 병원 방문 기록 저장 완료");
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        message: "병원 방문 기록이 저장되었습니다.",
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

