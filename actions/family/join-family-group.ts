/**
 * @file actions/family/join-family-group.ts
 * @description 가족 그룹 가입 Server Action
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

export interface JoinFamilyGroupResult {
  success: boolean;
  familyGroupId?: string;
  error?: string;
}

export async function joinFamilyGroup(
  inviteCode: string
): Promise<JoinFamilyGroupResult> {
  try {
    // 사용자 인증 확인
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: "인증이 필요합니다",
      };
    }

    const supabase = await createClerkSupabaseClient();
    
    // 사용자 ID 조회 (Clerk ID를 Supabase user_id로 변환)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다",
      };
    }

    const userId = userData.id;
    const serviceSupabase = getServiceRoleClient();

    // 초대 코드로 가족 그룹 조회
    const { data: familyGroup, error: findError } = await serviceSupabase
      .from("family_groups")
      .select("*")
      .eq("invite_code", inviteCode)
      .single();

    if (findError || !familyGroup) {
      return {
        success: false,
        error: "유효하지 않은 초대 코드입니다",
      };
    }

    // 이미 멤버인지 확인
    const { data: existingMember } = await serviceSupabase
      .from("family_group_members")
      .select("*")
      .eq("family_group_id", familyGroup.id)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      return {
        success: true,
        familyGroupId: familyGroup.id,
      };
    }

    // 멤버로 추가
    const { error: joinError } = await serviceSupabase
      .from("family_group_members")
      .insert({
        family_group_id: familyGroup.id,
        user_id: userId,
        role: "member",
      });

    if (joinError) {
      console.error("[JoinFamilyGroup] 가입 실패:", joinError);
      return {
        success: false,
        error: joinError.message,
      };
    }

    return {
      success: true,
      familyGroupId: familyGroup.id,
    };
  } catch (error) {
    console.error("[JoinFamilyGroup] 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

