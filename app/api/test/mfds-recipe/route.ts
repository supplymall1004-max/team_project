/**
 * @file app/api/test/mfds-recipe/route.ts
 * @description 식약처 레시피 조회 API (테스트용)
 * 
 * 클라이언트에서 식약처 API를 호출하기 위한 서버 사이드 API 라우트입니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchFoodSafetyRecipes, type FoodSafetyApiOptions } from "@/lib/recipes/foodsafety-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rcpSeq = searchParams.get("rcpSeq");
    const startIdx = searchParams.get("startIdx");
    const endIdx = searchParams.get("endIdx");

    console.group("[MFDS Recipe API] 레시피 조회 요청");
    console.log("rcpSeq:", rcpSeq);
    console.log("startIdx:", startIdx);
    console.log("endIdx:", endIdx);

    const options: FoodSafetyApiOptions = {
      startIdx: startIdx ? parseInt(startIdx, 10) : 1,
      endIdx: endIdx ? parseInt(endIdx, 10) : 1000,
      rcpSeq: rcpSeq || undefined,
    };

    const result = await fetchFoodSafetyRecipes(options);

    if (result.success) {
      console.log("✅ 레시피 조회 성공");
      console.groupEnd();
      return NextResponse.json({
        success: true,
        data: result.data,
        totalCount: result.totalCount,
      });
    } else {
      console.error("❌ 레시피 조회 실패:", result.error);
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ API 라우트 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

