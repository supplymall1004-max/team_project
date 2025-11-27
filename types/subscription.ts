/**
 * @file types/subscription.ts
 * @description 구독 관련 타입 정의
 */

export type SubscriptionPlan = "free" | "single" | "premium" | "enterprise";

export interface SubscriptionLimits {
  maxFamilyMembers: number;
  features: string[];
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    maxFamilyMembers: 100, // 개발 단계: 제한 없음
    features: ["기본 식단 추천", "개인 건강 프로필"],
  },
  single: {
    maxFamilyMembers: 100, // 개발 단계: 제한 없음
    features: ["기본 식단 추천", "개인 건강 프로필", "제철 과일 간식"],
  },
  premium: {
    maxFamilyMembers: 100, // 개발 단계: 제한 없음
    features: [
      "가족 통합 식단 (통합 식단 포함/제외 기능)",
      "개인별 맞춤 식단",
      "제철 과일 간식",
      "식단 히스토리",
      "영양 분석 리포트",
    ],
  },
  enterprise: {
    maxFamilyMembers: 100, // 개발 단계: 제한 없음
    features: [
      "모든 premium 기능",
      "우선 고객 지원",
      "맞춤형 레시피 추가",
      "API 접근",
    ],
  },
};

/**
 * 가족 구성원 추가 가능 여부 확인
 */
export function canAddFamilyMember(
  currentMemberCount: number,
  subscriptionPlan: SubscriptionPlan
): boolean {
  const limit = SUBSCRIPTION_LIMITS[subscriptionPlan].maxFamilyMembers;
  // 무제한(-1)인 경우 항상 true 반환
  if (limit === -1) {
    return true;
  }
  return currentMemberCount < limit;
}

/**
 * 남은 추가 가능 슬롯 수
 */
export function getRemainingSlots(
  currentMemberCount: number,
  subscriptionPlan: SubscriptionPlan
): number {
  const limit = SUBSCRIPTION_LIMITS[subscriptionPlan].maxFamilyMembers;
  // 무제한(-1)인 경우 매우 큰 수 반환
  if (limit === -1) {
    return 999999;
  }
  return Math.max(0, limit - currentMemberCount);
}

