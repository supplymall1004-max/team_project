/**
 * @file lib/health/health-score-calculator.ts
 * @description 건강 점수 계산 로직
 *
 * 사용자 또는 가족 구성원의 건강 상태를 종합적으로 평가하여 0-100점의 건강 점수를 계산합니다.
 *
 * 계산 요소:
 * - 건강검진 결과 정상 여부 (40점)
 * - 약물 복용 규칙성 (20점)
 * - 예방접종 완료율 (20점)
 * - 최근 병원 방문 빈도 (10점)
 * - 건강 프로필 완성도 (10점)
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/types/kcdc: 건강검진 기록 타입
 * - @/types/health-data-integration: 약물, 병원 기록 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { HealthCheckupRecord } from "@/types/kcdc";
import type { MedicationRecord, HospitalRecord } from "@/types/health-data-integration";

/**
 * 건강 점수 계산 결과
 */
export interface HealthScoreResult {
  totalScore: number; // 0-100점
  breakdown: {
    checkupScore: number; // 건강검진 점수 (0-40)
    medicationScore: number; // 약물 복용 점수 (0-20)
    vaccinationScore: number; // 예방접종 점수 (0-20)
    hospitalVisitScore: number; // 병원 방문 점수 (0-10)
    profileScore: number; // 프로필 완성도 점수 (0-10)
  };
  details: {
    checkupDetails: {
      hasRecentCheckup: boolean;
      normalResultsCount: number;
      abnormalResultsCount: number;
      totalCheckups: number;
    };
    medicationDetails: {
      activeMedications: number;
      hasRegularSchedule: boolean;
      complianceRate: number; // 0-1
    };
    vaccinationDetails: {
      completedCount: number;
      requiredCount: number;
      completionRate: number; // 0-1
    };
    hospitalVisitDetails: {
      recentVisitCount: number; // 최근 6개월
      visitFrequencyScore: number; // 0-1
    };
    profileDetails: {
      completeness: number; // 0-1
      hasBasicInfo: boolean;
      hasHealthGoals: boolean;
    };
  };
}

/**
 * 건강검진 결과 정상 여부 판단
 */
function isCheckupResultNormal(results: Record<string, any>): boolean {
  // 주요 건강 지표 확인
  const keyIndicators = [
    "blood_pressure_systolic", // 수축기 혈압
    "blood_pressure_diastolic", // 이완기 혈압
    "blood_sugar", // 혈당
    "cholesterol_total", // 총 콜레스테롤
    "cholesterol_ldl", // LDL 콜레스테롤
    "cholesterol_hdl", // HDL 콜레스테롤
    "triglycerides", // 중성지방
  ];

  let normalCount = 0;
  let totalCount = 0;

  for (const indicator of keyIndicators) {
    const value = results[indicator];
    if (value !== null && value !== undefined) {
      totalCount++;
      // 정상 범위 체크 (간단한 기준)
      if (indicator === "blood_pressure_systolic") {
        if (value >= 90 && value <= 140) normalCount++;
      } else if (indicator === "blood_pressure_diastolic") {
        if (value >= 60 && value <= 90) normalCount++;
      } else if (indicator === "blood_sugar") {
        if (value >= 70 && value <= 100) normalCount++;
      } else if (indicator === "cholesterol_total") {
        if (value < 200) normalCount++;
      } else if (indicator === "cholesterol_ldl") {
        if (value < 100) normalCount++;
      } else if (indicator === "cholesterol_hdl") {
        if (value >= 40) normalCount++;
      } else if (indicator === "triglycerides") {
        if (value < 150) normalCount++;
      }
    }
  }

  // 측정된 지표의 70% 이상이 정상이면 정상으로 판단
  return totalCount === 0 || normalCount / totalCount >= 0.7;
}

/**
 * 건강검진 점수 계산 (0-40점)
 */
