/**
 * @file medical-facility.ts
 * @description 의료기관 위치 서비스 관련 타입 정의
 *
 * 주요 타입:
 * 1. MedicalFacilityCategory: 의료기관 카테고리
 * 2. NaverLocalSearchItem: 네이버 로컬 검색 API 응답 타입
 * 3. MedicalFacility: 가공된 의료기관 정보
 * 4. SearchParams: 검색 파라미터
 */

/**
 * 의료기관 카테고리
 */
export type MedicalFacilityCategory =
  | "hospital" // 병원
  | "pharmacy" // 약국
  | "animal_hospital" // 동물병원
  | "animal_pharmacy"; // 동물약국

/**
 * 네이버 로컬 검색 API 응답 아이템
 */
export interface NaverLocalSearchItem {
  title: string; // 장소명 (HTML 태그 제거 필요)
  link: string; // 네이버 링크
  category: string; // 카테고리
  description: string; // 설명
  telephone: string; // 전화번호
  address: string; // 지번 주소
  roadAddress: string; // 도로명 주소
  mapx: string; // X 좌표 (네이버 좌표계)
  mapy: string; // Y 좌표 (네이버 좌표계)
}

/**
 * 네이버 로컬 검색 API 응답
 */
export interface NaverLocalSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverLocalSearchItem[];
}

/**
 * 영업 시간 정보
 */
export interface OperatingHours {
  is24Hours: boolean; // 24시간 영업 여부
  hours?: string; // 영업 시간 (예: "09:00-21:00", "평일 09:00-18:00")
  description?: string; // 원본 description 텍스트
  closedDays?: string[]; // 휴무일 (예: ["일요일", "공휴일"])
  todayStatus?: "open" | "closed" | "closing_soon" | "unknown"; // 오늘 영업 상태
  todayHours?: string; // 오늘 영업 시간 (예: "09:00-21:00")
  nextOpenTime?: string; // 다음 영업 시작 시간
}

/**
 * 의료기관 정보 (가공된 데이터)
 */
export interface MedicalFacility {
  id: string; // 고유 ID (네이버 링크 기반)
  name: string; // 시설명
  category: MedicalFacilityCategory;
  address: string; // 지번 주소
  roadAddress: string; // 도로명 주소
  phone: string | null; // 전화번호
  latitude: number; // 위도 (WGS84)
  longitude: number; // 경도 (WGS84)
  distance?: number; // 사용자로부터의 거리 (km)
  link: string; // 네이버 링크
  operatingHours?: OperatingHours; // 영업 시간 정보
}

/**
 * 검색 파라미터
 */
export interface SearchParams {
  query: string; // 검색어
  lat?: number; // 위도
  lon?: number; // 경도
  radius?: number; // 반경 (km, 기본 2km)
  category?: MedicalFacilityCategory;
}

/**
 * 카테고리별 검색 키워드 매핑
 */
export const CATEGORY_KEYWORDS: Record<MedicalFacilityCategory, string[]> = {
  hospital: ["병원"],
  pharmacy: ["약국"],
  animal_hospital: ["동물병원", "반려동물병원", "애완동물병원"],
  animal_pharmacy: ["동물약국", "반려동물약국", "애완동물약국"],
};

/**
 * 카테고리별 한글 라벨
 */
export const CATEGORY_LABELS: Record<MedicalFacilityCategory, string> = {
  hospital: "병원",
  pharmacy: "약국",
  animal_hospital: "동물병원",
  animal_pharmacy: "동물약국",
};

/**
 * 카테고리별 아이콘 (lucide-react)
 */
export const CATEGORY_ICONS: Record<MedicalFacilityCategory, string> = {
  hospital: "Hospital",
  pharmacy: "Pill",
  animal_hospital: "Heart",
  animal_pharmacy: "Pill",
};

