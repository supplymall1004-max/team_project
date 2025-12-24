/**
 * @file app/api/health/lifecycle-notifications/stats/route.ts
 * @description 생애주기별 알림 통계 API
 * 
 * GET /api/health/lifecycle-notifications/stats - 알림 완료율 통계 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/health/lifecycle-notifications/stats
 * 알림 완료율 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("📊 GET /api/health/lifecycle-notifications/stats");

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
    const period = searchParams.get("period") || "week"; // week, month
    const familyMemberId = searchParams.get("family_member_id") || undefined;

    // 기간 계산
    const now = new Date();
    const startDate = new Date();
    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // 알림 통계 조회
    let query = supabase
      .from("notifications")
      .select("id, status, priority, created_at, confirmed_at, family_member_id")
      .eq("user_id", supabaseUserId)
      .eq("type", "lifecycle_event")
      .gte("created_at", startDate.toISOString());

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("❌ 알림 통계 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 통계 계산
    const total = notifications?.length || 0;
    const completed = notifications?.filter((n) => n.status === "confirmed").length || 0;
    const pending = notifications?.filter((n) => n.status === "pending").length || 0;
    const dismissed = notifications?.filter((n) => n.status === "dismissed").length || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 우선순위별 통계
    const byPriority = {
      high: {
        total: notifications?.filter((n) => n.priority === "high" || n.priority === "urgent").length || 0,
        completed: notifications?.filter((n) => (n.priority === "high" || n.priority === "urgent") && n.status === "confirmed").length || 0,
      },
      medium: {
        total: notifications?.filter((n) => n.priority === "normal").length || 0,
        completed: notifications?.filter((n) => n.priority === "normal" && n.status === "confirmed").length || 0,
      },
      low: {
        total: notifications?.filter((n) => n.priority === "low").length || 0,
        completed: notifications?.filter((n) => n.priority === "low" && n.status === "confirmed").length || 0,
      },
    };

    // 일별 완료율 (최근 7일 또는 30일)
    const days = period === "week" ? 7 : 30;
    const dailyStats: Array<{ date: string; total: number; completed: number; rate: number }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayStart = date.toISOString();
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEndStr = dayEnd.toISOString();

      const dayNotifications = notifications?.filter((n) => {
        const createdAt = new Date(n.created_at);
        return createdAt >= new Date(dayStart) && createdAt <= new Date(dayEndStr);
      }) || [];

      const dayTotal = dayNotifications.length;
      const dayCompleted = dayNotifications.filter((n) => n.status === "confirmed").length;
      const dayRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        total: dayTotal,
        completed: dayCompleted,
        rate: dayRate,
      });
    }

    console.log(`✅ 알림 통계 조회 완료: ${total}건 (완료율: ${completionRate}%)`);
    console.groupEnd();

    return NextResponse.json({
      period,
      summary: {
        total,
        completed,
        pending,
        dismissed,
        completionRate,
      },
      byPriority,
      dailyStats,
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

