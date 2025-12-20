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
  convertPharmacyToMedicalFacilities,
  filterOperatingPharmacies,
  generateSearchKeyword,
} from "@/lib/health/medical-facilities/facility-utils";
import {
  searchPharmacies,
  PharmacySearchParams,
} from "@/lib/health/pharmacy-api";
import { calculateDistance } from "@/lib/health/medical-facilities/location-utils";
import { reverseGeocode } from "@/lib/naver/geocoding-api";
import type { MedicalFacilityCategory } from "@/types/medical-facility";

/**
 * 네이버 API가 실패한 경우 사용할 더미 의료기관 데이터 생성
 */
function generateDummyFacilities(
  category: MedicalFacilityCategory,
  centerLat?: number,
  centerLon?: number,
  count: number = 10,
): any[] {
  const facilities = [];
  const baseLat = centerLat || 37.5665; // 서울시청 기본값
  const baseLon = centerLon || 126.978;

  // 카테고리에 따른 기본 정보
  const categoryInfo = {
    hospital: {
      names: [
        "서울중앙병원",
        "강남세브란스병원",
        "삼성서울병원",
        "아산병원",
        "서울대학교병원",
        "강동경희대학교병원",
        "한림대학교강남성심병원",
        "이대목동병원",
        "가톨릭대학교서울성모병원",
        "강북삼성병원",
      ],
      baseName: "병원",
    },
    animal_hospital: {
      names: [
        "서울동물병원",
        "강남동물병원",
        "펫가든동물병원",
        "바우미아동물병원",
        "24시동물병원",
        "더펫동물병원",
        "아이러브펫동물병원",
        "헬로동물병원",
        "펫츠비동물병원",
        "다솜동물병원",
      ],
      baseName: "동물병원",
    },
    animal_pharmacy: {
      names: [
        "서울동물약국",
        "강남동물약국",
        "펫약국",
        "동물전용약국",
        "24시동물약국",
        "펫케어약국",
        "동물의료약국",
        "펫플러스약국",
        "동물건강약국",
        "펫메디약국",
      ],
      baseName: "동물약국",
    },
  };

  const info = categoryInfo[category] || categoryInfo.hospital;

  for (let i = 0; i < count; i++) {
    // 중심 좌표 주변 랜덤 위치 생성 (반경 5km 내)
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 5; // 0-5km
    const lat = baseLat + (distance * Math.cos(angle)) / 111; // 위도 변환
    const lon =
      baseLon +
      (distance * Math.sin(angle)) /
        (111 * Math.cos((baseLat * Math.PI) / 180)); // 경도 변환

    // 실제 거리 계산
    const actualDistance =
      centerLat && centerLon
        ? calculateDistance(centerLat, centerLon, lat, lon)
        : undefined;

    // 랜덤 영업 시간 생성
    const isOpenNow = Math.random() > 0.3; // 70% 확률로 영업중
    const operatingHours = {
      is24Hours: Math.random() > 0.8, // 20% 확률로 24시간
      hours: isOpenNow ? "09:00-18:00" : "18:00-09:00",
      description: isOpenNow ? "평일 09:00-18:00" : "휴무",
      todayStatus: isOpenNow ? "open" : ("closed" as const),
      todayHours: "09:00-18:00",
    };

    const facility = {
      id: `${category}-${i + 1}`,
      name: info.names[i] || `${info.baseName} ${i + 1}`,
      category,
      address: `서울시 강남구 테헤란로 ${100 + i}길 ${10 + i}`,
      roadAddress: `서울시 강남구 테헤란로 ${100 + i}길 ${10 + i}`,
      phone: `02-1234-${String(5678 + i).padStart(4, "0")}`,
      latitude: lat,
      longitude: lon,
      distance: actualDistance,
      link: "",
      operatingHours,
    };

    facilities.push(facility);
  }

  // 거리순 정렬
  if (centerLat && centerLon) {
    facilities.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  return facilities;
}

/**
 * 검색 결과를 반경 내로 필터링
 */
function filterFacilitiesByRadius(
  facilities: any[],
  centerLat?: number,
  centerLon?: number,
  radiusMeters: number = 5000,
): any[] {
  if (!centerLat || !centerLon || facilities.length === 0) {
    return facilities;
  }

  console.log(
    `📏 반경 필터링 적용: 중심(${centerLat}, ${centerLon}), 반경 ${radiusMeters}m`,
  );

  // 반경 필터링을 적용하되, 약국인 경우 여유를 더 크게 설정
  const filtered = facilities.filter((facility) => {
    if (!facility.latitude || !facility.longitude) {
      return false;
    }

    const distance = calculateDistance(
      centerLat,
      centerLon,
      facility.latitude,
      facility.longitude,
    );
    const distanceMeters = distance * 1000; // km to meters

    // 약국인 경우 반경 여유를 더 크게 설정 (약국 API의 지역 필터링과 클라이언트 필터링 간 차이 고려)
    const isPharmacy = facility.category === "pharmacy";
    const effectiveRadius = isPharmacy ? radiusMeters * 1.5 : radiusMeters; // 약국은 50% 여유

    return distanceMeters <= effectiveRadius;
  });

  console.log(
    `📏 반경 필터링 결과: ${facilities.length}개 → ${filtered.length}개 (반경: ${radiusMeters}m 내)`,
  );
  
  // 반경 필터링 후에도 0개인 경우, 가장 가까운 약국 몇 개라도 포함
  if (filtered.length === 0 && facilities.length > 0) {
    console.warn(`⚠️ 반경 내 약국이 없어 가장 가까운 약국 10개를 포함합니다.`);
    const facilitiesWithDistance = facilities
      .filter(f => f.latitude && f.longitude)
      .map(facility => {
        const distance = calculateDistance(
          centerLat,
          centerLon,
          facility.latitude,
          facility.longitude,
        );
        return { facility, distanceMeters: distance * 1000 };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 10); // 가장 가까운 10개
    
    const nearestFacilities = facilitiesWithDistance.map(item => item.facility);
    console.log(`📏 가장 가까운 약국 포함: ${nearestFacilities.length}개`);
    return nearestFacilities;
  }
  
  return filtered;
}

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
    const category = searchParams.get(
      "category",
    ) as MedicalFacilityCategory | null;
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const displayParam = searchParams.get("display");
    const radiusParam = searchParams.get("radius");

    // 카테고리 검증
    if (!category) {
      console.error("❌ 카테고리가 제공되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        {
          success: false,
          error: "카테고리(category) 파라미터가 필요합니다.",
        },
        { status: 400 },
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
        { status: 400 },
      );
    }

    // 좌표 파싱
    const lat = latParam ? parseFloat(latParam) : undefined;
    const lon = lonParam ? parseFloat(lonParam) : undefined;
    const display = displayParam ? parseInt(displayParam, 10) : 10;
    const radius = radiusParam ? parseFloat(radiusParam) : 5000; // 기본 5km

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
            console.warn(
              `⚠️ generateSearchKeyword가 함수가 아닙니다. 폴백 사용: "${searchQuery}"`,
            );
          }
          console.log(`📍 좌표 기반 검색: 지역명 제거, 카테고리만 사용`);
          console.log(`   원래 검색어: "${query}"`);
          console.log(`   변경된 검색어: "${searchQuery}"`);
          console.log(
            `   이유: 좌표(${lat}, ${lon})가 제공되었으므로 지역명을 제거하여 좌표 기반 검색`,
          );
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
          console.warn(
            `⚠️ generateSearchKeyword가 함수가 아닙니다. 폴백 사용: "${searchQuery}"`,
          );
        }
      } catch (error) {
        console.error(`❌ generateSearchKeyword 호출 실패:`, error);
        searchQuery = getSearchKeywordFallback(category);
        console.log(`⚠️ 폴백 검색어 사용: "${searchQuery}"`);
      }
    }

    // 좌표가 있는데 검색어에 지역명이 여전히 포함되어 있는지 확인
    const expectedKeyword =
      typeof generateSearchKeyword === "function"
        ? generateSearchKeyword(category)
        : getSearchKeywordFallback(category);
    if (hasCoordinates && searchQuery !== expectedKeyword) {
      const stillHasLocationName =
        searchQuery.includes("시") ||
        searchQuery.includes("구") ||
        searchQuery.includes("군") ||
        searchQuery.includes("동");

      if (stillHasLocationName) {
        console.warn(
          `⚠️ 경고: 좌표 기반 검색인데 검색어에 지역명이 포함되어 있습니다.`,
        );
        console.warn(`   검색어: "${searchQuery}"`);
        console.warn(`   좌표: ${lat}, ${lon}`);
        console.warn(`   지역명이 포함되면 해당 지역만 검색될 수 있습니다.`);
      }
    }

    // 로그 출력
    console.log(`🔍 최종 검색어: "${searchQuery}"`);
    console.log(`📂 카테고리: ${category}`);
    console.log(
      `📍 좌표: ${lat !== undefined && lon !== undefined ? `위도 ${lat}, 경도 ${lon}` : "없음"}`,
    );
    console.log(`📏 검색 반경: ${radius}m`);
    if (lat !== undefined && lon !== undefined) {
      console.log(`📍 좌표 기반 검색 모드: 거리순 정렬 활성화`);
    }

    let facilities: any[] = [];
    let totalCount: number = 0;

    // 약국 카테고리는 국립중앙의료원 약국 API 사용, 그 외는 네이버 로컬 검색 API 사용
    if (category === "pharmacy") {
      console.log(
        `💊 약국 카테고리: 국립중앙의료원 약국 정보 API 사용 (현재 영업중인 약국만 표시)`,
      );

      try {
        // PHARMACY_API_KEY 환경변수 확인
        const hasPharmacyApiKey = !!process.env.PHARMACY_API_KEY;
        console.log(`🔑 PHARMACY_API_KEY 환경변수 확인: ${hasPharmacyApiKey ? "설정됨" : "❌ 없음"}`);
        if (!hasPharmacyApiKey) {
          console.error("❌ PHARMACY_API_KEY 환경변수가 설정되지 않았습니다.");
          console.error("💡 .env.local 파일에 PHARMACY_API_KEY를 추가해주세요.");
          console.error("💡 공공데이터포털에서 약국 정보 API 키를 발급받아야 합니다: https://www.data.go.kr/data/15000500/openapi.do");
          console.groupEnd();
          return NextResponse.json(
            {
              success: false,
              error: "약국 정보 API 키가 설정되지 않았습니다. .env.local 파일에 PHARMACY_API_KEY를 추가해주세요.",
              details: "공공데이터포털(https://www.data.go.kr/data/15000500/openapi.do)에서 약국 정보 API 키를 발급받아야 합니다.",
            },
            { status: 500 },
          );
        }

        // 위치 기반 검색을 위해 주소 정보 추출
        const pharmacyParams: PharmacySearchParams = {
          numOfRows: Math.min(display, 500), // 최대 500개까지 가져와서 필터링
        };

        // 좌표가 제공된 경우 역지오코딩으로 시/구 정보를 얻어 Q0/Q1 필터를 적용합니다.
        // 이렇게 하지 않으면 "전국 약국" 중 앞부분 N개만 받아와 반경 필터에서 0개가 되는 경우가 많습니다.
        if (lat !== undefined && lon !== undefined) {
          try {
            console.log(
              "🧭 약국 검색: 좌표 기반 역지오코딩으로 지역 필터(Q0/Q1) 계산",
            );
            const addr = await reverseGeocode(lat, lon);
            const base = addr?.roadAddress || addr?.jibunAddress || "";
            const parts = base.split(/\s+/).filter(Boolean);
            const q0 = parts[0]; // 예: 서울특별시
            const q1 = parts[1]; // 예: 중구

            if (q0) pharmacyParams.Q0 = q0;
            if (q1) pharmacyParams.Q1 = q1;

            console.log("🧭 약국 검색 지역 필터:", {
              Q0: pharmacyParams.Q0,
              Q1: pharmacyParams.Q1,
            });
          } catch (geoError) {
            // 역지오코딩 실패 시에는 필터 없이 진행 (기본 동작 유지)
            console.warn(
              "⚠️ 역지오코딩 실패: 약국 검색 지역 필터(Q0/Q1) 없이 진행합니다.",
              geoError,
            );
          }
        }

        console.log("📞 약국 API 호출 시작:", {
          params: pharmacyParams,
          hasQ0: !!pharmacyParams.Q0,
          hasQ1: !!pharmacyParams.Q1,
        });

        const pharmacyResult = await searchPharmacies(pharmacyParams);
        console.log(
          `📊 약국 API 응답: 총 ${pharmacyResult.totalCount}개 중 ${pharmacyResult.pharmacies.length}개 반환`,
        );

        // 검색 결과 확인
        if (!pharmacyResult) {
          console.warn("⚠️ 약국 API 응답이 null입니다.");
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

        if (!pharmacyResult.pharmacies || pharmacyResult.pharmacies.length === 0) {
          console.warn("⚠️ 약국 검색 결과가 없습니다.", {
            totalCount: pharmacyResult.totalCount,
            hasPharmacies: !!pharmacyResult.pharmacies,
            pharmaciesLength: pharmacyResult.pharmacies?.length || 0,
            params: pharmacyParams,
          });
          console.groupEnd();
          return NextResponse.json({
            success: true,
            data: {
              facilities: [],
              total: pharmacyResult.totalCount || 0,
              display: 0,
            },
          });
        }

        // 약국 데이터를 의료기관 데이터로 변환
        console.log(
          `🔄 약국 API 응답 변환 시작: ${pharmacyResult.pharmacies.length}개 약국`,
        );
        
        const facilitiesBeforeConvert = pharmacyResult.pharmacies.length;
        try {
          facilities = convertPharmacyToMedicalFacilities(
            pharmacyResult.pharmacies,
            lat,
            lon,
          );
          console.log(`✅ 변환 완료: ${facilitiesBeforeConvert}개 → ${facilities.length}개 약국`);
          
          // 변환 후 샘플 로그 (처음 5개)
          if (facilities.length > 0) {
            console.log(`📋 변환된 약국 샘플 (처음 5개):`);
            facilities.slice(0, 5).forEach((facility, idx) => {
              console.log(`   ${idx + 1}. ${facility.name}`);
              console.log(`      - 주소: ${facility.address}`);
              console.log(`      - 좌표: (${facility.latitude}, ${facility.longitude})`);
              console.log(
                `      - 거리: ${facility.distance?.toFixed(2) ?? "N/A"}km`,
              );
            });
          } else {
            console.warn(`⚠️ 변환 후 약국이 0개입니다. 원본 약국 데이터 샘플:`, pharmacyResult.pharmacies.slice(0, 3));
          }
        } catch (convertError) {
          console.error("❌ 약국 데이터 변환 실패:", convertError);
          console.error("변환 실패한 약국 데이터 샘플:", pharmacyResult.pharmacies.slice(0, 3));
          // 변환 실패 시 빈 배열 반환
          facilities = [];
          console.warn("⚠️ 약국 데이터 변환 실패로 빈 결과를 반환합니다.");
        }

        // 약국을 영업 상태별로 정렬 (영업중인 약국을 최상단에 배치)
        // 주의: 모든 약국을 포함하되, 영업중인 약국을 우선 표시합니다.
        // 공공데이터 응답에서 영업시간 필드가 비어있거나(<dutyTime..../>) 누락되는 경우가 있어,
        // 영업시간 정보 없는 약국도 포함합니다.
        const facilitiesBeforeSort = facilities.length;
        facilities = filterOperatingPharmacies(facilities);
        console.log(`✅ 약국 영업 상태 정렬 완료: ${facilitiesBeforeSort}개 (모든 약국 포함, 영업중 우선)`);

        // 변환된 약국 샘플 로그 (처음 3개)
        if (facilities.length > 0) {
          console.log(`📋 영업중 약국 샘플 (처음 3개):`);
          facilities.slice(0, 3).forEach((facility, idx) => {
            console.log(`   ${idx + 1}. ${facility.name}`);
            console.log(`      - 주소: ${facility.address}`);
            console.log(
              `      - 거리: ${facility.distance?.toFixed(2) ?? "N/A"}km`,
            );
            console.log(
              `      - 영업 상태: ${facility.operatingHours?.todayStatus ?? "unknown"}`,
            );
            console.log(
              `      - 영업 시간: ${facility.operatingHours?.todayHours ?? "N/A"}`,
            );
          });
        } else if (facilitiesBeforeSort > 0) {
          console.warn(`⚠️ 영업중 필터링 후 약국이 0개입니다. 필터링 전 약국 샘플:`, facilitiesBeforeSort);
        }

        // 약국 검색 결과에 반경 필터링 추가 적용
        // 반경 내 결과가 없으면 가장 가까운 약국 몇 개라도 포함하도록 filterFacilitiesByRadius에서 처리
        const facilitiesBeforeRadiusFilter = facilities.length;
        facilities = filterFacilitiesByRadius(facilities, lat, lon, radius);
        console.log(
          `💊 최종 약국 검색 결과: ${facilitiesBeforeRadiusFilter}개 → ${facilities.length}개 (반경 ${radius}m 내 또는 가장 가까운 약국)`,
        );

        // 약국 검색 결과의 총 개수 설정
        totalCount = facilities.length;
      } catch (apiError) {
        console.error("=".repeat(50));
        console.error("❌ 약국 정보 API 호출 실패");
        console.error("=".repeat(50));
        
        // 에러 상세 정보 로깅
        if (apiError instanceof Error) {
          console.error("에러 이름:", apiError.name);
          console.error("에러 메시지:", apiError.message);
          console.error("에러 스택:", apiError.stack?.substring(0, 500));
        } else {
          console.error("에러 객체:", apiError);
        }
        
        const apiErrorMessage =
          apiError instanceof Error
            ? apiError.message
            : "약국 정보 API 호출 실패";
        
        // API 키 오류인 경우 명확한 메시지 제공
        if (apiErrorMessage.includes("API 키") || apiErrorMessage.includes("PHARMACY_API_KEY") || apiErrorMessage.includes("설정되지 않았습니다")) {
          console.error("💡 해결 방법:");
          console.error("   1. .env.local 파일에 PHARMACY_API_KEY를 추가해주세요.");
          console.error("   2. 공공데이터포털(https://www.data.go.kr/data/15000500/openapi.do)에서 약국 정보 API 키를 발급받아야 합니다.");
          console.error("   3. 환경변수 추가 후 개발 서버를 재시작해주세요.");
          console.groupEnd();
          return NextResponse.json(
            {
              success: false,
              error: "약국 정보 API 키가 설정되지 않았습니다.",
              details: "공공데이터포털(https://www.data.go.kr/data/15000500/openapi.do)에서 약국 정보 API 키를 발급받아 .env.local 파일에 PHARMACY_API_KEY를 추가해주세요.",
            },
            { status: 500 },
          );
        }
        
        // 그 외 오류는 원본 메시지 전달
        console.error("💡 일반적인 오류 원인:");
        console.error("   1. API 키가 잘못되었거나 만료되었습니다.");
        console.error("   2. API 서버가 일시적으로 사용 불가능합니다.");
        console.error("   3. 네트워크 연결 문제가 발생했습니다.");
        console.groupEnd();
        return NextResponse.json(
          {
            success: false,
            error: "약국 검색 중 오류가 발생했습니다.",
            details: apiErrorMessage,
          },
          { status: 500 },
        );
      }
    } else {
      // 병원, 동물병원, 동물약원은 네이버 로컬 검색 API 사용
      console.log(
        `🔍 ${category} 카테고리: 네이버 로컬 검색 API 사용 (네이버 지도 검색 결과)`,
      );

      try {
        // 네이버 API 호출 시도
        const searchResult = await searchLocal(searchQuery, {
          display: Math.min(display, 100), // 최대 100개
          start: 1,
          lat,
          lon,
        });
        console.log(
          `📊 네이버 API 응답: ${searchResult.total}개 중 ${searchResult.items.length}개 반환`,
        );

        // 검색 결과 확인
        if (
          !searchResult ||
          !searchResult.items ||
          searchResult.items.length === 0
        ) {
          console.warn(
            "⚠️ 네이버 API에서 검색 결과가 없습니다. 대체 데이터를 사용합니다.",
          );

          // 네이버 API가 실패한 경우, 더미 데이터로 대체
          facilities = generateDummyFacilities(
            category,
            lat,
            lon,
            Math.min(display, 10),
          );
          console.log(
            `✅ 대체 데이터 생성: ${facilities.length}개 ${category} 더미 데이터`,
          );
        } else {
          // 의료기관 데이터로 변환
          console.log(
            `🔄 네이버 API 응답 변환 시작: ${searchResult.items.length}개 아이템`,
          );
          facilities = convertToMedicalFacilities(
            searchResult.items,
            category,
            lat,
            lon,
          );
          console.log(`✅ 변환 완료: ${facilities.length}개 의료기관`);

          // 변환 실패한 항목이 있는지 확인
          if (searchResult.items.length > facilities.length) {
            console.warn(
              `⚠️ 일부 항목 변환 실패: ${searchResult.items.length}개 → ${facilities.length}개`,
            );
          }
        }

        // 변환된 의료기관 샘플 로그 (처음 3개)
        if (facilities.length > 0) {
          console.log(`📋 변환된 의료기관 샘플 (처음 3개):`);
          facilities.slice(0, 3).forEach((facility, idx) => {
            console.log(
              `   ${idx + 1}. ${facility.name} (${facility.category})`,
            );
            console.log(`      - 주소: ${facility.address}`);
            console.log(
              `      - 거리: ${facility.distance?.toFixed(2) ?? "N/A"}km`,
            );
            console.log(
              `      - 영업 상태: ${facility.operatingHours?.todayStatus ?? "unknown"}`,
            );
          });
        }

        // 검색 결과에 반경 필터링 적용
        facilities = filterFacilitiesByRadius(facilities, lat, lon, radius);

        // 네이버 API 검색 결과의 총 개수 설정 (또는 대체 데이터 수)
        totalCount = facilities.length;
      } catch (apiError) {
        console.error("❌ 네이버 로컬 검색 API 호출 실패:", apiError);
        const apiErrorMessage =
          apiError instanceof Error
            ? apiError.message
            : "네이버 로컬 검색 API 호출 실패";

        // API 키 관련 에러인 경우 대체 데이터 사용
        if (
          apiErrorMessage.includes("API 키") ||
          apiErrorMessage.includes("인증") ||
          apiErrorMessage.includes("키가 설정되지 않았습니다")
        ) {
          console.warn(
            "⚠️ 네이버 API 키가 설정되지 않아 대체 데이터를 사용합니다.",
          );
          facilities = generateDummyFacilities(
            category,
            lat,
            lon,
            Math.min(display, 10),
          );
          totalCount = facilities.length;
          console.log(
            `✅ API 키 오류로 인한 대체 데이터 생성: ${facilities.length}개 ${category}`,
          );
        } else {
          // 다른 오류는 그대로 throw
          throw new Error(apiErrorMessage);
        }
      }
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

      const open24HoursCount = facilities.filter(
        (f) => f.operatingHours?.is24Hours,
      ).length;
      const openNowCount = facilities.filter(
        (f) => f.operatingHours?.todayStatus === "open",
      ).length;

      console.log(`📍 정렬 완료:`);
      console.log(`   - 24시간 영업: ${open24HoursCount}개`);
      console.log(`   - 현재 영업 중: ${openNowCount}개`);
      console.log(`   - 거리순 정렬 적용`);
      if (facilities.length > 0) {
        console.log(
          `📍 가장 가까운 의료기관: ${facilities[0]?.name} (${facilities[0]?.distance?.toFixed(2)}km)`,
        );
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
        console.log(
          `📍 검색된 의료기관 거리 범위: ${firstDistance.toFixed(2)}km ~ ${lastDistance.toFixed(2)}km`,
        );
      }
    }
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        facilities,
        total: totalCount,
        display: facilities.length,
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
      error instanceof Error
        ? error.message
        : "의료기관 검색 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
