/**
 * @file lib/diet/family-summary.ts
 * @description 가족 식단 요약 관련 헬퍼와 타입 정의
 *
 * DietSection 클라이언트와 YesterdayFamilyTabs 컴포넌트에서
 * 공통으로 사용하는 타입과 유틸리티를 제공합니다.
 */

export interface FamilyMemberTabPayload {
  id: string;
  name: string;
  relationship?: string | null;
  role: "self" | "member";
  includeInUnified?: boolean;
  diseases?: string[];
  allergies?: string[];
  notes?: string[];
  healthFlags?: {
    type: "disease" | "allergy";
    code: string;
    label: string;
  }[];
}

export interface FamilyDietSummaryPayload {
  memberTabs: FamilyMemberTabPayload[];
  includedMemberIds?: string[] | null;
}

/**
 * 서버에서 제공된 포함 ID 배열과 탭 정보를 바탕으로
 * 실제로 사용할 포함 대상 ID 리스트를 결정합니다.
 *
 * - 서버가 명시적으로 includedMemberIds를 내려주면 그대로 사용합니다.
 * - undefined이거나 빈 배열이면 includeInUnified !== false 인 탭만 포함합니다.
 */
export function deriveIncludedMemberIds({
  memberTabs,
  includedMemberIds,
}: FamilyDietSummaryPayload): string[] {
  if (Array.isArray(includedMemberIds) && includedMemberIds.length > 0) {
    return includedMemberIds;
  }

  if (!Array.isArray(memberTabs) || memberTabs.length === 0) {
    return [];
  }

  return memberTabs
    .filter((member) => member.includeInUnified !== false)
    .map((member) => member.id);
}
































