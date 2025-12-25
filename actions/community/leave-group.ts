/**
 * @file actions/community/leave-group.ts
 * @description 그룹 탈퇴 Server Action
 *
 * 사용자가 그룹에서 탈퇴하며, 소유자는 탈퇴할 수 없습니다.
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
 * 그룹 탈퇴
 *
 * @param groupId 탈퇴할 그룹 ID
 * @returns 성공 여부
 */
export async function leaveGroup(
  groupId: string
): Promise<ActionResult<{ group_id: string }>> {
  try {
    console.group("[LeaveGroup] 그룹 탈퇴 시작");
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

    const { data: group } = await supabase
      .from("community_groups")
      .select("id, owner_id")
      .eq("id", groupId)
      .single();

    if (!group) {
      console.error("❌ 그룹을 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "그룹을 찾을 수 없습니다." };
    }

    // 4. 소유자 탈퇴 방지
    if (group.owner_id === user.id) {
      console.error("❌ 그룹 소유자는 탈퇴할 수 없습니다");
      console.groupEnd();
      return {
        success: false,
        error: "그룹 소유자는 탈퇴할 수 없습니다. 그룹을 삭제하거나 소유권을 양도해주세요.",
      };
    }

    // 5. 멤버 여부 확인
    const { data: member } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      console.error("❌ 그룹 멤버가 아닙니다");
      console.groupEnd();
      return { success: false, error: "그룹 멤버가 아닙니다." };
    }

    // 6. 그룹 탈퇴
    const { error: leaveError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (leaveError) {
      console.error("❌ 그룹 탈퇴 실패:", leaveError);
      console.groupEnd();
      return {
        success: false,
        error: leaveError.message || "그룹 탈퇴에 실패했습니다.",
      };
    }

    // 7. member_count는 트리거에 의해 자동 감소
    console.log("✅ 그룹 탈퇴 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        group_id: groupId,
      },
    };
  } catch (error) {
    console.error("❌ 그룹 탈퇴 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "그룹 탈퇴 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

