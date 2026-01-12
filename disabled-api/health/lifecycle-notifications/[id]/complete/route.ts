/**
 * @file app/api/health/lifecycle-notifications/[id]/complete/route.ts
 * @description 생애주기별 알림 완료 처리 API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { awardPointsForCompletion } from "@/lib/health/gamification";

/**
 * POST /api/health/lifecycle-notifications/[id]/complete
 * 알림 완료 처리
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`✅ POST /api/health/lifecycle-notifications/${id}/complete`);

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
    const supabase = getServiceRoleClient();

    // 알림 확인 및 소유권 검증
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("type", "lifecycle_event")
      .single();

    if (fetchError || !notification) {
      console.error("❌ 알림 조회 실패:", fetchError);
      console.groupEnd();
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // 알림 완료 처리
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("❌ 알림 완료 처리 실패:", updateError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to complete notification", message: updateError.message },
        { status: 500 }
      );
    }

    // 게임화: 포인트 적립
    let gamificationResult = null;
    try {
      gamificationResult = await awardPointsForCompletion(
        supabaseUserId,
        notification.priority as 'low' | 'normal' | 'high' | 'urgent'
      );
      console.log("✅ 포인트 적립 완료:", gamificationResult);
    } catch (error) {
      console.error("⚠️ 포인트 적립 실패 (알림 완료는 성공):", error);
      // 포인트 적립 실패해도 알림 완료는 성공으로 처리
    }

    console.log("✅ 알림 완료 처리 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      gamification: gamificationResult,
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

