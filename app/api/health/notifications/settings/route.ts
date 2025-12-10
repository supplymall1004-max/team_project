/**
 * @file app/api/health/notifications/settings/route.ts
 * @description 건강 알림 설정 API
 *
 * 사용자의 건강 알림 설정을 조회하고 업데이트하는 API 엔드포인트입니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";

interface NotificationSettings {
  // 예방주사 알림
  vaccinationReminders: boolean;
  vaccinationChannels: string[];
  vaccinationDaysBefore: number[];

  // 약물 복용 알림
  medicationReminders: boolean;
  medicationChannels: string[];
  medicationTimes: string[]; // HH:MM 형식

  // 건강검진 알림
  checkupReminders: boolean;
  checkupChannels: string[];
  checkupDaysBefore: number[];

  // 병원 진료 알림
  appointmentReminders: boolean;
  appointmentChannels: string[];
  appointmentDaysBefore: number[];

  // 일반 설정
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  timezone: string;
}

/**
 * GET /api/health/notifications/settings
 * 사용자의 알림 설정 조회
 */
export async function GET(request: NextRequest) {
  console.group("[API] 알림 설정 조회");

  try {
    // 사용자 인증
    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    console.log(`사용자 ID: ${user.id}`);

    const supabase = getServiceRoleClient();

    // 알림 설정 조회
    const { data: settings, error } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116: 결과 없음
      console.error("알림 설정 조회 실패:", error);
      return NextResponse.json(
        { error: "알림 설정을 조회하는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 기본 설정 반환 (설정이 없는 경우)
    const defaultSettings: NotificationSettings = {
      vaccinationReminders: true,
      vaccinationChannels: ["in_app", "push"],
      vaccinationDaysBefore: [0, 1, 7],

      medicationReminders: true,
      medicationChannels: ["in_app", "push"],
      medicationTimes: ["09:00", "21:00"],

      checkupReminders: true,
      checkupChannels: ["in_app", "email"],
      checkupDaysBefore: [7, 30],

      appointmentReminders: true,
      appointmentChannels: ["in_app", "sms"],
      appointmentDaysBefore: [1, 7],

      quietHours: {
        enabled: true,
        start: "22:00",
        end: "08:00",
      },
      timezone: "Asia/Seoul",
    };

    const userSettings = settings ? settings.settings : defaultSettings;

    console.log("알림 설정 조회 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      settings: userSettings,
    });

  } catch (error) {
    console.error("알림 설정 조회 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      { error: "알림 설정 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/notifications/settings
 * 사용자의 알림 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  console.group("[API] 알림 설정 업데이트");

  try {
    // 사용자 인증
    const user = await ensureSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    console.log(`사용자 ID: ${user.id}`);

    // 프리미엄 체크 (건강 알림은 프리미엄 기능)
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      return NextResponse.json(
        { error: "프리미엄 회원만 이용할 수 있는 기능입니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings }: { settings: NotificationSettings } = body;

    // 입력 검증
    if (!settings) {
      return NextResponse.json(
        { error: "알림 설정이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 설정 유효성 검증
    const validationErrors = validateNotificationSettings(settings);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "유효하지 않은 설정입니다.", details: validationErrors },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 설정 업데이트 (upsert)
    const { data, error } = await supabase
      .from("user_notification_settings")
      .upsert({
        user_id: user.id,
        settings: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (error) {
      console.error("알림 설정 저장 실패:", error);
      return NextResponse.json(
        { error: "알림 설정 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("알림 설정 저장 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      settings: data.settings,
      message: "알림 설정이 저장되었습니다.",
    });

  } catch (error) {
    console.error("알림 설정 업데이트 중 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      { error: "알림 설정 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 알림 설정 유효성 검증
 */
function validateNotificationSettings(settings: NotificationSettings): string[] {
  const errors: string[] = [];

  // 채널 검증
  const validChannels = ["push", "sms", "email", "in_app"];

  if (settings.vaccinationChannels) {
    const invalidChannels = settings.vaccinationChannels.filter(c => !validChannels.includes(c));
    if (invalidChannels.length > 0) {
      errors.push(`유효하지 않은 예방주사 알림 채널: ${invalidChannels.join(', ')}`);
    }
  }

  if (settings.medicationChannels) {
    const invalidChannels = settings.medicationChannels.filter(c => !validChannels.includes(c));
    if (invalidChannels.length > 0) {
      errors.push(`유효하지 않은 약물 알림 채널: ${invalidChannels.join(', ')}`);
    }
  }

  if (settings.checkupChannels) {
    const invalidChannels = settings.checkupChannels.filter(c => !validChannels.includes(c));
    if (invalidChannels.length > 0) {
      errors.push(`유효하지 않은 검진 알림 채널: ${invalidChannels.join(', ')}`);
    }
  }

  if (settings.appointmentChannels) {
    const invalidChannels = settings.appointmentChannels.filter(c => !validChannels.includes(c));
    if (invalidChannels.length > 0) {
      errors.push(`유효하지 않은 진료 알림 채널: ${invalidChannels.join(', ')}`);
    }
  }

  // 시간 형식 검증
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (settings.medicationTimes) {
    const invalidTimes = settings.medicationTimes.filter(t => !timeRegex.test(t));
    if (invalidTimes.length > 0) {
      errors.push(`유효하지 않은 약물 복용 시간 형식: ${invalidTimes.join(', ')}`);
    }
  }

  if (settings.quietHours) {
    if (settings.quietHours.start && !timeRegex.test(settings.quietHours.start)) {
      errors.push(`유효하지 않은 조용한 시간 시작 형식: ${settings.quietHours.start}`);
    }
    if (settings.quietHours.end && !timeRegex.test(settings.quietHours.end)) {
      errors.push(`유효하지 않은 조용한 시간 종료 형식: ${settings.quietHours.end}`);
    }
  }

  // 일자 범위 검증
  const validateDaysArray = (days: number[], fieldName: string) => {
    if (days.some(d => !Number.isInteger(d) || d < -365 || d > 365)) {
      errors.push(`${fieldName}에 유효하지 않은 일자 범위가 포함되어 있습니다.`);
    }
  };

  if (settings.vaccinationDaysBefore) {
    validateDaysArray(settings.vaccinationDaysBefore, "예방주사 알림");
  }

  if (settings.checkupDaysBefore) {
    validateDaysArray(settings.checkupDaysBefore, "건강검진 알림");
  }

  if (settings.appointmentDaysBefore) {
    validateDaysArray(settings.appointmentDaysBefore, "진료 알림");
  }

  return errors;
}

