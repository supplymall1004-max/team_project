/**
 * @file actions/game/update-family-intimacy.ts
 * @description 가족 친밀도 업데이트 Server Action
 *
 * 가족 구성원과의 상호작용에 따라 친밀도를 업데이트합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/game/family-interaction: updateIntimacyScore, calculateIntimacyLevel
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import {
  updateIntimacyScore,
  calculateIntimacyLevel,
  type FamilyIntimacy,
} from "@/lib/game/family-interaction";

interface UpdateFamilyIntimacyParams {
  memberId: string;
  interactionType: "health_help" | "challenge_participation" | "daily_interaction";
}

export async function updateFamilyIntimacy(
  params: UpdateFamilyIntimacyParams
): Promise<{
  success: boolean;
  error?: string;
  intimacy?: FamilyIntimacy;
}> {
  try {
    console.group("[UpdateFamilyIntimacy] 가족 친밀도 업데이트 시작");
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

    // 기존 친밀도 데이터 조회
    const { data: existingIntimacy, error: fetchError } = await supabase
      .from("family_intimacy")
      .select("*")
      .eq("user_id", user.id)
      .eq("family_member_id", params.memberId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러
      console.error("❌ 친밀도 데이터 조회 실패:", fetchError);
      console.groupEnd();
      return { success: false, error: fetchError.message };
    }

    const currentScore = existingIntimacy?.intimacy_score || 0;
    const updatedIntimacy = updateIntimacyScore(currentScore, params.interactionType);

    // 친밀도 데이터 업데이트 또는 생성
    const intimacyData = {
      user_id: user.id,
      family_member_id: params.memberId,
      intimacy_score: updatedIntimacy.intimacyScore,
      last_interaction_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("family_intimacy")
      .upsert(intimacyData, {
        onConflict: "user_id,family_member_id",
      });

    if (upsertError) {
      console.error("❌ 친밀도 업데이트 실패:", upsertError);
      console.groupEnd();
      return { success: false, error: upsertError.message };
    }

    const result: FamilyIntimacy = {
      familyMemberId: params.memberId,
      intimacyScore: updatedIntimacy.intimacyScore,
      intimacyLevel: updatedIntimacy.intimacyLevel,
      lastInteractionAt: updatedIntimacy.lastInteractionAt,
    };

    console.log("✅ 가족 친밀도 업데이트 완료");
    console.log("친밀도 점수:", result.intimacyScore);
    console.log("친밀도 레벨:", result.intimacyLevel);
    console.groupEnd();

    return {
      success: true,
      intimacy: result,
    };
  } catch (error) {
    console.error("❌ 가족 친밀도 업데이트 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

