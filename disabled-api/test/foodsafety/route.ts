/**
 * @file app/api/test/foodsafety/route.ts
 * @description 식약처 API 연결 테스트용 엔드포인트
 * 
 * 이 파일은 .env에 설정된 식약처 API 키가 정상적으로 작동하는지 확인합니다.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.group("🔍 식약처 API 연결 테스트");

  try {
    // 1. 환경 변수 확인
    const apiKey = process.env.FOOD_SAFETY_RECIPE_API_KEY;
    
    console.log("API 키 존재 여부:", !!apiKey);
    console.log("API 키 길이:", apiKey?.length);
    
    if (!apiKey) {
      console.error("❌ FOOD_SAFETY_RECIPE_API_KEY가 .env 파일에 설정되지 않았습니다.");
      console.groupEnd();
      
      return NextResponse.json(
        {
          success: false,
          error: "API 키가 설정되지 않았습니다.",
          message: ".env 파일에 FOOD_SAFETY_RECIPE_API_KEY를 추가해주세요.",
        },
        { status: 500 }
      );
    }

    // 2. 식약처 API 테스트 호출 (레시피 조회 API)
    // 식약처 레시피 API: http://openapi.foodsafetykorea.go.kr/api/{인증키}/COOKRCP01/json/1/5
    const testUrl = `http://openapi.foodsafetykorea.go.kr/api/${apiKey}/COOKRCP01/json/1/5`;
    
    console.log("테스트 URL:", testUrl.replace(apiKey, "***KEY***")); // 보안을 위해 키는 숨김

    // 타임아웃 설정 (60초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(testUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();

    console.log("응답 상태:", response.status);
    console.log("응답 데이터:", data);

    // 3. 응답 분석
    if (!response.ok) {
      console.error("❌ API 호출 실패:", response.status, response.statusText);
      console.groupEnd();
      
      return NextResponse.json(
        {
          success: false,
          error: `API 호출 실패: ${response.status} ${response.statusText}`,
          data,
        },
        { status: response.status }
      );
    }

    // 식약처 API는 성공 시 COOKRCP01 객체를 반환
    if (data.COOKRCP01?.RESULT?.CODE === "INFO-000") {
      console.log("✅ 식약처 API 연결 성공!");
      console.log(`📊 조회된 레시피 수: ${data.COOKRCP01.total_count}개`);
      console.groupEnd();

      return NextResponse.json({
        success: true,
        message: "식약처 API가 정상적으로 작동합니다!",
        totalCount: data.COOKRCP01.total_count,
        sampleRecipes: data.COOKRCP01.row?.slice(0, 3).map((recipe: any) => ({
          name: recipe.RCP_NM, // 레시피 이름
          calories: recipe.INFO_ENG, // 칼로리
          category: recipe.RCP_PAT2, // 요리 종류
        })),
        rawData: data,
      });
    }

    // 에러 코드가 있는 경우
    if (data.COOKRCP01?.RESULT?.CODE) {
      const errorCode = data.COOKRCP01.RESULT.CODE;
      const errorMsg = data.COOKRCP01.RESULT.MSG;
      
      console.error("❌ 식약처 API 오류:", errorCode, errorMsg);
      console.groupEnd();

      return NextResponse.json(
        {
          success: false,
          error: `식약처 API 오류: ${errorCode}`,
          message: errorMsg,
          details: "API 키가 유효하지 않거나 사용 승인이 완료되지 않았을 수 있습니다.",
        },
        { status: 400 }
      );
    }

    // 예상치 못한 응답 형식
    console.warn("⚠️ 예상치 못한 응답 형식:", data);
    console.groupEnd();

    return NextResponse.json({
      success: false,
      error: "예상치 못한 응답 형식",
      data,
    });

  } catch (error) {
    console.error("❌ 식약처 API 테스트 중 오류 발생:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: "API 테스트 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

