/**
 * @file app/api/health/lifecycle-notifications/route.ts
 * @description 생애주기별 네온 알림 조회 API
 * 
 * GET /api/health/lifecycle-notifications - 생애주기별 알림 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/lifecycle-notifications
 * 생애주기별 알림 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("🔔 GET /api/health/lifecycle-notifications");
    console.log("📍 생애주기별 알림 조회");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 확인 및 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });
    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get("family_member_id") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || "pending";

    // 알림 조회 쿼리 구성
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", supabaseUserId)
      .eq("type", "lifecycle_event");

    // 가족 구성원 필터
    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null); // 본인만
    }

    // 우선순위 필터
    if (priority) {
      query = query.eq("priority", priority);
    }

    // 카테고리 필터
    if (category) {
      query = query.eq("category", category);
    }

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 정렬 (우선순위 높은 순, 예정일 빠른 순)
    query = query.order("priority", { ascending: false });
    query = query.order("scheduled_at", { ascending: true, nullsFirst: false });

    const { data: notifications, error } = await query;

    if (error) {
      console.error("❌ 알림 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 우선순위별 그룹화
    const grouped = {
      high: notifications?.filter((n) => n.priority === 'high' || n.priority === 'urgent') || [],
      medium: notifications?.filter((n) => n.priority === 'normal') || [],
      low: notifications?.filter((n) => n.priority === 'low') || [],
    };

    console.log(`✅ 알림 조회 완료: ${notifications?.length || 0}건`);
    console.log(`  - High: ${grouped.high.length}건`);
    console.log(`  - Medium: ${grouped.medium.length}건`);
    console.log(`  - Low: ${grouped.low.length}건`);
    console.groupEnd();

    return NextResponse.json({
      notifications: notifications || [],
      grouped,
      count: notifications?.length || 0,
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

