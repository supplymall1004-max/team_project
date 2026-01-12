/**
 * @file app/api/health/lifecycle-notifications/history/route.ts
 * @description 생애주기별 알림 히스토리 조회 API
 * 
 * GET /api/health/lifecycle-notifications/history - 완료된 알림 히스토리 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/lifecycle-notifications/history
 * 알림 히스토리 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("📜 GET /api/health/lifecycle-notifications/history");

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
    const familyMemberId = searchParams.get("family_member_id") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;

    // 완료된 알림 조회
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", supabaseUserId)
      .eq("type", "lifecycle_event")
      .in("status", ["confirmed", "dismissed", "missed"]);

    // 가족 구성원 필터
    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error } = await query;

    if (error) {
      console.error("❌ 알림 히스토리 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 패턴 분석
    const patternAnalysis = {
      totalCompleted: notifications?.filter((n) => n.status === "confirmed").length || 0,
      totalDismissed: notifications?.filter((n) => n.status === "dismissed").length || 0,
      totalMissed: notifications?.filter((n) => n.status === "missed").length || 0,
      byCategory: {} as Record<string, { total: number; completed: number; dismissed: number; missed: number }>,
      byPriority: {} as Record<string, { total: number; completed: number; dismissed: number; missed: number }>,
    };

    notifications?.forEach((notification) => {
      const category = notification.category || "unknown";
      const priority = notification.priority || "normal";

      // 카테고리별 통계
      if (!patternAnalysis.byCategory[category]) {
        patternAnalysis.byCategory[category] = { total: 0, completed: 0, dismissed: 0, missed: 0 };
      }
      patternAnalysis.byCategory[category].total++;
      if (notification.status === "confirmed") patternAnalysis.byCategory[category].completed++;
      if (notification.status === "dismissed") patternAnalysis.byCategory[category].dismissed++;
      if (notification.status === "missed") patternAnalysis.byCategory[category].missed++;

      // 우선순위별 통계
      if (!patternAnalysis.byPriority[priority]) {
        patternAnalysis.byPriority[priority] = { total: 0, completed: 0, dismissed: 0, missed: 0 };
      }
      patternAnalysis.byPriority[priority].total++;
      if (notification.status === "confirmed") patternAnalysis.byPriority[priority].completed++;
      if (notification.status === "dismissed") patternAnalysis.byPriority[priority].dismissed++;
      if (notification.status === "missed") patternAnalysis.byPriority[priority].missed++;
    });

    console.log(`✅ 알림 히스토리 조회 완료: ${notifications?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      notifications: notifications || [],
      patternAnalysis,
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

