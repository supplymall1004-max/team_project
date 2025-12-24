/**
 * @file app/api/health/lifecycle-notifications/reminder-settings/route.ts
 * @description 생애주기별 알림 리마인더 설정 API
 * 
 * GET /api/health/lifecycle-notifications/reminder-settings - 설정 조회
 * PUT /api/health/lifecycle-notifications/reminder-settings - 설정 업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { LifecycleNotificationReminderSettingsInput } from "@/types/lifecycle-notification";

/**
 * GET /api/health/lifecycle-notifications/reminder-settings
 * 리마인더 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("🔔 GET /api/health/lifecycle-notifications/reminder-settings");

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

    // 설정 조회
    let query = supabase
      .from("lifecycle_notification_reminder_settings")
      .select("*")
      .eq("user_id", supabaseUserId);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data: settings, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("❌ 설정 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 기본 설정 반환 (없으면)
    const defaultSettings = {
      reminder_enabled: true,
      reminder_days_before: [0, 1, 7],
      notification_channels: ['in_app', 'push'],
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      per_notification_settings: {},
      timezone: 'Asia/Seoul',
    };

    console.log("✅ 리마인더 설정 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      settings: settings || defaultSettings,
      isDefault: !settings,
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
 * PUT /api/health/lifecycle-notifications/reminder-settings
 * 리마인더 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    console.group("💾 PUT /api/health/lifecycle-notifications/reminder-settings");

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

    const body: LifecycleNotificationReminderSettingsInput & { family_member_id?: string } = await request.json();
    const { family_member_id, ...settingsData } = body;

    // 기존 설정 확인
    let query = supabase
      .from("lifecycle_notification_reminder_settings")
      .select("id")
      .eq("user_id", supabaseUserId);

    if (family_member_id) {
      query = query.eq("family_member_id", family_member_id);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data: existing } = await query.maybeSingle();

    // Upsert
    const upsertData: any = {
      user_id: supabaseUserId,
      family_member_id: family_member_id || null,
      updated_at: new Date().toISOString(),
    };

    if (settingsData.reminder_enabled !== undefined) {
      upsertData.reminder_enabled = settingsData.reminder_enabled;
    }
    if (settingsData.reminder_days_before !== undefined) {
      upsertData.reminder_days_before = settingsData.reminder_days_before;
    }
    if (settingsData.notification_channels !== undefined) {
      upsertData.notification_channels = settingsData.notification_channels;
    }
    if (settingsData.quiet_hours_enabled !== undefined) {
      upsertData.quiet_hours_enabled = settingsData.quiet_hours_enabled;
    }
    if (settingsData.quiet_hours_start !== undefined) {
      upsertData.quiet_hours_start = settingsData.quiet_hours_start;
    }
    if (settingsData.quiet_hours_end !== undefined) {
      upsertData.quiet_hours_end = settingsData.quiet_hours_end;
    }
    if (settingsData.per_notification_settings !== undefined) {
      upsertData.per_notification_settings = settingsData.per_notification_settings;
    }
    if (settingsData.timezone !== undefined) {
      upsertData.timezone = settingsData.timezone;
    }

    const { data, error } = await supabase
      .from("lifecycle_notification_reminder_settings")
      .upsert(upsertData, {
        onConflict: "user_id,family_member_id",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 설정 저장 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to save settings", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 리마인더 설정 저장 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      settings: data,
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

