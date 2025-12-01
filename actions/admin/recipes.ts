/**
 * @file actions/admin/recipes.ts
 * @description 궁중 레시피 블로그 글 관련 서버 액션들
 *
 * 주요 기능:
 * - createRoyalRecipePost: 새로운 궁중 레시피 글 생성
 * - getRoyalRecipePosts: 작성된 글 목록 조회
 * - updateRoyalRecipePost: 글 수정
 * - deleteRoyalRecipePost: 글 삭제
 *
 * @dependencies
 * - @supabase/supabase-js: 데이터베이스 클라이언트
 * - @clerk/nextjs/server: Clerk 서버 API
 * - slugify: URL 슬러그 생성
 */

"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import slugify from "slugify";

export type RoyalRecipeEra = "goryeo" | "joseon" | "three_kingdoms";

export interface CreateRoyalRecipePostData {
  title: string;
  content: string;
  era: RoyalRecipeEra;
  slug?: string;
  thumbnailUrl?: string;
  excerpt?: string;
  published: boolean;
}

export interface RoyalRecipePost {
  id: string;
  title: string;
  content: string;
  era: RoyalRecipeEra;
  author_id: string;
  slug: string;
  published: boolean;
  thumbnail_url?: string;
  excerpt?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 새로운 궁중 레시피 글을 생성합니다.
 */
export async function createRoyalRecipePost(data: CreateRoyalRecipePostData) {
  console.group("[createRoyalRecipePost]");
  console.log("글 작성 시작:", { title: data.title, era: data.era });

  try {
    // Clerk 사용자 정보 확인
    const clerkUser = await currentUser();
    if (!clerkUser) {
      console.warn("인증되지 않은 사용자");
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    // 슬러그 생성 (중복 방지)
    const baseSlug = slugify(data.title, {
      lower: true,
      strict: true,
      locale: 'ko'
    });

    const supabase = await createClerkSupabaseClient();

    // 동일한 슬러그가 있는지 확인하고 번호 붙이기
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existingPost } = await supabase
        .from("royal_recipes_posts")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingPost) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log("최종 슬러그:", slug);

    // 데이터베이스에 글 저장
    const { data: post, error } = await supabase
      .from("royal_recipes_posts")
      .insert({
        title: data.title,
        content: data.content,
        era: data.era,
        author_id: clerkUser.id,
        slug,
        published: data.published,
        thumbnail_url: data.thumbnailUrl,
        excerpt: data.excerpt,
      })
      .select()
      .single();

    if (error) {
      console.error("데이터베이스 오류:", error);
      return {
        success: false,
        error: "글 작성 중 데이터베이스 오류가 발생했습니다.",
      };
    }

    console.log("글 작성 완료:", post.id);

    // 캐시 무효화
    revalidatePath("/admin/recipes");

    return {
      success: true,
      data: post,
    };

  } catch (error) {
    console.error("예상치 못한 오류:", error);
    return {
      success: false,
      error: "알 수 없는 오류가 발생했습니다.",
    };
  } finally {
    console.groupEnd();
  }
}

/**
 * 작성된 궁중 레시피 글 목록을 조회합니다.
 */
export async function getRoyalRecipePosts() {
  console.group("[getRoyalRecipePosts]");

  try {
    const supabase = await createClerkSupabaseClient();

    const { data: posts, error } = await supabase
      .from("royal_recipes_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("데이터베이스 조회 오류:", error);
      return {
        success: false,
        error: "글 목록 조회 중 오류가 발생했습니다.",
        data: [],
      };
    }

    console.log(`총 ${posts.length}개의 글 조회됨`);

    return {
      success: true,
      data: posts as RoyalRecipePost[],
    };

  } catch (error) {
    console.error("예상치 못한 오류:", error);
    return {
      success: false,
      error: "알 수 없는 오류가 발생했습니다.",
      data: [],
    };
  } finally {
    console.groupEnd();
  }
}

/**
 * 특정 궁중 레시피 글을 수정합니다.
 */
export async function updateRoyalRecipePost(
  postId: string,
  data: Partial<CreateRoyalRecipePostData>
) {
  console.group("[updateRoyalRecipePost]");
  console.log("글 수정 시작:", postId);

  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    const supabase = await createClerkSupabaseClient();

    // 제목이 변경된 경우 슬러그도 업데이트
    let updateData = { ...data };
    if (data.title) {
      const baseSlug = slugify(data.title, {
        lower: true,
        strict: true,
        locale: 'ko'
      });

      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const { data: existingPost } = await supabase
          .from("royal_recipes_posts")
          .select("id")
          .eq("slug", slug)
          .neq("id", postId)
          .single();

        if (!existingPost) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData.slug = slug;
    }

    const { data: post, error } = await supabase
      .from("royal_recipes_posts")
      .update(updateData)
      .eq("id", postId)
      .eq("author_id", clerkUser.id) // 자신의 글만 수정 가능
      .select()
      .single();

    if (error) {
      console.error("데이터베이스 업데이트 오류:", error);
      return {
        success: false,
        error: "글 수정 중 오류가 발생했습니다.",
      };
    }

    console.log("글 수정 완료:", postId);

    revalidatePath("/admin/recipes");

    return {
      success: true,
      data: post,
    };

  } catch (error) {
    console.error("예상치 못한 오류:", error);
    return {
      success: false,
      error: "알 수 없는 오류가 발생했습니다.",
    };
  } finally {
    console.groupEnd();
  }
}

/**
 * 특정 궁중 레시피 글을 삭제합니다.
 */
export async function deleteRoyalRecipePost(postId: string) {
  console.group("[deleteRoyalRecipePost]");
  console.log("글 삭제 시작:", postId);

  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase
      .from("royal_recipes_posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", clerkUser.id); // 자신의 글만 삭제 가능

    if (error) {
      console.error("데이터베이스 삭제 오류:", error);
      return {
        success: false,
        error: "글 삭제 중 오류가 발생했습니다.",
      };
    }

    console.log("글 삭제 완료:", postId);

    revalidatePath("/admin/recipes");

    return {
      success: true,
    };

  } catch (error) {
    console.error("예상치 못한 오류:", error);
    return {
      success: false,
      error: "알 수 없는 오류가 발생했습니다.",
    };
  } finally {
    console.groupEnd();
  }
}
