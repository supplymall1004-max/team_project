/**
 * @file actions/community/delete-post.ts
 * @description 게시글 삭제 Server Action
 *
 * 게시글을 삭제하며, 관련 댓글과 좋아요도 함께 삭제됩니다 (CASCADE).
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
 * 게시글 삭제
 *
 * @param postId 삭제할 게시글 ID
 * @returns 성공 여부
 */
export async function deletePost(
  postId: string
): Promise<ActionResult<{ post_id: string }>> {
  try {
    console.group("[DeletePost] 게시글 삭제 시작");
    console.log("postId", postId);

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

    // 3. 게시글 존재 여부 및 작성자 확인
    const supabase = getServiceRoleClient();

    const { data: post, error: postError } = await supabase
      .from("group_posts")
      .select("id, author_id, group_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("❌ 게시글을 찾을 수 없습니다:", postError);
      console.groupEnd();
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    // 4. 권한 확인 (작성자 또는 모더레이터)
    const isAuthor = post.author_id === user.id;

    if (!isAuthor) {
      // 모더레이터 권한 확인
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", post.group_id)
        .eq("user_id", user.id)
        .in("role", ["owner", "moderator"])
        .maybeSingle();

      if (!member) {
        console.error("❌ 게시글 삭제 권한이 없습니다");
        console.groupEnd();
        return {
          success: false,
          error: "게시글 삭제 권한이 없습니다.",
        };
      }
    }

    // 5. 게시글 삭제 (CASCADE로 댓글과 좋아요도 자동 삭제됨)
    // post_count와 user.post_count는 트리거에 의해 자동 감소
    const { error: deleteError } = await supabase
      .from("group_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("❌ 게시글 삭제 실패:", deleteError);
      console.groupEnd();
      return {
        success: false,
        error: deleteError.message || "게시글 삭제에 실패했습니다.",
      };
    }

    console.log("✅ 게시글 삭제 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        post_id: postId,
      },
    };
  } catch (error) {
    console.error("❌ 게시글 삭제 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "게시글 삭제 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

