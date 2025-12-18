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
  try {
    console.group("[API] GET /api/health/medical-facilities/geocode");

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

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

    console.log(`📍 주소: ${address}`);

    const result = await geocodeAddress(address);

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
    if (errorMessage.includes("인증") || errorMessage.includes("Authentication")) {
      return NextResponse.json(
        {
          success: false,
          error: "Maps API 인증에 실패했습니다. 네이버 클라우드 플랫폼 콘솔에서 Maps API 서비스 활성화 및 API 키를 확인해주세요.",
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

