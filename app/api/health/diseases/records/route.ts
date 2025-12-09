/**
 * @file app/api/health/diseases/records/route.ts
 * @description 질병 진단 기록 관리 API
 * 
 * GET /api/health/diseases/records - 질병 진단 기록 조회
 * POST /api/health/diseases/records - 질병 진단 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { saveDiseaseRecords, syncDiseasesToHealthProfile } from "@/lib/health/disease-records-sync";
import type { DiseaseRecord } from "@/types/health-data-integration";

/**
 * GET /api/health/diseases/records
 * 질병 진단 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/diseases/records");

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
    const status = searchParams.get("status") || undefined;

    // 3. 질병 진단 기록 조회
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("disease_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("diagnosis_date", { ascending: false });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error("❌ 질병 진단 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch disease records",
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 질병 진단 기록 조회 완료: ${records?.length || 0}건`);
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
 * POST /api/health/diseases/records
 * 질병 진단 기록 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/diseases/records");

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
      disease_name,
      disease_code,
      diagnosis_date,
      hospital_name,
      hospital_record_id,
      status,
      severity,
      treatment_plan,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!disease_name || !diagnosis_date) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "질병명과 진단일은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 질병 진단 기록 저장
    const record: Partial<DiseaseRecord> = {
      user_id: premiumCheck.userId,
      family_member_id: family_member_id || null,
      disease_name: disease_name,
      disease_code: disease_code || null,
      diagnosis_date: diagnosis_date,
      hospital_name: hospital_name || null,
      hospital_record_id: hospital_record_id || null,
      status: status || "active",
      severity: severity || null,
      treatment_plan: treatment_plan || null,
      data_source_id: null,
      is_auto_synced: false,
      notes: notes || null,
    };

    const result = await saveDiseaseRecords([record], premiumCheck.userId);

    if (result.errors > 0) {
      console.error("❌ 질병 진단 기록 저장 실패");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to save disease record",
          message: "질병 진단 기록 저장에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 5. user_health_profiles에 질병 정보 동기화
    await syncDiseasesToHealthProfile(premiumCheck.userId);

    console.log("✅ 질병 진단 기록 저장 완료");
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        message: "질병 진단 기록이 저장되었습니다.",
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

