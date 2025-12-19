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
import type { PharmacyInfo } from "@/lib/health/pharmacy-api";
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
  return getOperatingStatusAt(new Date(), is24Hours, startTime, endTime, closedDays);
}

/**
 * 특정 시각(now) 기준으로 영업 상태 계산
 *
 * - 22:00~02:00 처럼 "자정을 넘어가는" 영업시간도 올바르게 처리합니다.
 * - 테스트에서 now를 주입할 수 있도록 분리했습니다.
 */
export function getOperatingStatusAt(
  now: Date,
  is24Hours: boolean,
  startTime?: string,
  endTime?: string,
  closedDays?: string[]
): "open" | "closed" | "closing_soon" | "unknown" {
  if (is24Hours) {
    return "open";
  }

  const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const todayName = dayNames[currentDay];

  // 오늘 휴무일인지 확인
  if (closedDays && closedDays.length > 0) {
    if (closedDays.includes(todayName)) {
      return "closed";
    }
  }

  if (!startTime || !endTime) {
    return "unknown";
  }

  const toMinutes = (hhmm: string): number => {
    const [hh, mm] = hhmm.split(":");
    const h = Number(hh);
    const m = Number(mm);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
    return "unknown";
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOvernight = endMinutes < startMinutes; // 예: 22:00(1320) ~ 02:00(120)

  const isOpen = isOvernight
    ? currentMinutes >= startMinutes || currentMinutes < endMinutes
    : currentMinutes >= startMinutes && currentMinutes < endMinutes;

  if (!isOpen) return "closed";

  // closing_soon 계산
  // - 일반: endMinutes - currentMinutes
  // - 자정넘김:
  //   - 현재가 22:00~24:00 사이라면 (current>=start) 종료는 다음날 endMinutes
  //   - 현재가 00:00~02:00 사이라면 (current<end) 종료는 오늘 endMinutes
  const closeAtMinutes = isOvernight && currentMinutes >= startMinutes ? endMinutes + 24 * 60 : endMinutes;
  const currentAdjusted = isOvernight && currentMinutes < endMinutes ? currentMinutes + 24 * 60 : currentMinutes;
  const timeUntilClose = closeAtMinutes - currentAdjusted;

  if (timeUntilClose <= 30 && timeUntilClose > 0) return "closing_soon";
  return "open";
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

/**
 * 약국 데이터를 MedicalFacility 형식으로 변환
 *
 * @param pharmacies 약국 정보 배열
 * @param userLat 사용자 위도 (선택사항, 거리 계산용)
 * @param userLon 사용자 경도 (선택사항, 거리 계산용)
 * @returns 의료기관 데이터 배열
 */
export function convertPharmacyToMedicalFacilities(
  pharmacies: PharmacyInfo[],
  userLat?: number,
  userLon?: number
): MedicalFacility[] {
  console.group("[Facility Utils] 약국 API 응답 변환");
  console.log(`📋 변환할 약국 수: ${pharmacies.length}`);

  // 입력 검증
  if (!Array.isArray(pharmacies)) {
    console.error("[Facility Utils] pharmacies가 배열이 아닙니다:", typeof pharmacies);
    console.groupEnd();
    return [];
  }

  if (pharmacies.length === 0) {
    console.log("[Facility Utils] 변환할 약국이 없습니다.");
    console.groupEnd();
    return [];
  }

  const facilities: MedicalFacility[] = pharmacies
    .filter((pharmacy) => {
      // 필수 필드 검증
      if (!pharmacy || typeof pharmacy !== 'object') {
        console.warn("[Facility Utils] 유효하지 않은 약국 데이터:", pharmacy);
        return false;
      }
      
      if (!pharmacy.dutyName || typeof pharmacy.dutyName !== 'string' || pharmacy.dutyName.trim() === '') {
        console.warn("[Facility Utils] 약국명이 없습니다:", pharmacy);
        return false;
      }
      
      if (!pharmacy.wgs84Lat || !pharmacy.wgs84Lon) {
        console.warn("[Facility Utils] 좌표가 없습니다:", {
          name: pharmacy.dutyName,
          hasLat: !!pharmacy.wgs84Lat,
          hasLon: !!pharmacy.wgs84Lon,
        });
        return false;
      }
      
      return true;
    })
    .map((pharmacy, index) => {
      try {
        const latStr = String(pharmacy.wgs84Lat || '').trim();
        const lonStr = String(pharmacy.wgs84Lon || '').trim();
        
        if (!latStr || !lonStr) {
          console.warn(`[Facility Utils] 좌표 문자열이 비어있음: ${pharmacy.dutyName}`);
          return null;
        }

        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);

        // 좌표 검증
        if (isNaN(lat) || isNaN(lon)) {
          console.warn(`[Facility Utils] 잘못된 좌표: ${pharmacy.dutyName} - lat: "${latStr}", lon: "${lonStr}"`);
          return null;
        }
        
        // 좌표 범위 검증 (한국 영역: 위도 33~43, 경도 124~132)
        if (lat < 33 || lat > 43 || lon < 124 || lon > 132) {
          console.warn(`[Facility Utils] 좌표가 한국 영역을 벗어남: ${pharmacy.dutyName} - (${lat}, ${lon})`);
          return null;
        }

        // 거리 계산 (사용자 위치가 제공된 경우)
        let distance: number | undefined;
        if (userLat !== undefined && userLon !== undefined) {
          distance = calculateDistance(userLat, userLon, lat, lon);
        }

        // 영업 시간 정보 파싱 (오류 발생 시 undefined 반환)
        let operatingHours: OperatingHours | undefined;
        try {
          operatingHours = parsePharmacyOperatingHours(pharmacy);
        } catch (hoursError) {
          console.warn(`[Facility Utils] 약국 ${pharmacy.dutyName} 영업시간 파싱 실패:`, hoursError);
          operatingHours = undefined; // 영업시간 없이도 약국 정보는 표시
        }

        // 고유 ID 생성 (rnum이 없으면 인덱스 사용)
        const id = `pharmacy-${pharmacy.rnum || `idx-${index}`}`;

        const facility: MedicalFacility = {
          id,
          name: String(pharmacy.dutyName || '').trim() || `약국 ${index + 1}`,
          category: "pharmacy",
          address: String(pharmacy.dutyAddr || '').trim(),
          roadAddress: "", // 약국 API에는 도로명 주소가 없음
          phone: pharmacy.dutyTel1 ? String(pharmacy.dutyTel1).trim() : null,
          latitude: lat,
          longitude: lon,
          distance,
          link: "", // 약국 API에는 링크 정보가 없음
          operatingHours,
        };

        // 최소한 이름과 좌표가 있어야 유효한 약국
        if (!facility.name || facility.name === '') {
          console.warn(`[Facility Utils] 약국명이 비어있어 건너뜁니다:`, pharmacy);
          return null;
        }

        return facility;
      } catch (error) {
        console.error(`[Facility Utils] 약국 ${index + 1} 변환 실패:`, error);
        console.error(`약국 데이터:`, {
          dutyName: pharmacy?.dutyName,
          dutyAddr: pharmacy?.dutyAddr,
          wgs84Lat: pharmacy?.wgs84Lat,
          wgs84Lon: pharmacy?.wgs84Lon,
        });
        return null;
      }
    })
    .filter((facility): facility is MedicalFacility => facility !== null && facility !== undefined);

  // 거리순 정렬 (거리가 있는 경우)
  if (userLat !== undefined && userLon !== undefined) {
    facilities.sort((a, b) => {
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });
  }

  console.log(`✅ 약국 변환 완료: ${facilities.length}개 약국`);
  console.groupEnd();
  return facilities;
}

/**
 * 약국 영업 시간 정보 파싱
 *
 * @param pharmacy 약국 정보
 * @returns 영업 시간 정보
 */
function parsePharmacyOperatingHours(pharmacy: PharmacyInfo): OperatingHours | undefined {
  const now = new Date();
  const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  // 요일별 영업시간 필드 매핑 (1: 월, 2: 화, ..., 7: 일, 8: 공휴일)
  const dayFields = [
    { day: 0, start: 'dutyTime7s', end: 'dutyTime7c' }, // 일요일
    { day: 1, start: 'dutyTime1s', end: 'dutyTime1c' }, // 월요일
    { day: 2, start: 'dutyTime2s', end: 'dutyTime2c' }, // 화요일
    { day: 3, start: 'dutyTime3s', end: 'dutyTime3c' }, // 수요일
    { day: 4, start: 'dutyTime4s', end: 'dutyTime4c' }, // 목요일
    { day: 5, start: 'dutyTime5s', end: 'dutyTime5c' }, // 금요일
    { day: 6, start: 'dutyTime6s', end: 'dutyTime6c' }, // 토요일
    { day: 8, start: 'dutyTime8s', end: 'dutyTime8c' }, // 공휴일
  ];

  const todayField = dayFields.find(field => field.day === currentDay) ||
                    dayFields.find(field => field.day === 8); // 공휴일 정보가 없으면 평일 정보 사용

  if (!todayField) {
    return {
      is24Hours: false,
      description: "영업시간 정보 없음",
      todayStatus: "unknown",
    };
  }

  const startTimeStr = pharmacy[todayField.start as keyof PharmacyInfo] as string;
  const endTimeStr = pharmacy[todayField.end as keyof PharmacyInfo] as string;

  // 영업시간이 없는 경우
  if (!startTimeStr || !endTimeStr || startTimeStr === "" || endTimeStr === "") {
    return {
      is24Hours: false,
      description: `${dayNames[currentDay]} 영업시간 정보 없음`,
      todayStatus: "unknown",
    };
  }

  // HHMM 형식을 HH:MM으로 변환
  const formatTime = (timeStr: string): string => {
    if (timeStr.length === 4) {
      return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
    }
    return timeStr;
  };

  const startTime = formatTime(startTimeStr);
  const endTime = formatTime(endTimeStr);

  // 24시간 영업 확인 (00:00 ~ 24:00 또는 00:00 ~ 23:59)
  const is24Hours = (startTime === "00:00" && (endTime === "24:00" || endTime === "23:59"));

  // 현재 시간과 비교하여 영업 상태 계산
  // 주의: 새벽(자정 이후)에는 "어제 영업시간이 자정을 넘기는 경우"가 많아,
  // 오늘 영업시간만 보면 실제로 영업 중인데 closed로 나올 수 있습니다.
  // 그래서 새벽 시간대에는 어제 영업시간(자정 넘김)도 함께 고려합니다.
  let todayStatus = getOperatingStatusAt(now, is24Hours, startTime, endTime);

  const earlyMorningThresholdMinutes = 6 * 60; // 06:00 이전이면 "전날 심야영업" 가능성 큼
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (todayStatus !== "open" && todayStatus !== "closing_soon" && nowMinutes < earlyMorningThresholdMinutes) {
    const yesterdayDay = (currentDay + 6) % 7;
    const yesterdayField = dayFields.find(field => field.day === yesterdayDay);
    if (yesterdayField) {
      const yStartRaw = pharmacy[yesterdayField.start as keyof PharmacyInfo] as string;
      const yEndRaw = pharmacy[yesterdayField.end as keyof PharmacyInfo] as string;

      if (yStartRaw && yEndRaw) {
        const yStart = formatTime(yStartRaw);
        const yEnd = formatTime(yEndRaw);
        const yIs24 = yStart === "00:00" && (yEnd === "24:00" || yEnd === "23:59");
        const yStatus = getOperatingStatusAt(now, yIs24, yStart, yEnd);

        if (yStatus === "open" || yStatus === "closing_soon") {
          console.log("[parsePharmacyOperatingHours] 새벽 시간대 - 전날 영업시간(자정넘김)으로 영업중 판정:", {
            pharmacy: pharmacy.dutyName,
            currentDay: dayNames[currentDay],
            yesterdayDay: dayNames[yesterdayDay],
            yesterdayHours: `${yStart}-${yEnd}`,
            status: yStatus,
          });
          todayStatus = yStatus;
        }
      }
    }
  }

  return {
    is24Hours,
    hours: `${startTime}-${endTime}`,
    description: `${dayNames[currentDay]} ${startTime}-${endTime}`,
    todayStatus,
    todayHours: `${startTime}-${endTime}`,
  };
}

/**
 * 약국을 영업 상태별로 정렬 (영업중인 약국을 우선 표시)
 * 
 * 모든 약국을 포함하되, 영업중인 약국을 최상단에 배치합니다.
 * 영업시간 정보가 없는 약국도 포함합니다 (공공데이터 API의 영업시간 정보 누락 대응)
 *
 * @param facilities 약국 의료기관 배열
 * @returns 영업중인 약국이 우선 정렬된 배열 (모든 약국 포함)
 */
export function filterOperatingPharmacies(facilities: MedicalFacility[]): MedicalFacility[] {
  console.group("[Facility Utils] 약국 영업 상태 정렬");
  console.log(`📋 정렬 전 약국 수: ${facilities.length}`);

  // 모든 약국을 포함하되, 영업 상태에 따라 우선순위 부여
  const sortedFacilities = facilities.map(facility => {
    // 영업 상태 우선순위 계산
    let priority = 3; // 기본값: 영업 종료/휴무
    
    if (!facility.operatingHours) {
      priority = 2; // 영업시간 정보 없음
    } else {
      const status = facility.operatingHours.todayStatus;
      if (status === "open" || status === "closing_soon") {
        priority = 1; // 영업중 (최우선)
      } else if (status === "unknown") {
        priority = 2; // 영업시간 확인 불가
      } else {
        priority = 3; // 영업 종료/휴무
      }
    }
    
    return { facility, priority };
  });

  // 우선순위별로 정렬 (1: 영업중, 2: 정보없음/확인불가, 3: 영업종료)
  sortedFacilities.sort((a, b) => a.priority - b.priority);

  const result = sortedFacilities.map(item => item.facility);

  // 통계 로그
  const openCount = result.filter(f => 
    f.operatingHours?.todayStatus === "open" || 
    f.operatingHours?.todayStatus === "closing_soon"
  ).length;
  const unknownCount = result.filter(f => 
    !f.operatingHours || f.operatingHours.todayStatus === "unknown"
  ).length;
  const closedCount = result.filter(f => 
    f.operatingHours?.todayStatus === "closed"
  ).length;

  console.log(`✅ 정렬 완료: ${result.length}개 약국`);
  console.log(`   - 영업중: ${openCount}개`);
  console.log(`   - 영업시간 확인 불가/정보 없음: ${unknownCount}개`);
  console.log(`   - 영업 종료/휴무: ${closedCount}개`);
  console.groupEnd();

  return result;
}

