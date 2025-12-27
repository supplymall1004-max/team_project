/**
 * @file actions/game/character-game-events.ts
 * @description 캐릭터 게임 이벤트 Server Actions
 *
 * 게임 이벤트 조회, 생성, 완료 처리를 위한 Server Actions입니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/character-game-event-manager: 게임 이벤트 매니저
 * - @/lib/game/character-game-event-scheduler: 게임 이벤트 스케줄러
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  getUserActiveEvents,
  completeGameEvent,
} from "@/lib/game/character-game-event-manager";
import {
  scheduleMedicationEvents,
  scheduleBabyFeedingEvents,
  createCharacterGameEvent,
} from "@/lib/game/character-game-event-scheduler";
import { generateLifecycleGameEvents } from "@/lib/game/lifecycle-event-generator";
import type {
  CharacterGameEvent,
  CreateCharacterGameEventParams,
  CompleteCharacterGameEventParams,
  CharacterGameEventResponse,
} from "@/types/game/character-game-events";

/**
 * 활성 게임 이벤트 조회
 *
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @returns 활성 게임 이벤트 목록
 */
export async function getActiveGameEvents(
  familyMemberId?: string | null
): Promise<CharacterGameEvent[]> {
  console.group("[ServerAction] getActiveGameEvents");
  console.log("familyMemberId:", familyMemberId);

  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ 로그인이 필요합니다");
      console.groupEnd();
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      console.log("❌ 사용자 정보를 찾을 수 없습니다");
      console.groupEnd();
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const events = await getUserActiveEvents(user.id, familyMemberId || null);

    console.log(`✅ 활성 이벤트 ${events.length}개 조회 완료`);
    console.groupEnd();

    return events;
  } catch (error) {
    console.error("❌ 활성 게임 이벤트 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 약물 복용 이벤트 스케줄링
 *
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @returns 생성된 이벤트 개수
 */
export async function scheduleMedicationGameEvents(
  familyMemberId?: string | null
): Promise<number> {
  console.group("[ServerAction] scheduleMedicationGameEvents");
  console.log("familyMemberId:", familyMemberId);

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const count = await scheduleMedicationEvents(user.id, familyMemberId || null);

    console.log(`✅ 약물 복용 이벤트 ${count}개 생성 완료`);
    console.groupEnd();

    return count;
  } catch (error) {
    console.error("❌ 약물 복용 이벤트 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 생애주기 이벤트 스케줄링
 *
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @returns 생성된 이벤트 개수
 */
export async function scheduleLifecycleGameEvents(
  familyMemberId?: string | null
): Promise<number> {
  console.group("[ServerAction] scheduleLifecycleGameEvents");
  console.log("familyMemberId:", familyMemberId);

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const count = await generateLifecycleGameEvents(user.id, familyMemberId || null);

    console.log(`✅ 생애주기 이벤트 ${count}개 생성 완료`);
    console.groupEnd();

    return count;
  } catch (error) {
    console.error("❌ 생애주기 이벤트 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 아기 분유 이벤트 스케줄링
 *
 * @param familyMemberId 가족 구성원 ID (필수)
 * @returns 생성된 이벤트 개수
 */
export async function scheduleBabyFeedingGameEvents(
  familyMemberId: string
): Promise<number> {
  console.group("[ServerAction] scheduleBabyFeedingGameEvents");
  console.log("familyMemberId:", familyMemberId);

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const count = await scheduleBabyFeedingEvents(user.id, familyMemberId);

    console.log(`✅ 아기 분유 이벤트 ${count}개 생성 완료`);
    console.groupEnd();

    return count;
  } catch (error) {
    console.error("❌ 아기 분유 이벤트 스케줄링 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 게임 이벤트 생성
 *
 * @param params 이벤트 생성 파라미터
 * @returns 생성된 게임 이벤트
 */
export async function createGameEvent(
  params: Omit<CreateCharacterGameEventParams, "user_id">
): Promise<CharacterGameEvent> {
  console.group("[ServerAction] createGameEvent");
  console.log("params:", params);

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const eventParams: CreateCharacterGameEventParams = {
      ...params,
      user_id: user.id,
    };

    const event = await createCharacterGameEvent(eventParams);

    console.log("✅ 게임 이벤트 생성 완료:", event.id);
    console.groupEnd();

    return event;
  } catch (error) {
    console.error("❌ 게임 이벤트 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 게임 이벤트 완료 처리
 *
 * @param eventId 이벤트 ID
 * @param pointsEarned 획득 포인트 (선택사항)
 * @param experienceEarned 획득 경험치 (선택사항)
 * @returns 이벤트 완료 처리 결과
 */
export async function completeGameEventAction(
  eventId: string,
  pointsEarned?: number,
  experienceEarned?: number
): Promise<CharacterGameEventResponse> {
  console.group("[ServerAction] completeGameEventAction");
  console.log("eventId:", eventId);
  console.log("pointsEarned:", pointsEarned);
  console.log("experienceEarned:", experienceEarned);

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const completeParams: CompleteCharacterGameEventParams = {
      event_id: eventId,
      user_id: user.id,
      points_earned: pointsEarned,
      experience_earned: experienceEarned,
    };

    const result = await completeGameEvent(completeParams);

    if (!result.success) {
      console.log("❌ 이벤트 완료 처리 실패:", result.error);
      console.groupEnd();
      throw new Error(result.error || "이벤트 완료 처리에 실패했습니다.");
    }

    console.log("✅ 이벤트 완료 처리 완료");
    console.log("포인트:", result.points_earned);
    console.log("경험치:", result.experience_earned);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 이벤트 완료 처리 실패:", error);
    console.groupEnd();
    throw error;
  }
}

