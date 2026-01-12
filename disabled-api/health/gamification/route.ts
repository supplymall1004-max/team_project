/**
 * @file app/api/health/gamification/route.ts
 * @description 게임화 데이터 조회 API
 * 
 * GET /api/health/gamification - 사용자 게임화 데이터 조회
 */

import { NextRequest, NextResponse } from "next/server";
export const runtime = 'edge';
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getUserGamificationData } from "@/lib/health/gamification";

/**
 * GET /api/health/gamification
 * 사용자 게임화 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("🎮 GET /api/health/gamification");

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const data = await getUserGamificationData(supabaseUserId);

    console.log(`✅ 게임화 데이터 조회 완료: ${data.totalPoints}점, ${data.streakDays}일 연속`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
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

