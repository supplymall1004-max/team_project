/**
 * @file app/api/game/events/[id]/complete/route.ts
 * @description 게임 이벤트 완료 처리 API
 *
 * POST /api/game/events/[id]/complete - 게임 이벤트 완료 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/auth";
import { completeGameEvent } from "@/lib/game/character-game-event-manager";
import type { CompleteCharacterGameEventParams } from "@/types/game/character-game-events";

/**
 * POST /api/game/events/[id]/complete
 * 게임 이벤트 완료 처리
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] POST /api/game/events/[id]/complete");

    const { userId } = await auth();
    if (!userId) {
      console.log("❌ 로그인이 필요합니다");
      console.groupEnd();
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      console.log("❌ 사용자 정보를 찾을 수 없습니다");
      console.groupEnd();
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();

    const completeParams: CompleteCharacterGameEventParams = {
      event_id: id,
      user_id: user.id,
      points_earned: body.points_earned,
      experience_earned: body.experience_earned,
    };

    const result = await completeGameEvent(completeParams);

    if (!result.success) {
      console.log("❌ 이벤트 완료 처리 실패:", result.error);
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    console.log("✅ 이벤트 완료 처리 완료");
    console.log("포인트:", result.points_earned);
    console.log("경험치:", result.experience_earned);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ 이벤트 완료 처리 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "이벤트 완료 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

