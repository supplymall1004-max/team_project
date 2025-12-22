/**
 * @file lib/health/dashboard-aggregator.ts
 * @description 대시보드 데이터 집계 유틸리티
 *
 * 건강 대시보드에 필요한 모든 데이터를 집계하여 반환합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/lib/health/health-score-calculator: 건강 점수 계산
 * - @/types/kcdc: 건강검진, 예방접종 타입
 * - @/types/health-data-integration: 약물, 병원 기록 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { calculateHealthScore } from "./health-score-calculator";
import type { HealthCheckupRecord } from "@/types/kcdc";
import type { MedicationRecord, HospitalRecord } from "@/types/health-data-integration";

/**
 * 가족 구성원 건강 요약
 */
export interface FamilyMemberHealthSummary {
  id: string;
  name: string;
  relationship?: string | null;
  healthScore: number;
  recentCheckup: {
    date: string | null;
    hasAbnormalResults: boolean;
  } | null;
  activeMedications: number;
  upcomingVaccinations: number;
  upcomingCheckups: number;
}

/**
 * 건강 알림
 */
export interface HealthAlert {
  id: string;
  type: "vaccination" | "checkup" | "medication" | "flu_alert";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  dueDate: string | null;
  familyMemberId: string | null;
  familyMemberName: string | null;
}

/**
 * 건강 트렌드 데이터
 */
export interface HealthTrendData {
  date: string;
  weight?: number | null;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  } | null;
  bloodSugar?: number | null;
}

/**
 * 대시보드 집계 결과
 */
export interface DashboardSummary {
  familyMembers: FamilyMemberHealthSummary[];
  alerts: HealthAlert[];
  trends: {
    [familyMemberId: string]: HealthTrendData[];
  };
  overallHealthScore: number;
}

/**
 * 가족 구성원 목록 조회
 */
async function getFamilyMembers(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    relationship: string | null;
  }>
> {
  const supabase = getServiceRoleClient();

  // 본인 정보
  const { data: profile } = await supabase
    .from("user_health_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const members: Array<{ id: string; name: string; relationship: string | null }> = [];

  if (profile) {
    // 본인은 user_id를 사용
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    members.push({
      id: userId,
      name: user?.name || "본인",
      relationship: null,
    });
  }

  // 가족 구성원 조회
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, name, relationship")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (familyMembers) {
    for (const member of familyMembers) {
      members.push({
        id: member.id,
        name: member.name,
        relationship: member.relationship,
      });
    }
  }

  return members;
}

/**
 * 가족 구성원별 건강 요약 생성
 */
async function getFamilyMemberSummaries(
  userId: string,
  memberIds: string[]
): Promise<FamilyMemberHealthSummary[]> {
  const summaries: FamilyMemberHealthSummary[] = [];

  for (const memberId of memberIds) {
    try {
      // 건강 점수 계산
      const healthScore = await calculateHealthScore(
        userId,
        memberId === userId ? null : memberId
      );

      const supabase = getServiceRoleClient();

      // 최근 건강검진 조회
      let checkupQuery = supabase
        .from("user_health_checkup_records")
        .select("*")
        .eq("user_id", userId)
        .order("checkup_date", { ascending: false })
        .limit(1);

      if (memberId !== userId) {
        checkupQuery = checkupQuery.eq("family_member_id", memberId);
      } else {
        checkupQuery = checkupQuery.is("family_member_id", null);
      }

      const { data: recentCheckups } = await checkupQuery;
      const recentCheckup = recentCheckups?.[0] as HealthCheckupRecord | undefined;

      // 현재 복용 중인 약물 수
      const today = new Date().toISOString().split("T")[0];
      let medicationQuery = supabase
        .from("medication_records")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .or(`end_date.is.null,end_date.gte.${today}`);

      if (memberId !== userId) {
        medicationQuery = medicationQuery.eq("family_member_id", memberId);
      } else {
        medicationQuery = medicationQuery.is("family_member_id", null);
      }

      const { count: activeMedications } = await medicationQuery;

      // 예정된 예방접종 수
      let vaccinationQuery = supabase
        .from("user_vaccination_schedules")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("status", "pending")
        .gte("recommended_date", today);

      if (memberId !== userId) {
        vaccinationQuery = vaccinationQuery.eq("family_member_id", memberId);
      } else {
        vaccinationQuery = vaccinationQuery.is("family_member_id", null);
      }

      const { count: upcomingVaccinations } = await vaccinationQuery;

      // 예정된 건강검진 수
      let checkupRecommendationQuery = supabase
        .from("user_health_checkup_recommendations")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gte("recommended_date", today);

      if (memberId !== userId) {
        checkupRecommendationQuery = checkupRecommendationQuery.eq("family_member_id", memberId);
      } else {
        checkupRecommendationQuery = checkupRecommendationQuery.is("family_member_id", null);
      }

      const { count: upcomingCheckups } = await checkupRecommendationQuery;

      // 구성원 정보 조회
      let memberName = "본인";
      let relationship: string | null = null;

      if (memberId !== userId) {
        const { data: member } = await supabase
          .from("family_members")
          .select("name, relationship")
          .eq("id", memberId)
          .single();

        if (member) {
          memberName = member.name;
          relationship = member.relationship;
        }
      } else {
        const { data: user } = await supabase
          .from("users")
          .select("name")
          .eq("id", userId)
          .single();

        if (user) {
          memberName = user.name || "본인";
        }
      }

      // 건강검진 결과 정상 여부 확인
      let hasAbnormalResults = false;
      if (recentCheckup?.results) {
        const results = recentCheckup.results as Record<string, any>;
        // 간단한 정상 여부 체크 (혈압, 혈당 등)
        if (
          results.blood_pressure_systolic &&
          (results.blood_pressure_systolic < 90 || results.blood_pressure_systolic > 140)
        ) {
          hasAbnormalResults = true;
        }
        if (
          results.blood_pressure_diastolic &&
          (results.blood_pressure_diastolic < 60 || results.blood_pressure_diastolic > 90)
        ) {
          hasAbnormalResults = true;
        }
        if (results.blood_sugar && (results.blood_sugar < 70 || results.blood_sugar > 100)) {
          hasAbnormalResults = true;
        }
      }

      summaries.push({
        id: memberId,
        name: memberName,
        relationship,
        healthScore: healthScore.totalScore,
        recentCheckup: recentCheckup
          ? {
              date: recentCheckup.checkup_date,
              hasAbnormalResults,
            }
          : null,
        activeMedications: activeMedications || 0,
        upcomingVaccinations: upcomingVaccinations || 0,
        upcomingCheckups: upcomingCheckups || 0,
      });
    } catch (error) {
      console.error(`❌ 구성원 ${memberId} 요약 생성 실패:`, error);
    }
  }

  return summaries;
}

