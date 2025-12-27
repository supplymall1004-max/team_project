/**
 * @file actions/game/auto-update-quests.ts
 * @description 건강 데이터 입력 시 퀘스트 자동 업데이트 Server Action
 *
 * 건강 데이터가 입력될 때마다 관련 퀘스트의 진행 상황을 자동으로 업데이트합니다.
 * 사용자가 수동으로 클릭할 필요 없이, 실제 건강 관리 활동이 자동으로 퀘스트에 반영됩니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/auto-quest-tracker: calculateQuestProgress, getQuestsByDataType
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/health/gamification: addPoints
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  calculateQuestProgress,
  getQuestsByDataType,
} from "@/lib/game/auto-quest-tracker";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { addPoints } from "@/lib/health/gamification";
import { getQuestById } from "@/lib/game/quest-system";

/**
 * 건강 데이터 입력 시 퀘스트 자동 업데이트
 */
export async function autoUpdateQuestsOnHealthData(
  userId: string,
  familyMemberId: string | null,
  dataType: "medication" | "activity" | "sleep" | "checkup" | "vaccination"
): Promise<{ success: boolean; updatedQuests: number; error?: string }> {
  try {
    console.group("[AutoUpdateQuests] 건강 데이터 입력 시 퀘스트 자동 업데이트");
    console.log("userId:", userId, "familyMemberId:", familyMemberId, "dataType:", dataType);

    const today = new Date().toISOString().split("T")[0];
    const relevantQuests = getQuestsByDataType(dataType);

    if (relevantQuests.length === 0) {
      console.log("ℹ️ 관련 퀘스트가 없습니다");
      console.groupEnd();
      return { success: true, updatedQuests: 0 };
    }

    const supabase = getServiceRoleClient();
    let updatedCount = 0;

    for (const quest of relevantQuests) {
      try {
        // 퀘스트 진행 상황 계산
        const progress = await calculateQuestProgress(
          quest.id,
          userId,
          familyMemberId,
          today
        );

        // 기존 퀘스트 진행 상황 조회
        const { data: existingQuest } = await supabase
          .from("daily_quests")
          .select("completed, completed_at")
          .eq("user_id", userId)
          .eq("quest_id", quest.id)
          .eq("quest_date", today)
          .maybeSingle();

        const wasCompleted = existingQuest?.completed || false;

        // 퀘스트 진행 상황 업데이트 또는 생성
        const questData = {
          user_id: userId,
          quest_id: quest.id,
          progress: progress.progress,
          target: progress.target,
          completed: progress.completed,
          completed_at:
            progress.completed && !wasCompleted
              ? new Date().toISOString()
              : existingQuest?.completed_at || null,
          quest_date: today,
        };

        const { error: upsertError } = await supabase
          .from("daily_quests")
          .upsert(questData, {
            onConflict: "user_id,quest_id,quest_date",
          });

        if (upsertError) {
          console.error(`❌ 퀘스트 ${quest.id} 업데이트 실패:`, upsertError);
          continue;
        }

        updatedCount++;

        // 새로 완료된 경우 보상 지급
        if (progress.completed && !wasCompleted) {
          await addPoints(userId, quest.rewardPoints, `퀘스트 완료: ${quest.title}`);
          console.log(`✅ 퀘스트 ${quest.id} 완료! 보상 ${quest.rewardPoints} 포인트 지급`);
        }
      } catch (error) {
        console.error(`❌ 퀘스트 ${quest.id} 처리 중 오류:`, error);
        // 개별 퀘스트 오류는 무시하고 계속 진행
      }
    }

    console.log(`✅ ${updatedCount}개 퀘스트 업데이트 완료`);
    console.groupEnd();

    return { success: true, updatedQuests: updatedCount };
  } catch (error) {
    console.error("❌ 퀘스트 자동 업데이트 실패:", error);
    console.groupEnd();
    return {
      success: false,
      updatedQuests: 0,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 특정 퀘스트의 진행 상황을 수동으로 새로고침
 * (주기적 업데이트용)
 */
export async function refreshQuestProgress(
  questId: string,
  familyMemberId: string | null
): Promise<{ success: boolean; progress?: number; completed?: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    const today = new Date().toISOString().split("T")[0];
    const progress = await calculateQuestProgress(questId, user.id, familyMemberId, today);

    // 데이터베이스 업데이트
    const supabase = getServiceRoleClient();
    const { data: existingQuest } = await supabase
      .from("daily_quests")
      .select("completed, completed_at")
      .eq("user_id", user.id)
      .eq("quest_id", questId)
      .eq("quest_date", today)
      .maybeSingle();

    const wasCompleted = existingQuest?.completed || false;
    const quest = getQuestById(questId);

    if (!quest) {
      return { success: false, error: "퀘스트를 찾을 수 없습니다." };
    }

    const questData = {
      user_id: user.id,
      quest_id: questId,
      progress: progress.progress,
      target: progress.target,
      completed: progress.completed,
      completed_at:
        progress.completed && !wasCompleted
          ? new Date().toISOString()
          : existingQuest?.completed_at || null,
      quest_date: today,
    };

    const { error: upsertError } = await supabase
      .from("daily_quests")
      .upsert(questData, {
        onConflict: "user_id,quest_id,quest_date",
      });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    // 새로 완료된 경우 보상 지급
    if (progress.completed && !wasCompleted) {
      await addPoints(user.id, quest.rewardPoints, `퀘스트 완료: ${quest.title}`);
    }

    return {
      success: true,
      progress: progress.progress,
      completed: progress.completed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 모든 일일 퀘스트의 진행 상황을 일괄 새로고침
 */
export async function refreshAllDailyQuests(
  familyMemberId: string | null
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, updatedCount: 0, error: "로그인이 필요합니다." };
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      return { success: false, updatedCount: 0, error: "사용자 정보를 찾을 수 없습니다." };
    }

    const { DAILY_QUESTS } = require("@/lib/game/quest-system");
    const today = new Date().toISOString().split("T")[0];
    let updatedCount = 0;

    for (const quest of DAILY_QUESTS) {
      try {
        const result = await refreshQuestProgress(quest.id, familyMemberId);
        if (result.success) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ 퀘스트 ${quest.id} 새로고침 실패:`, error);
        // 개별 퀘스트 오류는 무시하고 계속 진행
      }
    }

    return { success: true, updatedCount };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