function calculateCheckupScore(
  checkups: HealthCheckupRecord[]
): { score: number; details: HealthScoreResult["details"]["checkupDetails"] } {
  if (checkups.length === 0) {
    return {
      score: 0,
      details: {
        hasRecentCheckup: false,
        normalResultsCount: 0,
        abnormalResultsCount: 0,
        totalCheckups: 0,
      },
    };
  }

  // 최근 1년 이내 검진만 고려
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentCheckups = checkups.filter(
    (checkup) => new Date(checkup.checkup_date) >= oneYearAgo
  );

  if (recentCheckups.length === 0) {
    return {
      score: 10, // 최근 검진이 없으면 기본 점수
      details: {
        hasRecentCheckup: false,
        normalResultsCount: 0,
        abnormalResultsCount: 0,
        totalCheckups: checkups.length,
      },
    };
  }

  // 최근 검진 결과 분석
  let normalCount = 0;
  let abnormalCount = 0;

  for (const checkup of recentCheckups) {
    if (isCheckupResultNormal(checkup.results || {})) {
      normalCount++;
    } else {
      abnormalCount++;
    }
  }

  const normalRate = normalCount / recentCheckups.length;
  const score = Math.round(40 * normalRate);

  return {
    score,
    details: {
      hasRecentCheckup: true,
      normalResultsCount: normalCount,
      abnormalResultsCount: abnormalCount,
      totalCheckups: recentCheckups.length,
    },
  };
}

/**
 * 약물 복용 규칙성 점수 계산 (0-20점)
 */
function calculateMedicationScore(
  medications: MedicationRecord[]
): { score: number; details: HealthScoreResult["details"]["medicationDetails"] } {
  if (medications.length === 0) {
    return {
      score: 20, // 약물이 없으면 만점
      details: {
        activeMedications: 0,
        hasRegularSchedule: true,
        complianceRate: 1,
      },
    };
  }

  // 현재 복용 중인 약물만 고려
  const today = new Date().toISOString().split("T")[0];
  const activeMedications = medications.filter(
    (med) => !med.end_date || med.end_date >= today
  );

  if (activeMedications.length === 0) {
    return {
      score: 20,
      details: {
        activeMedications: 0,
        hasRegularSchedule: true,
        complianceRate: 1,
      },
    };
  }

  // 알림 설정 여부 확인
  const medicationsWithReminder = activeMedications.filter(
    (med) => med.reminder_enabled && med.reminder_times.length > 0
  );

  const hasRegularSchedule = medicationsWithReminder.length > 0;
  const complianceRate = medicationsWithReminder.length / activeMedications.length;

  // 규칙성 점수: 알림 설정 비율에 따라 계산
  const score = Math.round(20 * complianceRate);

  return {
    score,
    details: {
      activeMedications: activeMedications.length,
      hasRegularSchedule,
      complianceRate,
    },
  };
}

/**
 * 예방접종 완료율 점수 계산 (0-20점)
 */
function calculateVaccinationScore(
  schedules: Array<{ priority: string; status: string }>,
  records: Array<{ completed_date: string | null }>
): { score: number; details: HealthScoreResult["details"]["vaccinationDetails"] } {
  // 필수 예방접종만 고려
  const requiredSchedules = schedules.filter((s) => s.priority === "required");
  const completedRecords = records.filter((r) => r.completed_date !== null);

  if (requiredSchedules.length === 0) {
    return {
      score: 20, // 필수 예방접종이 없으면 만점
      details: {
        completedCount: completedRecords.length,
        requiredCount: 0,
        completionRate: 1,
      },
    };
  }

  // 완료된 예방접종 수 (일정과 기록 매칭)
  const completedCount = Math.min(completedRecords.length, requiredSchedules.length);
  const completionRate = completedCount / requiredSchedules.length;
  const score = Math.round(20 * completionRate);

  return {
    score,
    details: {
      completedCount,
      requiredCount: requiredSchedules.length,
      completionRate,
    },
  };
}

