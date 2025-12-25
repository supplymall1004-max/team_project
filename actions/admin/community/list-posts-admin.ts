/**
 * @file actions/admin/community/list-posts-admin.ts
 * @description 관리자용 게시글 목록 조회 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/types/admin/community: AdminPost, AdminPaginationParams
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { AdminPost, AdminPaginationParams } from "@/types/admin/community";

interface ListPostsAdminParams extends AdminPaginationParams {
  groupId?: string;
  authorId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * 관리자용 게시글 목록 조회
 */
export async function listPostsAdmin(
  params: ListPostsAdminParams = {}
): Promise<{
  success: boolean;
  error?: string;
  data?: AdminPost[];
  total?: number;
}> {
  try {
    console.group("[AdminCommunity][ListPosts] 게시글 목록 조회 시작");

    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      groupId,
      authorId,
      search,
      dateFrom,
      dateTo,
    } = params;

    const supabase = getServiceRoleClient();

    let query = supabase
      .from("group_posts")
      .select(`
        *,
        users!group_posts_author_id_fkey(id, name, clerk_id),
        community_groups!group_posts_group_id_fkey(id, name)
      `);

    // 필터링
    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ 게시글 목록 조회 실패:", error);
      throw error;
    }

    const posts: AdminPost[] = (data || []).map((post: any) => ({
      id: post.id,
      group_id: post.group_id,
      author_id: post.author_id,
      title: post.title,
      content: post.content,
      post_type: post.post_type,
      images: Array.isArray(post.images) ? post.images : [],
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      view_count: post.view_count || 0,
      is_pinned: post.is_pinned || false,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.users?.id || post.author_id,
        name: post.users?.name || "알 수 없음",
      },
      group: {
        id: post.community_groups?.id || post.group_id,
        name: post.community_groups?.name || "알 수 없음",
      },
      commentCount: post.comment_count || 0,
      likeCount: post.like_count || 0,
      viewCount: post.view_count || 0,
    }));

    console.log("✅ 게시글 목록 조회 완료");
    console.log("📊 조회된 게시글 수:", posts.length);
    console.groupEnd();

    return {
      success: true,
      data: posts,
      total: count || 0,
    };
  } catch (error) {
    console.error("❌ 게시글 목록 조회 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

