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

// Re-export calculateDistance for external use
export { calculateDistance };

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
    const status = calculateTodayStatus(true, undefined, undefined);
    return {
      is24Hours: true,
      description: cleanDesc,
      todayStatus: status,
    };
  }

  // 휴무일 정보 추출
  const closedDays: string[] = [];
  const closedDayPatterns = [
    /(일요일|월요일|화요일|수요일|목요일|금요일|토요일)\s*휴무/gi,
    /(공휴일|공휴|법정공휴일)\s*휴무/gi,
    /(일|월|화|수|목|금|토)\s*요일\s*휴무/gi,
  ];
  
  for (const pattern of closedDayPatterns) {
    const matches = cleanDesc.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !closedDays.includes(match[1])) {
        closedDays.push(match[1]);
      }
    }
  }

  // 일반 영업 시간 패턴 추출 (예: "09:00-21:00", "평일 09:00-18:00")
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/g, // 09:00-21:00
    /(\d{1,2})시\s*[-~]\s*(\d{1,2})시/g, // 9시-21시
    /평일\s*(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/g, // 평일 09:00-18:00
    /(월|화|수|목|금|토|일)\s*(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/g, // 월 09:00-18:00
  ];

  let hours: string | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;
  
  for (const pattern of timePatterns) {
    const match = cleanDesc.match(pattern);
    if (match && match.length > 0) {
      hours = match[0];
      // 시간 추출 (HH:MM 형식)
      const timeMatch = hours.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
      }
      break;
    }
  }

  // 오늘 영업 상태 계산
  const todayStatus = calculateTodayStatus(false, startTime, endTime, closedDays);
  const todayHours = hours ? extractTodayHours(cleanDesc) : undefined;

  // 영업 시간 정보가 있으면 반환
  if (hours || closedDays.length > 0) {
    return {
      is24Hours: false,
      hours,
      description: cleanDesc,
      closedDays: closedDays.length > 0 ? closedDays : undefined,
      todayStatus,
      todayHours,
    };
  }

  // 영업 시간 정보가 없으면 기본 정보만 반환
  return {
    is24Hours: false,
    description: cleanDesc,
    todayStatus: "unknown",
  };
}

/**
 * 오늘 영업 상태 계산
 *
 * @param is24Hours 24시간 영업 여부
 * @param startTime 영업 시작 시간 (HH:MM)
 * @param endTime 영업 종료 시간 (HH:MM)
 * @param closedDays 휴무일 배열
 * @returns 오늘 영업 상태
 */
function calculateTodayStatus(
  is24Hours: boolean,
  startTime?: string,
  endTime?: string,
  closedDays?: string[]
): "open" | "closed" | "closing_soon" | "unknown" {
  if (is24Hours) {
    return "open";
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const todayName = dayNames[currentDay];

  // 오늘 휴무일인지 확인
  if (closedDays && closedDays.length > 0) {
    // 공휴일 확인 (간단한 체크 - 실제로는 공휴일 API 필요)
    const isHoliday = closedDays.some(day => day.includes("공휴") || day.includes("법정"));
    if (isHoliday) {
      // 공휴일 체크는 복잡하므로 일단 closed로 처리
      // 실제로는 한국 공휴일 API를 사용해야 함
    }
    
    // 오늘 요일이 휴무일인지 확인
    if (closedDays.includes(todayName)) {
      return "closed";
    }
  }

  if (!startTime || !endTime) {
    return "unknown";
  }

  // 현재 시간을 HH:MM 형식으로 변환
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 시간 비교
  if (currentTime >= startTime && currentTime < endTime) {
    // 영업 종료 30분 전이면 closing_soon
    const endTimeMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const timeUntilClose = endTimeMinutes - currentTimeMinutes;
    
    if (timeUntilClose <= 30 && timeUntilClose > 0) {
      return "closing_soon";
    }
    return "open";
  }

  return "closed";
}

/**
 * description에서 오늘 영업 시간 추출
 *
 * @param description 원본 description
 * @returns 오늘 영업 시간 문자열
 */
function extractTodayHours(description: string): string | undefined {
  const now = new Date();
  const currentDay = now.getDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const todayName = dayNames[currentDay];

  // 오늘 요일로 시작하는 영업시간 패턴 찾기
  const todayPattern = new RegExp(`${todayName}\\s*(\\d{1,2}):(\\d{2})\\s*[-~]\\s*(\\d{1,2}):(\\d{2})`, 'i');
  const match = description.match(todayPattern);
  
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}-${match[3].padStart(2, '0')}:${match[4]}`;
  }

  // 평일/주말 패턴 확인
  const isWeekend = currentDay === 0 || currentDay === 6;
  if (isWeekend) {
    const weekendPattern = /(주말|토일|토요일|일요일)\s*(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/i;
    const weekendMatch = description.match(weekendPattern);
    if (weekendMatch) {
      return `${weekendMatch[2].padStart(2, '0')}:${weekendMatch[3]}-${weekendMatch[4].padStart(2, '0')}:${weekendMatch[5]}`;
    }
  } else {
    const weekdayPattern = /(평일|월금|월~금)\s*(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/i;
    const weekdayMatch = description.match(weekdayPattern);
    if (weekdayMatch) {
      return `${weekdayMatch[2].padStart(2, '0')}:${weekdayMatch[3]}-${weekdayMatch[4].padStart(2, '0')}:${weekdayMatch[5]}`;
    }
  }

  // 일반 영업시간 패턴
  const generalPattern = /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/;
  const generalMatch = description.match(generalPattern);
  if (generalMatch) {
    return `${generalMatch[1].padStart(2, '0')}:${generalMatch[2]}-${generalMatch[3].padStart(2, '0')}:${generalMatch[4]}`;
  }

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

  // 카테고리 검증
  if (!category || !(category in keywords)) {
    console.error(`❌ 유효하지 않은 카테고리: ${category}`);
    // 기본값으로 "병원" 반환
    return location ? `${location} 병원` : "병원";
  }

  const baseKeyword = keywords[category];
  if (!baseKeyword) {
    console.error(`❌ 카테고리에 대한 키워드를 찾을 수 없습니다: ${category}`);
    return location ? `${location} 병원` : "병원";
  }

  return location ? `${location} ${baseKeyword}` : baseKeyword;
}