/**
 * 병원 방문 빈도 점수 계산 (0-10점)
 */
function calculateHospitalVisitScore(
  hospitalRecords: HospitalRecord[]
): { score: number; details: HealthScoreResult["details"]["hospitalVisitDetails"] } {
  // 최근 6개월 이내 방문 기록만 고려
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentVisits = hospitalRecords.filter(
    (record) => new Date(record.visit_date) >= sixMonthsAgo
  );

  // 병원 방문 빈도가 낮을수록 좋음
  // 월 1회 이하: 만점, 월 2회: 7점, 월 3회 이상: 5점
  const visitCount = recentVisits.length;
  const months = 6;
  const visitsPerMonth = visitCount / months;

  let visitFrequencyScore = 1;
  if (visitsPerMonth <= 1) {
    visitFrequencyScore = 1;
  } else if (visitsPerMonth <= 2) {
    visitFrequencyScore = 0.7;
  } else {
    visitFrequencyScore = 0.5;
  }

  const score = Math.round(10 * visitFrequencyScore);

  return {
    score,
    details: {
      recentVisitCount: visitCount,
      visitFrequencyScore,
    },
  };
}

/**
 * 건강 프로필 완성도 점수 계산 (0-10점)
 */
function calculateProfileScore(profile: {
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  daily_calorie_goal?: number | null;
  diseases?: string[] | null;
  allergies?: string[] | null;
}): { score: number; details: HealthScoreResult["details"]["profileDetails"] } {
  let filledFields = 0;
  const totalFields = 8;

  if (profile.age !== null && profile.age !== undefined) filledFields++;
  if (profile.gender) filledFields++;
  if (profile.height_cm !== null && profile.height_cm !== undefined) filledFields++;
  if (profile.weight_kg !== null && profile.weight_kg !== undefined) filledFields++;
  if (profile.activity_level) filledFields++;
  if (profile.daily_calorie_goal !== null && profile.daily_calorie_goal !== undefined)
    filledFields++;
  if (profile.diseases && Array.isArray(profile.diseases)) filledFields++;
  if (profile.allergies && Array.isArray(profile.allergies)) filledFields++;

  const completeness = filledFields / totalFields;
  const score = Math.round(10 * completeness);

  return {
    score,
    details: {
      completeness,
      hasBasicInfo: !!(profile.age && profile.gender && profile.height_cm && profile.weight_kg),
      hasHealthGoals: !!(profile.daily_calorie_goal && profile.activity_level),
    },
  };
}

/**
 * 건강 점수 계산
 *
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택)
 * @returns 건강 점수 계산 결과
 */
