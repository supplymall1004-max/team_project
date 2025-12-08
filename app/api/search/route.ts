/**
 * @file api/search/route.ts
 * @description 통합 검색 API (레시피 검색)
 *
 * 주요 기능:
 * 1. 레시피 검색
 * 2. 관련도순 정렬
 * 3. 타입별 태그 표시
 */

import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json(
        { error: "검색어를 입력해주세요" },
        { status: 400 }
      );
    }

    console.groupCollapsed("[SearchAPI] 통합 검색");
    console.log("query", query);
    console.log("limit", limit);

    const supabase = await createClerkSupabaseClient();
    const results: Array<{
      id: string;
      type: "recipe";
      title: string;
      description: string | null;
      thumbnail_url: string | null;
      slug: string;
      relevance_score: number;
      metadata?: Record<string, any>;
    }> = [];

    // 1. 레시피 검색
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select(
        `
        id,
        slug,
        title,
        description,
        thumbnail_url,
        rating_stats:recipe_rating_stats(rating_count, average_rating)
        `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!recipesError && recipes) {
      recipes.forEach((recipe) => {
        // 관련도 점수 계산 (제목 매칭 > 설명 매칭, 별점 고려)
        const titleMatch = recipe.title.toLowerCase().includes(query.toLowerCase());
        const descriptionMatch = recipe.description?.toLowerCase().includes(query.toLowerCase());
        const rating = parseFloat((recipe.rating_stats as any)?.[0]?.average_rating || "0") || 0;
        const ratingCount = (recipe.rating_stats as any)?.[0]?.rating_count || 0;

        let relevanceScore = 0;
        if (titleMatch) relevanceScore += 100;
        if (descriptionMatch) relevanceScore += 30;
        relevanceScore += rating * 10;
        relevanceScore += Math.min(ratingCount, 100) * 0.1;

        results.push({
          id: recipe.id,
          type: "recipe",
          title: recipe.title,
          description: recipe.description,
          thumbnail_url: recipe.thumbnail_url,
          slug: recipe.slug,
          relevance_score: relevanceScore,
          metadata: {
            rating: rating,
            rating_count: ratingCount,
          },
        });
      });
    }


    // 관련도순 정렬
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    // 최대 개수 제한
    const limitedResults = results.slice(0, limit);

    console.log("results count", limitedResults.length);
    console.groupEnd();

    return NextResponse.json(
      {
        query,
        results: limitedResults,
        total: limitedResults.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("search error", error);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

