/**
 * @file actions/admin/community/delete-group-admin.ts
 * @description 관리자용 그룹 삭제 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 관리자용 그룹 삭제
 */
export async function deleteGroupAdmin(groupId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.group("[AdminCommunity][DeleteGroup] 그룹 삭제 시작");
    console.log("📝 그룹 ID:", groupId);

    const supabase = getServiceRoleClient();

    // 그룹 삭제 (CASCADE로 연관 데이터 자동 삭제)
    const { error } = await supabase
      .from("community_groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      console.error("❌ 그룹 삭제 실패:", error);
      throw error;
    }

    console.log("✅ 그룹 삭제 완료");
    console.groupEnd();

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ 그룹 삭제 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

