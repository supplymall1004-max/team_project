/**
 * @file actions/community/create-post.ts
 * @description 게시글 생성 Server Action
 *
 * 그룹에 게시글을 작성하고, 게임화 포인트를 지급하며, 퀘스트 진행도를 업데이트합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/lib/health/gamification: addPoints
 * - @/lib/game/quest-system: getQuestById, isQuestCompleted
 * - @/types/community: CreatePostInput, PostWithAuthor
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { addPoints } from "@/lib/health/gamification";
import { getQuestById, isQuestCompleted } from "@/lib/game/quest-system";
import type {
  CreatePostInput,
  PostWithAuthor,
  ActionResult,
} from "@/types/community";

/**
 * 게시글 생성
 *
 * @param input 게시글 생성 입력 데이터
 * @returns 생성된 게시글 정보
 */
export async function createPost(
  input: CreatePostInput
): Promise<ActionResult<PostWithAuthor>> {
  try {
    console.group("[CreatePost] 게시글 작성 시작");
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
    if (!input.title || input.title.trim().length === 0) {
      console.error("❌ 게시글 제목이 필요합니다");
      console.groupEnd();
      return { success: false, error: "게시글 제목을 입력해주세요." };
    }

    if (input.title.length > 200) {
      console.error("❌ 게시글 제목이 너무 깁니다 (최대 200자)");
      console.groupEnd();
      return { success: false, error: "게시글 제목은 200자 이하여야 합니다." };
    }

    if (!input.content || input.content.trim().length === 0) {
      console.error("❌ 게시글 내용이 필요합니다");
      console.groupEnd();
      return { success: false, error: "게시글 내용을 입력해주세요." };
    }

    if (input.content.length > 10000) {
      console.error("❌ 게시글 내용이 너무 깁니다 (최대 10000자)");
      console.groupEnd();
      return { success: false, error: "게시글 내용은 10000자 이하여야 합니다." };
    }

    // 4. 그룹 멤버 여부 확인
    const supabase = getServiceRoleClient();

    const { data: group, error: groupError } = await supabase
      .from("community_groups")
      .select("id, name, is_public")
      .eq("id", input.group_id)
      .single();

    if (groupError || !group) {
      console.error("❌ 그룹을 찾을 수 없습니다:", groupError);
      console.groupEnd();
      return { success: false, error: "그룹을 찾을 수 없습니다." };
    }

    // 그룹 멤버 여부 확인
    const { data: member } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", input.group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      console.error("❌ 그룹 멤버만 게시글을 작성할 수 있습니다");
      console.groupEnd();
      return {
        success: false,
        error: "그룹 멤버만 게시글을 작성할 수 있습니다.",
      };
    }

    // 5. 게시글 생성
    const { data: post, error: createError } = await supabase
      .from("group_posts")
      .insert({
        group_id: input.group_id,
        author_id: user.id,
        title: input.title.trim(),
        content: input.content.trim(),
        post_type: input.post_type || "general",
        images: input.images || [],
        like_count: 0,
        comment_count: 0,
        view_count: 0,
        is_pinned: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ 게시글 작성 실패:", createError);
      console.groupEnd();
      return {
        success: false,
        error: createError.message || "게시글 작성에 실패했습니다.",
      };
    }

    console.log("✅ 게시글 작성 완료:", post.id);

    // 6. post_count는 트리거에 의해 자동 증가
    // user.post_count도 트리거에 의해 자동 증가

    // 7. 게임화 포인트 지급 (게시글 작성 포인트: 10점)
    const postPoints = 10;
    await addPoints(user.id, postPoints, `게시글 작성: ${input.title}`);

    // 8. 퀘스트 진행도 업데이트 (커뮤니티 활동 퀘스트가 있다면)
    // TODO: 커뮤니티 활동 퀘스트 ID 정의 필요
    // const communityQuestId = "daily_community_post";
    // const quest = getQuestById(communityQuestId);
    // if (quest) {
    //   // 퀘스트 진행도 업데이트 로직
    // }

    console.log("✅ 게시글 작성 완료");
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
        view_count: post.view_count,
        is_pinned: post.is_pinned,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          id: user.id,
          name: user.name,
          profile_image_url: null, // TODO: users 테이블에서 조회
        },
        group: {
          id: group.id,
          name: group.name,
        },
        is_liked: false,
      },
    };
  } catch (error) {
    console.error("❌ 게시글 작성 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "게시글 작성 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

