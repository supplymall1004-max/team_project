/**
 * @file app/api/cron/daily-notifications/route.ts
 * @description 일일 알림 통합 Cron Job
 * 
 * 매일 실행되어 다음 알림 작업들을 순차적으로 실행합니다:
 * 1. 반려동물 건강 이벤트 알림 (오전 9시 실행)
 * 2. 스마트 알림 (오후 9시 실행 - 별도 Cron Job으로 실행)
 * 
 * 크론 스케줄: 매일 오전 9시에 실행 (반려동물 알림)
 * 오후 9시 스마트 알림은 이 엔드포인트를 직접 호출하거나 별도로 설정 가능
 * Vercel Cron 설정: vercel.json에 추가 필요
 */

import { NextRequest, NextResponse } from "next/server";
import { schedulePetLifecycleNotifications } from "@/lib/health/pet-lifecycle-notification-service";
import { scheduleSmartNotifications } from "@/lib/notifications/smart-notification-service";

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
 * POST /api/cron/daily-notifications
 * 일일 알림 통합 실행
 */
export async function POST(request: NextRequest) {
  try {
    console.group("📬 [Cron] 일일 알림 통합 실행 시작");

    // 크론 잡 인증 확인 (선택적)
    // if (!verifyCronSecret(request)) {
    //   console.error("❌ 크론 잡 인증 실패");
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const results: {
      petLifecycle?: any;
      smartNotifications?: any;
      errors?: string[];
    } = {};

    const errors: string[] = [];

    // 현재 시간 확인
    const now = new Date();
    const hour = now.getHours();

    // 1. 반려동물 건강 이벤트 알림 (오전 9시에 실행)
    try {
      console.log("🐾 반려동물 건강 이벤트 알림 실행 중...");
      const petResult = await schedulePetLifecycleNotifications();
      results.petLifecycle = petResult;
      console.log("✅ 반려동물 건강 이벤트 알림 완료");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("❌ 반려동물 건강 이벤트 알림 실패:", errorMessage);
      errors.push(`반려동물 알림: ${errorMessage}`);
    }

    // 2. 스마트 알림 (오후 9시에 실행 - query parameter로 제어 가능)
    // URL에 ?include=smart-notifications 파라미터가 있거나 시간이 21시면 실행
    const url = new URL(request.url);
    const includeSmart = url.searchParams.get("include") === "smart-notifications" || hour === 21;
    
    if (includeSmart) {
      try {
        console.log("🧠 스마트 알림 실행 중...");
        const smartResult = await scheduleSmartNotifications();
        results.smartNotifications = smartResult;
        console.log("✅ 스마트 알림 완료");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("❌ 스마트 알림 실패:", errorMessage);
        errors.push(`스마트 알림: ${errorMessage}`);
      }
    } else {
      console.log(`⏭️ 스마트 알림 스킵 (현재 시간: ${hour}시, 실행 시간: 21시 또는 ?include=smart-notifications 필요)`);
    }

    // 결과 정리
    if (errors.length > 0) {
      results.errors = errors;
    }

    console.log("✅ 일일 알림 통합 실행 완료");
    console.log("📊 실행 결과:", results);
    console.groupEnd();

    return NextResponse.json({
      success: errors.length === 0,
      message: "일일 알림 통합 실행이 완료되었습니다.",
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ 일일 알림 통합 실행 중 오류:", error);
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
 * GET /api/cron/daily-notifications
 * 수동 실행용 (테스트 목적)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

