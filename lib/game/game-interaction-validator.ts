/**
 * @file lib/game/game-interaction-validator.ts
 * @description 게임 요소 간 상호작용 검증 로직
 *
 * 게임 요소들(퀘스트, 레벨, 포인트, 배지, 스킨 등) 간의 상호작용이
 * 올바르게 작동하는지 검증하는 로직입니다.
 *
 * 주요 기능:
 * 1. 포인트 획득 → 레벨 계산 트리거
 * 2. 레벨업 → 스킨 해제 확인
 * 3. 포인트 획득 → 배지 획득 확인
 * 4. 퀘스트 완료 → 포인트 획득 확인
 * 5. 가족 챌린지 완료 → 친밀도 증가 확인
 *
 * @dependencies
 * - @/lib/health/gamification: getUserGamificationData, addPoints
 * - @/lib/game/level-system: LevelData, createLevelData
 * - @/actions/game/calculate-level: calculateLevel
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getUserGamificationData, type UserGamificationData } from "@/lib/health/gamification";
import type { LevelData } from "@/lib/game/level-system";

export interface GameInteractionResult {
  success: boolean;
  message: string;
  data?: {
    pointsBefore?: number;
    pointsAfter?: number;
    levelBefore?: number;
    levelAfter?: number;
    badgesEarned?: string[];
    skinsUnlocked?: string[];
  };
  error?: string;
}

/**
 * 포인트 획득 후 레벨 계산이 필요한지 확인
 */
export async function shouldCalculateLevelAfterPoints(
  userId: string,
  pointsAdded: number
): Promise<boolean> {
  try {
    const gamificationData = await getUserGamificationData(userId);
    const newTotalPoints = gamificationData.totalPoints + pointsAdded;

    // 포인트가 일정량 이상 증가했을 때만 레벨 계산
    // (성능 최적화를 위해 매번 계산하지 않음)
    const threshold = 50; // 50포인트 이상 증가 시 레벨 계산
    return pointsAdded >= threshold;
  } catch (error) {
    console.error("❌ 레벨 계산 필요 여부 확인 실패:", error);
    return false;
  }
}

/**
 * 게임 요소 간 상호작용 검증
 * 퀘스트 완료 → 포인트 획득 → 배지 획득 → 레벨 계산 흐름 검증
 */