/**
 * 건강 알림 생성
 */
async function getHealthAlerts(userId: string): Promise<HealthAlert[]> {
  const alerts: HealthAlert[] = [];
  const supabase = getServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  // 가족 구성원 목록
  const members = await getFamilyMembers(userId);
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  // 예방접종 알림
  const { data: vaccinationSchedules } = await supabase
    .from("user_vaccination_schedules")
    .select("id, vaccine_name, recommended_date, priority, family_member_id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("recommended_date", today)
    .order("recommended_date", { ascending: true })
    .limit(10);

  if (vaccinationSchedules) {
    for (const schedule of vaccinationSchedules) {
      const daysUntil = Math.ceil(
        (new Date(schedule.recommended_date).getTime() - new Date(today).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: `vaccination-${schedule.id}`,
        type: "vaccination",
        priority: daysUntil <= 7 ? "high" : daysUntil <= 30 ? "medium" : "low",
        title: `${schedule.vaccine_name} 예방접종`,
        description: `${daysUntil}일 후 예정`,
        dueDate: schedule.recommended_date,
        familyMemberId: schedule.family_member_id,
        familyMemberName: schedule.family_member_id
          ? memberMap.get(schedule.family_member_id) || null
          : null,
      });
    }
  }

  // 건강검진 알림
  const { data: checkupRecommendations } = await supabase
    .from("user_health_checkup_recommendations")
    .select("id, checkup_name, recommended_date, priority, family_member_id")
    .eq("user_id", userId)
    .gte("recommended_date", today)
    .order("recommended_date", { ascending: true })
    .limit(10);

  if (checkupRecommendations) {
    for (const recommendation of checkupRecommendations) {
      const daysUntil = Math.ceil(
        (new Date(recommendation.recommended_date).getTime() - new Date(today).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: `checkup-${recommendation.id}`,
        type: "checkup",
        priority:
          recommendation.priority === "high"
            ? "high"
            : daysUntil <= 30
              ? "medium"
              : "low",
        title: `${recommendation.checkup_name} 건강검진`,
        description: `${daysUntil}일 후 권장`,
        dueDate: recommendation.recommended_date,
        familyMemberId: recommendation.family_member_id,
        familyMemberName: recommendation.family_member_id
          ? memberMap.get(recommendation.family_member_id) || null
          : null,
      });
    }
  }

  // 약물 복용 알림 (오늘 복용해야 하는 약물)
  const { data: medications } = await supabase
    .from("medication_records")
    .select("id, medication_name, reminder_times, family_member_id")
    .eq("user_id", userId)
    .eq("reminder_enabled", true)
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (medications) {
    for (const medication of medications) {
      if (medication.reminder_times && medication.reminder_times.length > 0) {
        alerts.push({
          id: `medication-${medication.id}`,
          type: "medication",
          priority: "medium",
          title: `${medication.medication_name} 복용`,
          description: `복용 시간: ${medication.reminder_times.join(", ")}`,
          dueDate: today,
          familyMemberId: medication.family_member_id,
          familyMemberName: medication.family_member_id
            ? memberMap.get(medication.family_member_id) || null
            : null,
        });
      }
    }
  }

  // 독감 경보 (KCDC API 데이터)
  const { data: fluAlerts } = await supabase
    .from("kcdc_alerts")
    .select("id, alert_level, region, week")
    .eq("alert_type", "flu")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fluAlerts && fluAlerts.length > 0) {
    const alert = fluAlerts[0];
    alerts.push({
      id: `flu-${alert.id}`,
      type: "flu_alert",
      priority: alert.alert_level === "high" ? "high" : "medium",
      title: "독감 유행 경보",
      description: `${alert.region} 지역 ${alert.week}주 독감 유행 단계`,
      dueDate: null,
      familyMemberId: null,
      familyMemberName: null,
    });
  }

  // 우선순위별 정렬
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return alerts;
}

