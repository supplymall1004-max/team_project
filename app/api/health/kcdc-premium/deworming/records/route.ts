/**
 * @file app/api/health/kcdc-premium/deworming/records/route.ts
 * @description 구충제 복용 기록 API
 * 
 * GET /api/health/kcdc-premium/deworming/records - 복용 기록 조회
 * POST /api/health/kcdc-premium/deworming/records - 복용 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getDewormingRecords,
  createDewormingRecord,
  getUpcomingDewormingRecords,
  type CreateDewormingRecordParams,
} from "@/lib/kcdc/deworming-manager";

/**
 * GET /api/health/kcdc-premium/deworming/records
 * 구충제 복용 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/deworming/records");

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
    const searchParams = request.nextUrl.searchParams;
    const familyMemberId = searchParams.get("family_member_id");
    const upcoming = searchParams.get("upcoming");
    const days = searchParams.get("days");

    // 3. 기록 조회
    let records;
    if (upcoming === "true") {
      // 다음 복용 예정 기록만 조회
      const daysNum = days ? parseInt(days, 10) : 30;
      records = await getUpcomingDewormingRecords(
        premiumCheck.userId,
        daysNum
      );
    } else {
      // 전체 기록 조회
      records = await getDewormingRecords(
        premiumCheck.userId,
        familyMemberId || null
      );
    }

    console.log("✅ 조회 성공:", records.length, "개");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "구충제 복용 기록 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/deworming/records
 * 구충제 복용 기록 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/deworming/records");

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
      dosage,
      taken_date,
      cycle_days,
      prescribed_by,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!medication_name || !dosage || !taken_date) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "구충제명, 복용량, 복용일은 필수입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 기록 생성
    const params: CreateDewormingRecordParams = {
      userId: premiumCheck.userId,
      familyMemberId: family_member_id || null,
      medicationName: medication_name,
      dosage,
      takenDate: taken_date,
      cycleDays: cycle_days,
      prescribedBy: prescribed_by || null,
      notes: notes || null,
    };

    const record = await createDewormingRecord(params);

    console.log("✅ 생성 성공:", record.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "구충제 복용 기록 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

