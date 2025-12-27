/**
 * @file app/api/game/events/route.ts
 * @description 게임 이벤트 API 엔드포인트
 *
 * GET /api/game/events - 활성 게임 이벤트 조회
 * POST /api/game/events - 게임 이벤트 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/auth";
import { getUserActiveEvents } from "@/lib/game/character-game-event-manager";
import { scheduleMedicationEvents, scheduleBabyFeedingEvents } from "@/lib/game/character-game-event-scheduler";
import type { CreateCharacterGameEventParams } from "@/types/game/character-game-events";
import { createCharacterGameEvent } from "@/lib/game/character-game-event-scheduler";

/**
 * GET /api/game/events
 * 활성 게임 이벤트 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/game/events");

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

    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get("family_member_id") || undefined;

    const events = await getUserActiveEvents(user.id, familyMemberId || null);

    console.log(`✅ 활성 이벤트 ${events.length}개 조회 완료`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("❌ 게임 이벤트 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "게임 이벤트 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game/events
 * 게임 이벤트 생성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/game/events");

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

    const body = await request.json();
    const { event_type, action } = body;

    // 특정 액션 처리
    if (action === "schedule_medications") {
      // 약물 복용 이벤트 스케줄링
      const familyMemberId = body.family_member_id || null;
      const count = await scheduleMedicationEvents(user.id, familyMemberId);
      return NextResponse.json({
        success: true,
        message: `약물 복용 이벤트 ${count}개 생성 완료`,
        count,
      });
    }

    if (action === "schedule_baby_feeding") {
      // 아기 분유 이벤트 스케줄링
      const familyMemberId = body.family_member_id;
      if (!familyMemberId) {
        return NextResponse.json({ error: "family_member_id가 필요합니다." }, { status: 400 });
      }
      const count = await scheduleBabyFeedingEvents(user.id, familyMemberId);
      return NextResponse.json({
        success: true,
        message: `아기 분유 이벤트 ${count}개 생성 완료`,
        count,
      });
    }

    // 직접 이벤트 생성
    const eventParams: CreateCharacterGameEventParams = {
      user_id: user.id,
      family_member_id: body.family_member_id || null,
      event_type: body.event_type,
      event_data: body.event_data,
      scheduled_time: body.scheduled_time,
      priority: body.priority || "normal",
    };

    const event = await createCharacterGameEvent(eventParams);

    console.log("✅ 게임 이벤트 생성 완료:", event.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "게임 이벤트 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

