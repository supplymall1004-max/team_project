/**
 * @file app/api/cron/smart-notifications/route.ts
 * @description 스마트 알림 크론 잡
 * 
 * 매일 실행되어 놓친 일정을 감지하고 알림을 발송합니다.
 * 
 * 크론 스케줄: 매일 오후 9시 (KST) - 하루 일정이 끝난 후
 * Vercel Cron 설정: vercel.json에 추가 필요
 */

import { NextRequest, NextResponse } from "next/server";
import { scheduleSmartNotifications } from "@/lib/notifications/smart-notification-service";

/**
 * POST /api/cron/smart-notifications
 * 스마트 알림 스케줄링 실행
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🧠 [Cron] 스마트 알림 스케줄링 시작");

    // 스마트 알림 스케줄링 실행
    const result = await scheduleSmartNotifications();

    console.log("✅ 크론 잡 실행 완료:", result);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "스마트 알림 스케줄링이 완료되었습니다.",
      result,
    });
  } catch (error) {
    console.error("❌ 크론 잡 실행 중 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/smart-notifications
 * 수동 실행용 (테스트 목적)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

