/**
 * @file actions/community/toggle-like.ts
 * @description 좋아요 토글 Server Action
 *
 * 게시글 또는 댓글에 좋아요를 누르거나 취소합니다.
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
 * 좋아요 토글
 *
 * @param postId 게시글 ID (댓글 좋아요인 경우 null)
 * @param commentId 댓글 ID (게시글 좋아요인 경우 null)
 * @returns 좋아요 상태 (liked: true/false)
 */
export async function toggleLike(
  postId: string | null,
  commentId: string | null
): Promise<ActionResult<{ liked: boolean }>> {
  try {
    console.group("[ToggleLike] 좋아요 토글 시작");
    console.log("postId", postId);
    console.log("commentId", commentId);

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

    // 3. 입력 유효성 검사
    if (!postId && !commentId) {
      console.error("❌ 게시글 ID 또는 댓글 ID가 필요합니다");
      console.groupEnd();
      return {
        success: false,
        error: "게시글 ID 또는 댓글 ID가 필요합니다.",
      };
    }

    if (postId && commentId) {
      console.error("❌ 게시글 ID와 댓글 ID를 동시에 제공할 수 없습니다");
      console.groupEnd();
      return {
        success: false,
        error: "게시글 ID와 댓글 ID를 동시에 제공할 수 없습니다.",
      };
    }

    // 4. 기존 좋아요 확인
    const supabase = getServiceRoleClient();

    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq(postId ? "post_id" : "comment_id", postId || commentId)
      .maybeSingle();

    // 5. 좋아요 토글
    if (existingLike) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from("post_likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        console.error("❌ 좋아요 취소 실패:", deleteError);
        console.groupEnd();
        return {
          success: false,
          error: deleteError.message || "좋아요 취소에 실패했습니다.",
        };
      }

      // like_count는 트리거에 의해 자동 감소
      console.log("✅ 좋아요 취소 완료");
      console.groupEnd();

      return {
        success: true,
        data: { liked: false },
      };
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase.from("post_likes").insert({
        post_id: postId || null,
        comment_id: commentId || null,
        user_id: user.id,
      });

      if (insertError) {
        console.error("❌ 좋아요 추가 실패:", insertError);
        console.groupEnd();
        return {
          success: false,
          error: insertError.message || "좋아요 추가에 실패했습니다.",
        };
      }

      // like_count는 트리거에 의해 자동 증가
      console.log("✅ 좋아요 추가 완료");
      console.groupEnd();

      return {
        success: true,
        data: { liked: true },
      };
    }
  } catch (error) {
    console.error("❌ 좋아요 토글 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "좋아요 토글 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

