/**
 * @file lib/health/medication-reminder-service.ts
 * @description 약물 복용 알림 시스템 서비스
 *
 * 약물 복용 알림을 스케줄링하고 관리하는 서비스입니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/types/health-data-integration: 약물 기록 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { MedicationRecord } from "@/types/health-data-integration";

/**
 * 약물 복용 알림 로그
 */
export interface MedicationReminderLog {
  id: string;
  medication_record_id: string;
  scheduled_time: string;
  notified_at: string | null;
  confirmed_at: string | null;
  status: "pending" | "notified" | "confirmed" | "missed";
  created_at: string;
  updated_at: string;
}

/**
 * 약물 복용 알림 스케줄 생성
 * 약물 기록의 reminder_times를 기반으로 알림 로그를 생성합니다.
 *
 * @param medicationRecord 약물 기록
 * @param startDate 시작 날짜 (기본값: 오늘)
 * @param endDate 종료 날짜 (기본값: 약물 종료일 또는 30일 후)
 * @returns 생성된 알림 로그 수
 */
export async function createMedicationReminderSchedule(
  medicationRecord: MedicationRecord,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  console.group("[MedicationReminderService] 약물 복용 알림 스케줄 생성");
  console.log("약물 기록 ID:", medicationRecord.id);

  try {
    if (!medicationRecord.reminder_enabled || !medicationRecord.reminder_times.length) {
      console.log("✅ 알림이 비활성화되어 있거나 알림 시간이 없습니다.");
      console.groupEnd();
      return 0;
    }

    const supabase = getServiceRoleClient();

    // 날짜 범위 설정
    const today = startDate || new Date();
    today.setHours(0, 0, 0, 0);

    const medicationEndDate = medicationRecord.end_date
      ? new Date(medicationRecord.end_date)
      : null;
    const scheduleEndDate = endDate || medicationEndDate || new Date();
    scheduleEndDate.setHours(23, 59, 59, 999);

    if (medicationEndDate && scheduleEndDate > medicationEndDate) {
      scheduleEndDate.setTime(medicationEndDate.getTime());
    }

    // 30일 후로 제한
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    if (scheduleEndDate > maxDate) {
      scheduleEndDate.setTime(maxDate.getTime());
    }

    // 알림 로그 생성
    const reminderLogs: Array<{
      medication_record_id: string;
      scheduled_time: string;
      status: string;
    }> = [];

    const currentDate = new Date(today);
    while (currentDate <= scheduleEndDate) {
      for (const reminderTime of medicationRecord.reminder_times) {
        const [hours, minutes] = reminderTime.split(":").map(Number);
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // 과거 시간은 제외
        if (scheduledTime >= new Date()) {
          reminderLogs.push({
            medication_record_id: medicationRecord.id,
            scheduled_time: scheduledTime.toISOString(),
            status: "pending",
          });
        }
      }

      // 다음 날로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (reminderLogs.length === 0) {
      console.log("✅ 생성할 알림이 없습니다.");
      console.groupEnd();
      return 0;
    }

    // 기존 알림 로그 확인 (중복 방지)
    const { data: existingLogs } = await supabase
      .from("medication_reminder_logs")
      .select("scheduled_time")
      .eq("medication_record_id", medicationRecord.id)
      .in(
        "scheduled_time",
        reminderLogs.map((log) => log.scheduled_time)
      );

    const existingTimes = new Set(
      (existingLogs || []).map((log) => new Date(log.scheduled_time).toISOString())
    );

    // 중복되지 않은 알림만 추가
    const newLogs = reminderLogs.filter(
      (log) => !existingTimes.has(new Date(log.scheduled_time).toISOString())
    );

    if (newLogs.length === 0) {
      console.log("✅ 모든 알림이 이미 생성되어 있습니다.");
      console.groupEnd();
      return 0;
    }

    // 알림 로그 저장
    const { error } = await supabase
      .from("medication_reminder_logs")
      .insert(newLogs);

    if (error) {
      console.error("❌ 알림 로그 저장 실패:", error);
      throw error;
    }

    console.log(`✅ 약물 복용 알림 스케줄 ${newLogs.length}개 생성 완료`);
    console.groupEnd();

    return newLogs.length;
  } catch (error) {
    console.error("❌ 약물 복용 알림 스케줄 생성 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 약물 복용 알림 확인
 * 사용자가 약물을 복용했다고 확인했을 때 호출합니다.
 *
 * @param reminderLogId 알림 로그 ID
 * @returns 업데이트된 알림 로그
 */
export async function confirmMedicationReminder(
  reminderLogId: string
): Promise<MedicationReminderLog> {
  console.group("[MedicationReminderService] 약물 복용 확인");
  console.log("알림 로그 ID:", reminderLogId);

  try {
    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("medication_reminder_logs")
      .update({
        confirmed_at: now,
        status: "confirmed",
      })
      .eq("id", reminderLogId)
      .select()
      .single();

    if (error) {
      console.error("❌ 약물 복용 확인 실패:", error);
      throw error;
    }

    console.log("✅ 약물 복용 확인 완료");
    console.groupEnd();

    return data as MedicationReminderLog;
  } catch (error) {
    console.error("❌ 약물 복용 확인 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 약물 복용 알림 조회
 * 특정 약물 기록의 알림 로그를 조회합니다.
 *
 * @param medicationRecordId 약물 기록 ID
 * @param startDate 시작 날짜 (선택)
 * @param endDate 종료 날짜 (선택)
 * @returns 알림 로그 목록
 */
export async function getMedicationReminderLogs(
  medicationRecordId: string,
  startDate?: Date,
  endDate?: Date
): Promise<MedicationReminderLog[]> {
  console.group("[MedicationReminderService] 약물 복용 알림 조회");
  console.log("약물 기록 ID:", medicationRecordId);

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from("medication_reminder_logs")
      .select("*")
      .eq("medication_record_id", medicationRecordId)
      .order("scheduled_time", { ascending: true });

    if (startDate) {
      query = query.gte("scheduled_time", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("scheduled_time", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 약물 복용 알림 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 약물 복용 알림 ${data?.length || 0}개 조회 완료`);
    console.groupEnd();

    return (data || []) as MedicationReminderLog[];
  } catch (error) {
    console.error("❌ 약물 복용 알림 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 사용자의 모든 약물 복용 알림 조회
 *
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택)
 * @param date 날짜 (기본값: 오늘)
 * @returns 알림 로그 목록
 */
export async function getUserMedicationReminders(
  userId: string,
  familyMemberId?: string | null,
  date?: Date
): Promise<MedicationReminderLog[]> {
  console.group("[MedicationReminderService] 사용자 약물 복용 알림 조회");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId || "없음");

  try {
    const supabase = getServiceRoleClient();

    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 약물 기록 조회
    let medicationQuery = supabase
      .from("medication_records")
      .select("id")
      .eq("user_id", userId)
      .eq("reminder_enabled", true)
      .or(`end_date.is.null,end_date.gte.${targetDate.toISOString().split("T")[0]}`);

    if (familyMemberId) {
      medicationQuery = medicationQuery.eq("family_member_id", familyMemberId);
    } else {
      medicationQuery = medicationQuery.is("family_member_id", null);
    }

    const { data: medications, error: medicationError } = await medicationQuery;

    if (medicationError) {
      console.error("❌ 약물 기록 조회 실패:", medicationError);
      throw medicationError;
    }

    if (!medications || medications.length === 0) {
      console.log("✅ 복용 중인 약물이 없습니다.");
      console.groupEnd();
      return [];
    }

    const medicationIds = medications.map((m) => m.id);

    // 알림 로그 조회
    const { data, error } = await supabase
      .from("medication_reminder_logs")
      .select("*")
      .in("medication_record_id", medicationIds)
      .gte("scheduled_time", startOfDay.toISOString())
      .lte("scheduled_time", endOfDay.toISOString())
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("❌ 약물 복용 알림 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 약물 복용 알림 ${data?.length || 0}개 조회 완료`);
    console.groupEnd();

    return (data || []) as MedicationReminderLog[];
  } catch (error) {
    console.error("❌ 사용자 약물 복용 알림 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 누락된 약물 복용 알림 업데이트
 * 예정 시간이 지났지만 확인되지 않은 알림을 'missed' 상태로 업데이트합니다.
 *
 * @param hoursBeforeMissed 몇 시간 후 누락으로 처리할지 (기본값: 2시간)
 * @returns 업데이트된 알림 수
 */
export async function updateMissedReminders(
  hoursBeforeMissed: number = 2
): Promise<number> {
  console.group("[MedicationReminderService] 누락된 약물 복용 알림 업데이트");

  try {
    const supabase = getServiceRoleClient();

    // 2시간 전에 예정되었지만 아직 확인되지 않은 알림
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBeforeMissed);

    const { data, error } = await supabase
      .from("medication_reminder_logs")
      .update({
        status: "missed",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .lte("scheduled_time", cutoffTime.toISOString())
      .select();

    if (error) {
      console.error("❌ 누락된 알림 업데이트 실패:", error);
      throw error;
    }

    const updatedCount = data?.length || 0;
    console.log(`✅ 누락된 약물 복용 알림 ${updatedCount}개 업데이트 완료`);
    console.groupEnd();

    return updatedCount;
  } catch (error) {
    console.error("❌ 누락된 약물 복용 알림 업데이트 오류:", error);
    console.groupEnd();
    throw error;
  }
}

