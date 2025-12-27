/**
 * @file actions/game/quests.ts
 * @description 퀘스트 시스템 Server Actions
 */

"use server";

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

/**
 * 사용자의 활성 퀘스트 조회
 */
export async function getActiveQuests(familyMemberId?: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    // 활성 퀘스트 조회
    let query = supabase
      .from("user_quests")
      .select(`
        *,
        quest:quests(*)
      `)
      .eq("user_id", user.id)
      .is("completed_at", null);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }

    const { data: userQuests, error } = await query;

    if (error) {
      console.error("퀘스트 조회 오류:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      quests: userQuests || [],
    };
  } catch (error) {
    console.error("퀘스트 조회 실패:", error);
    return { success: false, error: "퀘스트 조회에 실패했습니다." };
  }
}

/**
 * 퀘스트 진행도 업데이트
 */
export async function updateQuestProgress(
  questId: string,
  progress: number,
  familyMemberId?: string | null
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    // 퀘스트 정보 조회
    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("*")
      .eq("id", questId)
      .single();

    if (questError || !quest) {
      return { success: false, error: "퀘스트를 찾을 수 없습니다." };
    }

    // 사용자 퀘스트 조회 또는 생성
    let query = supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("quest_id", questId);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data: userQuest, error: fetchError } = await query.single();

    let updatedQuest;
    if (userQuest) {
      // 기존 퀘스트 업데이트
      const newProgress = Math.min(progress, quest.target_count);
      const isCompleted = newProgress >= quest.target_count;

      const { data, error: updateError } = await supabase
        .from("user_quests")
        .update({
          progress: newProgress,
          completed_at: isCompleted && !userQuest.completed_at ? new Date().toISOString() : userQuest.completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userQuest.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      updatedQuest = data;

      // 완료 시 보상 기록
      if (isCompleted && !userQuest.completed_at) {
        await supabase.from("quest_completions").insert({
          user_quest_id: userQuest.id,
          points_earned: quest.reward_points,
          experience_earned: quest.reward_experience,
        });
      }
    } else {
      // 새 퀘스트 생성
      const { data, error: insertError } = await supabase
        .from("user_quests")
        .insert({
          user_id: user.id,
          family_member_id: familyMemberId || null,
          quest_id: questId,
          progress: Math.min(progress, quest.target_count),
          completed_at: progress >= quest.target_count ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      updatedQuest = data;

      // 완료 시 보상 기록
      if (progress >= quest.target_count) {
        await supabase.from("quest_completions").insert({
          user_quest_id: data.id,
          points_earned: quest.reward_points,
          experience_earned: quest.reward_experience,
        });
      }
    }

    return {
      success: true,
      quest: updatedQuest,
      isCompleted: updatedQuest.progress >= quest.target_count,
      rewards: {
        points: quest.reward_points,
        experience: quest.reward_experience,
      },
    };
  } catch (error) {
    console.error("퀘스트 진행도 업데이트 실패:", error);
    return { success: false, error: "퀘스트 진행도 업데이트에 실패했습니다." };
  }
}

/**
 * 퀘스트 보상 수령
 */
export async function claimQuestReward(userQuestId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    // 사용자 퀘스트 조회
    const { data: userQuest, error: questError } = await supabase
      .from("user_quests")
      .select(`
        *,
        quest:quests(*)
      `)
      .eq("id", userQuestId)
      .eq("user_id", user.id)
      .single();

    if (questError || !userQuest) {
      return { success: false, error: "퀘스트를 찾을 수 없습니다." };
    }

    if (!userQuest.completed_at) {
      return { success: false, error: "완료되지 않은 퀘스트입니다." };
    }

    if (userQuest.claimed_at) {
      return { success: false, error: "이미 보상을 수령했습니다." };
    }

    // 보상 수령 처리
    const { error: updateError } = await supabase
      .from("user_quests")
      .update({
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userQuestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      rewards: {
        points: (userQuest.quest as any).reward_points,
        experience: (userQuest.quest as any).reward_experience,
      },
    };
  } catch (error) {
    console.error("보상 수령 실패:", error);
    return { success: false, error: "보상 수령에 실패했습니다." };
  }
}

/**
 * 일일 퀘스트 초기화 (매일 자정에 실행)
 */
export async function initializeDailyQuests() {
  try {
    const supabase = await createClerkSupabaseClient();

    // 모든 사용자 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    // 일일 퀘스트 조회
    const { data: dailyQuests, error: questsError } = await supabase
      .from("quests")
      .select("*")
      .eq("quest_type", "daily")
      .eq("is_active", true);

    if (questsError) {
      return { success: false, error: questsError.message };
    }

    // 각 사용자에게 일일 퀘스트 할당
    const userQuests = [];
    for (const user of users || []) {
      for (const quest of dailyQuests || []) {
        userQuests.push({
          user_id: user.id,
          quest_id: quest.id,
          progress: 0,
        });
      }
    }

    if (userQuests.length > 0) {
      const { error: insertError } = await supabase
        .from("user_quests")
        .insert(userQuests);

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    return {
      success: true,
      initialized: userQuests.length,
    };
  } catch (error) {
    console.error("일일 퀘스트 초기화 실패:", error);
    return { success: false, error: "일일 퀘스트 초기화에 실패했습니다." };
  }
}

