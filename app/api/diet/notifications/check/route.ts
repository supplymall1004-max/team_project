/**
 * @file app/api/diet/notifications/check/route.ts
 * @description 알림 표시 여부 확인 API
 *
 * GET /api/diet/notifications/check
 * 오늘 식단 알림을 표시해야 하는지 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/diet/notifications/check
 * 알림 표시 여부 확인
 */
export async function GET(request: NextRequest) {
  try {
    console.group("🔔 알림 표시 여부 확인");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;

    // 알림 설정 조회
    const { data: notificationSettings, error: settingsError } = await supabase
      .from("diet_notification_settings")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    // 설정 조회 실패 시 데이터베이스 연결 문제로 간주하고 팝업 표시하지 않음
    if (settingsError) {
      console.error("❌ 알림 설정 조회 실패:", settingsError);
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "settings_lookup_error",
        error: settingsError.message
      });
    }

    const settings = notificationSettings || {
      popup_enabled: true,
      browser_enabled: false,
      last_notification_date: null,
      last_dismissed_date: null,
    };

    console.log("알림 설정:", {
      popup_enabled: settings.popup_enabled,
      browser_enabled: settings.browser_enabled,
      last_notification_date: settings.last_notification_date,
      last_dismissed_date: settings.last_dismissed_date,
    });

    // 팝업 알림이 비활성화되어 있으면 표시하지 않음
    if (!settings.popup_enabled) {
      console.log("⚠️ 팝업 알림 비활성화됨");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "popup_disabled"
      });
    }

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    // 오늘 이미 알림을 표시했거나 닫았다면 표시하지 않음
    if (settings.last_notification_date === today || settings.last_dismissed_date === today) {
      console.log("⚠️ 오늘 이미 알림 표시됨 또는 닫힘");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: settings.last_notification_date === today ? "already_shown_today" : "dismissed_today"
      });
    }

    // 현재 시간 확인 (KST 기준 오전 5시 이후인지)
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC to KST
    const currentHour = kstNow.getHours();

    if (currentHour < 5) {
      console.log("⚠️ 아직 오전 5시 이전:", currentHour, "시");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "too_early",
        currentHour
      });
    }

    // 오늘 식단 존재 여부 확인
    const { data: todaysDiets, error: dietError } = await supabase
      .from("diet_plans")
      .select("id")
      .eq("user_id", supabaseUserId)
      .eq("plan_date", today)
      .limit(1);

    if (dietError) {
      console.error("❌ 식단 조회 실패:", dietError);
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "diet_check_error"
      });
    }

    if (!todaysDiets || todaysDiets.length === 0) {
      console.log("⚠️ 오늘 식단이 없음");
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "no_diet_today"
      });
    }

    // 모든 조건 만족 - 알림 표시
    console.log("✅ 알림 표시 조건 만족");
    console.groupEnd();

    return NextResponse.json({
      shouldShow: true,
      today,
      dietsCount: todaysDiets.length,
    });

  } catch (error) {
    console.error("❌ 알림 확인 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
