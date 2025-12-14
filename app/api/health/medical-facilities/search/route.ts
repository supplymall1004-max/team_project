/**
 * @file route.ts
 * @description 의료기관 검색 API 엔드포인트
 *
 * 네이버 로컬 검색 API를 프록시하여 의료기관을 검색합니다.
 * 서버 사이드에서 API 키를 보호합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchLocal } from "@/lib/naver/local-api";
import {
  convertToMedicalFacilities,
  generateSearchKeyword,
} from "@/lib/health/medical-facilities/facility-utils";
import type { MedicalFacilityCategory } from "@/types/medical-facility";

/**
 * GET /api/health/medical-facilities/search
 *
 * 의료기관 검색 API
 *
 * Query Parameters:
 * - query: 검색어 (선택사항, 카테고리만으로도 검색 가능)
 * - category: 의료기관 카테고리 (hospital, pharmacy, animal_hospital, animal_pharmacy)
 * - lat: 사용자 위도 (선택사항)
 * - lon: 사용자 경도 (선택사항)
 * - display: 표시할 결과 수 (기본 10, 최대 100)
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/medical-facilities/search");

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category") as MedicalFacilityCategory | null;
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const displayParam = searchParams.get("display");

    // 카테고리 검증
    if (!category) {
      console.error("❌ 카테고리가 제공되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "카테고리(category) 파라미터가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const validCategories: MedicalFacilityCategory[] = [
      "hospital",
      "pharmacy",
      "animal_hospital",
      "animal_pharmacy",
    ];

    if (!validCategories.includes(category)) {
      console.error(`❌ 유효하지 않은 카테고리: ${category}`);
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 카테고리입니다. 가능한 값: ${validCategories.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 검색어 생성
    // query가 제공되면 사용, 없으면 카테고리만 사용
    const searchQuery = query || generateSearchKeyword(category);
    
    // 좌표 파싱
    const lat = latParam ? parseFloat(latParam) : undefined;
    const lon = lonParam ? parseFloat(lonParam) : undefined;
    const display = displayParam ? parseInt(displayParam, 10) : 10;

    // 로그 출력
    console.log(`🔍 검색어: "${searchQuery}"`);
    console.log(`📂 카테고리: ${category}`);
    console.log(`📍 좌표: ${lat !== undefined && lon !== undefined ? `${lat}, ${lon}` : "없음"}`);

    // 네이버 로컬 검색 API 호출
    let searchResult;
    try {
      searchResult = await searchLocal(searchQuery, {
        display: Math.min(display, 100), // 최대 100개
        start: 1,
        lat,
        lon,
      });
      console.log(`📊 네이버 API 응답: ${searchResult.total}개 중 ${searchResult.items.length}개 반환`);
    } catch (apiError) {
      console.error("❌ 네이버 로컬 검색 API 호출 실패:", apiError);
      const apiErrorMessage =
        apiError instanceof Error ? apiError.message : "네이버 로컬 검색 API 호출 실패";
      
      // API 키 관련 에러인지 확인
      if (apiErrorMessage.includes("API 키") || apiErrorMessage.includes("인증")) {
        console.error("💡 API 키 설정이 필요합니다. .env.local 파일을 확인하세요.");
        console.error("   - NAVER_SEARCH_CLIENT_ID 또는 NAVER_CLIENT_ID");
        console.error("   - NAVER_SEARCH_CLIENT_SECRET 또는 NAVER_CLIENT_SECRET");
      }
      
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: apiErrorMessage,
        },
        { status: 500 }
      );
    }

    // 검색 결과 확인
    if (!searchResult || !searchResult.items || searchResult.items.length === 0) {
      console.warn("⚠️ 검색 결과가 없습니다.");
      console.groupEnd();
      return NextResponse.json({
        success: true,
        data: {
          facilities: [],
          total: 0,
          display: 0,
        },
      });
    }

    // 의료기관 데이터로 변환
    let facilities;
    try {
      facilities = convertToMedicalFacilities(
        searchResult.items,
        category,
        lat,
        lon
      );
      console.log(`✅ 변환 완료: ${facilities.length}개 의료기관`);
    } catch (convertError) {
      console.error("❌ 데이터 변환 실패:", convertError);
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "의료기관 데이터 변환 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    console.log(`✅ 검색 완료: ${facilities.length}개 의료기관 발견`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        facilities,
        total: searchResult.total,
        display: searchResult.display,
      },
    });
  } catch (error) {
    console.error("❌ 의료기관 검색 API 오류:", error);
    console.error("오류 상세:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.groupEnd();

    const errorMessage =
      error instanceof Error ? error.message : "의료기관 검색 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

