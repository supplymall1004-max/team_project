/**
 * @file app/api/health/medications/reminders/route.ts
 * @description 약물 복용 알림 관리 API
 *
 * GET /api/health/medications/reminders - 약물 복용 알림 조회
 * POST /api/health/medications/reminders/:id/confirm - 약물 복용 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getUserMedicationReminders,
  confirmMedicationReminder,
  getMedicationReminderLogs,
} from "@/lib/health/medication-reminder-service";

/**
 * GET /api/health/medications/reminders
 * 약물 복용 알림 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/medications/reminders");

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
    const dateParam = searchParams.get("date");
    const medicationRecordId = searchParams.get("medication_record_id");

    const date = dateParam ? new Date(dateParam) : undefined;

    // 3. 약물 복용 알림 조회
    let reminders;

    if (medicationRecordId) {
      // 특정 약물 기록의 알림 조회
      reminders = await getMedicationReminderLogs(medicationRecordId, date, date);
    } else {
      // 사용자의 모든 약물 복용 알림 조회
      reminders = await getUserMedicationReminders(
        premiumCheck.userId,
        familyMemberId || null,
        date
      );
    }

    console.log("✅ 약물 복용 알림 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "약물 복용 알림 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/medications/reminders/:id/confirm
 * 약물 복용 확인
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] POST /api/health/medications/reminders/:id/confirm");

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

    // 2. 약물 복용 확인
    const reminder = await confirmMedicationReminder(id);

    console.log("✅ 약물 복용 확인 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "약물 복용 확인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

