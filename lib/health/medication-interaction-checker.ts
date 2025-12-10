/**
 * @file lib/health/medication-interaction-checker.ts
 * @description 약물 상호작용 검사 로직
 *
 * 사용자가 복용 중인 약물 간의 상호작용을 검사하고 위험도를 평가합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/types/health-data-integration: 약물 기록 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { MedicationRecord } from "@/types/health-data-integration";

/**
 * 약물 상호작용 위험도
 */
export type InteractionLevel = "severe" | "moderate" | "mild" | "info";

/**
 * 약물 상호작용 정보
 */
export interface MedicationInteraction {
  id: string;
  medication_a: string;
  medication_b: string;
  interaction_level: InteractionLevel;
  description: string | null;
  recommendation: string | null;
  source: string;
}

/**
 * 약물 상호작용 검사 결과
 */
export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: Array<{
    medicationA: string;
    medicationB: string;
    level: InteractionLevel;
    description: string | null;
    recommendation: string | null;
    source: string;
  }>;
  severeCount: number;
  moderateCount: number;
  mildCount: number;
  infoCount: number;
}

/**
 * 약물명 정규화
 * 약물명을 비교하기 위해 정규화 (대소문자 통일, 공백 제거 등)
 */
function normalizeMedicationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s가-힣]/g, ""); // 특수문자 제거
}

/**
 * 약물명 매칭
 * 두 약물명이 같은지 확인 (정규화 후 비교)
 */
function matchMedicationNames(name1: string, name2: string): boolean {
  const normalized1 = normalizeMedicationName(name1);
  const normalized2 = normalizeMedicationName(name2);
  return normalized1 === normalized2;
}

/**
 * 약물 상호작용 검사
 *
 * @param medications 복용 중인 약물 목록
 * @param userId 사용자 ID (선택, 가족 구성원별 검사 시 사용)
 * @param familyMemberId 가족 구성원 ID (선택)
 * @returns 상호작용 검사 결과
 */
export async function checkMedicationInteractions(
  medications: MedicationRecord[],
  userId?: string,
  familyMemberId?: string | null
): Promise<InteractionCheckResult> {
  console.group("[MedicationInteractionChecker] 약물 상호작용 검사 시작");
  console.log("검사할 약물 수:", medications.length);

  try {
    if (medications.length < 2) {
      console.log("✅ 약물이 2개 미만이므로 상호작용 검사 불필요");
      console.groupEnd();
      return {
        hasInteractions: false,
        interactions: [],
        severeCount: 0,
        moderateCount: 0,
        mildCount: 0,
        infoCount: 0,
      };
    }

    const supabase = getServiceRoleClient();
    const interactions: InteractionCheckResult["interactions"] = [];

    // 모든 약물 쌍에 대해 상호작용 검사
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const medA = medications[i];
        const medB = medications[j];

        // 약물명으로 상호작용 정보 조회
        // 정규화된 약물명으로 검색
        const normalizedMedA = normalizeMedicationName(medA.medication_name);
        const normalizedMedB = normalizeMedicationName(medB.medication_name);

        const { data: allInteractions, error } = await supabase
          .from("medication_interactions")
          .select("*");

        if (error) {
          console.error(`❌ 상호작용 조회 실패 (${medA.medication_name} + ${medB.medication_name}):`, error);
          continue;
        }

        // 메모리에서 매칭 검색
        const interactionData = (allInteractions || []).find((interaction) => {
          const normalizedA = normalizeMedicationName(interaction.medication_a);
          const normalizedB = normalizeMedicationName(interaction.medication_b);
          return (
            (normalizedA === normalizedMedA && normalizedB === normalizedMedB) ||
            (normalizedA === normalizedMedB && normalizedB === normalizedMedA)
          );
        });

        if (error) {
          console.error(`❌ 상호작용 조회 실패 (${medA.medication_name} + ${medB.medication_name}):`, error);
          continue;
        }

        if (interactionData) {
          interactions.push({
            medicationA: medA.medication_name,
            medicationB: medB.medication_name,
            level: interactionData.interaction_level as InteractionLevel,
            description: interactionData.description,
            recommendation: interactionData.recommendation,
            source: interactionData.source,
          });
        }
      }
    }

    // 위험도별 개수 계산
    const severeCount = interactions.filter((i) => i.level === "severe").length;
    const moderateCount = interactions.filter((i) => i.level === "moderate").length;
    const mildCount = interactions.filter((i) => i.level === "mild").length;
    const infoCount = interactions.filter((i) => i.level === "info").length;

    const result: InteractionCheckResult = {
      hasInteractions: interactions.length > 0,
      interactions,
      severeCount,
      moderateCount,
      mildCount,
      infoCount,
    };

    console.log("✅ 약물 상호작용 검사 완료:", {
      hasInteractions: result.hasInteractions,
      totalInteractions: interactions.length,
      severeCount: result.severeCount,
      moderateCount: result.moderateCount,
    });
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 약물 상호작용 검사 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 사용자 또는 가족 구성원의 현재 복용 중인 약물 상호작용 검사
 *
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택)
 * @returns 상호작용 검사 결과
 */
