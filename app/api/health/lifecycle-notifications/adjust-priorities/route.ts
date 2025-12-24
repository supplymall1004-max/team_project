/**
 * @file app/api/health/lifecycle-notifications/adjust-priorities/route.ts
 * @description 스마트 우선순위 조정 API
 * 
 * POST /api/health/lifecycle-notifications/adjust-priorities - 우선순위 자동 조정
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { adjustNotificationPriorities } from "@/lib/health/smart-priority-adjuster";

/**
 * POST /api/health/lifecycle-notifications/adjust-priorities
 * 스마트 우선순위 조정 실행
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🤖 POST /api/health/lifecycle-notifications/adjust-priorities");

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
    const body = await request.json().catch(() => ({}));
    const familyMemberId = body.family_member_id || undefined;

    // 우선순위 조정 실행
    const adjustments = await adjustNotificationPriorities(supabaseUserId, familyMemberId);

    console.log(`✅ 우선순위 조정 완료: ${adjustments.length}건 조정됨`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      adjustments,
      count: adjustments.length,
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

