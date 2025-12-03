/**
 * @file app/api/diet/notifications/settings/route.ts
 * @description 알림 설정 관리 API
 *
 * GET /api/diet/notifications/settings - 알림 설정 조회
 * PUT /api/diet/notifications/settings - 알림 설정 업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/diet/notifications/settings
 * 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("⚙️ 알림 설정 조회");

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

    // 알림 설정 조회 (없으면 기본값 반환)
    const { data: settings } = await supabase
      .from("diet_notification_settings")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    const notificationSettings = settings || {
      popup_enabled: true,
      browser_enabled: false,
      notification_time: "05:00:00",
      last_notification_date: null,
      last_dismissed_date: null,
    };

    console.log("알림 설정:", notificationSettings);
    console.groupEnd();

    return NextResponse.json({
      settings: notificationSettings,
    });

  } catch (error) {
    console.error("❌ 설정 조회 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/diet/notifications/settings
 * 알림 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    console.group("⚙️ 알림 설정 업데이트");

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

    // 요청 데이터 파싱
    const body = await request.json();
    const {
      popup_enabled,
      browser_enabled,
      notification_time,
    } = body;

    console.log("업데이트 요청:", {
      popup_enabled,
      browser_enabled,
      notification_time,
    });

    // 유효성 검증
    if (typeof popup_enabled !== "boolean" && popup_enabled !== undefined) {
      console.error("❌ popup_enabled 타입 오류");
      console.groupEnd();
      return NextResponse.json(
        { error: "popup_enabled must be boolean" },
        { status: 400 }
      );
    }

    if (typeof browser_enabled !== "boolean" && browser_enabled !== undefined) {
      console.error("❌ browser_enabled 타입 오류");
      console.groupEnd();
      return NextResponse.json(
        { error: "browser_enabled must be boolean" },
        { status: 400 }
      );
    }

    if (notification_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(notification_time)) {
      console.error("❌ notification_time 형식 오류");
      console.groupEnd();
      return NextResponse.json(
        { error: "notification_time must be in HH:MM:SS format" },
        { status: 400 }
      );
    }

    // 업데이트 데이터 구성
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (popup_enabled !== undefined) updateData.popup_enabled = popup_enabled;
    if (browser_enabled !== undefined) updateData.browser_enabled = browser_enabled;
    if (notification_time !== undefined) updateData.notification_time = notification_time;

    // 설정 업데이트 또는 생성
    const { data: existingSettings } = await supabase
      .from("diet_notification_settings")
      .select("id")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    let result;

    if (existingSettings) {
      // 기존 설정 업데이트
      const { data, error } = await supabase
        .from("diet_notification_settings")
        .update(updateData)
        .eq("user_id", supabaseUserId)
        .select()
        .single();

      if (error) {
        console.error("❌ 설정 업데이트 실패:", error);
        console.error("업데이트 시도한 데이터:", updateData);
        console.error("사용자 ID:", supabaseUserId);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to update settings",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        );
      }

      result = data;
      console.log("✅ 알림 설정 업데이트됨");
      console.log("업데이트된 설정:", result);
    } else {
      // 새 설정 생성
      const insertData = {
        user_id: supabaseUserId,
        popup_enabled: popup_enabled ?? true,
        browser_enabled: browser_enabled ?? false,
        notification_time: notification_time ?? "05:00:00",
        ...updateData,
      };

      const { data, error } = await supabase
        .from("diet_notification_settings")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ 설정 생성 실패:", error);
        console.error("생성 시도한 데이터:", insertData);
        console.error("사용자 ID:", supabaseUserId);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to create settings",
            details: error.message,
            code: error.code
          },
          { status: 500 }
        );
      }

      result = data;
      console.log("✅ 알림 설정 생성됨");
      console.log("생성된 설정:", result);
    }

    console.log("최종 설정:", result);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      settings: result,
    });

  } catch (error) {
    console.error("❌ 설정 업데이트 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
