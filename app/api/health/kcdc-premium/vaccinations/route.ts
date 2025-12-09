/**
 * @file app/api/health/kcdc-premium/vaccinations/route.ts
 * @description 예방접종 기록 관리 API
 * 
 * GET /api/health/kcdc-premium/vaccinations - 예방접종 기록 조회
 * POST /api/health/kcdc-premium/vaccinations - 예방접종 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getVaccinationRecords,
  createVaccinationRecord,
  type CreateVaccinationRecordParams,
} from "@/lib/kcdc/vaccination-manager";

/**
 * GET /api/health/kcdc-premium/vaccinations
 * 예방접종 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/vaccinations");

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

    // 3. 예방접종 기록 조회
    const records = await getVaccinationRecords(
      premiumCheck.userId,
      familyMemberId
    );

    console.log(`✅ 예방접종 기록 조회 완료: ${records.length}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error("❌ 예방접종 기록 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to fetch vaccination records",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 기록 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/vaccinations
 * 예방접종 기록 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/vaccinations");

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
      vaccine_name,
      vaccine_code,
      target_age_group,
      scheduled_date,
      completed_date,
      dose_number,
      total_doses,
      vaccination_site,
      vaccination_site_address,
      reminder_enabled,
      reminder_days_before,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!vaccine_name || !dose_number || !total_doses) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "백신명, 접종 차수, 총 차수는 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 예방접종 기록 생성
    const record = await createVaccinationRecord({
      userId: premiumCheck.userId,
      familyMemberId: family_member_id,
      vaccineName: vaccine_name,
      vaccineCode: vaccine_code,
      targetAgeGroup: target_age_group,
      scheduledDate: scheduled_date,
      completedDate: completed_date,
      doseNumber: dose_number,
      totalDoses: total_doses,
      vaccinationSite: vaccination_site,
      vaccinationSiteAddress: vaccination_site_address,
      reminderEnabled: reminder_enabled,
      reminderDaysBefore: reminder_days_before,
      notes,
    });

    console.log("✅ 예방접종 기록 생성 완료:", record.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 예방접종 기록 생성 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to create vaccination record",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 기록 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

