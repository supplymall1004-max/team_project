/**
 * @file actions/community/update-post.ts
 * @description 게시글 수정 Server Action
 *
 * 게시글을 수정하며, 작성자 또는 모더레이터만 수정할 수 있습니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: UpdatePostInput, PostWithAuthor
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type {
  UpdatePostInput,
  PostWithAuthor,
  ActionResult,
} from "@/types/community";

/**
 * 게시글 수정
 *
 * @param postId 수정할 게시글 ID
 * @param input 게시글 수정 입력 데이터
 * @returns 수정된 게시글 정보
 */
export async function updatePost(
  postId: string,
  input: UpdatePostInput
): Promise<ActionResult<PostWithAuthor>> {
  try {
    console.group("[UpdatePost] 게시글 수정 시작");
    console.log("postId", postId);
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
        .eq("role", "moderator")
        .maybeSingle();

      if (!member) {
        console.error("❌ 게시글 수정 권한이 없습니다");
        console.groupEnd();
        return {
          success: false,
          error: "게시글 수정 권한이 없습니다.",
        };
      }
    }

    // 5. 입력 유효성 검사
    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        console.error("❌ 게시글 제목이 필요합니다");
        console.groupEnd();
        return { success: false, error: "게시글 제목을 입력해주세요." };
      }
      if (input.title.length > 200) {
        console.error("❌ 게시글 제목이 너무 깁니다 (최대 200자)");
        console.groupEnd();
        return { success: false, error: "게시글 제목은 200자 이하여야 합니다." };
      }
    }

    if (input.content !== undefined) {
      if (input.content.trim().length === 0) {
        console.error("❌ 게시글 내용이 필요합니다");
        console.groupEnd();
        return { success: false, error: "게시글 내용을 입력해주세요." };
      }
      if (input.content.length > 10000) {
        console.error("❌ 게시글 내용이 너무 깁니다 (최대 10000자)");
        console.groupEnd();
        return { success: false, error: "게시글 내용은 10000자 이하여야 합니다." };
      }
    }

    // 6. 게시글 수정
    const updateData: Partial<{
      title: string;
      content: string;
      post_type: string;
      images: string[];
      is_pinned: boolean;
    }> = {};

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.content !== undefined) updateData.content = input.content.trim();
    if (input.post_type !== undefined) updateData.post_type = input.post_type;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.is_pinned !== undefined && isAuthor) {
      // is_pinned는 모더레이터만 수정 가능 (작성자는 수정 불가)
      const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", post.group_id)
        .eq("user_id", user.id)
        .in("role", ["owner", "moderator"])
        .maybeSingle();

      if (member) {
        updateData.is_pinned = input.is_pinned;
      }
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("group_posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ 게시글 수정 실패:", updateError);
      console.groupEnd();
      return {
        success: false,
        error: updateError.message || "게시글 수정에 실패했습니다.",
      };
    }

    // 7. 작성자 및 그룹 정보 조회
    const { data: author } = await supabase
      .from("users")
      .select("id, name, profile_image_url")
      .eq("id", updatedPost.author_id)
      .single();

    const { data: group } = await supabase
      .from("community_groups")
      .select("id, name")
      .eq("id", updatedPost.group_id)
      .single();

    console.log("✅ 게시글 수정 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        id: updatedPost.id,
        group_id: updatedPost.group_id,
        author_id: updatedPost.author_id,
        title: updatedPost.title,
        content: updatedPost.content,
        post_type: updatedPost.post_type as PostWithAuthor["post_type"],
        images: (updatedPost.images as string[]) || [],
        like_count: updatedPost.like_count,
        comment_count: updatedPost.comment_count,
        view_count: updatedPost.view_count,
        is_pinned: updatedPost.is_pinned,
        created_at: updatedPost.created_at,
        updated_at: updatedPost.updated_at,
        author: {
          id: author?.id || updatedPost.author_id,
          name: author?.name || "알 수 없음",
          profile_image_url: author?.profile_image_url || null,
        },
        group: {
          id: group?.id || updatedPost.group_id,
          name: group?.name || "알 수 없음",
        },
        is_liked: false, // TODO: 좋아요 여부 확인
      },
    };
  } catch (error) {
    console.error("❌ 게시글 수정 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "게시글 수정 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

