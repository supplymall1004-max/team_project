/**
 * @file actions/family/create-family-group.ts
 * @description 가족 그룹 생성 Server Action
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

export interface CreateFamilyGroupResult {
  success: boolean;
  familyGroupId?: string;
  inviteCode?: string;
  error?: string;
}

export async function createFamilyGroup(
  name?: string
): Promise<CreateFamilyGroupResult> {
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

    // 초대 코드 생성 (데이터베이스 함수 사용)
    const { data: codeData, error: codeError } = await serviceSupabase.rpc(
      "generate_family_invite_code"
    );

    if (codeError || !codeData) {
      // 폴백: 클라이언트에서 코드 생성
      const inviteCode = `FAM-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;

      // 가족 그룹 생성
      const { data: familyGroup, error: createError } = await serviceSupabase
        .from("family_groups")
        .insert({
          invite_code: inviteCode,
          admin_user_id: userId,
          name: name || null,
        })
        .select()
        .single();

      if (createError) {
        console.error("[CreateFamilyGroup] 생성 실패:", createError);
        return {
          success: false,
          error: createError.message,
        };
      }

      // 관리자를 멤버로 추가
      await serviceSupabase.from("family_group_members").insert({
        family_group_id: familyGroup.id,
        user_id: userId,
        role: "admin",
      });

      return {
        success: true,
        familyGroupId: familyGroup.id,
        inviteCode: familyGroup.invite_code,
      };
    }

    // 데이터베이스 함수로 코드 생성 성공
    const inviteCode = codeData;

    // 가족 그룹 생성
    const { data: familyGroup, error: createError } = await serviceSupabase
      .from("family_groups")
      .insert({
        invite_code: inviteCode,
        admin_user_id: userId,
        name: name || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("[CreateFamilyGroup] 생성 실패:", createError);
      return {
        success: false,
        error: createError.message,
      };
    }

    // 관리자를 멤버로 추가
    await serviceSupabase.from("family_group_members").insert({
      family_group_id: familyGroup.id,
      user_id: userId,
      role: "admin",
    });

    return {
      success: true,
      familyGroupId: familyGroup.id,
      inviteCode: familyGroup.invite_code,
    };
  } catch (error) {
    console.error("[CreateFamilyGroup] 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

