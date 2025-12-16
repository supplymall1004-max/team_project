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
import { searchPharmacies, PharmacySearchParams } from "@/lib/health/pharmacy-api";
import { calculateDistance } from "@/lib/health/medical-facilities/location-utils";
import type { MedicalFacilityCategory } from "@/types/medical-facility";

/**
 * 카테고리에 맞는 검색 키워드 생성 (폴백 함수)
 * generateSearchKeyword가 로드되지 않은 경우를 대비
 */
function getSearchKeywordFallback(category: MedicalFacilityCategory): string {
  const keywords: Record<MedicalFacilityCategory, string> = {
    hospital: "병원",
    pharmacy: "약국",
    animal_hospital: "동물병원",
    animal_pharmacy: "동물약국",
  };
  return keywords[category] || "병원";
}

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

    // 좌표 파싱
    const lat = latParam ? parseFloat(latParam) : undefined;
    const lon = lonParam ? parseFloat(lonParam) : undefined;
    const display = displayParam ? parseInt(displayParam, 10) : 10;

    // 검색어 생성
    // 좌표가 제공되고 query에 지역명이 포함되어 있으면, 좌표 기반 검색을 위해 지역명 제거
    let searchQuery: string;
    const hasCoordinates = lat !== undefined && lon !== undefined;
    
    if (query) {
      // query가 제공된 경우
      // 좌표가 있고 지역명이 포함되어 있으면 카테고리만 사용 (좌표 기반 검색)
      const hasLocationName = 
        query.includes("시") || 
        query.includes("구") || 
        query.includes("군") || 
        query.includes("동") ||
        query.includes("서울") ||
        query.includes("부산") ||
        query.includes("대구") ||
        query.includes("인천") ||
        query.includes("광주") ||
        query.includes("대전") ||
        query.includes("울산");
      
      if (hasCoordinates && hasLocationName) {
        // 좌표 기반 검색: 지역명 제거하고 카테고리만 사용
        try {
          if (typeof generateSearchKeyword === "function") {
            searchQuery = generateSearchKeyword(category);
          } else {
            searchQuery = getSearchKeywordFallback(category);
            console.warn(`⚠️ generateSearchKeyword가 함수가 아닙니다. 폴백 사용: "${searchQuery}"`);
          }
          console.log(`📍 좌표 기반 검색: 지역명 제거, 카테고리만 사용`);
          console.log(`   원래 검색어: "${query}"`);
          console.log(`   변경된 검색어: "${searchQuery}"`);
          console.log(`   이유: 좌표(${lat}, ${lon})가 제공되었으므로 지역명을 제거하여 좌표 기반 검색`);
        } catch (error) {
          console.error(`❌ generateSearchKeyword 호출 실패:`, error);
          searchQuery = getSearchKeywordFallback(category);
          console.log(`⚠️ 폴백 검색어 사용: "${searchQuery}"`);
        }
      } else {
        // 주소 검색: query 그대로 사용
        searchQuery = query;
      }
    } else {
      // query가 없으면 카테고리만 사용
      try {
        if (typeof generateSearchKeyword === "function") {
          searchQuery = generateSearchKeyword(category);
        } else {
          searchQuery = getSearchKeywordFallback(category);
          console.warn(`⚠️ generateSearchKeyword가 함수가 아닙니다. 폴백 사용: "${searchQuery}"`);
        }
      } catch (error) {
        console.error(`❌ generateSearchKeyword 호출 실패:`, error);
        searchQuery = getSearchKeywordFallback(category);
        console.log(`⚠️ 폴백 검색어 사용: "${searchQuery}"`);
      }
    }
    
    // 좌표가 있는데 검색어에 지역명이 여전히 포함되어 있는지 확인
    const expectedKeyword = typeof generateSearchKeyword === "function" 
      ? generateSearchKeyword(category) 
      : getSearchKeywordFallback(category);
    if (hasCoordinates && searchQuery !== expectedKeyword) {
      const stillHasLocationName = 
        searchQuery.includes("시") || 
        searchQuery.includes("구") || 
        searchQuery.includes("군") || 
        searchQuery.includes("동");
      
      if (stillHasLocationName) {
        console.warn(`⚠️ 경고: 좌표 기반 검색인데 검색어에 지역명이 포함되어 있습니다.`);
        console.warn(`   검색어: "${searchQuery}"`);
        console.warn(`   좌표: ${lat}, ${lon}`);
        console.warn(`   지역명이 포함되면 해당 지역만 검색될 수 있습니다.`);
      }
    }

    // 로그 출력
    console.log(`🔍 최종 검색어: "${searchQuery}"`);
    console.log(`📂 카테고리: ${category}`);
    console.log(`📍 좌표: ${lat !== undefined && lon !== undefined ? `위도 ${lat}, 경도 ${lon}` : "없음"}`);
    if (lat !== undefined && lon !== undefined) {
      console.log(`📍 좌표 기반 검색 모드: 거리순 정렬 활성화`);
    }

    let facilities: any[] = [];

    // 모든 카테고리(약국 포함)에서 네이버 로컬 검색 API 사용
    // 네이버 지도에서 약국 검색 결과를 가져오기 위해 네이버 로컬 검색 API 사용
    console.log(`🔍 ${category} 카테고리: 네이버 로컬 검색 API 사용 (네이버 지도 검색 결과)`);

    let searchResult;
    try {
      searchResult = await searchLocal(searchQuery, {
        display: Math.min(display, 100), // 최대 100개
        start: 1,
        lat,
        lon,
      });
      console.log(`📊 네이버 API 응답: ${searchResult.total}개 중 ${searchResult.items.length}개 반환`);

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
      console.log(`🔄 네이버 API 응답 변환 시작: ${searchResult.items.length}개 아이템`);
      facilities = convertToMedicalFacilities(
        searchResult.items,
        category,
        lat,
        lon
      );
      console.log(`✅ 변환 완료: ${facilities.length}개 의료기관`);
      
      // 변환 실패한 항목이 있는지 확인
      if (searchResult.items.length > facilities.length) {
        console.warn(`⚠️ 일부 항목 변환 실패: ${searchResult.items.length}개 → ${facilities.length}개`);
      }
      
      // 변환된 의료기관 샘플 로그 (처음 3개)
      if (facilities.length > 0) {
        console.log(`📋 변환된 의료기관 샘플 (처음 3개):`);
        facilities.slice(0, 3).forEach((facility, idx) => {
          console.log(`   ${idx + 1}. ${facility.name} (${facility.category})`);
          console.log(`      - 주소: ${facility.address}`);
          console.log(`      - 거리: ${facility.distance?.toFixed(2) ?? 'N/A'}km`);
          console.log(`      - 영업 상태: ${facility.operatingHours?.todayStatus ?? 'unknown'}`);
        });
      }
      
      // 약국 카테고리인 경우 운영 중인 약국 우선 표시 (필터링은 하지 않음)
      // 모든 약국을 표시하되, 운영 중인 약국을 우선 정렬
      if (category === 'pharmacy') {
        const totalCount = facilities.length;
        const open24HoursCount = facilities.filter(f => f.operatingHours?.is24Hours).length;
        const openNowCount = facilities.filter(f => f.operatingHours?.todayStatus === 'open').length;
        const unknownStatusCount = facilities.filter(f => 
          !f.operatingHours || 
          !f.operatingHours.todayStatus || 
          f.operatingHours.todayStatus === 'unknown'
        ).length;
        const closedCount = facilities.filter(f => f.operatingHours?.todayStatus === 'closed').length;
        
        console.log(`💊 약국 검색 결과: 총 ${totalCount}개`);
        console.log(`   - 24시간 영업: ${open24HoursCount}개`);
        console.log(`   - 현재 영업 중: ${openNowCount}개`);
        console.log(`   - 영업 상태 불명: ${unknownStatusCount}개`);
        console.log(`   - 영업 종료/휴무: ${closedCount}개`);
        console.log(`   ℹ️ 모든 약국을 표시하며, 운영 중인 약국을 우선 정렬합니다.`);
      }
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
    if (facilities.length === 0) {
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
      
      // 좌표가 제공된 경우 거리순 정렬 (24시간 영업 우선)
      if (lat !== undefined && lon !== undefined && facilities.length > 0) {
        // 24시간 영업 의료기관을 먼저 정렬하고, 그 다음 거리순 정렬
        facilities.sort((a, b) => {
          // 1순위: 24시간 영업 여부 (24시간 영업이 먼저)
          const aIs24Hours = a.operatingHours?.is24Hours ? 1 : 0;
          const bIs24Hours = b.operatingHours?.is24Hours ? 1 : 0;
          
          if (aIs24Hours !== bIs24Hours) {
            return bIs24Hours - aIs24Hours; // 24시간 영업이 먼저
          }
          
          // 2순위: 영업 중 여부 (영업 중이 먼저)
          const aIsOpen = a.operatingHours?.todayStatus === "open" ? 1 : 0;
          const bIsOpen = b.operatingHours?.todayStatus === "open" ? 1 : 0;
          
          if (aIsOpen !== bIsOpen) {
            return bIsOpen - aIsOpen; // 영업 중이 먼저
          }
          
          // 3순위: 거리순 정렬
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          return distA - distB;
        });
        
        const open24HoursCount = facilities.filter(f => f.operatingHours?.is24Hours).length;
        const openNowCount = facilities.filter(f => f.operatingHours?.todayStatus === "open").length;
        
        console.log(`📍 정렬 완료:`);
        console.log(`   - 24시간 영업: ${open24HoursCount}개`);
        console.log(`   - 현재 영업 중: ${openNowCount}개`);
        console.log(`   - 거리순 정렬 적용`);
        if (facilities.length > 0) {
          console.log(`📍 가장 가까운 의료기관: ${facilities[0]?.name} (${facilities[0]?.distance?.toFixed(2)}km)`);
          if (facilities[0]?.operatingHours?.is24Hours) {
            console.log(`   ⏰ 24시간 영업`);
          }
        }
      }

    console.log(`✅ 검색 완료: ${facilities.length}개 의료기관 발견`);
    if (lat !== undefined && lon !== undefined && facilities.length > 0) {
      console.log(`📍 검색 중심 좌표: 위도 ${lat}, 경도 ${lon}`);
      const firstDistance = facilities[0]?.distance;
      const lastDistance = facilities[facilities.length - 1]?.distance;
      if (firstDistance !== undefined && lastDistance !== undefined) {
        console.log(`📍 검색된 의료기관 거리 범위: ${firstDistance.toFixed(2)}km ~ ${lastDistance.toFixed(2)}km`);
      }
    }
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        facilities,
        total: searchResult?.total ?? facilities.length,
        display: searchResult?.display ?? facilities.length,
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

