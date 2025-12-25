/**
 * @file actions/game/complete-quest.ts
 * @description 퀘스트 완료 처리 Server Action
 *
 * 퀘스트 완료 시 진행 상황 업데이트, 보상 지급, 다음 퀘스트 생성 등의 로직을 처리합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/health/gamification: addPoints
 * - @/lib/game/quest-system: getQuestById, isQuestCompleted
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { addPoints } from "@/lib/health/gamification";
import { getQuestById, isQuestCompleted } from "@/lib/game/quest-system";

interface CompleteQuestParams {
  questId: string;
  progress: number;
  questDate?: string; // YYYY-MM-DD 형식, 없으면 오늘
}

export async function completeQuest(
  params: CompleteQuestParams
): Promise<{ success: boolean; error?: string; completed?: boolean; rewardPoints?: number }> {
  try {
    console.group("[CompleteQuest] 퀘스트 완료 처리 시작");
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

    const quest = getQuestById(params.questId);
    if (!quest) {
      console.error("❌ 퀘스트를 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "퀘스트를 찾을 수 없습니다." };
    }

    const supabase = getServiceRoleClient();
    const questDate = params.questDate || new Date().toISOString().split("T")[0];

    // 기존 퀘스트 진행 상황 조회
    const { data: existingQuest, error: fetchError } = await supabase
      .from("daily_quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("quest_id", params.questId)
      .eq("quest_date", questDate)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러
      console.error("❌ 퀘스트 조회 실패:", fetchError);
      console.groupEnd();
      return { success: false, error: fetchError.message };
    }

    const newProgress = params.progress;
    const wasCompleted = existingQuest?.completed || false;
    const isNowCompleted = isQuestCompleted(newProgress, quest.target);

    // 퀘스트 진행 상황 업데이트 또는 생성
    const questData = {
      user_id: user.id,
      quest_id: params.questId,
      progress: newProgress,
      target: quest.target,
      completed: isNowCompleted,
      completed_at: isNowCompleted && !wasCompleted ? new Date().toISOString() : existingQuest?.completed_at || null,
      quest_date: questDate,
    };

    const { error: upsertError } = await supabase
      .from("daily_quests")
      .upsert(questData, {
        onConflict: "user_id,quest_id,quest_date",
      });

    if (upsertError) {
      console.error("❌ 퀘스트 업데이트 실패:", upsertError);
      console.groupEnd();
      return { success: false, error: upsertError.message };
    }

    // 새로 완료된 경우 보상 지급
    let rewardPoints = 0;
    if (isNowCompleted && !wasCompleted) {
      rewardPoints = quest.rewardPoints;
      await addPoints(user.id, rewardPoints, `퀘스트 완료: ${quest.title}`);
      console.log("✅ 보상 포인트 지급:", rewardPoints);
    }

    console.log("✅ 퀘스트 완료 처리 완료");
    console.log("완료 여부:", isNowCompleted);
    console.groupEnd();

    return {
      success: true,
      completed: isNowCompleted,
      rewardPoints: isNowCompleted && !wasCompleted ? rewardPoints : 0,
    };
  } catch (error) {
    console.error("❌ 퀘스트 완료 처리 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

