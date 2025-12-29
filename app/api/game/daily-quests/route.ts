/**
 * @file app/api/game/daily-quests/route.ts
 * @description 일일 퀘스트 진행 상황 조회 API
 * 
 * GET /api/game/daily-quests - 일일 퀘스트 진행 상황 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/game/daily-quests
 * 일일 퀘스트 진행 상황 조회
 * 
 * Query Parameters:
 * - date: 조회할 날짜 (YYYY-MM-DD 형식, 기본값: 오늘)
 * - memberId: 가족 구성원 ID (선택)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Query parameters 파싱
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const memberId = searchParams.get("memberId") || null;

    const supabase = getServiceRoleClient();

    // 일일 퀘스트 진행 상황 조회
    const query = supabase
      .from("daily_quests")
      .select("quest_id, progress, target, completed, completed_at, quest_date")
      .eq("user_id", user.id)
      .eq("quest_date", date);

    if (memberId) {
      // 가족 구성원별 퀘스트는 현재 daily_quests 테이블에 family_member_id 컬럼이 없을 수 있음
      // 일단 전체 조회 후 필터링
    }

    const { data: quests, error } = await query;

    if (error) {
      console.error("❌ 일일 퀘스트 조회 실패:", error);
      return NextResponse.json(
        { error: "Failed to fetch quests", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quests: quests || [],
      date,
      memberId,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버에서 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

