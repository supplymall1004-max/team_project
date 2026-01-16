/**
 * @file app/api/trending/recipes/route.ts
 * @description 트렌딩 레시피 API (인기 순위)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = await createClerkSupabaseClient();

    // 임시: 최신 레시피를 트렌딩으로 반환
    // TODO: recipe_popularity materialized view 생성 후 실제 인기도 기반으로 변경
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 임시 트렌딩 데이터 추가
    const trendingRecipes = (recipes || []).map((recipe, index) => ({
      ...recipe,
      trending: {
        viewCount: Math.floor(Math.random() * 1000) + 100,
        likeCount: Math.floor(Math.random() * 100) + 10,
        saveCount: Math.floor(Math.random() * 50) + 5,
        popularityScore: Math.floor(Math.random() * 500) + 100,
      },
    }));

    return NextResponse.json({ recipes: trendingRecipes });
  } catch (error) {
    console.error("[TrendingAPI] 오류:", error);
    return NextResponse.json(
      { recipes: [] },
      { status: 200 }
    );
  }
}

