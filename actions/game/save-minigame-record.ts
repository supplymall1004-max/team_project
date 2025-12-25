/**
 * @file actions/game/save-minigame-record.ts
 * @description 미니게임 기록 저장 Server Action
 *
 * 미니게임 플레이 결과를 저장하고 점수에 따른 보상을 지급합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/health/gamification: addPoints
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { addPoints } from "@/lib/health/gamification";

interface SaveMinigameRecordParams {
  memberId?: string;
  gameType: "medication_memory" | "exercise_timing" | "nutrition_puzzle";
  score: number;
  completed: boolean;
}

export async function saveMinigameRecord(
  params: SaveMinigameRecordParams
): Promise<{ success: boolean; error?: string; recordId?: string }> {
  try {
    console.group("[SaveMinigameRecord] 미니게임 기록 저장 시작");
    console.log("params", params);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 로그인이 필요합니다");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 정보를 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    const supabase = getServiceRoleClient();

    // 보상 포인트 계산 (점수 기반)
    const rewardPoints = Math.floor(params.score / 10);

    // 미니게임 기록 저장
    const { data: record, error: recordError } = await supabase
      .from("minigame_records")
      .insert({
        user_id: user.id,
        family_member_id: params.memberId || null,
        game_type: params.gameType,
        score: params.score,
        completed: params.completed,
        reward_points: rewardPoints,
        played_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (recordError) {
      console.error("❌ 미니게임 기록 저장 실패:", recordError);
      console.groupEnd();
      return { success: false, error: recordError.message };
    }

    // 보상 포인트 지급
    if (rewardPoints > 0) {
      await addPoints(user.id, rewardPoints, `미니게임 완료: ${params.gameType}`);
    }

    console.log("✅ 미니게임 기록 저장 완료:", record.id);
    console.log("보상 포인트:", rewardPoints);
    console.groupEnd();

    return { success: true, recordId: record.id };
  } catch (error) {
    console.error("❌ 미니게임 기록 저장 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

