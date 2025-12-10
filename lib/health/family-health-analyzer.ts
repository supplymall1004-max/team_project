/**
 * @file lib/health/family-health-analyzer.ts
 * @description 가족 건강 비교 분석 유틸리티
 *
 * 가족 구성원 간 건강 상태를 비교하고 패턴을 분석합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/lib/health/health-score-calculator: 건강 점수 계산
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { calculateHealthScore } from "./health-score-calculator";
import type { HealthCheckupRecord } from "@/types/kcdc";
import type { MedicationRecord } from "@/types/health-data-integration";

/**
 * 가족 구성원 건강 비교 데이터
 */
export interface FamilyMemberComparison {
  id: string;
  name: string;
  relationship: string | null;
  age: number | null;
  gender: string | null;
  healthScore: number;
  bmi: number | null;
  activeMedications: number;
  recentCheckupDate: string | null;
  vaccinationCompletionRate: number;
}

/**
 * 가족 건강 비교 결과
 */
export interface FamilyHealthComparisonResult {
  members: FamilyMemberComparison[];
  averages: {
    healthScore: number;
    bmi: number | null;
    activeMedications: number;
    vaccinationCompletionRate: number;
  };
  insights: string[];
  commonHealthIssues: string[];
}

/**
 * 나이 계산
 */
function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

/**
 * BMI 계산
 */
