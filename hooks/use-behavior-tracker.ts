/**
 * @file hooks/use-behavior-tracker.ts
 * @description 클라이언트 사이드 행동 추적 Hook
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { trackBehavior } from "@/lib/analytics/user-behavior-tracker";
import type { ActionType, TargetType } from "@/lib/analytics/user-behavior-tracker";

/**
 * 클라이언트에서 사용자 행동 추적
 */
export function useBehaviorTracker() {
  const trackedRef = useRef<Set<string>>(new Set());

  const track = useCallback(
    async (actionType: ActionType, targetType: TargetType, targetId?: string) => {
      // 중복 방지 (같은 세션에서 동일 행동은 한 번만)
      const key = `${actionType}-${targetType}-${targetId}`;
      if (trackedRef.current.has(key)) return;

      trackedRef.current.add(key);
      await trackBehavior({ actionType, targetType, targetId });
    },
    []
  );

  return { track };
}

/**
 * 레시피 페이지 자동 조회 추적
 * 3초 이상 머물면 "진짜 조회"로 간주
 */
export function useTrackRecipeView(recipeId: string) {
  const { track } = useBehaviorTracker();

  useEffect(() => {
    const timer = setTimeout(() => {
      track("view", "recipe", recipeId);
    }, 3000);

    return () => clearTimeout(timer);
  }, [recipeId, track]);
}

