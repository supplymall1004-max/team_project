/**
 * @file lib/game/baby-feeding-scheduler.ts
 * @description 아기 분유 스케줄 관리
 *
 * 아기 분유 먹일 시간 스케줄을 생성, 수정, 조회하고
 * 다음 분유 시간을 자동으로 계산합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/types/game/character-game-events: 아기 분유 스케줄 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  BabyFeedingSchedule,
  CreateBabyFeedingScheduleParams,
} from "@/types/game/character-game-events";

/**
 * 아기 분유 스케줄 생성 또는 업데이트
 */
export async function upsertBabyFeedingSchedule(
  params: CreateBabyFeedingScheduleParams
): Promise<BabyFeedingSchedule> {
  console.group("[BabyFeedingScheduler] 분유 스케줄 생성/업데이트");
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  // 기존 스케줄 확인
  const { data: existing } = await supabase
    .from("baby_feeding_schedules")
    .select("*")
    .eq("user_id", params.user_id)
    .eq("family_member_id", params.family_member_id)
    .single();

  // 다음 분유 시간 계산
  const nextFeedingTime = calculateNextFeedingTime(
    existing?.last_feeding_time,
    existing?.next_feeding_time,
    params.feeding_interval_hours
  );

  const scheduleData = {
    user_id: params.user_id,
    family_member_id: params.family_member_id,
    feeding_interval_hours: params.feeding_interval_hours,
    next_feeding_time: nextFeedingTime?.toISOString() || null,
    is_active: true,
    reminder_enabled: params.reminder_enabled ?? true,
    reminder_minutes_before: params.reminder_minutes_before ?? 10,
    notes: params.notes || null,
  };

  let result;
  if (existing) {
    // 업데이트
    const { data, error } = await supabase
      .from("baby_feeding_schedules")
      .update(scheduleData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("❌ 분유 스케줄 업데이트 실패:", error);
      console.groupEnd();
      throw new Error(`분유 스케줄 업데이트 실패: ${error.message}`);
    }

    result = data;
  } else {
    // 생성
    const { data, error } = await supabase
      .from("baby_feeding_schedules")
      .insert(scheduleData)
      .select()
      .single();

    if (error) {
      console.error("❌ 분유 스케줄 생성 실패:", error);
      console.groupEnd();
      throw new Error(`분유 스케줄 생성 실패: ${error.message}`);
    }

    result = data;
  }

  console.log("✅ 분유 스케줄 생성/업데이트 완료:", result.id);
  console.log("다음 분유 시간:", result.next_feeding_time);
  console.groupEnd();

  return result as BabyFeedingSchedule;
}

/**
 * 다음 분유 시간 계산
 */
function calculateNextFeedingTime(
  lastFeedingTime: string | null,
  currentNextFeedingTime: string | null,
  intervalHours: number
): Date | null {
  const now = new Date();

  // 이미 계산된 다음 시간이 있고 미래라면 그대로 사용
  if (currentNextFeedingTime) {
    const nextTime = new Date(currentNextFeedingTime);
    if (nextTime > now) {
      return nextTime;
    }
  }

  // 마지막 분유 시간이 있으면 그 시간부터 간격 계산
  if (lastFeedingTime) {
    const lastTime = new Date(lastFeedingTime);
    const nextTime = new Date(lastTime);
    nextTime.setHours(
      nextTime.getHours() + Math.floor(intervalHours),
      nextTime.getMinutes() + Math.floor((intervalHours % 1) * 60),
      0,
      0
    );

    // 과거 시간이면 지금부터 간격 시간 후로 설정
    if (nextTime <= now) {
      const adjustedTime = new Date(now);
      adjustedTime.setHours(
        adjustedTime.getHours() + Math.floor(intervalHours),
        adjustedTime.getMinutes() + Math.floor((intervalHours % 1) * 60),
        0,
        0
      );
      return adjustedTime;
    }

    return nextTime;
  }

  // 마지막 분유 시간이 없으면 지금부터 간격 시간 후
  const nextTime = new Date(now);
  nextTime.setHours(
    nextTime.getHours() + Math.floor(intervalHours),
    nextTime.getMinutes() + Math.floor((intervalHours % 1) * 60),
    0,
    0
  );

  return nextTime;
}

/**
 * 분유 완료 처리 (분유를 주었을 때)
 */
export async function completeBabyFeeding(
  userId: string,
  familyMemberId: string
): Promise<BabyFeedingSchedule> {
  console.group("[BabyFeedingScheduler] 분유 완료 처리");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const supabase = getServiceRoleClient();

  // 스케줄 조회
  const { data: schedule, error: fetchError } = await supabase
    .from("baby_feeding_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId)
    .single();

  if (fetchError || !schedule) {
    console.error("❌ 분유 스케줄 조회 실패:", fetchError);
    console.groupEnd();
    throw new Error("분유 스케줄을 찾을 수 없습니다.");
  }

  const now = new Date();

  // 다음 분유 시간 계산
  const nextFeedingTime = calculateNextFeedingTime(
    now.toISOString(),
    schedule.next_feeding_time,
    schedule.feeding_interval_hours
  );

  // 스케줄 업데이트
  const { data: updatedSchedule, error: updateError } = await supabase
    .from("baby_feeding_schedules")
    .update({
      last_feeding_time: now.toISOString(),
      next_feeding_time: nextFeedingTime?.toISOString() || null,
    })
    .eq("id", schedule.id)
    .select()
    .single();

  if (updateError) {
    console.error("❌ 분유 스케줄 업데이트 실패:", updateError);
    console.groupEnd();
    throw new Error(`분유 스케줄 업데이트 실패: ${updateError.message}`);
  }

  console.log("✅ 분유 완료 처리 완료");
  console.log("다음 분유 시간:", updatedSchedule.next_feeding_time);
  console.groupEnd();

  return updatedSchedule as BabyFeedingSchedule;
}

/**
 * 분유 스케줄 조회
 */
export async function getBabyFeedingSchedule(
  userId: string,
  familyMemberId: string
): Promise<BabyFeedingSchedule | null> {
  console.group("[BabyFeedingScheduler] 분유 스케줄 조회");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("baby_feeding_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 레코드 없음
      console.log("✅ 분유 스케줄이 없습니다.");
      console.groupEnd();
      return null;
    }
    console.error("❌ 분유 스케줄 조회 실패:", error);
    console.groupEnd();
    throw new Error(`분유 스케줄 조회 실패: ${error.message}`);
  }

  console.log("✅ 분유 스케줄 조회 완료");
  console.groupEnd();

  return data as BabyFeedingSchedule;
}

/**
 * 분유 스케줄 비활성화
 */
export async function deactivateBabyFeedingSchedule(
  userId: string,
  familyMemberId: string
): Promise<void> {
  console.group("[BabyFeedingScheduler] 분유 스케줄 비활성화");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("baby_feeding_schedules")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId);

  if (error) {
    console.error("❌ 분유 스케줄 비활성화 실패:", error);
    console.groupEnd();
    throw new Error(`분유 스케줄 비활성화 실패: ${error.message}`);
  }

  console.log("✅ 분유 스케줄 비활성화 완료");
  console.groupEnd();
}

