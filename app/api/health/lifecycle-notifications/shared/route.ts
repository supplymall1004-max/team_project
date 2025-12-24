/**
 * @file app/api/health/lifecycle-notifications/shared/route.ts
 * @description 공유받은 알림 조회 API
 * 
 * GET /api/health/lifecycle-notifications/shared - 공유받은 알림 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/lifecycle-notifications/shared
 * 공유받은 알림 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("🔗 GET /api/health/lifecycle-notifications/shared");

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

    // 공유받은 알림 조회
    const { data: shares, error: sharesError } = await supabase
      .from("lifecycle_notification_shares")
      .select(`
        *,
        notifications (*),
        shared_by:users!lifecycle_notification_shares_shared_by_user_id_fkey (id, name)
      `)
      .eq("shared_with_user_id", supabaseUserId)
      .eq("status", "active");

    if (sharesError) {
      console.error("❌ 공유 알림 조회 실패:", sharesError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: sharesError.message },
        { status: 500 }
      );
    }

    // 공유한 알림 조회
    const { data: sharedByMe, error: sharedByMeError } = await supabase
      .from("lifecycle_notification_shares")
      .select(`
        *,
        notifications (*),
        shared_with:users!lifecycle_notification_shares_shared_with_user_id_fkey (id, name)
      `)
      .eq("shared_by_user_id", supabaseUserId)
      .eq("status", "active");

    if (sharedByMeError) {
      console.error("❌ 공유한 알림 조회 실패:", sharedByMeError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: sharedByMeError.message },
        { status: 500 }
      );
    }

    console.log(`✅ 공유 알림 조회 완료: 받은 알림 ${shares?.length || 0}건, 공유한 알림 ${sharedByMe?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      received: shares || [],
      shared: sharedByMe || [],
      receivedCount: shares?.length || 0,
      sharedCount: sharedByMe?.length || 0,
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

