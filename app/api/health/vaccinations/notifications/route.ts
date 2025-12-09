/**
 * @file app/api/health/vaccinations/notifications/route.ts
 * @description 예방주사 알림 관리 API
 *
 * GET /api/health/vaccinations/notifications - 알림 설정 조회
 * PUT /api/health/vaccinations/notifications - 알림 설정 업데이트
 * POST /api/health/vaccinations/notifications/send - 수동 알림 발송
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getUserNotificationSettings,
  updateUserNotificationSettings,
  sendVaccinationNotification,
} from "@/lib/health/vaccination-notification-service";

/**
 * GET /api/health/vaccinations/notifications
 * 사용자 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/vaccinations/notifications");

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

    // 2. 사용자 알림 설정 조회
    const settings = await getUserNotificationSettings(premiumCheck.userId);

    console.log("✅ 알림 설정 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: settings || {
        vaccinationReminders: true,
        reminderChannels: ["in_app"],
        reminderDaysBefore: [0, 1, 7],
      },
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
 * PUT /api/health/vaccinations/notifications
 * 사용자 알림 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    console.group("[API] PUT /api/health/vaccinations/notifications");

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
      vaccination_reminders,
      reminder_channels,
      reminder_days_before,
    } = body;

    // 3. 알림 설정 업데이트
    const success = await updateUserNotificationSettings(premiumCheck.userId, {
      vaccinationReminders: vaccination_reminders,
      reminderChannels: reminder_channels,
      reminderDaysBefore: reminder_days_before,
    });

    if (!success) {
      console.error("❌ 알림 설정 업데이트 실패");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to update notification settings",
          message: "알림 설정 업데이트에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    console.log("✅ 알림 설정 업데이트 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "알림 설정이 업데이트되었습니다.",
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
 * POST /api/health/vaccinations/notifications/send
 * 수동 알림 발송 (테스트용)
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/vaccinations/notifications/send");

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
      schedule_id,
      notification_type,
      notification_channel,
      days_before,
      custom_message,
    } = body;

    if (!schedule_id || !notification_type || !notification_channel) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "일정 ID, 알림 유형, 알림 채널은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 3. 알림 발송
    const result = await sendVaccinationNotification({
      scheduleId: schedule_id,
      userId: premiumCheck.userId,
      notificationType: notification_type,
      notificationChannel: notification_channel,
      daysBefore: days_before,
      customMessage: custom_message,
    });

    if (!result.success) {
      console.error("❌ 알림 발송 실패:", result.error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to send notification",
          message: result.error || "알림 발송에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    console.log("✅ 수동 알림 발송 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "알림이 발송되었습니다.",
      notification_id: result.notificationId,
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

