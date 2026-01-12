/**
 * @file route.ts
 * @description 주소 지오코딩 API 엔드포인트
 *
 * 주소를 좌표로 변환하는 API입니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/naver/geocoding-api";

/**
 * GET /api/health/medical-facilities/geocode
 *
 * 주소를 좌표로 변환
 *
 * Query Parameters:
 * - address: 검색할 주소
 */
export async function GET(request: NextRequest) {
  // 즉시 로그 출력 (라우트가 호출되는지 확인)
  console.log("=".repeat(50));
  console.log("[API] GET /api/health/medical-facilities/geocode - 라우트 호출됨!");
  console.log("=".repeat(50));
  
  try {
    console.group("[API] GET /api/health/medical-facilities/geocode");
    console.log("🌐 API 라우트 호출됨");

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    console.log(`📥 받은 주소 파라미터: "${address}"`);

    if (!address) {
      console.error("❌ 주소가 제공되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "주소(address) 파라미터가 필요합니다.",
        },
        { status: 400 }
      );
    }

    console.log(`📍 지오코딩 시작: ${address}`);
    console.log(`🔑 환경변수 확인: NAVER_CLIENT_ID=${process.env.NAVER_CLIENT_ID ? process.env.NAVER_CLIENT_ID.substring(0, 5) + "..." : "없음"}`);

    const result = await geocodeAddress(address);
    console.log(`📊 geocodeAddress 결과:`, result ? `성공 (${result.lat}, ${result.lon})` : "null (주소를 찾을 수 없음)");

    if (!result) {
      console.warn("⚠️ 주소를 찾을 수 없습니다.");
      console.warn(`   검색한 주소: ${address}`);
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: `주소를 찾을 수 없습니다. "${address}"에 대한 검색 결과가 없습니다. 더 구체적인 주소를 입력해보세요 (예: "서울시청", "인천광역시 미추홀구청").`,
        },
        { status: 404 }
      );
    }

    // 지역명은 geocodeAddress에서 추출된 것을 사용
    const locationName = result.locationName || null;

    console.log(`✅ 좌표 변환 성공: ${result.lat}, ${result.lon}`);
    if (locationName) {
      console.log(`📍 지역명: ${locationName}`);
    }
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        lat: result.lat,
        lon: result.lon,
        address: locationName, // 지역명 포함
      },
    });
  } catch (error) {
    console.error("❌ 지오코딩 API 오류:", error);
    console.groupEnd();

    const errorMessage = error instanceof Error ? error.message : "지오코딩 중 오류가 발생했습니다.";
    
    // 인증 실패인 경우 401로 반환
    if (errorMessage.includes("인증") || errorMessage.includes("Authentication") || errorMessage.includes("Maps API")) {
      return NextResponse.json(
        {
          success: false,
          error: "네이버 Maps API 인증에 실패했습니다.",
          details: "네이버 클라우드 플랫폼 콘솔에서 Maps API 서비스를 활성화하고 올바른 API 키를 발급받아 .env.local 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요. (2025년 7월 1일부터 Maps API는 새로운 키가 필요합니다)",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

