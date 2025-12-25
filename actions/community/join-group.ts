/**
 * @file actions/community/join-group.ts
 * @description 그룹 가입 Server Action
 *
 * 사용자가 그룹에 가입하고, member_count가 자동으로 증가합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { ActionResult } from "@/types/community";

/**
 * 그룹 가입
 *
 * @param groupId 가입할 그룹 ID
 * @returns 성공 여부
 */
export async function joinGroup(
  groupId: string
): Promise<ActionResult<{ group_id: string; user_id: string }>> {
  try {
    console.group("[JoinGroup] 그룹 가입 시작");
    console.log("groupId", groupId);

    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 로그인이 필요합니다");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 2. Supabase 사용자 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 정보를 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    // 3. 그룹 존재 여부 확인
    const supabase = getServiceRoleClient();

    const { data: group, error: groupError } = await supabase
      .from("community_groups")
      .select("id, is_public, is_family_only")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      console.error("❌ 그룹을 찾을 수 없습니다:", groupError);
      console.groupEnd();
      return { success: false, error: "그룹을 찾을 수 없습니다." };
    }

    // 4. 이미 가입 여부 확인
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      console.error("❌ 이미 가입한 그룹입니다");
      console.groupEnd();
      return { success: false, error: "이미 가입한 그룹입니다." };
    }

    // 5. 비공개 그룹 접근 권한 확인 (추후 구현: 초대 시스템)
    // 현재는 비공개 그룹도 가입 가능 (추후 초대 시스템 추가 시 수정)

    // 6. 그룹 가입
    const { error: joinError } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "member",
    });

    if (joinError) {
      console.error("❌ 그룹 가입 실패:", joinError);
      console.groupEnd();
      return {
        success: false,
        error: joinError.message || "그룹 가입에 실패했습니다.",
      };
    }

    // 7. member_count는 트리거에 의해 자동 증가
    console.log("✅ 그룹 가입 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        group_id: groupId,
        user_id: user.id,
      },
    };
  } catch (error) {
    console.error("❌ 그룹 가입 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "그룹 가입 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

