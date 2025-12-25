/**
 * @file actions/admin/community/delete-post-admin.ts
 * @description 관리자용 게시글 삭제 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 관리자용 게시글 삭제
 */
export async function deletePostAdmin(postId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.group("[AdminCommunity][DeletePost] 게시글 삭제 시작");
    console.log("📝 게시글 ID:", postId);

    const supabase = getServiceRoleClient();

    // 게시글 삭제 (CASCADE로 댓글, 좋아요 자동 삭제)
    const { error } = await supabase
      .from("group_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("❌ 게시글 삭제 실패:", error);
      throw error;
    }

    console.log("✅ 게시글 삭제 완료");
    console.groupEnd();

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ 게시글 삭제 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

