/**
 * @file actions/game/baby-feeding.ts
 * @description 아기 분유 스케줄 Server Actions
 *
 * 아기 분유 스케줄 관리 및 완료 처리를 위한 Server Actions입니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/baby-feeding-scheduler: 아기 분유 스케줄러
 * - @/types/game/character-game-events: 아기 분유 스케줄 타입
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  getBabyFeedingSchedule,
  upsertBabyFeedingSchedule,
  completeBabyFeeding,
  deactivateBabyFeedingSchedule,
} from "@/lib/game/baby-feeding-scheduler";
import type {
  BabyFeedingSchedule,
  CreateBabyFeedingScheduleParams,
} from "@/types/game/character-game-events";

/**
 * 아기 분유 스케줄 조회
 *
 * @param familyMemberId 가족 구성원 ID
 * @returns 분유 스케줄 또는 null
 */
export async function getBabyFeedingScheduleAction(
  familyMemberId: string
): Promise<BabyFeedingSchedule | null> {
  console.group("[ServerAction] getBabyFeedingScheduleAction");
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

    const schedule = await getBabyFeedingSchedule(user.id, familyMemberId);

    console.log("✅ 분유 스케줄 조회 완료");
    console.groupEnd();

    return schedule;
  } catch (error) {
    console.error("❌ 분유 스케줄 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 아기 분유 스케줄 생성/수정
 *
 * @param params 분유 스케줄 파라미터
 * @returns 생성/수정된 분유 스케줄
 */
export async function upsertBabyFeedingScheduleAction(
  params: Omit<CreateBabyFeedingScheduleParams, "user_id">
): Promise<BabyFeedingSchedule> {
  console.group("[ServerAction] upsertBabyFeedingScheduleAction");
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

    const scheduleParams: CreateBabyFeedingScheduleParams = {
      ...params,
      user_id: user.id,
    };

    const schedule = await upsertBabyFeedingSchedule(scheduleParams);

    console.log("✅ 분유 스케줄 생성/수정 완료:", schedule.id);
    console.groupEnd();

    return schedule;
  } catch (error) {
    console.error("❌ 분유 스케줄 생성/수정 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 분유 완료 처리
 *
 * @param familyMemberId 가족 구성원 ID
 * @returns 업데이트된 분유 스케줄
 */
export async function completeBabyFeedingAction(
  familyMemberId: string
): Promise<BabyFeedingSchedule> {
  console.group("[ServerAction] completeBabyFeedingAction");
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

    const schedule = await completeBabyFeeding(user.id, familyMemberId);

    console.log("✅ 분유 완료 처리 완료");
    console.log("다음 분유 시간:", schedule.next_feeding_time);
    console.groupEnd();

    return schedule;
  } catch (error) {
    console.error("❌ 분유 완료 처리 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 분유 스케줄 비활성화
 *
 * @param familyMemberId 가족 구성원 ID
 */
export async function deactivateBabyFeedingScheduleAction(
  familyMemberId: string
): Promise<void> {
  console.group("[ServerAction] deactivateBabyFeedingScheduleAction");
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

    await deactivateBabyFeedingSchedule(user.id, familyMemberId);

    console.log("✅ 분유 스케줄 비활성화 완료");
    console.groupEnd();
  } catch (error) {
    console.error("❌ 분유 스케줄 비활성화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

