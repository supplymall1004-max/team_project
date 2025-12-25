/**
 * @file actions/community/get-post.ts
 * @description 게시글 조회 Server Action
 *
 * 게시글 상세 정보를 조회하고, view_count를 증가시킵니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: PostWithAuthor
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { PostWithAuthor, ActionResult } from "@/types/community";

/**
 * 게시글 조회
 *
 * @param postId 조회할 게시글 ID
 * @returns 게시글 정보
 */
export async function getPost(
  postId: string
): Promise<ActionResult<PostWithAuthor>> {
  try {
    console.group("[GetPost] 게시글 조회 시작");
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

    // 3. 게시글 조회
    const supabase = getServiceRoleClient();

    const { data: post, error: postError } = await supabase
      .from("group_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("❌ 게시글을 찾을 수 없습니다:", postError);
      console.groupEnd();
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    // 4. 그룹 멤버 여부 확인 (비공개 그룹)
    const { data: group } = await supabase
      .from("community_groups")
      .select("id, name, is_public")
      .eq("id", post.group_id)
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
        .eq("group_id", post.group_id)
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

    // 5. view_count 증가
    await supabase
      .from("group_posts")
      .update({ view_count: post.view_count + 1 })
      .eq("id", postId);

    // 6. 작성자 정보 조회
    const { data: author } = await supabase
      .from("users")
      .select("id, name, profile_image_url")
      .eq("id", post.author_id)
      .single();

    // 7. 좋아요 여부 확인
    const { data: like } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("✅ 게시글 조회 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        id: post.id,
        group_id: post.group_id,
        author_id: post.author_id,
        title: post.title,
        content: post.content,
        post_type: post.post_type as PostWithAuthor["post_type"],
        images: (post.images as string[]) || [],
        like_count: post.like_count,
        comment_count: post.comment_count,
        view_count: post.view_count + 1, // 증가된 값 반환
        is_pinned: post.is_pinned,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          id: author?.id || post.author_id,
          name: author?.name || "알 수 없음",
          profile_image_url: author?.profile_image_url || null,
        },
        group: {
          id: group.id,
          name: group.name,
        },
        is_liked: !!like,
      },
    };
  } catch (error) {
    console.error("❌ 게시글 조회 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "게시글 조회 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

