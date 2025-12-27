/**
 * @file app/api/cron/generate-lifecycle-game-events/route.ts
 * @description 생애주기 게임 이벤트 생성 크론 잡
 *
 * 생애주기별 알림을 게임 이벤트로 변환하여 모든 사용자에게 제공합니다.
 * 생애주기 알림이 업데이트된 후 호출됩니다.
 *
 * 보안: 크론 시크릿을 사용하여 인증합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateLifecycleGameEventsForAllUsers } from "@/lib/game/lifecycle-event-generator";

/**
 * POST /api/cron/generate-lifecycle-game-events
 * 생애주기 게임 이벤트 생성 크론 잡
 *
 * @param request NextRequest
 * @returns 처리 결과
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[Cron] 생애주기 게임 이벤트 생성 시작");

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

    // 생애주기 게임 이벤트 생성 실행
    const result = await generateLifecycleGameEventsForAllUsers();

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

