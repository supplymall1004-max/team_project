/**
 * @file app/api/mfds/medication-overview/test/route.ts
 * @description 식약처 의약품개요정보 API 테스트 라우트
 * 
 * GET /api/mfds/medication-overview/test - API 연결 테스트
 */

import { NextRequest, NextResponse } from "next/server";
import { searchMedicationOverviewByName } from "@/lib/mfds/medication-overview-client";

/**
 * GET /api/mfds/medication-overview/test
 * 의약품개요정보 API 테스트
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/mfds/medication-overview/test");

    // 환경 변수 확인
    const apiKey = process.env.MFDS_MEDICATION_OVERVIEW_API_KEY || process.env.MFDS_API_KEY;
    console.log("환경 변수 확인:", {
      hasMFDS_MEDICATION_OVERVIEW_API_KEY: !!process.env.MFDS_MEDICATION_OVERVIEW_API_KEY,
      hasMFDS_API_KEY: !!process.env.MFDS_API_KEY,
      hasApiKey: !!apiKey,
    });

    if (!apiKey) {
      console.error("❌ API 키가 설정되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "API 키가 설정되지 않았습니다.",
          message: ".env.local 파일에 MFDS_API_KEY 또는 MFDS_MEDICATION_OVERVIEW_API_KEY를 설정해주세요.",
        },
        { status: 400 }
      );
    }

    // 테스트 검색어
    const searchParams = request.nextUrl.searchParams;
    const testItemName = searchParams.get("itemName") || "타이레놀";

    console.log("테스트 검색어:", testItemName);

    // API 호출 테스트
    const result = await searchMedicationOverviewByName(testItemName, 1, 5);

    console.log("✅ API 테스트 성공");
    console.log("조회 결과:", {
      totalCount: result.totalCount,
      itemsCount: result.items.length,
      firstItem: result.items[0] ? {
        item_name: result.items[0].item_name,
        entp_name: result.items[0].entp_name,
        ingr_name: result.items[0].ingr_name,
      } : null,
    });
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "의약품개요정보 API 연결 성공",
      data: {
        totalCount: result.totalCount,
        itemsCount: result.items.length,
        items: result.items.slice(0, 3), // 처음 3개만 반환
        testItemName,
      },
    });
  } catch (error) {
    console.error("❌ API 테스트 실패:", error);
    
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
      console.error("에러 스택:", error.stack);
      console.error("에러 이름:", error.name);
    } else {
      console.error("에러 객체:", JSON.stringify(error, null, 2));
    }
    
    console.groupEnd();

    // 사용자 친화적인 에러 메시지 생성
    let userMessage = "의약품개요정보 API 연결에 실패했습니다.";
    if (error instanceof Error) {
      if (error.message.includes("API 키")) {
        userMessage = "API 키가 설정되지 않았거나 유효하지 않습니다. 환경 변수를 확인해주세요.";
      } else if (error.message.includes("네트워크") || error.message.includes("fetch")) {
        userMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
      } else if (error.message.includes("파싱") || error.message.includes("JSON")) {
        userMessage = "API 응답을 처리할 수 없습니다. API 서버 상태를 확인해주세요.";
      } else {
        userMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "API 테스트 실패",
        message: userMessage,
        details: error instanceof Error ? error.message : String(error),
        // 개발 환경에서만 상세 정보 제공
        ...(process.env.NODE_ENV === "development" && {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorString: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

