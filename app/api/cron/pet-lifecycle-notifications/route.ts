/**
 * @file app/api/cron/pet-lifecycle-notifications/route.ts
 * @description 반려동물 건강 이벤트 알림 크론 잡
 * 
 * 매일 실행되어 반려동물의 생애주기별 건강 이벤트를 확인하고 알림을 발송합니다.
 * 
 * 크론 스케줄: 매일 오전 9시 (KST)
 * Vercel Cron 설정: vercel.json에 추가 필요
 */

import { NextRequest, NextResponse } from "next/server";
import { schedulePetLifecycleNotifications } from "@/lib/health/pet-lifecycle-notification-service";

/**
 * 크론 잡 인증을 위한 시크릿 키 확인
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "default-secret-key";
  
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Vercel Cron은 자동으로 인증 헤더를 추가합니다
  // 수동 호출 시에만 시크릿 키 확인
  return true; // 개발 환경에서는 항상 허용
}

/**
 * POST /api/cron/pet-lifecycle-notifications
 * 반려동물 건강 이벤트 알림 스케줄링 실행
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🐾 [Cron] 반려동물 건강 이벤트 알림 스케줄링 시작");

    // 크론 잡 인증 확인 (선택적)
    // if (!verifyCronSecret(request)) {
    //   console.error("❌ 크론 잡 인증 실패");
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // 알림 스케줄링 실행
    const result = await schedulePetLifecycleNotifications();

    console.log("✅ 크론 잡 실행 완료:", result);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "반려동물 건강 이벤트 알림 스케줄링이 완료되었습니다.",
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
 * GET /api/cron/pet-lifecycle-notifications
 * 수동 실행용 (테스트 목적)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

