/**
 * @file app/api/health/lifecycle-notifications/route.ts
 * @description 생애주기별 네온 알림 조회 및 생성 API
 * 
 * GET /api/health/lifecycle-notifications - 생애주기별 알림 조회
 * POST /api/health/lifecycle-notifications - 생애주기별 알림 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { generateLifecycleNotifications, saveLifecycleNotifications } from "@/lib/health/lifecycle-notification-generator";

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

/**
 * POST /api/health/lifecycle-notifications
 * 생애주기별 알림 생성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🔔 POST /api/health/lifecycle-notifications");
    console.log("📍 생애주기별 알림 생성");

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

    // 요청 본문 파싱 (선택적)
    let body: { family_member_id?: string } = {};
    try {
      body = await request.json().catch(() => ({}));
    } catch {
      // 본문이 없어도 됨 (본인 알림 생성)
    }

    const familyMemberId = body.family_member_id || undefined;

    // 생애주기별 알림 생성
    console.log("🔔 생애주기별 알림 생성 시작...");
    const notifications = await generateLifecycleNotifications(
      supabaseUserId,
      familyMemberId
    );

    if (notifications.length === 0) {
      console.warn("⚠️ 생성된 알림이 없습니다.");
      console.groupEnd();
      return NextResponse.json({
        success: true,
        message: "생성할 알림이 없습니다. 생년월일 정보를 확인해주세요.",
        notifications: [],
        saved: 0,
      });
    }

    // 알림 저장
    console.log("💾 알림 저장 중...");
    const saveResult = await saveLifecycleNotifications(notifications);

    console.log(`✅ 알림 생성 완료: ${saveResult.saved}건 저장, ${saveResult.errors}건 실패`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: `${saveResult.saved}개의 알림이 생성되었습니다.`,
      notifications,
      saved: saveResult.saved,
      errors: saveResult.errors,
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

