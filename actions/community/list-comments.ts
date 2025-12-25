/**
 * @file actions/community/list-comments.ts
 * @description 댓글 목록 조회 Server Action
 *
 * 게시글의 댓글 목록을 조회하며, 대댓글을 포함한 계층 구조를 반환합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: ListCommentsParams, PaginatedResult, CommentWithAuthor
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type {
  ListCommentsParams,
  PaginatedResult,
  CommentWithAuthor,
  ActionResult,
} from "@/types/community";

/**
 * 댓글 목록 조회
 *
 * @param params 조회 파라미터
 * @returns 댓글 목록 및 페이지네이션 정보
 */
export async function listComments(
  params: ListCommentsParams
): Promise<ActionResult<PaginatedResult<CommentWithAuthor>>> {
  try {
    console.group("[ListComments] 댓글 목록 조회 시작");
    console.log("params", params);

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

    // 3. 게시글 존재 여부 확인
    const supabase = getServiceRoleClient();

    const { data: post } = await supabase
      .from("group_posts")
      .select("id")
      .eq("id", params.post_id)
      .single();

    if (!post) {
      console.error("❌ 게시글을 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    // 4. 파라미터 설정
    const page = params.page || 1;
    const limit = params.limit || 50; // 댓글은 더 많이 표시
    const offset = (page - 1) * limit;

    // 5. 댓글 조회 (대댓글 제외, 최상위 댓글만)
    const { data: comments, error: queryError, count } = await supabase
      .from("post_comments")
      .select("*", { count: "exact" })
      .eq("post_id", params.post_id)
      .is("parent_comment_id", null) // 최상위 댓글만
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error("❌ 댓글 목록 조회 실패:", queryError);
      console.groupEnd();
      return {
        success: false,
        error: queryError.message || "댓글 목록 조회에 실패했습니다.",
      };
    }

    // 6. 각 댓글의 작성자 정보 및 좋아요 여부, 대댓글 조회
    const commentsWithAuthor: CommentWithAuthor[] = await Promise.all(
      (comments || []).map(async (comment) => {
        // 작성자 정보 조회
        const { data: author } = await supabase
          .from("users")
          .select("id, name, profile_image_url")
          .eq("id", comment.author_id)
          .single();

        // 좋아요 여부 확인
        const { data: like } = await supabase
          .from("post_likes")
          .select("id")
          .eq("comment_id", comment.id)
          .eq("user_id", user.id)
          .maybeSingle();

        // 대댓글 조회 (최대 10개, 최신순)
        const { data: replies } = await supabase
          .from("post_comments")
          .select("*")
          .eq("parent_comment_id", comment.id)
          .order("created_at", { ascending: true })
          .limit(10);

        // 대댓글 작성자 정보 및 좋아요 여부 조회
        const repliesWithAuthor: CommentWithAuthor[] = await Promise.all(
          (replies || []).map(async (reply) => {
            const { data: replyAuthor } = await supabase
              .from("users")
              .select("id, name, profile_image_url")
              .eq("id", reply.author_id)
              .single();

            const { data: replyLike } = await supabase
              .from("post_likes")
              .select("id")
              .eq("comment_id", reply.id)
              .eq("user_id", user.id)
              .maybeSingle();

            return {
              id: reply.id,
              post_id: reply.post_id,
              author_id: reply.author_id,
              content: reply.content,
              parent_comment_id: reply.parent_comment_id,
              like_count: reply.like_count,
              created_at: reply.created_at,
              updated_at: reply.updated_at,
              author: {
                id: replyAuthor?.id || reply.author_id,
                name: replyAuthor?.name || "알 수 없음",
                profile_image_url: replyAuthor?.profile_image_url || null,
              },
              is_liked: !!replyLike,
            };
          })
        );

        return {
          id: comment.id,
          post_id: comment.post_id,
          author_id: comment.author_id,
          content: comment.content,
          parent_comment_id: comment.parent_comment_id,
          like_count: comment.like_count,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          author: {
            id: author?.id || comment.author_id,
            name: author?.name || "알 수 없음",
            profile_image_url: author?.profile_image_url || null,
          },
          replies: repliesWithAuthor,
          is_liked: !!like,
        };
      })
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    console.log("✅ 댓글 목록 조회 완료:", {
      count: commentsWithAuthor.length,
      total,
      page,
      totalPages,
    });
    console.groupEnd();

    return {
      success: true,
      data: {
        items: commentsWithAuthor,
        meta: {
          total,
          page,
          limit,
          total_pages: totalPages,
        },
      },
    };
  } catch (error) {
    console.error("❌ 댓글 목록 조회 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "댓글 목록 조회 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

