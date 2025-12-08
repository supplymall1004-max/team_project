/**
 * @file app/api/mfds-recipes/search/route.ts
 * @description 식약처 레시피 검색 API 라우트
 *
 * 주요 기능:
 * 1. 레시피 이름으로 식약처 API 검색
 * 2. 검색 결과 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { searchFoodSafetyRecipesByName } from "@/lib/recipes/foodsafety-api";
import type { RecipeItem } from "@/lib/services/mfds-recipe-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/mfds-recipes/search
 * 레시피 이름으로 검색하는 API 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[MFDS Search API] 검색 요청 시작");

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    console.log("검색어:", query);
    console.log("제한:", limit);

    if (!query.trim()) {
      console.warn("검색어가 없습니다.");
      return NextResponse.json(
        {
          success: false,
          error: "검색어를 입력해주세요.",
          recipes: [],
        },
        { status: 400 }
      );
    }

    // 식약처 API 검색
    const result = await searchFoodSafetyRecipesByName(query, {
      startIdx: 1,
      endIdx: 1000,
      maxRetries: 3,
      retryDelay: 1000,
    });

    if (!result.success || !result.data) {
      console.error("검색 실패:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "검색에 실패했습니다.",
          recipes: [],
        },
        { status: 500 }
      );
    }

    // RecipeItem 형식으로 변환
    const recipes: RecipeItem[] = result.data.slice(0, limit).map((recipe) => ({
      RCP_SEQ: recipe.RCP_SEQ,
      RCP_NM: recipe.RCP_NM,
      RCP_WAY2: recipe.RCP_WAY2,
      RCP_PAT2: recipe.RCP_PAT2,
      INFO_ENG: recipe.INFO_ENG,
      INFO_CAR: recipe.INFO_CAR,
      INFO_PRO: recipe.INFO_PRO,
      INFO_FAT: recipe.INFO_FAT,
      INFO_NA: recipe.INFO_NA,
      INFO_FIBER: recipe.INFO_FIBER,
      INFO_K: recipe.INFO_K,
      INFO_P: recipe.INFO_P,
      INFO_GI: recipe.INFO_GI,
      RCP_PARTS_DTLS: recipe.RCP_PARTS_DTLS,
      MANUAL01: recipe.MANUAL01,
      MANUAL02: recipe.MANUAL02,
      MANUAL03: recipe.MANUAL03,
      MANUAL04: recipe.MANUAL04,
      MANUAL05: recipe.MANUAL05,
      MANUAL06: recipe.MANUAL06,
      MANUAL07: recipe.MANUAL07,
      MANUAL08: recipe.MANUAL08,
      MANUAL09: recipe.MANUAL09,
      MANUAL10: recipe.MANUAL10,
      MANUAL11: recipe.MANUAL11,
      MANUAL12: recipe.MANUAL12,
      MANUAL13: recipe.MANUAL13,
      MANUAL14: recipe.MANUAL14,
      MANUAL15: recipe.MANUAL15,
      MANUAL16: recipe.MANUAL16,
      MANUAL17: recipe.MANUAL17,
      MANUAL18: recipe.MANUAL18,
      MANUAL19: recipe.MANUAL19,
      MANUAL20: recipe.MANUAL20,
      MANUAL_IMG01: recipe.MANUAL_IMG01,
      MANUAL_IMG02: recipe.MANUAL_IMG02,
      MANUAL_IMG03: recipe.MANUAL_IMG03,
      MANUAL_IMG04: recipe.MANUAL_IMG04,
      MANUAL_IMG05: recipe.MANUAL_IMG05,
      MANUAL_IMG06: recipe.MANUAL_IMG06,
      MANUAL_IMG07: recipe.MANUAL_IMG07,
      MANUAL_IMG08: recipe.MANUAL_IMG08,
      MANUAL_IMG09: recipe.MANUAL_IMG09,
      MANUAL_IMG10: recipe.MANUAL_IMG10,
      MANUAL_IMG11: recipe.MANUAL_IMG11,
      MANUAL_IMG12: recipe.MANUAL_IMG12,
      MANUAL_IMG13: recipe.MANUAL_IMG13,
      MANUAL_IMG14: recipe.MANUAL_IMG14,
      MANUAL_IMG15: recipe.MANUAL_IMG15,
      MANUAL_IMG16: recipe.MANUAL_IMG16,
      MANUAL_IMG17: recipe.MANUAL_IMG17,
      MANUAL_IMG18: recipe.MANUAL_IMG18,
      MANUAL_IMG19: recipe.MANUAL_IMG19,
      MANUAL_IMG20: recipe.MANUAL_IMG20,
      ATT_FILE_NO_MAIN: recipe.ATT_FILE_NO_MAIN,
      ATT_FILE_NO_MK: recipe.ATT_FILE_NO_MK,
      HASH_TAG: undefined,
      RCP_WAY: undefined,
      RCP_PAT: undefined,
    }));

    console.log(`✅ ${recipes.length}개의 레시피 검색 성공`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      recipes,
      totalCount: recipes.length,
    });
  } catch (error) {
    console.error("[MFDS Search API] 검색 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "검색 중 오류가 발생했습니다.",
        recipes: [],
      },
      { status: 500 }
    );
  }
}













