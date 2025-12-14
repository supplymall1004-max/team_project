/**
 * @file facility-utils.ts
 * @description 의료기관 데이터 처리 유틸리티
 *
 * 네이버 API 응답을 의료기관 데이터로 변환하는 함수를 제공합니다.
 */

import type {
  MedicalFacility,
  MedicalFacilityCategory,
  NaverLocalSearchItem,
  OperatingHours,
} from "@/types/medical-facility";
import { convertNaverToWGS84 } from "@/lib/naver/map-client";
import { calculateDistance } from "./location-utils";

/**
 * HTML 태그를 제거하고 텍스트만 추출
 *
 * @param html HTML 문자열
 * @returns 순수 텍스트
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * description에서 영업 시간 정보 파싱
 *
 * @param description 네이버 API의 description 필드
 * @returns 영업 시간 정보
 */
function parseOperatingHours(description: string): OperatingHours | undefined {
  if (!description) return undefined;

  const cleanDesc = stripHtmlTags(description);
  
  // 24시간 영업 패턴 확인
  const is24Hours = /24\s*시간|24시간\s*영업|00:00\s*[-~]\s*24:00|00:00\s*[-~]\s*23:59|24h|24H/i.test(cleanDesc);
  
  if (is24Hours) {
    return {
      is24Hours: true,
      description: cleanDesc,
    };
  }

  // 일반 영업 시간 패턴 추출 (예: "09:00-21:00", "평일 09:00-18:00")
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/g, // 09:00-21:00
    /(\d{1,2})시\s*[-~]\s*(\d{1,2})시/g, // 9시-21시
    /평일\s*(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/g, // 평일 09:00-18:00
  ];

  let hours: string | undefined;
  for (const pattern of timePatterns) {
    const match = cleanDesc.match(pattern);
    if (match && match.length > 0) {
      hours = match[0];
      break;
    }
  }

  // 영업 시간 정보가 있으면 반환
  if (hours) {
    return {
      is24Hours: false,
      hours,
      description: cleanDesc,
    };
  }

  // 영업 시간 정보가 없으면 undefined 반환
  return undefined;
}

/**
 * 네이버 로컬 검색 API 응답을 의료기관 데이터로 변환
 *
 * @param items 네이버 로컬 검색 API 응답 아이템 배열
 * @param category 의료기관 카테고리
 * @param userLat 사용자 위도 (선택사항, 거리 계산용)
 * @param userLon 사용자 경도 (선택사항, 거리 계산용)
 * @returns 의료기관 데이터 배열
 */
export function convertToMedicalFacilities(
  items: NaverLocalSearchItem[],
  category: MedicalFacilityCategory,
  userLat?: number,
  userLon?: number
): MedicalFacility[] {
  console.group("[Facility Utils] 네이버 API 응답 변환");
  console.log(`📋 변환할 항목 수: ${items.length}`);

  const facilities: MedicalFacility[] = items
    .filter((item) => {
      // 필수 필드 검증
      if (!item || !item.title || !item.link) {
        console.warn("[Facility Utils] 필수 필드가 없는 항목을 건너뜁니다:", item);
        return false;
      }
      return true;
    })
    .map((item, index) => {
      try {
        // HTML 태그 제거
        const name = stripHtmlTags(item.title || "");
        const address = stripHtmlTags(item.address || "");
        const roadAddress = stripHtmlTags(item.roadAddress || "");

        // 네이버 좌표를 WGS84로 변환
        const { lat, lon } = convertNaverToWGS84(item.mapy || "0", item.mapx || "0");

        // 거리 계산 (사용자 위치가 제공된 경우)
        let distance: number | undefined;
        if (userLat !== undefined && userLon !== undefined) {
          distance = calculateDistance(userLat, userLon, lat, lon);
        }

        // 전화번호 정리 (공백 제거 및 하이픈 정리)
        const phone = item.telephone 
          ? item.telephone.trim().replace(/\s+/g, "").replace(/-/g, "-") 
          : null;

        // 영업 시간 정보 파싱
        const operatingHours = parseOperatingHours(item.description || "");

        // 고유 ID 생성 (네이버 링크 기반)
        const id = item.link?.split("/").pop() || `facility-${index}`;

        const facility: MedicalFacility = {
          id,
          name: name || `의료기관 ${index + 1}`,
          category,
          address: address || "",
          roadAddress: roadAddress || "",
          phone,
          latitude: lat,
          longitude: lon,
          distance,
          link: item.link || "",
          operatingHours,
        };

        return facility;
      } catch (error) {
        console.error(`[Facility Utils] 항목 ${index + 1} 변환 실패:`, error, item);
        // 기본값 반환
        return {
          id: `facility-${index}`,
          name: `의료기관 ${index + 1}`,
          category,
          address: "",
          roadAddress: "",
          phone: null,
          latitude: 37.5665,
          longitude: 126.978,
          distance: undefined,
          link: item.link || "",
          operatingHours: undefined,
        };
      }
    })
    .filter((facility) => facility !== null && facility !== undefined);

  // 거리순 정렬 (거리가 있는 경우)
  if (userLat !== undefined && userLon !== undefined) {
    facilities.sort((a, b) => {
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });
  }

  console.log(`✅ 변환 완료: ${facilities.length}개 의료기관`);
  console.groupEnd();
  return facilities;
}

/**
 * 의료기관을 거리순으로 정렬
 *
 * @param facilities 의료기관 배열
 * @returns 정렬된 의료기관 배열
 */
export function sortByDistance(
  facilities: MedicalFacility[]
): MedicalFacility[] {
  return [...facilities].sort((a, b) => {
    const distA = a.distance ?? Infinity;
    const distB = b.distance ?? Infinity;
    return distA - distB;
  });
}

/**
 * 카테고리에 맞는 검색 키워드 생성
 *
 * @param category 의료기관 카테고리
 * @param location 지역명 (선택사항)
 * @returns 검색 키워드
 */
export function generateSearchKeyword(
  category: MedicalFacilityCategory,
  location?: string
): string {
  const keywords: Record<MedicalFacilityCategory, string> = {
    hospital: "병원",
    pharmacy: "약국",
    animal_hospital: "동물병원",
    animal_pharmacy: "동물약국",
  };

  const baseKeyword = keywords[category];
  return location ? `${location} ${baseKeyword}` : baseKeyword;
}

