/**
 * @file app/api/cron/schedule-game-events/route.ts
 * @description 게임 이벤트 자동 스케줄링 크론 잡
 *
 * 주기적으로 모든 사용자의 게임 이벤트를 자동으로 생성합니다.
 * Vercel Cron Jobs 또는 외부 크론 서비스에서 호출할 수 있습니다.
 *
 * 보안: 크론 시크릿을 사용하여 인증합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { scheduleAllGameEvents } from "@/lib/game/character-game-event-scheduler-auto";

/**
 * GET /api/cron/schedule-game-events
 * 게임 이벤트 자동 스케줄링 크론 잡
 *
 * @param request NextRequest
 * @returns 처리 결과
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[Cron] 게임 이벤트 자동 스케줄링 시작");

    // 크론 시크릿 확인 (선택사항, 환경 변수에 설정)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log("❌ 크론 인증 실패");
        console.groupEnd();
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 게임 이벤트 스케줄링 실행
    const result = await scheduleAllGameEvents();

    console.log("✅ 크론 잡 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ 크론 잡 실행 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "크론 잡 실행 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

