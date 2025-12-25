/**
 * @file actions/community/get-group.ts
 * @description 그룹 조회 Server Action
 *
 * 그룹 상세 정보를 조회하고, 사용자의 멤버 여부 및 역할을 확인합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: GroupWithMembership
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type {
  GroupWithMembership,
  GroupMemberRole,
  ActionResult,
} from "@/types/community";

/**
 * 그룹 조회
 *
 * @param groupId 조회할 그룹 ID
 * @returns 그룹 정보 및 멤버 여부
 */
export async function getGroup(
  groupId: string
): Promise<ActionResult<GroupWithMembership>> {
  try {
    console.group("[GetGroup] 그룹 조회 시작");
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

    // 3. 그룹 조회
    const supabase = getServiceRoleClient();

    const { data: group, error: groupError } = await supabase
      .from("community_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      console.error("❌ 그룹을 찾을 수 없습니다:", groupError);
      console.groupEnd();
      return { success: false, error: "그룹을 찾을 수 없습니다." };
    }

    // 4. 비공개 그룹 접근 권한 확인
    if (!group.is_public) {
      // 멤버 여부 확인
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member) {
        console.error("❌ 비공개 그룹 접근 권한 없음");
        console.groupEnd();
        return {
          success: false,
          error: "이 그룹에 접근할 권한이 없습니다.",
        };
      }
    }

    // 5. 멤버 여부 및 역할 확인
    const { data: member } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isMember = !!member;
    const userRole = member?.role as GroupMemberRole | undefined;

    console.log("✅ 그룹 조회 완료:", {
      groupId: group.id,
      isMember,
      userRole,
    });
    console.groupEnd();

    return {
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category as GroupWithMembership["category"],
        cover_image_url: group.cover_image_url,
        is_public: group.is_public,
        is_family_only: group.is_family_only,
        owner_id: group.owner_id,
        member_count: group.member_count,
        post_count: group.post_count,
        created_at: group.created_at,
        updated_at: group.updated_at,
        is_member: isMember,
        user_role: userRole,
      },
    };
  } catch (error) {
    console.error("❌ 그룹 조회 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "그룹 조회 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

