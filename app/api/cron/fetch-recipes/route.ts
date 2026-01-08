/**
 * @file app/api/cron/fetch-recipes/route.ts
 * @description 레시피 자동 확보 배치 작업 API
 *
 * 주요 기능:
 * 1. 주기적 레시피 수집 (Cron 작업)
 * 2. 자동 메타데이터 생성 및 저장
 * 3. 품질 검증 및 중복 제거
 *
 * @dependencies
 * - lib/recipes/recipe-fetcher/index.ts: fetchRecipes
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchRecipes } from "@/lib/recipes/recipe-fetcher";

/**
 * 레시피 자동 확보 배치 작업
 * 
 * GET /api/cron/fetch-recipes
 * 
 * 쿼리 파라미터:
 * - source: 'web' | 'api' | 'all' (기본값: 'all')
 * - maxResults: number (기본값: 50)
 * - keywords: string[] (쉼표로 구분)
 */
export async function GET(request: NextRequest) {
  console.group("📥 레시피 자동 확보 배치 작업 시작");

  try {
    // 인증 확인 (Cron 작업은 특별한 헤더로 보호)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const source = (searchParams.get("source") || "all") as "web" | "api" | "all";
    const maxResults = parseInt(searchParams.get("maxResults") || "50", 10);
    const keywordsParam = searchParams.get("keywords");
    const keywords = keywordsParam ? keywordsParam.split(",") : [];

    console.log("수집 옵션:", { source, maxResults, keywords });

    // 기본 키워드 (없는 경우)
    const defaultKeywords = [
      "한식",
      "반찬",
      "밑반찬",
      "국",
      "찌개",
      "볶음",
      "구이",
      "조림",
    ];

    const finalKeywords = keywords.length > 0 ? keywords : defaultKeywords;

    // 레시피 수집 실행
    const result = await fetchRecipes({
      source,
      maxResults,
      keywords: finalKeywords,
    });

    console.log("✅ 배치 작업 완료:", {
      totalFetched: result.totalFetched,
      totalValidated: result.totalValidated,
      totalSaved: result.totalSaved,
      errors: result.errors.length,
    });

    console.groupEnd();

    return NextResponse.json({
      success: result.success,
      totalFetched: result.totalFetched,
      totalValidated: result.totalValidated,
      totalSaved: result.totalSaved,
      errors: result.errors,
      message: `레시피 ${result.totalSaved}개 저장 완료`,
    });
  } catch (error) {
    console.error("❌ 배치 작업 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

