/**
 * @file lib/premium/features.ts
 * @description 프리미엄 기능 정의 및 관리
 * 
 * 프리미엄 기능 목록과 각 기능의 설명을 중앙에서 관리합니다.
 */

/**
 * 프리미엄 기능 타입
 */
export type PremiumFeatureId =
  | 'family_diet' // 가족 맞춤 식단
  | 'advanced_health_dashboard' // 고급 건강 대시보드
  | 'unlimited_bookmarks' // 무제한 즐겨찾기
  | 'ad_free_videos' // 광고 없는 영상
  | 'detailed_nutrition_report' // 상세 영양 리포트
  | 'health_trends' // 건강 트렌드 분석
  | 'custom_meal_plans' // 맞춤 식단 계획
  | 'priority_support' // 우선 고객 지원
  | 'export_data' // 데이터 내보내기
  | 'api_access'; // API 접근

/**
 * 프리미엄 기능 정보
 */
export interface PremiumFeature {
  id: PremiumFeatureId;
  name: string;
  description: string;
  icon?: string;
}

/**
 * 프리미엄 기능 목록
 */
export const PREMIUM_FEATURES: Record<PremiumFeatureId, PremiumFeature> = {
  family_diet: {
    id: 'family_diet',
    name: '가족 맞춤 식단',
    description: '가족 구성원별 맞춤 식단 계획 및 영양 관리',
    icon: '👨‍👩‍👧‍👦',
  },
  advanced_health_dashboard: {
    id: 'advanced_health_dashboard',
    name: '고급 건강 대시보드',
    description: '통합 건강 데이터 시각화 및 트렌드 분석',
    icon: '📊',
  },
  unlimited_bookmarks: {
    id: 'unlimited_bookmarks',
    name: '무제한 즐겨찾기',
    description: '레시피와 식단을 무제한으로 저장',
    icon: '⭐',
  },
  ad_free_videos: {
    id: 'ad_free_videos',
    name: '광고 없는 영상',
    description: '요리 영상 시청 시 광고 없이 감상',
    icon: '🎬',
  },
  detailed_nutrition_report: {
    id: 'detailed_nutrition_report',
    name: '상세 영양 리포트',
    description: '종합 식단 리포트 및 영양소 분석',
    icon: '📈',
  },
  health_trends: {
    id: 'health_trends',
    name: '건강 트렌드 분석',
    description: '건강 데이터 추이 분석 및 예측',
    icon: '📉',
  },
  custom_meal_plans: {
    id: 'custom_meal_plans',
    name: '맞춤 식단 계획',
    description: '개인 건강 상태에 맞춘 식단 자동 생성',
    icon: '🍽️',
  },
  priority_support: {
    id: 'priority_support',
    name: '우선 고객 지원',
    description: '프리미엄 회원 전용 고객 지원',
    icon: '💬',
  },
  export_data: {
    id: 'export_data',
    name: '데이터 내보내기',
    description: '건강 데이터 및 식단 정보 내보내기',
    icon: '💾',
  },
  api_access: {
    id: 'api_access',
    name: 'API 접근',
    description: '프로그래밍 방식으로 데이터 접근',
    icon: '🔌',
  },
};

/**
 * 프리미엄 기능이 필요한 기능인지 확인
 */
export function isPremiumFeature(featureId: string): featureId is PremiumFeatureId {
  return featureId in PREMIUM_FEATURES;
}

/**
 * 프리미엄 기능 정보 가져오기
 */
export function getPremiumFeature(featureId: PremiumFeatureId): PremiumFeature {
  return PREMIUM_FEATURES[featureId];
}

/**
 * 모든 프리미엄 기능 목록 가져오기
 */
export function getAllPremiumFeatures(): PremiumFeature[] {
  return Object.values(PREMIUM_FEATURES);
}

