/**
 * @file app/api/user/stats/route.ts
 * @description 사용자 통계 API (연속 방문 일수, 총 방문 일수)
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    // 최근 방문 기록 조회
    const { data: visitData } = await supabase
      .from("user_daily_visits")
      .select("*")
      .eq("user_id", userData.id)
      .order("visit_date", { ascending: false })
      .limit(1);

    let streakCount = 0;
    let totalVisits = 0;

    if (visitData && visitData.length > 0) {
      const lastVisit = visitData[0];
      streakCount = lastVisit.streak_count || 0;
      totalVisits = lastVisit.total_visits || 0;

      // 오늘 방문 기록이 없으면 생성
      if (lastVisit.visit_date !== today) {
        // 어제 날짜 계산
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // 연속 방문 계산
        const newStreakCount = lastVisit.visit_date === yesterdayStr 
          ? streakCount + 1 
          : 1;

        // 새 방문 기록 생성
        await supabase.from("user_daily_visits").insert({
          user_id: userData.id,
          visit_date: today,
          streak_count: newStreakCount,
          total_visits: totalVisits + 1,
        });

        streakCount = newStreakCount;
        totalVisits = totalVisits + 1;
      }
    } else {
      // 첫 방문 기록 생성
      await supabase.from("user_daily_visits").insert({
        user_id: userData.id,
        visit_date: today,
        streak_count: 1,
        total_visits: 1,
      });

      streakCount = 1;
      totalVisits = 1;
    }

    return NextResponse.json({
      name: userData.name || "회원",
      streakCount,
      totalVisits,
    });

  } catch (error) {
    console.error("[UserStats] 오류:", error);
    return NextResponse.json(
      { error: "통계 조회 실패" },
      { status: 500 }
    );
  }
}