function calculateBMI(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * 가족 건강 비교 분석
 *
 * @param userId 사용자 ID
 * @returns 가족 건강 비교 결과
 */
export async function analyzeFamilyHealth(
  userId: string
): Promise<FamilyHealthComparisonResult> {
  console.group("[FamilyHealthAnalyzer] 가족 건강 비교 분석 시작");
  console.log("사용자 ID:", userId);

  try {
    const supabase = getServiceRoleClient();

    // 1. 가족 구성원 목록 조회
    const members: Array<{
      id: string;
      name: string;
      relationship: string | null;
      birth_date: string | null;
      gender: string | null;
      height_cm: number | null;
      weight_kg: number | null;
    }> = [];

    // 본인 정보
    const { data: profile } = await supabase
      .from("user_health_profiles")
      .select("age, gender, height_cm, weight_kg")
      .eq("user_id", userId)
      .single();

    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (profile) {
      members.push({
        id: userId,
        name: user?.name || "본인",
        relationship: null,
        birth_date: null,
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
      });
    }

    // 가족 구성원 조회
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("id, name, relationship, birth_date, gender, height_cm, weight_kg")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (familyMembers) {
      members.push(...familyMembers);
    }

    console.log(`✅ 가족 구성원 ${members.length}명 조회 완료`);

    // 2. 각 구성원별 건강 데이터 수집
    const comparisons: FamilyMemberComparison[] = [];

    for (const member of members) {
      try {
        // 건강 점수 계산
        const healthScore = await calculateHealthScore(
          userId,
          member.id === userId ? null : member.id
        );

        // BMI 계산
        const bmi = calculateBMI(member.height_cm, member.weight_kg);

        // 현재 복용 중인 약물 수
        const today = new Date().toISOString().split("T")[0];
        let medicationQuery = supabase
          .from("medication_records")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .or(`end_date.is.null,end_date.gte.${today}`);

        if (member.id !== userId) {
          medicationQuery = medicationQuery.eq("family_member_id", member.id);
        } else {
          medicationQuery = medicationQuery.is("family_member_id", null);
        }

        const { count: activeMedications } = await medicationQuery;

        // 최근 건강검진 날짜
        let checkupQuery = supabase
          .from("user_health_checkup_records")
          .select("checkup_date")
          .eq("user_id", userId)
          .order("checkup_date", { ascending: false })
          .limit(1);

        if (member.id !== userId) {
          checkupQuery = checkupQuery.eq("family_member_id", member.id);
        } else {
          checkupQuery = checkupQuery.is("family_member_id", null);
        }

        const { data: recentCheckup } = await checkupQuery;

        // 예방접종 완료율
        let vaccinationScheduleQuery = supabase
          .from("user_vaccination_schedules")
          .select("id, priority, status")
          .eq("user_id", userId);

        if (member.id !== userId) {
          vaccinationScheduleQuery = vaccinationScheduleQuery.eq("family_member_id", member.id);
        } else {
          vaccinationScheduleQuery = vaccinationScheduleQuery.is("family_member_id", null);
        }

        const { data: vaccinationSchedules } = await vaccinationScheduleQuery;

        let vaccinationRecordQuery = supabase
          .from("user_vaccination_records")
          .select("id")
          .eq("user_id", userId);

        if (member.id !== userId) {
          vaccinationRecordQuery = vaccinationRecordQuery.eq("family_member_id", member.id);
        } else {
          vaccinationRecordQuery = vaccinationRecordQuery.is("family_member_id", null);
        }

        const { data: vaccinationRecords } = await vaccinationRecordQuery;

        const requiredSchedules = (vaccinationSchedules || []).filter(
          (s) => s.priority === "required"
        );
        const completedCount = Math.min(
          (vaccinationRecords || []).length,
          requiredSchedules.length
        );
        const vaccinationCompletionRate =
          requiredSchedules.length > 0 ? completedCount / requiredSchedules.length : 1;

        const age = member.birth_date ? calculateAge(member.birth_date) : null;

        comparisons.push({
          id: member.id,
          name: member.name,
          relationship: member.relationship,
          age,
          gender: member.gender,
          healthScore: healthScore.totalScore,
          bmi,
          activeMedications: activeMedications || 0,
          recentCheckupDate: recentCheckup?.[0]?.checkup_date || null,
          vaccinationCompletionRate,
        });
      } catch (error) {
        console.error(`❌ 구성원 ${member.id} 분석 실패:`, error);
      }
    }

    // 3. 평균값 계산
    const validHealthScores = comparisons
      .map((m) => m.healthScore)
      .filter((s) => s !== null && s !== undefined);
    const validBMIs = comparisons
      .map((m) => m.bmi)
      .filter((b) => b !== null && b !== undefined) as number[];
    const validMedications = comparisons.map((m) => m.activeMedications);
    const validVaccinationRates = comparisons.map((m) => m.vaccinationCompletionRate);

    const averages = {
      healthScore:
        validHealthScores.length > 0
          ? Math.round(
              validHealthScores.reduce((sum, s) => sum + s, 0) / validHealthScores.length
            )
          : 0,
      bmi:
        validBMIs.length > 0
          ? Math.round((validBMIs.reduce((sum, b) => sum + b, 0) / validBMIs.length) * 10) / 10
          : null,
      activeMedications:
        validMedications.length > 0
          ? Math.round(
              validMedications.reduce((sum, m) => sum + m, 0) / validMedications.length
            )
          : 0,
      vaccinationCompletionRate:
        validVaccinationRates.length > 0
          ? Math.round(
              (validVaccinationRates.reduce((sum, r) => sum + r, 0) /
                validVaccinationRates.length) *
                100
            ) / 100
          : 0,
    };

    // 4. 인사이트 생성
    const insights: string[] = [];

    // 건강 점수 기반 인사이트
    const lowScoreMembers = comparisons.filter((m) => m.healthScore < 60);
    if (lowScoreMembers.length > 0) {
      insights.push(
        `${lowScoreMembers.map((m) => m.name).join(", ")}의 건강 점수가 낮습니다. 정기 건강검진을 권장합니다.`
      );
    }

    // BMI 기반 인사이트
    const highBMIMembers = comparisons.filter((m) => m.bmi && m.bmi >= 25);
    if (highBMIMembers.length > 0) {
      insights.push(
        `${highBMIMembers.map((m) => m.name).join(", ")}의 BMI가 높습니다. 식단 조절과 운동을 권장합니다.`
      );
    }

    // 약물 복용 기반 인사이트
    const highMedicationMembers = comparisons.filter((m) => m.activeMedications >= 3);
    if (highMedicationMembers.length > 0) {
      insights.push(
        `${highMedicationMembers.map((m) => m.name).join(", ")}이(가) 복용 중인 약물이 많습니다. 약물 상호작용을 확인하세요.`
      );
    }

    // 예방접종 기반 인사이트
    const lowVaccinationMembers = comparisons.filter(
      (m) => m.vaccinationCompletionRate < 0.8
    );
    if (lowVaccinationMembers.length > 0) {
      insights.push(
        `${lowVaccinationMembers.map((m) => m.name).join(", ")}의 예방접종 완료율이 낮습니다. 예방접종 일정을 확인하세요.`
      );
    }

    // 5. 공통 건강 이슈 발견
    const commonHealthIssues: string[] = [];

    // 모든 구성원이 낮은 건강 점수를 가진 경우
    if (comparisons.every((m) => m.healthScore < 70)) {
      commonHealthIssues.push("가족 전체의 건강 점수가 낮습니다. 생활 습관 개선이 필요합니다.");
    }

    // 모든 구성원이 높은 BMI를 가진 경우
    const allHighBMI = comparisons.every(
      (m) => m.bmi !== null && m.bmi >= 25
    );
    if (allHighBMI) {
      commonHealthIssues.push("가족 전체의 BMI가 높습니다. 가족 단위 식단 관리가 필요합니다.");
    }

    const result: FamilyHealthComparisonResult = {
      members: comparisons,
      averages,
      insights,
      commonHealthIssues,
    };

    console.log("✅ 가족 건강 비교 분석 완료:", {
      membersCount: result.members.length,
      insightsCount: result.insights.length,
      commonIssuesCount: result.commonHealthIssues.length,
    });
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 가족 건강 비교 분석 오류:", error);
    console.groupEnd();
    throw error;
  }
}

