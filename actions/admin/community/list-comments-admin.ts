/**
 * @file actions/admin/community/list-comments-admin.ts
 * @description 관리자용 댓글 목록 조회 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/types/admin/community: AdminComment, AdminPaginationParams
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { AdminComment, AdminPaginationParams } from "@/types/admin/community";

interface ListCommentsAdminParams extends AdminPaginationParams {
  postId?: string;
  authorId?: string;
  search?: string;
}

/**
 * 관리자용 댓글 목록 조회
 */
export async function listCommentsAdmin(
  params: ListCommentsAdminParams = {}
): Promise<{
  success: boolean;
  error?: string;
  data?: AdminComment[];
  total?: number;
}> {
  try {
    console.group("[AdminCommunity][ListComments] 댓글 목록 조회 시작");

    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      postId,
      authorId,
      search,
    } = params;

    const supabase = getServiceRoleClient();

    let query = supabase
      .from("post_comments")
      .select(`
        *,
        users!post_comments_author_id_fkey(id, name, clerk_id),
        group_posts!post_comments_post_id_fkey(
          id,
          title,
          community_groups!group_posts_group_id_fkey(id, name)
        )
      `);

    // 필터링
    if (postId) {
      query = query.eq("post_id", postId);
    }

    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    if (search) {
      query = query.ilike("content", `%${search}%`);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ 댓글 목록 조회 실패:", error);
      throw error;
    }

    const comments: AdminComment[] = (data || []).map((comment: any) => ({
      id: comment.id,
      post_id: comment.post_id,
      author_id: comment.author_id,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      like_count: comment.like_count || 0,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: {
        id: comment.users?.id || comment.author_id,
        name: comment.users?.name || "알 수 없음",
      },
      post: {
        id: comment.group_posts?.id || comment.post_id,
        title: comment.group_posts?.title || "알 수 없음",
        group: {
          id: comment.group_posts?.community_groups?.id || "",
          name: comment.group_posts?.community_groups?.name || "알 수 없음",
        },
      },
      likeCount: comment.like_count || 0,
    }));

    console.log("✅ 댓글 목록 조회 완료");
    console.log("📊 조회된 댓글 수:", comments.length);
    console.groupEnd();

    return {
      success: true,
      data: comments,
      total: count || 0,
    };
  } catch (error) {
    console.error("❌ 댓글 목록 조회 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

