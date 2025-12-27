/**
 * @file app/api/cron/generate-kcdc-game-events/route.ts
 * @description KCDC 게임 이벤트 생성 크론 잡
 *
 * KCDC 알림 데이터를 게임 이벤트로 변환하여 모든 사용자에게 제공합니다.
 * KCDC 데이터가 업데이트된 후 호출됩니다.
 *
 * 보안: 크론 시크릿을 사용하여 인증합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateKCDCGameEventsForAllUsers } from "@/lib/game/kcdc-event-generator";

/**
 * POST /api/cron/generate-kcdc-game-events
 * KCDC 게임 이벤트 생성 크론 잡
 *
 * @param request NextRequest
 * @returns 처리 결과
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[Cron] KCDC 게임 이벤트 생성 시작");

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

    // KCDC 게임 이벤트 생성 실행
    const result = await generateKCDCGameEventsForAllUsers();

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

