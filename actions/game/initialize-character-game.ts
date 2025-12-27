/**
 * @file actions/game/initialize-character-game.ts
 * @description 캐릭터 게임 초기화 Server Action
 *
 * 사용자가 처음 게임을 시작할 때 호출하는 Server Action입니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/character-game-initializer: 게임 초기화 로직
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  initializeCharacterGame,
  initializeAllFamilyMembersGame,
} from "@/lib/game/character-game-initializer";

/**
 * 캐릭터 게임 초기화
 *
 * @param familyMemberId 가족 구성원 ID (선택사항, null이면 본인)
 * @returns 초기화 결과
 */
export async function initializeGameAction(
  familyMemberId?: string | null
): Promise<{
  medicationEventsCreated: number;
  babyFeedingEventsCreated: number;
  lifecycleEventsCreated: number;
  success: boolean;
  error?: string;
}> {
  console.group("[ServerAction] initializeGameAction");
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

    const result = await initializeCharacterGame(user.id, familyMemberId || null);

    console.log("✅ 게임 초기화 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 게임 초기화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 모든 가족 구성원에 대해 게임 초기화
 *
 * @returns 초기화 결과
 */
export async function initializeAllFamilyMembersGameAction(): Promise<{
  processedMembers: number;
  totalMedicationEvents: number;
  totalBabyFeedingEvents: number;
  totalLifecycleEvents: number;
  errors: number;
}> {
  console.group("[ServerAction] initializeAllFamilyMembersGameAction");

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const result = await initializeAllFamilyMembersGame(user.id);

    console.log("✅ 모든 가족 구성원 게임 초기화 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 모든 가족 구성원 게임 초기화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

