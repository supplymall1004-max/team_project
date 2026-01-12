/**
 * @file app/api/health/lifecycle-notifications/[id]/share/route.ts
 * @description 생애주기별 알림 공유 API
 * 
 * POST /api/health/lifecycle-notifications/[id]/share - 알림 공유
 * DELETE /api/health/lifecycle-notifications/[id]/share - 공유 취소
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * POST /api/health/lifecycle-notifications/[id]/share
 * 알림 공유
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`🔗 POST /api/health/lifecycle-notifications/${id}/share`);

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

    const body = await request.json();
    const { shared_with_user_id, shared_with_family_member_id, share_completion_status, share_reminders } = body;

    if (!shared_with_user_id) {
      return NextResponse.json({ error: "shared_with_user_id is required" }, { status: 400 });
    }

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

    // 공유 생성
    const { data, error } = await supabase
      .from("lifecycle_notification_shares")
      .insert({
        notification_id: id,
        shared_by_user_id: supabaseUserId,
        shared_with_user_id: shared_with_user_id,
        shared_with_family_member_id: shared_with_family_member_id || null,
        share_completion_status: share_completion_status !== false,
        share_reminders: share_reminders === true,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 알림 공유 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to share notification", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 알림 공유 완료");
    console.groupEnd();

    return NextResponse.json({ success: true, share: data });
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

/**
 * DELETE /api/health/lifecycle-notifications/[id]/share
 * 공유 취소
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`❌ DELETE /api/health/lifecycle-notifications/${id}/share`);

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

    const { searchParams } = new URL(request.url);
    const sharedWithUserId = searchParams.get("shared_with_user_id");

    // 공유 취소
    let query = supabase
      .from("lifecycle_notification_shares")
      .update({ status: "revoked" })
      .eq("notification_id", id)
      .eq("shared_by_user_id", supabaseUserId);

    if (sharedWithUserId) {
      query = query.eq("shared_with_user_id", sharedWithUserId);
    }

    const { error } = await query;

    if (error) {
      console.error("❌ 공유 취소 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to revoke share", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 공유 취소 완료");
    console.groupEnd();

    return NextResponse.json({ success: true });
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

