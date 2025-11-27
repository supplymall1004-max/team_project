/**
 * @file api/search/route.ts
 * @description 통합 검색 API (레시피 + 레거시 아카이브 + 기타)
 *
 * 주요 기능:
 * 1. 레시피 검색
 * 2. 레거시 아카이브 검색
 * 3. 관련도순 정렬
 * 4. 타입별 태그 표시
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
      type: "recipe" | "legacy_video" | "legacy_document";
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

    // 2. 레거시 비디오 검색
    const { data: legacyVideos, error: videosError } = await supabase
      .from("legacy_videos")
      .select(
        `
        id,
        slug,
        title,
        description,
        thumbnail_url,
        master:legacy_masters(name, region)
        `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (!videosError && legacyVideos) {
      legacyVideos.forEach((video) => {
        const titleMatch = video.title.toLowerCase().includes(query.toLowerCase());
        const descriptionMatch = video.description?.toLowerCase().includes(query.toLowerCase());

        let relevanceScore = 0;
        if (titleMatch) relevanceScore += 100;
        if (descriptionMatch) relevanceScore += 30;

        results.push({
          id: video.id,
          type: "legacy_video",
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail_url,
          slug: video.slug,
          relevance_score: relevanceScore,
          metadata: {
            master: (video.master as any)?.name,
            region: (video.master as any)?.region,
          },
        });
      });
    }

    // 3. 레거시 문서 검색
    const { data: legacyDocs, error: docsError } = await supabase
      .from("legacy_documents")
      .select(
        `
        id,
        title,
        summary,
        region,
        era
        `
      )
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .limit(limit);

    if (!docsError && legacyDocs) {
      legacyDocs.forEach((doc) => {
        const titleMatch = doc.title.toLowerCase().includes(query.toLowerCase());
        const summaryMatch = doc.summary?.toLowerCase().includes(query.toLowerCase());

        let relevanceScore = 0;
        if (titleMatch) relevanceScore += 100;
        if (summaryMatch) relevanceScore += 30;

        results.push({
          id: doc.id,
          type: "legacy_document",
          title: doc.title,
          description: doc.summary,
          thumbnail_url: null,
          slug: `legacy/${doc.id}`, // 문서는 ID 기반
          relevance_score: relevanceScore,
          metadata: {
            region: doc.region,
            era: doc.era,
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

