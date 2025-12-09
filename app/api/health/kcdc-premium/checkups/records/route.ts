/**
 * @file app/api/health/kcdc-premium/checkups/records/route.ts
 * @description 건강검진 기록 관리 API
 * 
 * GET /api/health/kcdc-premium/checkups/records - 건강검진 기록 조회
 * POST /api/health/kcdc-premium/checkups/records - 건강검진 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getCheckupRecords,
  createCheckupRecord,
  type CreateCheckupRecordParams,
} from "@/lib/kcdc/checkup-manager";

/**
 * GET /api/health/kcdc-premium/checkups/records
 * 건강검진 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/checkups/records");

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

    // 3. 건강검진 기록 조회
    const records = await getCheckupRecords(
      premiumCheck.userId,
      familyMemberId
    );

    console.log(`✅ 건강검진 기록 조회 완료: ${records.length}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error("❌ 건강검진 기록 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to fetch checkup records",
        message:
          error instanceof Error
            ? error.message
            : "건강검진 기록 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/checkups/records
 * 건강검진 기록 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/checkups/records");

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
      checkup_type,
      checkup_date,
      checkup_site,
      checkup_site_address,
      results,
      next_recommended_date,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!checkup_type || !checkup_date) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "검진 유형과 검진 일자는 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 건강검진 기록 생성
    const record = await createCheckupRecord({
      userId: premiumCheck.userId,
      familyMemberId: family_member_id,
      checkupType: checkup_type,
      checkupDate: checkup_date,
      checkupSite: checkup_site,
      checkupSiteAddress: checkup_site_address,
      results: results || {},
      nextRecommendedDate: next_recommended_date,
      notes,
    });

    console.log("✅ 건강검진 기록 생성 완료:", record.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 건강검진 기록 생성 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to create checkup record",
        message:
          error instanceof Error
            ? error.message
            : "건강검진 기록 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

