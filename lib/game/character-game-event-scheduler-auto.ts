/**
 * @file lib/game/character-game-event-scheduler-auto.ts
 * @description 캐릭터 게임 이벤트 자동 스케줄링
 *
 * 주기적으로 게임 이벤트를 자동으로 생성하는 스케줄러입니다.
 * 크론 잡 또는 서버리스 함수에서 호출할 수 있습니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/game/character-game-event-scheduler: 이벤트 스케줄러
 * - @/lib/game/baby-feeding-scheduler: 아기 분유 스케줄러
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { scheduleMedicationEvents, scheduleBabyFeedingEvents } from "@/lib/game/character-game-event-scheduler";
import { getBabyFeedingSchedule } from "@/lib/game/baby-feeding-scheduler";
import { generateLifecycleGameEvents } from "@/lib/game/lifecycle-event-generator";

/**
 * 모든 사용자의 게임 이벤트 자동 스케줄링
 *
 * 이 함수는 크론 잡 또는 서버리스 함수에서 주기적으로 호출됩니다.
 * 모든 활성 사용자에 대해 약물 복용 및 아기 분유 이벤트를 생성합니다.
 *
 * @returns 처리 결과
 */
export async function scheduleAllGameEvents(): Promise<{
  processedUsers: number;
  medicationEventsCreated: number;
  babyFeedingEventsCreated: number;
  lifecycleEventsCreated: number;
  errors: number;
}> {
  console.group("[CharacterGameEventSchedulerAuto] 모든 사용자 게임 이벤트 스케줄링");
  const startTime = Date.now();

  const result = {
    processedUsers: 0,
    medicationEventsCreated: 0,
    babyFeedingEventsCreated: 0,
    lifecycleEventsCreated: 0,
    errors: 0,
  };

  try {
    const supabase = getServiceRoleClient();

    // 모든 활성 사용자 조회 (최근 30일 내 활동한 사용자)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(1000); // 한 번에 최대 1000명 처리

    if (usersError) {
      console.error("❌ 사용자 조회 실패:", usersError);
      console.groupEnd();
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log("✅ 처리할 사용자가 없습니다.");
      console.groupEnd();
      return result;
    }

    console.log(`📋 처리 대상 사용자: ${users.length}명`);

    // 각 사용자에 대해 이벤트 스케줄링
    for (const user of users) {
      try {
        // 약물 복용 이벤트 스케줄링 (본인 + 가족 구성원)
        const medicationCount = await scheduleMedicationEvents(user.id, null);
        result.medicationEventsCreated += medicationCount;

        // 가족 구성원별 약물 복용 이벤트
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id);

        if (familyMembers && familyMembers.length > 0) {
          for (const member of familyMembers) {
            const memberMedicationCount = await scheduleMedicationEvents(user.id, member.id);
            result.medicationEventsCreated += memberMedicationCount;
          }
        }

        // 아기 분유 이벤트 스케줄링
        const { data: activeFeedingSchedules } = await supabase
          .from("baby_feeding_schedules")
          .select("family_member_id")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (activeFeedingSchedules && activeFeedingSchedules.length > 0) {
          for (const schedule of activeFeedingSchedules) {
            try {
              const feedingCount = await scheduleBabyFeedingEvents(user.id, schedule.family_member_id);
              result.babyFeedingEventsCreated += feedingCount;
            } catch (error) {
              console.error(`❌ 아기 분유 이벤트 스케줄링 실패 (user: ${user.id}, member: ${schedule.family_member_id}):`, error);
              result.errors++;
            }
          }
        }

        // 생애주기 이벤트 스케줄링
        try {
          const lifecycleCount = await generateLifecycleGameEvents(user.id, null);
          result.lifecycleEventsCreated += lifecycleCount;
        } catch (error) {
          console.error(`❌ 생애주기 이벤트 스케줄링 실패 (user: ${user.id}):`, error);
          result.errors++;
        }

        // 가족 구성원별 생애주기 이벤트
        if (familyMembers && familyMembers.length > 0) {
          for (const member of familyMembers) {
            try {
              const memberLifecycleCount = await generateLifecycleGameEvents(user.id, member.id);
              result.lifecycleEventsCreated += memberLifecycleCount;
            } catch (error) {
              console.error(`❌ 가족 구성원 생애주기 이벤트 스케줄링 실패 (user: ${user.id}, member: ${member.id}):`, error);
              result.errors++;
            }
          }
        }

        result.processedUsers++;
      } catch (error) {
        console.error(`❌ 사용자 이벤트 스케줄링 실패 (user: ${user.id}):`, error);
        result.errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ 게임 이벤트 스케줄링 완료`);
    console.log(`처리된 사용자: ${result.processedUsers}명`);
    console.log(`약물 복용 이벤트: ${result.medicationEventsCreated}개`);
    console.log(`아기 분유 이벤트: ${result.babyFeedingEventsCreated}개`);
    console.log(`생애주기 이벤트: ${result.lifecycleEventsCreated}개`);
    console.log(`오류: ${result.errors}개`);
    console.log(`소요 시간: ${duration}ms`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 게임 이벤트 자동 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 특정 사용자의 게임 이벤트 스케줄링
 *
 * @param userId 사용자 ID
 * @returns 처리 결과
 */
export async function scheduleUserGameEvents(userId: string): Promise<{
  medicationEventsCreated: number;
  babyFeedingEventsCreated: number;
  lifecycleEventsCreated: number;
}> {
  console.group("[CharacterGameEventSchedulerAuto] 사용자 게임 이벤트 스케줄링");
  console.log("userId:", userId);

  const result = {
    medicationEventsCreated: 0,
    babyFeedingEventsCreated: 0,
    lifecycleEventsCreated: 0,
  };

  try {
    const supabase = getServiceRoleClient();

    // 약물 복용 이벤트 스케줄링 (본인)
    const medicationCount = await scheduleMedicationEvents(userId, null);
    result.medicationEventsCreated += medicationCount;

    // 가족 구성원별 약물 복용 이벤트
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId);

    if (familyMembers && familyMembers.length > 0) {
      for (const member of familyMembers) {
        const memberMedicationCount = await scheduleMedicationEvents(userId, member.id);
        result.medicationEventsCreated += memberMedicationCount;
      }
    }

    // 아기 분유 이벤트 스케줄링
    const { data: activeFeedingSchedules } = await supabase
      .from("baby_feeding_schedules")
      .select("family_member_id")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (activeFeedingSchedules && activeFeedingSchedules.length > 0) {
      for (const schedule of activeFeedingSchedules) {
        const feedingCount = await scheduleBabyFeedingEvents(userId, schedule.family_member_id);
        result.babyFeedingEventsCreated += feedingCount;
      }
    }

    // 생애주기 이벤트 스케줄링
    const lifecycleCount = await generateLifecycleGameEvents(userId, null);
    result.lifecycleEventsCreated += lifecycleCount;

    // 가족 구성원별 생애주기 이벤트
    if (familyMembers && familyMembers.length > 0) {
      for (const member of familyMembers) {
        const memberLifecycleCount = await generateLifecycleGameEvents(userId, member.id);
        result.lifecycleEventsCreated += memberLifecycleCount;
      }
    }

    console.log(`✅ 사용자 게임 이벤트 스케줄링 완료`);
    console.log(`약물 복용 이벤트: ${result.medicationEventsCreated}개`);
    console.log(`아기 분유 이벤트: ${result.babyFeedingEventsCreated}개`);
    console.log(`생애주기 이벤트: ${result.lifecycleEventsCreated}개`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 사용자 게임 이벤트 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

