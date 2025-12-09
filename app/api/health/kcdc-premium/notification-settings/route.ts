/**
 * @file app/api/health/kcdc-premium/notification-settings/route.ts
 * @description 알림 설정 API
 * 
 * GET /api/health/kcdc-premium/notification-settings - 알림 설정 조회
 * PUT /api/health/kcdc-premium/notification-settings - 알림 설정 업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { UserNotificationSettings } from "@/types/kcdc";

/**
 * GET /api/health/kcdc-premium/notification-settings
 * 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group(
      "[API] GET /api/health/kcdc-premium/notification-settings"
    );

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 알림 설정 조회
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러
      console.error("❌ 조회 실패:", error);
      console.groupEnd();
      throw new Error(`알림 설정 조회 실패: ${error.message}`);
    }

    // 3. 기본값 설정 (없는 경우)
    let settings: UserNotificationSettings;
    if (!data) {
      const defaultSettings = {
        user_id: premiumCheck.userId,
        periodic_services_enabled: true,
        periodic_services_reminder_days: 7,
        deworming_reminders_enabled: true,
        vaccination_reminders_enabled: true,
        checkup_reminders_enabled: true,
        infection_risk_alerts_enabled: true,
        travel_risk_alerts_enabled: true,
      };

      const { data: newData, error: insertError } = await supabase
        .from("user_notification_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        console.error("❌ 기본 설정 생성 실패:", insertError);
        console.groupEnd();
        throw new Error(`알림 설정 생성 실패: ${insertError.message}`);
      }

      settings = newData as UserNotificationSettings;
    } else {
      settings = data as UserNotificationSettings;
    }

    console.log("✅ 조회 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "알림 설정 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/kcdc-premium/notification-settings
 * 알림 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    console.group(
      "[API] PUT /api/health/kcdc-premium/notification-settings"
    );

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const {
      periodic_services_enabled,
      periodic_services_reminder_days,
      deworming_reminders_enabled,
      vaccination_reminders_enabled,
      checkup_reminders_enabled,
      infection_risk_alerts_enabled,
      travel_risk_alerts_enabled,
    } = body;

    // 3. 알림 설정 업데이트
    const supabase = getServiceRoleClient();

    // 기존 설정 확인
    const { data: existing } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .single();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (periodic_services_enabled !== undefined)
      updateData.periodic_services_enabled = periodic_services_enabled;
    if (periodic_services_reminder_days !== undefined)
      updateData.periodic_services_reminder_days =
        periodic_services_reminder_days;
    if (deworming_reminders_enabled !== undefined)
      updateData.deworming_reminders_enabled = deworming_reminders_enabled;
    if (vaccination_reminders_enabled !== undefined)
      updateData.vaccination_reminders_enabled =
        vaccination_reminders_enabled;
    if (checkup_reminders_enabled !== undefined)
      updateData.checkup_reminders_enabled = checkup_reminders_enabled;
    if (infection_risk_alerts_enabled !== undefined)
      updateData.infection_risk_alerts_enabled =
        infection_risk_alerts_enabled;
    if (travel_risk_alerts_enabled !== undefined)
      updateData.travel_risk_alerts_enabled = travel_risk_alerts_enabled;

    let result;
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from("user_notification_settings")
        .update(updateData)
        .eq("user_id", premiumCheck.userId)
        .select()
        .single();

      if (error) {
        console.error("❌ 업데이트 실패:", error);
        console.groupEnd();
        throw new Error(`알림 설정 업데이트 실패: ${error.message}`);
      }

      result = data;
    } else {
      // 생성
      const defaultSettings = {
        user_id: premiumCheck.userId,
        periodic_services_enabled: true,
        periodic_services_reminder_days: 7,
        deworming_reminders_enabled: true,
        vaccination_reminders_enabled: true,
        checkup_reminders_enabled: true,
        infection_risk_alerts_enabled: true,
        travel_risk_alerts_enabled: true,
        ...updateData,
      };

      const { data, error } = await supabase
        .from("user_notification_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error("❌ 생성 실패:", error);
        console.groupEnd();
        throw new Error(`알림 설정 생성 실패: ${error.message}`);
      }

      result = data;
    }

    console.log("✅ 업데이트 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: result as UserNotificationSettings,
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "알림 설정 업데이트에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

