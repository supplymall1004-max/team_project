/**
 * @file lib/game/character-game-initializer.ts
 * @description 캐릭터 게임 초기화 로직
 *
 * 사용자가 처음 게임을 시작할 때 필요한 초기 설정을 수행합니다.
 * - 약물 복용 이벤트 자동 생성
 * - 아기 분유 스케줄 확인 및 이벤트 생성
 * - 게임 설정 초기화
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
 * 사용자의 캐릭터 게임 초기화
 *
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택사항, null이면 본인)
 * @returns 초기화 결과
 */
export async function initializeCharacterGame(
  userId: string,
  familyMemberId?: string | null
): Promise<{
  medicationEventsCreated: number;
  babyFeedingEventsCreated: number;
  lifecycleEventsCreated: number;
  success: boolean;
  error?: string;
}> {
  console.group("[CharacterGameInitializer] 게임 초기화 시작");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const result = {
    medicationEventsCreated: 0,
    babyFeedingEventsCreated: 0,
    lifecycleEventsCreated: 0,
    success: false,
    error: undefined as string | undefined,
  };

  try {
    // 1. 약물 복용 이벤트 스케줄링
    try {
      const medicationCount = await scheduleMedicationEvents(userId, familyMemberId || null);
      result.medicationEventsCreated = medicationCount;
      console.log(`✅ 약물 복용 이벤트 ${medicationCount}개 생성 완료`);
    } catch (error) {
      console.error("❌ 약물 복용 이벤트 생성 실패:", error);
      // 약물 이벤트 생성 실패해도 계속 진행
    }

    // 2. 아기 분유 이벤트 스케줄링 (가족 구성원이 있는 경우)
    if (familyMemberId) {
      try {
        const schedule = await getBabyFeedingSchedule(userId, familyMemberId);
        if (schedule && schedule.is_active) {
          const feedingCount = await scheduleBabyFeedingEvents(userId, familyMemberId);
          result.babyFeedingEventsCreated = feedingCount;
          console.log(`✅ 아기 분유 이벤트 ${feedingCount}개 생성 완료`);
        } else {
          console.log("ℹ️ 아기 분유 스케줄이 없거나 비활성화되어 있습니다.");
        }
      } catch (error) {
        console.error("❌ 아기 분유 이벤트 생성 실패:", error);
        // 분유 이벤트 생성 실패해도 계속 진행
      }
    }

    // 3. 생애주기별 이벤트 스케줄링
    try {
      const lifecycleCount = await generateLifecycleGameEvents(userId, familyMemberId || null);
      result.lifecycleEventsCreated = lifecycleCount;
      console.log(`✅ 생애주기 이벤트 ${lifecycleCount}개 생성 완료`);
    } catch (error) {
      console.error("❌ 생애주기 이벤트 생성 실패:", error);
      // 생애주기 이벤트 생성 실패해도 계속 진행
    }

    // 4. 게임 설정 확인 및 초기화
    const supabase = getServiceRoleClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("game_settings")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("❌ 사용자 정보 조회 실패:", userError);
    } else if (!user.game_settings) {
      // 게임 설정이 없으면 기본값으로 초기화
      const defaultSettings = {
        characterGameEnabled: true,
        autoWalkEnabled: true,
        soundEnabled: true,
        notificationEnabled: true,
        gameTheme: "default",
      };

      await supabase
        .from("users")
        .update({ game_settings: defaultSettings })
        .eq("id", userId);

      console.log("✅ 게임 설정 초기화 완료");
    }

    result.success = true;
    console.log("✅ 게임 초기화 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 게임 초기화 실패:", error);
    console.groupEnd();
    result.error = error instanceof Error ? error.message : "게임 초기화 중 오류가 발생했습니다.";
    return result;
  }
}

/**
 * 모든 가족 구성원에 대해 게임 초기화
 *
 * @param userId 사용자 ID
 * @returns 초기화 결과
 */
export async function initializeAllFamilyMembersGame(
  userId: string
): Promise<{
  processedMembers: number;
  totalMedicationEvents: number;
  totalBabyFeedingEvents: number;
  totalLifecycleEvents: number;
  errors: number;
}> {
  console.group("[CharacterGameInitializer] 모든 가족 구성원 게임 초기화");
  const startTime = Date.now();

  const result = {
    processedMembers: 0,
    totalMedicationEvents: 0,
    totalBabyFeedingEvents: 0,
    totalLifecycleEvents: 0,
    errors: 0,
  };

  try {
    const supabase = getServiceRoleClient();

    // 본인 초기화
    const selfInit = await initializeCharacterGame(userId, null);
    if (selfInit.success) {
      result.totalMedicationEvents += selfInit.medicationEventsCreated;
      result.totalBabyFeedingEvents += selfInit.babyFeedingEventsCreated;
      result.totalLifecycleEvents += selfInit.lifecycleEventsCreated;
      result.processedMembers++;
    } else {
      result.errors++;
    }

    // 가족 구성원 조회
    const { data: familyMembers, error } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId);

    if (error) {
      console.error("❌ 가족 구성원 조회 실패:", error);
      console.groupEnd();
      throw error;
    }

    if (familyMembers && familyMembers.length > 0) {
      console.log(`📋 처리 대상 가족 구성원: ${familyMembers.length}명`);

      // 각 가족 구성원에 대해 초기화
      for (const member of familyMembers) {
        try {
          const memberInit = await initializeCharacterGame(userId, member.id);
          if (memberInit.success) {
            result.totalMedicationEvents += memberInit.medicationEventsCreated;
            result.totalBabyFeedingEvents += memberInit.babyFeedingEventsCreated;
            result.totalLifecycleEvents += memberInit.lifecycleEventsCreated;
            result.processedMembers++;
          } else {
            result.errors++;
          }
        } catch (error) {
          console.error(`❌ 가족 구성원 초기화 실패 (member: ${member.id}):`, error);
          result.errors++;
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ 모든 가족 구성원 게임 초기화 완료`);
    console.log(`처리된 구성원: ${result.processedMembers}명`);
    console.log(`약물 복용 이벤트: ${result.totalMedicationEvents}개`);
    console.log(`아기 분유 이벤트: ${result.totalBabyFeedingEvents}개`);
    console.log(`생애주기 이벤트: ${result.totalLifecycleEvents}개`);
    console.log(`오류: ${result.errors}개`);
    console.log(`소요 시간: ${duration}ms`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 모든 가족 구성원 게임 초기화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