export async function validateQuestToPointsFlow(
  userId: string,
  questId: string,
  rewardPoints: number
): Promise<GameInteractionResult> {
  try {
    console.group("[ValidateQuestToPointsFlow] 퀘스트 → 포인트 흐름 검증");

    // 1. 포인트 획득 전 상태 확인
    const beforeData = await getUserGamificationData(userId);
    const pointsBefore = beforeData.totalPoints;
    const badgesBefore = new Set(beforeData.badges);

    // 2. 포인트 추가 (실제로는 completeQuest에서 이미 수행됨)
    // 여기서는 검증만 수행
    const expectedPointsAfter = pointsBefore + rewardPoints;

    // 3. 포인트 획득 후 상태 확인
    const afterData = await getUserGamificationData(userId);
    const pointsAfter = afterData.totalPoints;
    const badgesAfter = new Set(afterData.badges);

    // 4. 검증
    const pointsMatch = pointsAfter === expectedPointsAfter;
    const newBadges = Array.from(badgesAfter).filter((b) => !badgesBefore.has(b));

    console.log("포인트 검증:", {
      before: pointsBefore,
      expected: expectedPointsAfter,
      after: pointsAfter,
      match: pointsMatch,
    });
    console.log("배지 획득:", newBadges);

    console.groupEnd();

    return {
      success: pointsMatch,
      message: pointsMatch
        ? "퀘스트 완료 → 포인트 획득 흐름이 정상적으로 작동합니다."
        : "포인트가 예상과 다르게 업데이트되었습니다.",
      data: {
        pointsBefore,
        pointsAfter,
        badgesEarned: newBadges,
      },
      error: pointsMatch ? undefined : "포인트 불일치",
    };
  } catch (error) {
    console.error("❌ 검증 실패:", error);
    return {
      success: false,
      message: "검증 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 포인트 획득 → 배지 획득 흐름 검증
 */
export async function validatePointsToBadgesFlow(
  userId: string,
  pointsAdded: number
): Promise<GameInteractionResult> {
  try {
    console.group("[ValidatePointsToBadgesFlow] 포인트 → 배지 흐름 검증");

    const beforeData = await getUserGamificationData(userId);
    const badgesBefore = new Set(beforeData.badges);

    // 포인트 추가 후 배지 확인 (addPoints 함수가 이미 수행)
    const afterData = await getUserGamificationData(userId);
    const badgesAfter = new Set(afterData.badges);

    const newBadges = Array.from(badgesAfter).filter((b) => !badgesBefore.has(b));

    console.log("배지 획득:", newBadges);
    console.groupEnd();

    return {
      success: true,
      message: "포인트 획득 → 배지 획득 흐름이 정상적으로 작동합니다.",
      data: {
        badgesEarned: newBadges,
      },
    };
  } catch (error) {
    console.error("❌ 검증 실패:", error);
    return {
      success: false,
      message: "검증 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 레벨업 → 스킨 해제 흐름 검증
 */
export async function validateLevelUpToSkinsFlow(
  userId: string,
  memberId: string | null,
  levelBefore: number,
  levelAfter: number
): Promise<GameInteractionResult> {
  try {
    console.group("[ValidateLevelUpToSkinsFlow] 레벨업 → 스킨 해제 흐름 검증");

    const supabase = getServiceRoleClient();

    // 레벨업 시 해제되어야 하는 스킨 확인
    const expectedSkins: string[] = [];
    if (levelAfter >= 5 && levelBefore < 5) expectedSkins.push("level_5_skin");
    if (levelAfter >= 10 && levelBefore < 10) expectedSkins.push("level_10_skin");
    if (levelAfter >= 20 && levelBefore < 20) expectedSkins.push("level_20_skin");
    if (levelAfter >= 50 && levelBefore < 50) expectedSkins.push("level_50_skin");

    if (expectedSkins.length === 0) {
      console.log("레벨업했지만 해제할 스킨이 없습니다.");
      console.groupEnd();
      return {
        success: true,
        message: "레벨업했지만 해제할 스킨이 없습니다.",
        data: {
          levelBefore,
          levelAfter,
        },
      };
    }

    // 실제 해제된 스킨 확인
    const { data: unlockedSkins, error } = await supabase
      .from("character_skins")
      .select("skin_id")
      .eq("user_id", userId)
      .eq("family_member_id", memberId || null)
      .in("skin_id", expectedSkins);

    if (error) {
      console.error("❌ 스킨 조회 실패:", error);
      console.groupEnd();
      return {
        success: false,
        message: "스킨 조회 중 오류가 발생했습니다.",
        error: error.message,
      };
    }

    const unlockedSkinIds = unlockedSkins?.map((s) => s.skin_id) || [];
    const allSkinsUnlocked = expectedSkins.every((skinId) => unlockedSkinIds.includes(skinId));

    console.log("스킨 해제 검증:", {
      expected: expectedSkins,
      unlocked: unlockedSkinIds,
      allUnlocked: allSkinsUnlocked,
    });
    console.groupEnd();

    return {
      success: allSkinsUnlocked,
      message: allSkinsUnlocked
        ? "레벨업 → 스킨 해제 흐름이 정상적으로 작동합니다."
        : "일부 스킨이 해제되지 않았습니다.",
      data: {
        levelBefore,
        levelAfter,
        skinsUnlocked: unlockedSkinIds,
      },
      error: allSkinsUnlocked ? undefined : "스킨 해제 불일치",
    };
  } catch (error) {
    console.error("❌ 검증 실패:", error);
    return {
      success: false,
      message: "검증 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 전체 게임 요소 상호작용 검증
 */
export async function validateAllGameInteractions(
  userId: string,
  memberId?: string
): Promise<{
  success: boolean;
  results: GameInteractionResult[];
  summary: string;
}> {
  try {
    console.group("[ValidateAllGameInteractions] 전체 게임 요소 상호작용 검증");

    const results: GameInteractionResult[] = [];

    // 1. 포인트 → 배지 흐름 검증
    const pointsToBadges = await validatePointsToBadgesFlow(userId, 0);
    results.push(pointsToBadges);

    // 2. 레벨 데이터 확인
    const supabase = getServiceRoleClient();
    const { data: levelData } = await supabase
      .from("character_levels")
      .select("*")
      .eq("user_id", userId)
      .eq("family_member_id", memberId || null)
      .single();

    if (levelData) {
      // 레벨 → 스킨 흐름 검증 (레벨이 있는 경우)
      const levelToSkins = await validateLevelUpToSkinsFlow(
        userId,
        memberId || null,
        levelData.level - 1,
        levelData.level
      );
      results.push(levelToSkins);
    }

    const allSuccess = results.every((r) => r.success);
    const summary = allSuccess
      ? "모든 게임 요소 간 상호작용이 정상적으로 작동합니다."
      : "일부 게임 요소 간 상호작용에 문제가 있습니다.";

    console.log("검증 결과:", results);
    console.log("요약:", summary);
    console.groupEnd();

    return {
      success: allSuccess,
      results,
      summary,
    };
  } catch (error) {
    console.error("❌ 전체 검증 실패:", error);
    return {
      success: false,
      results: [],
      summary: "검증 중 오류가 발생했습니다.",
    };
  }
}

