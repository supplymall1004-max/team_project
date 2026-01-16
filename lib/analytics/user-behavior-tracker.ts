/**
 * @file lib/analytics/user-behavior-tracker.ts
 * @description 사용자 행동 추적 Server Actions
 * 
 * 주요 기능:
 * 1. 레시피 조회 추적
 * 2. 검색 추적
 * 3. 좋아요/저장 추적
 * 4. 개인화 추천에 활용
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export type ActionType = "view" | "like" | "save" | "search" | "cook";
export type TargetType = "recipe" | "post" | "diet" | "health_tip";

interface TrackBehaviorInput {
  actionType: ActionType;
  targetType: TargetType;
  targetId?: string;
  metadata?: Record<string, any>;
}

/**
 * 사용자 행동 기록 (범용)
 */
export async function trackBehavior(input: TrackBehaviorInput) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    const supabase = await createClerkSupabaseClient();

    // 사용자 ID 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) return { success: false };

    // 행동 로그 저장
    const { error } = await supabase.from("user_behavior_logs").insert({
      user_id: userData.id,
      action_type: input.actionType,
      target_type: input.targetType,
      target_id: input.targetId,
      metadata: input.metadata || {},
    });

    if (error) {
      console.error("[BehaviorTracker] 로그 저장 실패:", error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("[BehaviorTracker] 오류:", error);
    return { success: false };
  }
}

/**
 * 레시피 조회 추적
 */
export async function trackRecipeView(recipeId: string, metadata?: Record<string, any>) {
  return trackBehavior({
    actionType: "view",
    targetType: "recipe",
    targetId: recipeId,
    metadata,
  });
}

/**
 * 검색어 추적
 */
export async function trackSearch(query: string, resultCount: number) {
  return trackBehavior({
    actionType: "search",
    targetType: "recipe",
    metadata: { query, resultCount },
  });
}

/**
 * 좋아요 추적
 */
export async function trackLike(targetType: TargetType, targetId: string) {
  return trackBehavior({
    actionType: "like",
    targetType,
    targetId,
  });
}

/**
 * 저장 추적
 */
export async function trackSave(targetType: TargetType, targetId: string) {
  return trackBehavior({
    actionType: "save",
    targetType,
    targetId,
  });
}

