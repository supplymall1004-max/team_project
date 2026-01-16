/**
 * @file app/api/community/qa-posts/route.ts
 * @description Q&A 게시글 조회 API
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = await createClerkSupabaseClient();

    // Q&A 게시글 조회 (임시: 최근 커뮤니티 게시글 반환)
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        title,
        content,
        type,
        created_at,
        author:users!community_posts_author_id_fkey (
          name,
          is_expert,
          expert_field
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Q&A 형식으로 변환
    const qaPosts = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorName: post.author?.name || "익명",
      isExpert: post.author?.is_expert || false,
      expertField: post.author?.expert_field,
      answerCount: 0, // TODO: 실제 댓글 수 계산
      hasBestAnswer: false, // TODO: 실제 베스트 답변 여부
      createdAt: post.created_at,
    }));

    return NextResponse.json({ posts: qaPosts });
  } catch (error) {
    console.error("[QAPostsAPI] 오류:", error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}

