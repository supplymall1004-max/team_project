/**
 * @file actions/game/calculate-level.ts
 * @description 레벨 계산 및 업데이트 Server Action
 *
 * 건강 점수 기반으로 경험치를 계산하고 레벨업 여부를 확인하여 레벨을 업데이트합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/level-system: createLevelData, checkLevelUp, calculateLevelUpReward, convertHealthScoreToExperience
 * - @/lib/health/gamification: addPoints
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  createLevelData,
  checkLevelUp,
  calculateLevelUpReward,
  convertHealthScoreToExperience,
  type LevelData,
} from "@/lib/game/level-system";
import { addPoints } from "@/lib/health/gamification";

interface CalculateLevelParams {
  memberId?: string;
  healthScore: number; // 현재 건강 점수
}

export async function calculateLevel(
  params: CalculateLevelParams
): Promise<{
  success: boolean;
  error?: string;
  levelData?: LevelData;
  leveledUp?: boolean;
  rewardPoints?: number;
  skinId?: string;
}> {
  try {
    console.group("[CalculateLevel] 레벨 계산 시작");
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

    // 기존 레벨 데이터 조회
    const { data: existingLevel, error: fetchError } = await supabase
      .from("character_levels")
      .select("*")
      .eq("user_id", user.id)
      .eq("family_member_id", params.memberId || null)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러
      console.error("❌ 레벨 데이터 조회 실패:", fetchError);
      console.groupEnd();
      return { success: false, error: fetchError.message };
    }

    const oldTotalExperience = existingLevel?.experience || 0;
    const additionalExperience = convertHealthScoreToExperience(params.healthScore);
    const newLevelData = createLevelData(oldTotalExperience, additionalExperience);

    // 레벨업 여부 확인
    const leveledUp = checkLevelUp(oldTotalExperience, newLevelData.totalExperience);

    // 레벨 데이터 업데이트 또는 생성
    const levelData = {
      user_id: user.id,
      family_member_id: params.memberId || null,
      level: newLevelData.level,
      experience: newLevelData.experience,
      experience_to_next_level: newLevelData.experienceToNextLevel,
      last_level_up_at: leveledUp ? new Date().toISOString() : existingLevel?.last_level_up_at || null,
    };

    const { error: upsertError } = await supabase
      .from("character_levels")
      .upsert(levelData, {
        onConflict: "user_id,family_member_id",
      });

    if (upsertError) {
      console.error("❌ 레벨 업데이트 실패:", upsertError);
      console.groupEnd();
      return { success: false, error: upsertError.message };
    }

    // 레벨업 보상 지급
    let rewardPoints = 0;
    let skinId: string | undefined;
    if (leveledUp) {
      const reward = calculateLevelUpReward(newLevelData.level);
      rewardPoints = reward.points;
      skinId = reward.skinId;

      await addPoints(user.id, rewardPoints, `레벨업 달성: 레벨 ${newLevelData.level}`);

      // 스킨 보상이 있으면 인벤토리에 추가
      if (skinId && params.memberId) {
        await supabase.from("character_skins").upsert({
          user_id: user.id,
          family_member_id: params.memberId,
          skin_id: skinId,
          is_active: false,
        }, {
          onConflict: "user_id,family_member_id,skin_id",
        });
      }

      console.log("✅ 레벨업 보상 지급:", { rewardPoints, skinId });
    }

    console.log("✅ 레벨 계산 완료");
    console.log("레벨:", newLevelData.level);
    console.log("경험치:", newLevelData.experience);
    console.log("레벨업:", leveledUp);
    console.groupEnd();

    return {
      success: true,
      levelData: newLevelData,
      leveledUp,
      rewardPoints: leveledUp ? rewardPoints : 0,
      skinId: leveledUp ? skinId : undefined,
    };
  } catch (error) {
    console.error("❌ 레벨 계산 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

