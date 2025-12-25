/**
 * @file actions/community/create-comment.ts
 * @description 댓글 생성 Server Action
 *
 * 게시글에 댓글을 작성하고, 게임화 포인트를 지급합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/health/gamification: addPoints
 * - @/types/community: CreateCommentInput, CommentWithAuthor
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { addPoints } from "@/lib/health/gamification";
import type {
  CreateCommentInput,
  CommentWithAuthor,
  ActionResult,
} from "@/types/community";

/**
 * 댓글 생성
 *
 * @param input 댓글 생성 입력 데이터
 * @returns 생성된 댓글 정보
 */
export async function createComment(
  input: CreateCommentInput
): Promise<ActionResult<CommentWithAuthor>> {
  try {
    console.group("[CreateComment] 댓글 작성 시작");
    console.log("input", input);

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
    if (!input.content || input.content.trim().length === 0) {
      console.error("❌ 댓글 내용이 필요합니다");
      console.groupEnd();
      return { success: false, error: "댓글 내용을 입력해주세요." };
    }

    if (input.content.length > 2000) {
      console.error("❌ 댓글 내용이 너무 깁니다 (최대 2000자)");
      console.groupEnd();
      return { success: false, error: "댓글 내용은 2000자 이하여야 합니다." };
    }

    // 4. 게시글 존재 여부 확인
    const supabase = getServiceRoleClient();

    const { data: post } = await supabase
      .from("group_posts")
      .select("id, group_id")
      .eq("id", input.post_id)
      .single();

    if (!post) {
      console.error("❌ 게시글을 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    // 5. 대댓글인 경우 부모 댓글 확인
    if (input.parent_comment_id) {
      const { data: parentComment } = await supabase
        .from("post_comments")
        .select("id, post_id")
        .eq("id", input.parent_comment_id)
        .single();

      if (!parentComment || parentComment.post_id !== input.post_id) {
        console.error("❌ 부모 댓글을 찾을 수 없습니다");
        console.groupEnd();
        return { success: false, error: "부모 댓글을 찾을 수 없습니다." };
      }
    }

    // 6. 댓글 생성
    const { data: comment, error: createError } = await supabase
      .from("post_comments")
      .insert({
        post_id: input.post_id,
        author_id: user.id,
        content: input.content.trim(),
        parent_comment_id: input.parent_comment_id || null,
        like_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ 댓글 작성 실패:", createError);
      console.groupEnd();
      return {
        success: false,
        error: createError.message || "댓글 작성에 실패했습니다.",
      };
    }

    console.log("✅ 댓글 작성 완료:", comment.id);

    // 7. comment_count는 트리거에 의해 자동 증가

    // 8. 게임화 포인트 지급 (댓글 작성 포인트: 5점)
    const commentPoints = 5;
    await addPoints(user.id, commentPoints, `댓글 작성`);

    // 9. 작성자 정보 조회
    const { data: author } = await supabase
      .from("users")
      .select("id, name, profile_image_url")
      .eq("id", user.id)
      .single();

    console.log("✅ 댓글 작성 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        id: comment.id,
        post_id: comment.post_id,
        author_id: comment.author_id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        like_count: comment.like_count,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: {
          id: author?.id || user.id,
          name: author?.name || "알 수 없음",
          profile_image_url: author?.profile_image_url || null,
        },
        is_liked: false,
      },
    };
  } catch (error) {
    console.error("❌ 댓글 작성 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "댓글 작성 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