export async function calculateHealthScore(
  userId: string,
  familyMemberId?: string | null
): Promise<HealthScoreResult> {
  console.group("[HealthScoreCalculator] 건강 점수 계산 시작");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId || "없음");

  try {
    const supabase = getServiceRoleClient();

    // 1. 건강검진 기록 조회
    let checkupQuery = supabase
      .from("user_health_checkup_records")
      .select("*")
      .eq("user_id", userId)
      .order("checkup_date", { ascending: false });

    if (familyMemberId) {
      checkupQuery = checkupQuery.eq("family_member_id", familyMemberId);
    } else {
      checkupQuery = checkupQuery.is("family_member_id", null);
    }

    const { data: checkups, error: checkupError } = await checkupQuery;

    if (checkupError) {
      console.error("❌ 건강검진 기록 조회 실패:", checkupError);
    }

    // 2. 약물 복용 기록 조회
    let medicationQuery = supabase
      .from("medication_records")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    if (familyMemberId) {
      medicationQuery = medicationQuery.eq("family_member_id", familyMemberId);
    } else {
      medicationQuery = medicationQuery.is("family_member_id", null);
    }

    const { data: medications, error: medicationError } = await medicationQuery;

    if (medicationError) {
      console.error("❌ 약물 복용 기록 조회 실패:", medicationError);
    }

    // 3. 예방접종 일정 및 기록 조회
    let vaccinationScheduleQuery = supabase
      .from("user_vaccination_schedules")
      .select("priority, status")
      .eq("user_id", userId);

    if (familyMemberId) {
      vaccinationScheduleQuery = vaccinationScheduleQuery.eq("family_member_id", familyMemberId);
    } else {
      vaccinationScheduleQuery = vaccinationScheduleQuery.is("family_member_id", null);
    }

    const { data: vaccinationSchedules, error: vaccinationScheduleError } =
      await vaccinationScheduleQuery;

    if (vaccinationScheduleError) {
      console.error("❌ 예방접종 일정 조회 실패:", vaccinationScheduleError);
    }

    let vaccinationRecordQuery = supabase
      .from("user_vaccination_records")
      .select("completed_date")
      .eq("user_id", userId);

    if (familyMemberId) {
      vaccinationRecordQuery = vaccinationRecordQuery.eq("family_member_id", familyMemberId);
    } else {
      vaccinationRecordQuery = vaccinationRecordQuery.is("family_member_id", null);
    }

    const { data: vaccinationRecords, error: vaccinationRecordError } =
      await vaccinationRecordQuery;

    if (vaccinationRecordError) {
      console.error("❌ 예방접종 기록 조회 실패:", vaccinationRecordError);
    }

    // 4. 병원 방문 기록 조회
    let hospitalQuery = supabase
      .from("hospital_records")
      .select("*")
      .eq("user_id", userId)
      .order("visit_date", { ascending: false });

    if (familyMemberId) {
      hospitalQuery = hospitalQuery.eq("family_member_id", familyMemberId);
    } else {
      hospitalQuery = hospitalQuery.is("family_member_id", null);
    }

    const { data: hospitalRecords, error: hospitalError } = await hospitalQuery;

    if (hospitalError) {
      console.error("❌ 병원 방문 기록 조회 실패:", hospitalError);
    }

    // 5. 건강 프로필 조회
    const profileQuery = supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: profile, error: profileError } = await profileQuery;

    if (profileError) {
      console.error("❌ 건강 프로필 조회 실패:", profileError);
    }

    // 6. 각 항목별 점수 계산
    const checkupResult = calculateCheckupScore((checkups || []) as HealthCheckupRecord[]);
    const medicationResult = calculateMedicationScore(
      (medications || []) as MedicationRecord[]
    );
    const vaccinationResult = calculateVaccinationScore(
      (vaccinationSchedules || []) as Array<{ priority: string; status: string }>,
      (vaccinationRecords || []) as Array<{ completed_date: string | null }>
    );
    const hospitalResult = calculateHospitalVisitScore(
      (hospitalRecords || []) as HospitalRecord[]
    );
    const profileResult = calculateProfileScore(profile || {});

    // 7. 총점 계산
    const totalScore =
      checkupResult.score +
      medicationResult.score +
      vaccinationResult.score +
      hospitalResult.score +
      profileResult.score;

    const result: HealthScoreResult = {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      breakdown: {
        checkupScore: checkupResult.score,
        medicationScore: medicationResult.score,
        vaccinationScore: vaccinationResult.score,
        hospitalVisitScore: hospitalResult.score,
        profileScore: profileResult.score,
      },
      details: {
        checkupDetails: checkupResult.details,
        medicationDetails: medicationResult.details,
        vaccinationDetails: vaccinationResult.details,
        hospitalVisitDetails: hospitalResult.details,
        profileDetails: profileResult.details,
      },
    };

    console.log("✅ 건강 점수 계산 완료:", {
      totalScore: result.totalScore,
      breakdown: result.breakdown,
    });
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 건강 점수 계산 오류:", error);
    console.groupEnd();
    throw error;
  }
}

