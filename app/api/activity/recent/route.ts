/**
 * @file app/api/activity/recent/route.ts
 * @description 최근 활동 피드 API
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = await createClerkSupabaseClient();

    // 임시: 최근 커뮤니티 게시글을 활동으로 반환
    // TODO: user_behavior_logs 테이블 생성 후 실제 활동 데이터로 변경
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        title,
        type,
        created_at,
        author:users!community_posts_author_id_fkey (
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 활동 데이터로 변환
    const activities = (posts || []).map((post: any) => ({
      id: post.id,
      type: "post" as const,
      userName: post.author?.name || "익명",
      targetTitle: post.title,
      targetType: "post" as const,
      targetId: post.id,
      createdAt: post.created_at,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[ActivityAPI] 오류:", error);
    return NextResponse.json(
      { activities: [] },
      { status: 200 }
    );
  }
}