/**
 * 건강 트렌드 데이터 생성
 */
async function getHealthTrends(
  userId: string,
  memberIds: string[]
): Promise<{ [familyMemberId: string]: HealthTrendData[] }> {
  const trends: { [familyMemberId: string]: HealthTrendData[] } = {};
  const supabase = getServiceRoleClient();

  // 최근 6개월 데이터만 조회
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const memberId of memberIds) {
    const memberTrends: HealthTrendData[] = [];

    // 건강검진 결과에서 트렌드 데이터 추출
    let checkupQuery = supabase
      .from("user_health_checkup_records")
      .select("checkup_date, results")
      .eq("user_id", userId)
      .gte("checkup_date", sixMonthsAgo.toISOString().split("T")[0])
      .order("checkup_date", { ascending: true });

    if (memberId !== userId) {
      checkupQuery = checkupQuery.eq("family_member_id", memberId);
    } else {
      checkupQuery = checkupQuery.is("family_member_id", null);
    }

    const { data: checkups } = await checkupQuery;

    if (checkups) {
      for (const checkup of checkups) {
        const results = (checkup.results || {}) as Record<string, any>;
        memberTrends.push({
          date: checkup.checkup_date,
          weight: results.weight || null,
          bloodPressure:
            results.blood_pressure_systolic && results.blood_pressure_diastolic
              ? {
                  systolic: results.blood_pressure_systolic,
                  diastolic: results.blood_pressure_diastolic,
                }
              : null,
          bloodSugar: results.blood_sugar || null,
        });
      }
    }

    trends[memberId] = memberTrends;
  }

  return trends;
}

/**
 * 대시보드 데이터 집계
 *
 * @param userId 사용자 ID
 * @returns 대시보드 집계 결과
 */
export async function aggregateDashboardData(
  userId: string
): Promise<DashboardSummary> {
  console.group("[DashboardAggregator] 대시보드 데이터 집계 시작");
  console.log("사용자 ID:", userId);

  try {
    // 1. 가족 구성원 목록 조회
    const members = await getFamilyMembers(userId);
    const memberIds = members.map((m) => m.id);

    console.log(`✅ 가족 구성원 ${memberIds.length}명 조회 완료`);

    // 2. 가족 구성원별 건강 요약 생성
    const familyMemberSummaries = await getFamilyMemberSummaries(userId, memberIds);

    console.log(`✅ 가족 구성원 건강 요약 생성 완료`);

    // 3. 건강 알림 생성
    const alerts = await getHealthAlerts(userId);

    console.log(`✅ 건강 알림 ${alerts.length}개 생성 완료`);

    // 4. 건강 트렌드 데이터 생성
    const trends = await getHealthTrends(userId, memberIds);

    console.log(`✅ 건강 트렌드 데이터 생성 완료`);

    // 5. 전체 건강 점수 계산 (가족 평균)
    const avgHealthScore =
      familyMemberSummaries.length > 0
        ? Math.round(
            familyMemberSummaries.reduce((sum, m) => sum + m.healthScore, 0) /
              familyMemberSummaries.length
          )
        : 0;

    const result: DashboardSummary = {
      familyMembers: familyMemberSummaries,
      alerts,
      trends,
      overallHealthScore: avgHealthScore,
    };

    console.log("✅ 대시보드 데이터 집계 완료:", {
      familyMembersCount: result.familyMembers.length,
      alertsCount: result.alerts.length,
      overallHealthScore: result.overallHealthScore,
    });
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 대시보드 데이터 집계 오류:", error);
    console.groupEnd();
    throw error;
  }
}

