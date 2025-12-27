/**
 * @file lib/game/character-game-event-scheduler.ts
 * @description 캐릭터 게임 이벤트 스케줄러
 *
 * 약물 복용, 아기 분유, 건강검진 등 다양한 건강 관련 이벤트를
 * 게임 이벤트로 변환하여 스케줄링합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/types/game/character-game-events: 게임 이벤트 타입
 * - @/types/health-data-integration: 약물 기록 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  CharacterGameEvent,
  CharacterGameEventType,
  CreateCharacterGameEventParams,
  MedicationEventData,
  BabyFeedingEventData,
  HealthCheckupEventData,
  VaccinationEventData,
  KCDCAlertEventData,
  LifecycleEventData,
} from "@/types/game/character-game-events";
import type { MedicationRecord } from "@/types/health-data-integration";

/**
 * 약물 복용 이벤트 생성
 */
export async function scheduleMedicationEvents(
  userId: string,
  familyMemberId: string | null
): Promise<number> {
  console.group("[CharacterGameEventScheduler] 약물 복용 이벤트 스케줄링");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    // 활성 약물 기록 조회
    let query = supabase
      .from("medication_records")
      .select("*")
      .eq("user_id", userId)
      .eq("reminder_enabled", true)
      .or("end_date.is.null,end_date.gte." + new Date().toISOString().split("T")[0]);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data: medications, error } = await query;

    if (error) {
      console.error("❌ 약물 기록 조회 실패:", error);
      console.groupEnd();
      throw error;
    }

    if (!medications || medications.length === 0) {
      console.log("✅ 스케줄할 약물이 없습니다.");
      console.groupEnd();
      return 0;
    }

    console.log(`📋 활성 약물 ${medications.length}개 발견`);

    let eventsCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 각 약물에 대해 오늘부터 7일간 이벤트 생성
    for (const medication of medications as MedicationRecord[]) {
      if (!medication.reminder_times || medication.reminder_times.length === 0) {
        continue;
      }

      const medicationEndDate = medication.end_date
        ? new Date(medication.end_date)
        : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후

      const currentDate = new Date(today);
      while (currentDate <= medicationEndDate && currentDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        for (const reminderTime of medication.reminder_times) {
          const [hours, minutes] = reminderTime.split(":").map(Number);
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // 과거 시간은 제외
          if (scheduledTime < new Date()) {
            continue;
          }

          // 기존 이벤트 확인 (중복 방지)
          const { data: existing } = await supabase
            .from("character_game_events")
            .select("id")
            .eq("user_id", userId)
            .eq("family_member_id", familyMemberId || null)
            .eq("event_type", "medication")
            .eq("scheduled_time", scheduledTime.toISOString())
            .eq("status", "pending")
            .single();

          if (existing) {
            continue; // 이미 존재하는 이벤트는 건너뜀
          }

          // 이벤트 데이터 생성
          const eventData: MedicationEventData = {
            medication_record_id: medication.id,
            medication_name: medication.medication_name,
            dosage: medication.dosage || "",
            frequency: medication.frequency || "",
            scheduled_time: reminderTime,
            dialogue_message: `${medication.medication_name} 먹을 시간이야. 약 줘!`,
          };

          // 게임 이벤트 생성
          const eventParams: CreateCharacterGameEventParams = {
            user_id: userId,
            family_member_id: familyMemberId || null,
            event_type: "medication",
            event_data: eventData,
            scheduled_time: scheduledTime.toISOString(),
            priority: "high",
          };

          await createCharacterGameEvent(eventParams);
          eventsCreated++;
        }

        // 다음 날로 이동
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    console.log(`✅ 약물 복용 이벤트 ${eventsCreated}개 생성 완료`);
    console.groupEnd();

    return eventsCreated;
  } catch (error) {
    console.error("❌ 약물 복용 이벤트 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 아기 분유 이벤트 생성
 */
export async function scheduleBabyFeedingEvents(
  userId: string,
  familyMemberId: string
): Promise<number> {
  console.group("[CharacterGameEventScheduler] 아기 분유 이벤트 스케줄링");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    // 아기 분유 스케줄 조회
    const { data: schedule, error } = await supabase
      .from("baby_feeding_schedules")
      .select("*")
      .eq("user_id", userId)
      .eq("family_member_id", familyMemberId)
      .eq("is_active", true)
      .single();

    if (error || !schedule) {
      console.log("✅ 활성 분유 스케줄이 없습니다.");
      console.groupEnd();
      return 0;
    }

    // 가족 구성원 정보 조회 (이름 확인)
    const { data: familyMember } = await supabase
      .from("family_members")
      .select("name")
      .eq("id", familyMemberId)
      .single();

    const babyName = familyMember?.name || "아기";

    // 다음 분유 시간 계산
    let nextFeedingTime: Date;
    if (schedule.next_feeding_time) {
      nextFeedingTime = new Date(schedule.next_feeding_time);
    } else if (schedule.last_feeding_time) {
      nextFeedingTime = new Date(schedule.last_feeding_time);
      nextFeedingTime.setHours(
        nextFeedingTime.getHours() + Math.floor(schedule.feeding_interval_hours),
        nextFeedingTime.getMinutes() + Math.floor((schedule.feeding_interval_hours % 1) * 60),
        0,
        0
      );
    } else {
      // 첫 분유 시간: 지금부터 간격 시간 후
      nextFeedingTime = new Date();
      nextFeedingTime.setHours(
        nextFeedingTime.getHours() + Math.floor(schedule.feeding_interval_hours),
        nextFeedingTime.getMinutes() + Math.floor((schedule.feeding_interval_hours % 1) * 60),
        0,
        0
      );
    }

    // 과거 시간이면 지금부터 간격 시간 후로 설정
    if (nextFeedingTime < new Date()) {
      nextFeedingTime = new Date();
      nextFeedingTime.setHours(
        nextFeedingTime.getHours() + Math.floor(schedule.feeding_interval_hours),
        nextFeedingTime.getMinutes() + Math.floor((schedule.feeding_interval_hours % 1) * 60),
        0,
        0
      );
    }

    // 기존 이벤트 확인 (중복 방지)
    const { data: existing } = await supabase
      .from("character_game_events")
      .select("id")
      .eq("user_id", userId)
      .eq("family_member_id", familyMemberId)
      .eq("event_type", "baby_feeding")
      .eq("scheduled_time", nextFeedingTime.toISOString())
      .eq("status", "pending")
      .single();

    if (existing) {
      console.log("✅ 이미 분유 이벤트가 존재합니다.");
      console.groupEnd();
      return 0;
    }

    // 이벤트 데이터 생성
    const eventData: BabyFeedingEventData = {
      feeding_schedule_id: schedule.id,
      baby_name: babyName,
      feeding_interval_hours: schedule.feeding_interval_hours,
      last_feeding_time: schedule.last_feeding_time,
      dialogue_message: `${babyName}가 울고 있어요. 분유를 주세요!`,
      crying_intensity: 80, // 기본 울음 강도
    };

    // 게임 이벤트 생성
    const eventParams: CreateCharacterGameEventParams = {
      user_id: userId,
      family_member_id: familyMemberId,
      event_type: "baby_feeding",
      event_data: eventData,
      scheduled_time: nextFeedingTime.toISOString(),
      priority: "urgent",
    };

    await createCharacterGameEvent(eventParams);

    // 다음 분유 시간 업데이트
    await supabase
      .from("baby_feeding_schedules")
      .update({ next_feeding_time: nextFeedingTime.toISOString() })
      .eq("id", schedule.id);

    console.log(`✅ 아기 분유 이벤트 생성 완료: ${nextFeedingTime.toISOString()}`);
    console.groupEnd();

    return 1;
  } catch (error) {
    console.error("❌ 아기 분유 이벤트 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 게임 이벤트 생성 (공통 함수)
 */
export async function createCharacterGameEvent(
  params: CreateCharacterGameEventParams
): Promise<CharacterGameEvent> {
  console.group("[CharacterGameEventScheduler] 게임 이벤트 생성");
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  const eventData = {
    user_id: params.user_id,
    family_member_id: params.family_member_id || null,
    event_type: params.event_type,
    event_data: params.event_data,
    scheduled_time: params.scheduled_time,
    status: "pending" as const,
    priority: params.priority || "normal",
    points_earned: 0,
    experience_earned: 0,
  };

  const { data, error } = await supabase
    .from("character_game_events")
    .insert(eventData)
    .select()
    .single();

  if (error) {
    console.error("❌ 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    throw new Error(`게임 이벤트 생성 실패: ${error.message}`);
  }

  console.log("✅ 게임 이벤트 생성 완료:", data.id);
  console.groupEnd();

  return data as CharacterGameEvent;
}

/**
 * 활성 이벤트 조회 (현재 시간 기준)
 */
export async function getActiveGameEvents(
  userId: string,
  familyMemberId?: string | null
): Promise<CharacterGameEvent[]> {
  console.group("[CharacterGameEventScheduler] 활성 이벤트 조회");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const supabase = getServiceRoleClient();
  const now = new Date();

  let query = supabase
    .from("character_game_events")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "active"])
    .lte("scheduled_time", now.toISOString())
    .order("scheduled_time", { ascending: true });

  if (familyMemberId !== undefined) {
    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ 활성 이벤트 조회 실패:", error);
    console.groupEnd();
    throw new Error(`활성 이벤트 조회 실패: ${error.message}`);
  }

  console.log(`✅ 활성 이벤트 ${data?.length || 0}개 조회 완료`);
  console.groupEnd();

  return (data || []) as CharacterGameEvent[];
}

