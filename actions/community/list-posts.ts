/**
 * @file actions/community/list-posts.ts
 * @description 게시글 목록 조회 Server Action
 *
 * 그룹 내 게시글 목록을 조회하며, 필터링, 정렬, 페이지네이션을 지원합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: ListPostsParams, PaginatedResult, PostWithAuthor
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type {
  ListPostsParams,
  PaginatedResult,
  PostWithAuthor,
  ActionResult,
} from "@/types/community";

/**
 * 게시글 목록 조회
 *
 * @param params 조회 파라미터
 * @returns 게시글 목록 및 페이지네이션 정보
 */
export async function listPosts(
  params: ListPostsParams
): Promise<ActionResult<PaginatedResult<PostWithAuthor>>> {
  try {
    console.group("[ListPosts] 게시글 목록 조회 시작");
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

    // 3. 그룹 ID 필수 확인
    if (!params.group_id) {
      console.error("❌ 그룹 ID가 필요합니다");
      console.groupEnd();
      return { success: false, error: "그룹 ID가 필요합니다." };
    }

    // 4. 그룹 멤버 여부 확인
    const supabase = getServiceRoleClient();

    const { data: group } = await supabase
      .from("community_groups")
      .select("id, is_public")
      .eq("id", params.group_id)
      .single();

    if (!group) {
      console.error("❌ 그룹을 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "그룹을 찾을 수 없습니다." };
    }

    if (!group.is_public) {
      const { data: member } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", params.group_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member) {
        console.error("❌ 그룹 멤버만 게시글을 조회할 수 있습니다");
        console.groupEnd();
        return {
          success: false,
          error: "그룹 멤버만 게시글을 조회할 수 있습니다.",
        };
      }
    }

    // 5. 파라미터 설정
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const sort = params.sort || "latest";

    // 6. 쿼리 빌더
    let query = supabase
      .from("group_posts")
      .select("*", { count: "exact" })
      .eq("group_id", params.group_id);

    // 7. 필터링
    if (params.post_type) {
      query = query.eq("post_type", params.post_type);
    }

    // 8. 정렬
    if (sort === "popular") {
      // 인기순: like_count + comment_count 합계 기준
      query = query.order("is_pinned", { ascending: false }); // 고정글 우선
      // 인기순 정렬은 애플리케이션 레벨에서 처리 (또는 계산된 컬럼 사용)
    } else {
      // 최신순
      query = query.order("is_pinned", { ascending: false }); // 고정글 우선
      query = query.order("created_at", { ascending: false });
    }

    // 9. 페이지네이션
    query = query.range(offset, offset + limit - 1);

    // 10. 쿼리 실행
    const { data: posts, error: queryError, count } = await query;

    if (queryError) {
      console.error("❌ 게시글 목록 조회 실패:", queryError);
      console.groupEnd();
      return {
        success: false,
        error: queryError.message || "게시글 목록 조회에 실패했습니다.",
      };
    }

    // 11. 작성자 정보 및 좋아요 여부 조회
    const postsWithAuthor: PostWithAuthor[] = await Promise.all(
      (posts || []).map(async (post) => {
        const [authorResult, likeResult] = await Promise.all([
          supabase
            .from("users")
            .select("id, name, profile_image_url")
            .eq("id", post.author_id)
            .single(),
          supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        const { data: groupData } = await supabase
          .from("community_groups")
          .select("id, name")
          .eq("id", post.group_id)
          .single();

        return {
          id: post.id,
          group_id: post.group_id,
          author_id: post.author_id,
          title: post.title,
          content: post.content,
          post_type: post.post_type as PostWithAuthor["post_type"],
          images: (post.images as string[]) || [],
          like_count: post.like_count,
          comment_count: post.comment_count,
          view_count: post.view_count,
          is_pinned: post.is_pinned,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: {
            id: authorResult.data?.id || post.author_id,
            name: authorResult.data?.name || "알 수 없음",
            profile_image_url: authorResult.data?.profile_image_url || null,
          },
          group: {
            id: groupData?.id || post.group_id,
            name: groupData?.name || "알 수 없음",
          },
          is_liked: !!likeResult.data,
        };
      })
    );

    // 12. 인기순 정렬 (필요한 경우)
    if (sort === "popular") {
      postsWithAuthor.sort((a, b) => {
        const aScore = a.like_count + a.comment_count;
        const bScore = b.like_count + b.comment_count;
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return bScore - aScore;
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    console.log("✅ 게시글 목록 조회 완료:", {
      count: postsWithAuthor.length,
      total,
      page,
      totalPages,
    });
    console.groupEnd();

    return {
      success: true,
      data: {
        items: postsWithAuthor,
        meta: {
          total,
          page,
          limit,
          total_pages: totalPages,
        },
      },
    };
  } catch (error) {
    console.error("❌ 게시글 목록 조회 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "게시글 목록 조회 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

