/**
 * @file app/api/game/baby-feeding/route.ts
 * @description 아기 분유 스케줄 API 엔드포인트
 *
 * GET /api/game/baby-feeding - 분유 스케줄 조회
 * POST /api/game/baby-feeding - 분유 스케줄 생성/수정
 * PUT /api/game/baby-feeding/complete - 분유 완료 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/auth";
import {
  getBabyFeedingSchedule,
  upsertBabyFeedingSchedule,
  completeBabyFeeding,
  deactivateBabyFeedingSchedule,
} from "@/lib/game/baby-feeding-scheduler";
import type { CreateBabyFeedingScheduleParams } from "@/types/game/character-game-events";

/**
 * GET /api/game/baby-feeding
 * 분유 스케줄 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/game/baby-feeding");

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get("family_member_id");

    if (!familyMemberId) {
      return NextResponse.json({ error: "family_member_id가 필요합니다." }, { status: 400 });
    }

    const schedule = await getBabyFeedingSchedule(user.id, familyMemberId);

    console.log("✅ 분유 스케줄 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("❌ 분유 스케줄 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "분유 스케줄 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game/baby-feeding
 * 분유 스케줄 생성/수정
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/game/baby-feeding");

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await request.json();
    const { family_member_id, feeding_interval_hours, reminder_enabled, reminder_minutes_before, notes } = body;

    if (!family_member_id || !feeding_interval_hours) {
      return NextResponse.json(
        { error: "family_member_id와 feeding_interval_hours가 필요합니다." },
        { status: 400 }
      );
    }

    const params: CreateBabyFeedingScheduleParams = {
      user_id: user.id,
      family_member_id,
      feeding_interval_hours: Number(feeding_interval_hours),
      reminder_enabled,
      reminder_minutes_before,
      notes,
    };

    const schedule = await upsertBabyFeedingSchedule(params);

    console.log("✅ 분유 스케줄 생성/수정 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("❌ 분유 스케줄 생성/수정 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "분유 스케줄 생성/수정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/game/baby-feeding/complete
 * 분유 완료 처리
 */
export async function PUT(request: NextRequest) {
  try {
    console.group("[API] PUT /api/game/baby-feeding/complete");

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await request.json();
    const { family_member_id } = body;

    if (!family_member_id) {
      return NextResponse.json({ error: "family_member_id가 필요합니다." }, { status: 400 });
    }

    const schedule = await completeBabyFeeding(user.id, family_member_id);

    console.log("✅ 분유 완료 처리 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("❌ 분유 완료 처리 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "분유 완료 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

