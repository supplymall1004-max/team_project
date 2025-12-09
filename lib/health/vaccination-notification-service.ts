/**
 * @file lib/health/vaccination-notification-service.ts
 * @description 예방주사 알림 서비스
 * 
 * 예방주사 예정일을 기준으로 알림 발송 및 관리
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 알림 발송 파라미터
 */
export interface SendVaccinationNotificationParams {
  scheduleId: string;
  userId: string;
  notificationType: "scheduled" | "reminder" | "overdue";
  notificationChannel: "push" | "sms" | "email" | "in_app";
  daysBefore?: number;
  customMessage?: string;
}

/**
 * 알림 발송 결과
 */
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * 예방주사 알림 발송
 */
export async function sendVaccinationNotification(
  params: SendVaccinationNotificationParams
): Promise<NotificationResult> {
  console.group("[VaccinationNotificationService] 예방주사 알림 발송");

  try {
    const supabase = getServiceRoleClient();

    // 예방주사 일정 정보 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from("user_vaccination_schedules")
      .select(`
        id,
        vaccine_name,
        recommended_date,
        priority,
        family_member_id,
        family_members(name)
      `)
      .eq("id", params.scheduleId)
      .eq("user_id", params.userId)
      .single();

    if (scheduleError || !schedule) {
      console.error("❌ 예방주사 일정 조회 실패:", scheduleError);
      console.groupEnd();
      return {
        success: false,
        error: "예방주사 일정을 찾을 수 없습니다.",
      };
    }

    // 알림 메시지 생성
    const message = createVaccinationNotificationMessage(
      schedule,
      params.notificationType,
      params.daysBefore
    );

    // 알림 로그 기록
    const { data: notificationLog, error: logError } = await supabase
      .from("vaccination_notification_logs")
      .insert({
        user_id: params.userId,
        family_member_id: schedule.family_member_id,
        vaccination_schedule_id: params.scheduleId,
        notification_type: params.notificationType,
        notification_channel: params.notificationChannel,
        scheduled_date: schedule.recommended_date,
        notification_status: "sent",
        reminder_days_before: params.daysBefore,
        message: params.customMessage || message,
      })
      .select()
      .single();

    if (logError) {
      console.error("❌ 알림 로그 기록 실패:", logError);
      console.groupEnd();
      return {
        success: false,
        error: "알림 로그 기록에 실패했습니다.",
      };
    }

    // 일정의 알림 정보 업데이트
    const { error: updateError } = await supabase
      .from("user_vaccination_schedules")
      .update({
        notification_sent_at: new Date().toISOString(),
        notification_channel: params.notificationChannel,
        reminder_count: schedule.reminder_count ? schedule.reminder_count + 1 : 1,
      })
      .eq("id", params.scheduleId);

    if (updateError) {
      console.warn("⚠️ 일정 알림 정보 업데이트 실패:", updateError);
    }

    // 실제 알림 발송 (여기서는 로그만 기록, 실제 구현은 별도 서비스로 분리)
    console.log(`📤 ${params.notificationChannel} 알림 발송: ${message}`);

    console.log("✅ 예방주사 알림 발송 완료");
    console.groupEnd();

    return {
      success: true,
      notificationId: notificationLog.id,
    };
  } catch (error) {
    console.error("❌ 예방주사 알림 발송 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 발송 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 알림 메시지 생성
 */
function createVaccinationNotificationMessage(
  schedule: any,
  notificationType: "scheduled" | "reminder" | "overdue",
  daysBefore?: number
): string {
  const familyMemberName = schedule.family_members?.name || "가족 구성원";
  const vaccineName = schedule.vaccine_name;
  const recommendedDate = new Date(schedule.recommended_date).toLocaleDateString('ko-KR');
  const priority = schedule.priority === "required" ? "필수" : schedule.priority === "recommended" ? "권장" : "선택";

  switch (notificationType) {
    case "scheduled":
      return `${familyMemberName}님의 ${vaccineName} 예방접종(${priority})이 ${recommendedDate}에 예정되어 있습니다.`;

    case "reminder":
      if (daysBefore === 0) {
        return `${familyMemberName}님의 ${vaccineName} 예방접종(${priority}) 당일입니다. 접종을 잊지 마세요!`;
      } else {
        return `${familyMemberName}님의 ${vaccineName} 예방접종(${priority})이 ${daysBefore}일 남았습니다.`;
      }

    case "overdue":
      return `${familyMemberName}님의 ${vaccineName} 예방접종(${priority}) 예정일(${recommendedDate})이 지났습니다. 빠른 시일 내 접종하세요.`;

    default:
      return `${familyMemberName}님의 ${vaccineName} 예방접종(${priority}) 알림입니다.`;
  }
}

/**
 * 예방주사 알림 스케줄러
 * 예정된 예방주사 일정을 확인하고 적절한 시점에 알림 발송
 */
export async function scheduleVaccinationNotifications(): Promise<{
  processed: number;
  notificationsSent: number;
  errors: number;
}> {
  console.group("[VaccinationNotificationService] 예방주사 알림 스케줄링");

  const result = {
    processed: 0,
    notificationsSent: 0,
    errors: 0,
  };

  try {
    const supabase = getServiceRoleClient();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 알림 대상 일정 조회 (오늘부터 7일 이내 예정된 일정)
    const { data: schedules, error: schedulesError } = await supabase
      .from("user_vaccination_schedules")
      .select(`
        id,
        user_id,
        vaccine_name,
        recommended_date,
        priority,
        family_member_id,
        notification_sent_at,
        reminder_count
      `)
      .eq("status", "pending")
      .gte("recommended_date", todayStr)
      .lte("recommended_date", new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (schedulesError) {
      console.error("❌ 알림 대상 일정 조회 실패:", schedulesError);
      console.groupEnd();
      return result;
    }

    console.log(`📋 알림 대상 일정: ${schedules?.length || 0}건`);

    for (const schedule of schedules || []) {
      try {
        result.processed++;

        const recommendedDate = new Date(schedule.recommended_date);
        const daysUntilVaccination = Math.floor((recommendedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // 알림 발송 여부 결정
        let shouldSendNotification = false;
        let notificationType: "scheduled" | "reminder" | "overdue" = "reminder";
        let daysBefore = daysUntilVaccination;

        if (daysUntilVaccination < 0) {
          // 예정일이 지남
          if (daysUntilVaccination >= -7) {
            // 7일 이내에 지났으면 연체 알림
            notificationType = "overdue";
            shouldSendNotification = true;
          }
        } else if (daysUntilVaccination === 0) {
          // 당일
          notificationType = "reminder";
          shouldSendNotification = true;
        } else if (daysUntilVaccination <= 7) {
          // 7일 이내
          notificationType = "reminder";
          shouldSendNotification = true;
        } else if (daysUntilVaccination === 30 && !schedule.notification_sent_at) {
          // 30일 전 (최초 알림)
          notificationType = "scheduled";
          shouldSendNotification = true;
        }

        // 이미 알림을 보냈는지 확인 (중복 방지)
        if (shouldSendNotification) {
          const { data: recentNotifications } = await supabase
            .from("vaccination_notification_logs")
            .select("id")
            .eq("vaccination_schedule_id", schedule.id)
            .eq("notification_type", notificationType)
            .gte("created_at", new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()) // 최근 24시간 내
            .limit(1);

          if (recentNotifications && recentNotifications.length > 0) {
            console.log(`⏰ ${schedule.vaccine_name} 알림이 최근에 이미 발송됨 - 건너뜀`);
            continue;
          }

          // 알림 발송
          const notificationResult = await sendVaccinationNotification({
            scheduleId: schedule.id,
            userId: schedule.user_id,
            notificationType,
            notificationChannel: "in_app", // 기본값, 사용자 설정에 따라 변경 가능
            daysBefore,
          });

          if (notificationResult.success) {
            result.notificationsSent++;
            console.log(`✅ ${schedule.vaccine_name} 알림 발송: ${notificationType}`);
          } else {
            result.errors++;
            console.error(`❌ ${schedule.vaccine_name} 알림 발송 실패:`, notificationResult.error);
          }
        }
      } catch (error) {
        console.error(`❌ 일정 처리 중 오류:`, error);
        result.errors++;
      }
    }

    console.log(`✅ 예방주사 알림 스케줄링 완료: ${result.processed}건 처리, ${result.notificationsSent}건 발송, ${result.errors}건 오류`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 예방주사 알림 스케줄링 실패:", error);
    console.groupEnd();
    return result;
  }
}

/**
 * 사용자별 알림 설정 조회
 */
export async function getUserNotificationSettings(userId: string): Promise<{
  vaccinationReminders: boolean;
  reminderChannels: string[];
  reminderDaysBefore: number[];
} | null> {
  try {
    const supabase = getServiceRoleClient();

    const { data: settings, error } = await supabase
      .from("user_notification_settings")
      .select("vaccination_reminders, reminder_channels, reminder_days_before")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("⚠️ 사용자 알림 설정 조회 실패:", error);
      return null;
    }

    return {
      vaccinationReminders: settings.vaccination_reminders || true,
      reminderChannels: Array.isArray(settings.reminder_channels) ? settings.reminder_channels : ["in_app"],
      reminderDaysBefore: Array.isArray(settings.reminder_days_before) ? settings.reminder_days_before : [0, 1, 7],
    };
  } catch (error) {
    console.error("❌ 사용자 알림 설정 조회 실패:", error);
    return null;
  }
}

/**
 * 사용자별 알림 설정 업데이트
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: {
    vaccinationReminders?: boolean;
    reminderChannels?: string[];
    reminderDaysBefore?: number[];
  }
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from("user_notification_settings")
      .upsert({
        user_id: userId,
        vaccination_reminders: settings.vaccinationReminders,
        reminder_channels: settings.reminderChannels,
        reminder_days_before: settings.reminderDaysBefore,
      });

    if (error) {
      console.error("❌ 사용자 알림 설정 업데이트 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ 사용자 알림 설정 업데이트 실패:", error);
    return false;
  }
}

