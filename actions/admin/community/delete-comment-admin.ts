/**
 * @file actions/admin/community/delete-comment-admin.ts
 * @description 관리자용 댓글 삭제 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 관리자용 댓글 삭제
 */
export async function deleteCommentAdmin(commentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.group("[AdminCommunity][DeleteComment] 댓글 삭제 시작");
    console.log("📝 댓글 ID:", commentId);

    const supabase = getServiceRoleClient();

    // 댓글 삭제 (CASCADE로 좋아요 자동 삭제)
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("❌ 댓글 삭제 실패:", error);
      throw error;
    }

    console.log("✅ 댓글 삭제 완료");
    console.groupEnd();

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ 댓글 삭제 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

