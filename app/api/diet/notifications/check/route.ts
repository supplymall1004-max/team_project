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

    const authResult = await auth();
    console.log("🔍 Auth result:", {
      userId: authResult.userId,
      hasUserId: !!authResult.userId,
      userIdType: typeof authResult.userId,
      userIdLength: authResult.userId?.length
    });

    const { userId } = authResult;

    if (!userId) {
      console.error("❌ 인증 실패 - userId가 없음");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    console.log("🔍 Supabase client 생성됨, users 테이블 조회 시도...");
    console.log("🔍 조회할 clerk_id:", userId);

    // 사용자의 Supabase user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .eq("clerk_id", userId)
      .maybeSingle();

    console.log("🔍 조회 결과:", {
      data: userData,
      error: userError,
      hasData: !!userData,
      errorCode: userError?.code,
      errorMessage: userError?.message,
      errorDetails: userError?.details,
      errorHint: userError?.hint
    });

    // 사용자가 없거나 조회 실패 시 팝업 표시하지 않음
    if (userError || !userData) {
      if (userError) {
        console.error("❌ 사용자 조회 오류:", userError);
      } else {
        console.log("⚠️ 사용자를 찾을 수 없음 - 팝업 표시하지 않음");
      }
      console.groupEnd();
      return NextResponse.json({
        shouldShow: false,
        reason: "user_not_found"
      });
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
    console.error("  - 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("  - 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("  - 에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
}