export async function checkUserMedicationInteractions(
  userId: string,
  familyMemberId?: string | null
): Promise<InteractionCheckResult> {
  console.group("[MedicationInteractionChecker] 사용자 약물 상호작용 검사 시작");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId || "없음");

  try {
    const supabase = getServiceRoleClient();

    // 현재 복용 중인 약물 조회
    const today = new Date().toISOString().split("T")[0];
    let medicationQuery = supabase
      .from("medication_records")
      .select("*")
      .eq("user_id", userId)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("start_date", { ascending: false });

    if (familyMemberId) {
      medicationQuery = medicationQuery.eq("family_member_id", familyMemberId);
    } else {
      medicationQuery = medicationQuery.is("family_member_id", null);
    }

    const { data: medications, error } = await medicationQuery;

    if (error) {
      console.error("❌ 약물 기록 조회 실패:", error);
      throw error;
    }

    if (!medications || medications.length === 0) {
      console.log("✅ 복용 중인 약물이 없습니다.");
      console.groupEnd();
      return {
        hasInteractions: false,
        interactions: [],
        severeCount: 0,
        moderateCount: 0,
        mildCount: 0,
        infoCount: 0,
      };
    }

    console.log(`✅ 복용 중인 약물 ${medications.length}개 조회 완료`);

    // 상호작용 검사
    const result = await checkMedicationInteractions(
      medications as MedicationRecord[],
      userId,
      familyMemberId
    );

    console.groupEnd();
    return result;
  } catch (error) {
    console.error("❌ 사용자 약물 상호작용 검사 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 약물 추가 시 상호작용 검사
 *
 * @param newMedicationName 새로 추가할 약물명
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택)
 * @returns 상호작용 검사 결과
 */
export async function checkNewMedicationInteraction(
  newMedicationName: string,
  userId: string,
  familyMemberId?: string | null
): Promise<InteractionCheckResult> {
  console.group("[MedicationInteractionChecker] 새 약물 상호작용 검사 시작");
  console.log("새 약물명:", newMedicationName);

  try {
    const supabase = getServiceRoleClient();

    // 현재 복용 중인 약물 조회
    const today = new Date().toISOString().split("T")[0];
    let medicationQuery = supabase
      .from("medication_records")
      .select("*")
      .eq("user_id", userId)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("start_date", { ascending: false });

    if (familyMemberId) {
      medicationQuery = medicationQuery.eq("family_member_id", familyMemberId);
    } else {
      medicationQuery = medicationQuery.is("family_member_id", null);
    }

    const { data: existingMedications, error } = await medicationQuery;

    if (error) {
      console.error("❌ 약물 기록 조회 실패:", error);
      throw error;
    }

    if (!existingMedications || existingMedications.length === 0) {
      console.log("✅ 기존 복용 약물이 없으므로 상호작용 없음");
      console.groupEnd();
      return {
        hasInteractions: false,
        interactions: [],
        severeCount: 0,
        moderateCount: 0,
        mildCount: 0,
        infoCount: 0,
      };
    }

    // 새 약물과 기존 약물 간 상호작용 검사
    const interactions: InteractionCheckResult["interactions"] = [];

    // 모든 상호작용 정보 조회
    const { data: allInteractions } = await supabase
      .from("medication_interactions")
      .select("*");

    const normalizedNewMed = normalizeMedicationName(newMedicationName);

    for (const existingMed of existingMedications) {
      // 정규화된 약물명으로 매칭 검색
      const normalizedExistingMed = normalizeMedicationName(existingMed.medication_name);

      const interactionData = (allInteractions || []).find((interaction) => {
        const normalizedA = normalizeMedicationName(interaction.medication_a);
        const normalizedB = normalizeMedicationName(interaction.medication_b);
        return (
          (normalizedA === normalizedNewMed && normalizedB === normalizedExistingMed) ||
          (normalizedA === normalizedExistingMed && normalizedB === normalizedNewMed)
        );
      });

      if (interactionData) {
        interactions.push({
          medicationA: newMedicationName,
          medicationB: existingMed.medication_name,
          level: interactionData.interaction_level as InteractionLevel,
          description: interactionData.description,
          recommendation: interactionData.recommendation,
          source: interactionData.source,
        });
      }
    }

    // 위험도별 개수 계산
    const severeCount = interactions.filter((i) => i.level === "severe").length;
    const moderateCount = interactions.filter((i) => i.level === "moderate").length;
    const mildCount = interactions.filter((i) => i.level === "mild").length;
    const infoCount = interactions.filter((i) => i.level === "info").length;

    const result: InteractionCheckResult = {
      hasInteractions: interactions.length > 0,
      interactions,
      severeCount,
      moderateCount,
      mildCount,
      infoCount,
    };

    console.log("✅ 새 약물 상호작용 검사 완료:", {
      hasInteractions: result.hasInteractions,
      totalInteractions: interactions.length,
    });
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 새 약물 상호작용 검사 오류:", error);
    console.groupEnd();
    throw error;
  }
}

