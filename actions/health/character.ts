/**
 * @file actions/health/character.ts
 * @description 캐릭터창 데이터 조회 Server Actions
 *
 * 캐릭터창에 표시되는 모든 데이터를 조회하는 Server Actions입니다.
 * - 기본 정보 (family_members)
 * - 최신 체중/체지방율 (weight_logs)
 * - 복용 중인 약물 및 오늘 복용 여부
 * - 건강검진 기록 및 권장 일정
 * - 백신 기록 및 일정
 * - 구충제 기록
 * - 생애주기별 알림
 * - 건강 점수
 * - 리마인드 통합
 * - 건강 트렌드 데이터
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/health/health-score-calculator: calculateHealthScore
 * - @/lib/kcdc/premium-guard: checkPremiumAccess
 * - @/types/character: CharacterData
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { calculateHealthScore } from "@/lib/health/health-score-calculator";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { detectCharacterEmotion } from "@/lib/health/emotion-detector";
import type { EmotionDetectionInput } from "@/lib/health/emotion-detector";
import type { CharacterData, ReminderItem } from "@/types/character";
import type {
  MedicationRecord,
} from "@/types/health-data-integration";
import type {
  HealthCheckupRecord,
  HealthCheckupRecommendation,
  VaccinationRecord,
  VaccinationSchedule,
  DewormingRecord,
} from "@/types/kcdc";
import type { WeightLog } from "@/types/health-visualization";
import type { UserHealthProfile } from "@/types/health";

/**
 * 생년월일로 나이 계산
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
 * 건강 상태 판단
 */
function getHealthStatus(score: number): "excellent" | "good" | "fair" | "needs_attention" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "needs_attention";
}

/**
 * D-Day 계산 (날짜 차이)
 */
function calculateDaysUntil(targetDate: string | Date | null): number | null {
  if (!targetDate) return null;
  try {
    const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * 캐릭터창 데이터 조회
 *
 * @param memberId 가족 구성원 ID (본인인 경우 user_id와 동일)
 * @returns 캐릭터창 데이터
 */
export async function getCharacterData(memberId: string): Promise<CharacterData> {
  console.group("[getCharacterData] 캐릭터창 데이터 조회 시작");
  console.log("가족 구성원 ID:", memberId);

  try {
    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      throw new Error(
        premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
      );
    }

    const supabase = getServiceRoleClient();
    const userId = premiumCheck.userId;
    const isSelf = memberId === userId;
    const familyMemberId = isSelf ? null : memberId;

    console.log("사용자 ID:", userId);
    console.log("본인 여부:", isSelf);

    // 2. 가족 구성원 기본 정보 조회
    let member: any;
    if (isSelf) {
      // 본인인 경우
      const { data: user } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", userId)
        .single();

      const { data: profile } = await supabase
        .from("user_health_profiles")
        .select("age, gender, height_cm, weight_kg, diseases, allergies, activity_level, dietary_preferences")
        .eq("user_id", userId)
        .single();

      if (!user) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      // 타입 안전성을 위해 profile 데이터를 명시적으로 처리
      // Supabase의 타입 추론이 제대로 작동하지 않을 수 있으므로 UserHealthProfile 타입으로 캐스팅
      const profileData = profile as Partial<UserHealthProfile> | null;

      member = {
        id: user.id,
        user_id: userId,
        name: user.name || "본인",
        birth_date: null,
        gender: profileData?.gender || null,
        relationship: null,
        diseases: Array.isArray(profileData?.diseases) 
          ? profileData.diseases.map((d: any) => typeof d === 'string' ? d : (d?.code || String(d)))
          : [],
        allergies: Array.isArray(profileData?.allergies) 
          ? profileData.allergies.map((a: any) => typeof a === 'string' ? a : (a?.code || String(a)))
          : [],
        height_cm: profileData?.height_cm || null,
        weight_kg: profileData?.weight_kg || null,
        activity_level: profileData?.activity_level || null,
        dietary_preferences: Array.isArray(profileData?.dietary_preferences) ? profileData.dietary_preferences : [],
        photo_url: null,
        avatar_type: "icon" as const,
        health_score: null,
        health_score_updated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      // 가족 구성원인 경우
      const { data: familyMember, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("id", memberId)
        .eq("user_id", userId)
        .single();

      if (error || !familyMember) {
        throw new Error("가족 구성원 정보를 찾을 수 없습니다.");
      }

      member = {
        ...familyMember,
        avatar_type: familyMember.avatar_type || "icon",
      };
    }

    console.log("✅ 가족 구성원 정보 조회 완료:", member.name);

    // 3. 나이 계산
    const age = member.birth_date
      ? calculateAge(member.birth_date)
      : isSelf
        ? (await supabase
            .from("user_health_profiles")
            .select("age")
            .eq("user_id", userId)
            .single()).data?.age || null
        : null;

    // 4. 최신 체중/체지방율 조회
    let weightQuery = supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);

    if (familyMemberId) {
      weightQuery = weightQuery.eq("family_member_id", familyMemberId);
    } else {
      weightQuery = weightQuery.is("family_member_id", null);
    }

    const { data: latestWeight } = await weightQuery;
    const weightLog = latestWeight?.[0] as WeightLog | undefined;

    // 5. 건강 점수 계산 (또는 캐시된 값 사용)
    let healthScore: number;
    const cacheValid =
      member.health_score !== null &&
      member.health_score_updated_at &&
      new Date(member.health_score_updated_at).getTime() >
        Date.now() - 24 * 60 * 60 * 1000; // 24시간 이내

    if (cacheValid) {
      healthScore = member.health_score!;
      console.log("✅ 캐시된 건강 점수 사용:", healthScore);
    } else {
      const healthScoreResult = await calculateHealthScore(userId, familyMemberId);
      healthScore = healthScoreResult.totalScore;

      // 캐시 업데이트
      if (isSelf) {
        // 본인은 user_health_profiles에 저장하지 않음 (family_members만 업데이트)
        // 가족 구성원만 업데이트
      } else {
        await supabase
          .from("family_members")
          .update({
            health_score: healthScore,
            health_score_updated_at: new Date().toISOString(),
          })
          .eq("id", memberId);
      }
      console.log("✅ 건강 점수 계산 완료:", healthScore);
    }

    // 6. 복용 중인 약물 조회
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

    const { data: activeMedications } = await medicationQuery;
    const medications = (activeMedications || []) as MedicationRecord[];

    // 7. 오늘 약물 복용 여부 조회
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const medicationIds = medications.map((m) => m.id);
    let todayCheckedIds: string[] = [];

    if (medicationIds.length > 0) {
      const { data: reminderLogs } = await supabase
        .from("medication_reminder_logs")
        .select("medication_record_id, status")
        .in("medication_record_id", medicationIds)
        .gte("scheduled_time", todayStart.toISOString())
        .lte("scheduled_time", todayEnd.toISOString())
        .eq("status", "confirmed");

      todayCheckedIds =
        reminderLogs?.map((log) => log.medication_record_id) || [];
    }

    // 복용하지 않은 약물 목록
    const missedMedications = medications.filter(
      (m) => !todayCheckedIds.includes(m.id)
    );

    // 8. 건강검진 기록 및 권장 일정 조회
    let checkupQuery = supabase
      .from("user_health_checkup_records")
      .select("*")
      .eq("user_id", userId)
      .order("checkup_date", { ascending: false })
      .limit(1);

    if (familyMemberId) {
      checkupQuery = checkupQuery.eq("family_member_id", familyMemberId);
    } else {
      checkupQuery = checkupQuery.is("family_member_id", null);
    }

    const { data: lastCheckup } = await checkupQuery;
    const lastCheckupRecord = lastCheckup?.[0] as HealthCheckupRecord | undefined;

    let recommendationQuery = supabase
      .from("user_health_checkup_recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("family_member_id", familyMemberId || userId)
      .order("recommended_date", { ascending: true })
      .limit(1);

    const { data: nextRecommendation } = await recommendationQuery;
    const nextCheckup = nextRecommendation?.[0] as
      | HealthCheckupRecommendation
      | undefined;

    const checkupDaysUntil = nextCheckup?.recommended_date
      ? calculateDaysUntil(nextCheckup.recommended_date)
      : null;

    // 9. 백신 기록 및 일정 조회
    let vaccinationRecordQuery = supabase
      .from("user_vaccination_records")
      .select("*")
      .eq("user_id", userId)
      .not("completed_date", "is", null)
      .order("completed_date", { ascending: false });

    if (familyMemberId) {
      vaccinationRecordQuery = vaccinationRecordQuery.eq(
        "family_member_id",
        familyMemberId
      );
    } else {
      vaccinationRecordQuery = vaccinationRecordQuery.is(
        "family_member_id",
        null
      );
    }

    const { data: completedVaccinations } = await vaccinationRecordQuery;
    const completed = (completedVaccinations || []) as VaccinationRecord[];

    let vaccinationScheduleQuery = supabase
      .from("user_vaccination_schedules")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("recommended_date", today)
      .order("recommended_date", { ascending: true });

    if (familyMemberId) {
      vaccinationScheduleQuery = vaccinationScheduleQuery.eq(
        "family_member_id",
        familyMemberId
      );
    } else {
      vaccinationScheduleQuery = vaccinationScheduleQuery.is(
        "family_member_id",
        null
      );
    }

    const { data: scheduledVaccinations } = await vaccinationScheduleQuery;
    const scheduled = (scheduledVaccinations || []) as VaccinationSchedule[];

    const nextVaccination = scheduled[0] || null;
    const vaccinationDaysUntil = nextVaccination?.recommended_date
      ? calculateDaysUntil(nextVaccination.recommended_date)
      : null;

    // 10. 구충제 기록 조회
    let dewormingQuery = supabase
      .from("user_deworming_records")
      .select("*")
      .eq("user_id", userId)
      .order("taken_date", { ascending: false })
      .limit(1);

    if (familyMemberId) {
      dewormingQuery = dewormingQuery.eq("family_member_id", familyMemberId);
    } else {
      dewormingQuery = dewormingQuery.is("family_member_id", null);
    }

    const { data: lastDeworming } = await dewormingQuery;
    const lastDewormingRecord = lastDeworming?.[0] as
      | DewormingRecord
      | undefined;

    const nextDewormingDate = lastDewormingRecord?.next_due_date
      ? new Date(lastDewormingRecord.next_due_date)
      : null;
    const dewormingDaysUntil = nextDewormingDate
      ? calculateDaysUntil(nextDewormingDate)
      : null;

    // 11. 생애주기별 알림 조회
    let notificationQuery = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "lifecycle_event")
      .in("status", ["pending", "sent"])
      .order("priority", { ascending: false })
      .order("scheduled_at", { ascending: true });

    if (familyMemberId) {
      notificationQuery = notificationQuery.eq("family_member_id", familyMemberId);
    } else {
      notificationQuery = notificationQuery.is("family_member_id", null);
    }

    const { data: lifecycleNotifications } = await notificationQuery;
    const notifications = lifecycleNotifications || [];

    const highPriorityNotifications = notifications.filter(
      (n) => n.priority === "high" || n.priority === "urgent"
    );
    const mediumPriorityNotifications = notifications.filter(
      (n) => n.priority === "normal" || n.priority === "medium"
    );
    const lowPriorityNotifications = notifications.filter(
      (n) => n.priority === "low"
    );

    // 12. 리마인드 통합 생성
    const reminders: ReminderItem[] = [];

    // 약물 복용 리마인드
    for (const med of missedMedications) {
      reminders.push({
        id: `medication-${med.id}`,
        type: "medication",
        title: `${med.medication_name} 복용`,
        description: `${med.dosage} - ${med.frequency}`,
        dueDate: today,
        daysUntil: 0,
        priority: "high",
        status: "pending",
        relatedId: med.id,
      });
    }

    // 건강검진 리마인드
    if (nextCheckup) {
      reminders.push({
        id: `checkup-${nextCheckup.id}`,
        type: "checkup",
        title: `${nextCheckup.checkup_name} 검진`,
        description: nextCheckup.checkup_type,
        dueDate: nextCheckup.recommended_date,
        daysUntil: checkupDaysUntil || 0,
        priority: nextCheckup.priority === "high" ? "high" : "normal",
        status: "pending",
        relatedId: nextCheckup.id,
      });
    }

    // 백신 리마인드
    if (nextVaccination) {
      reminders.push({
        id: `vaccination-${nextVaccination.id}`,
        type: "vaccination",
        title: `${nextVaccination.vaccine_name} 접종`,
        description: nextVaccination.priority,
        dueDate: nextVaccination.recommended_date,
        daysUntil: vaccinationDaysUntil || 0,
        priority:
          nextVaccination.priority === "required" ? "high" : "normal",
        status: "pending",
        relatedId: nextVaccination.id,
      });
    }

    // 구충제 리마인드
    if (nextDewormingDate) {
      reminders.push({
        id: `deworming-${lastDewormingRecord?.id || "next"}`,
        type: "deworming",
        title: "구충제 복용",
        description: lastDewormingRecord?.medication_name || "구충제",
        dueDate: nextDewormingDate.toISOString().split("T")[0],
        daysUntil: dewormingDaysUntil || 0,
        priority: dewormingDaysUntil && dewormingDaysUntil <= 7 ? "high" : "normal",
        status: "pending",
        relatedId: lastDewormingRecord?.id || null,
      });
    }

    // 우선순위별 정렬
    reminders.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.daysUntil - b.daysUntil;
    });

    const urgentReminders = reminders.filter(
      (r) => r.priority === "urgent" || (r.priority === "high" && r.daysUntil <= 1)
    );
    const upcomingReminders = reminders.filter(
      (r) => r.daysUntil > 1 && r.daysUntil <= 7
    );

    // 13. 건강 트렌드 데이터 조회 (최근 3개월)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let weightTrendQuery = supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", threeMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (familyMemberId) {
      weightTrendQuery = weightTrendQuery.eq("family_member_id", familyMemberId);
    } else {
      weightTrendQuery = weightTrendQuery.is("family_member_id", null);
    }

    const { data: weightTrends } = await weightTrendQuery;
    const weightTrendData: CharacterData["healthTrends"]["weight"] =
      (weightTrends || []).map((w: WeightLog) => ({
        date: w.date,
        weight_kg: w.weight_kg,
        body_fat_percentage: w.body_fat_percentage,
      }));

    // 활동량 및 영양 섭취 추이는 향후 구현 (activity_logs, diet_plans 활용)
    const activityTrendData: CharacterData["healthTrends"]["activity"] = [];
    const nutritionTrendData: CharacterData["healthTrends"]["nutrition"] = [];
    const healthScoreTrendData: CharacterData["healthTrends"]["healthScore"] = [];

    // 14. 감정 결정을 위한 추가 데이터 수집
    console.log("🎭 감정 결정을 위한 데이터 수집 시작");

    // 최근 건강 점수 변화 계산 (최근 7일간)
    let recentHealthScoreChange: number | null = null;
    if (member.health_score_updated_at) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // 간단히 현재 점수와 이전 점수 비교 (실제로는 히스토리 데이터 필요)
      // 여기서는 건강 점수 추이 데이터가 없으므로 null로 설정
      recentHealthScoreChange = null;
    }

    // 오늘 식사 데이터 조회
    const todayMeals = {
      breakfast: null as { calories: number; time?: string } | null,
      lunch: null as { calories: number; time?: string } | null,
      dinner: null as { calories: number; time?: string } | null,
    };

    try {
      const { data: todayDietPlans } = await supabase
        .from("diet_plans")
        .select("meal_type, calories, plan_date")
        .eq("user_id", userId)
        .eq("plan_date", today)
        .is("family_member_id", familyMemberId || null)
        .order("meal_type", { ascending: true });

      if (todayDietPlans) {
        todayDietPlans.forEach((plan: any) => {
          if (plan.meal_type === "breakfast") {
            todayMeals.breakfast = { calories: plan.calories || 0 };
          } else if (plan.meal_type === "lunch") {
            todayMeals.lunch = { calories: plan.calories || 0 };
          } else if (plan.meal_type === "dinner") {
            todayMeals.dinner = { calories: plan.calories || 0 };
          }
        });
      }
    } catch (error) {
      console.warn("⚠️ 식사 데이터 조회 실패 (무시):", error);
    }

    // 오늘 총 칼로리 계산
    const currentCalories =
      (todayMeals.breakfast?.calories || 0) +
      (todayMeals.lunch?.calories || 0) +
      (todayMeals.dinner?.calories || 0);

    // 수면 데이터 조회 (최근 1일)
    let sleepData = null;
    try {
      const { data: recentSleep } = await supabase
        .from("sleep_logs")
        .select("sleep_duration_minutes, sleep_quality_score, date")
        .eq("user_id", userId)
        .is("family_member_id", familyMemberId || null)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (recentSleep) {
        sleepData = {
          durationMinutes: recentSleep.sleep_duration_minutes,
          qualityScore: recentSleep.sleep_quality_score,
          lastSleepDate: recentSleep.date,
        };
      }
    } catch (error) {
      console.warn("⚠️ 수면 데이터 조회 실패 (무시):", error);
    }

    // 활동량 데이터 조회 (오늘)
    let activityData = null;
    try {
      const { data: todayActivity } = await supabase
        .from("activity_logs")
        .select("steps, calories_burned, date")
        .eq("user_id", userId)
        .is("family_member_id", familyMemberId || null)
        .eq("date", today)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (todayActivity) {
        activityData = {
          steps: todayActivity.steps,
          caloriesBurned: todayActivity.calories_burned,
        };
      }
    } catch (error) {
      console.warn("⚠️ 활동량 데이터 조회 실패 (무시):", error);
    }

    // 건강 프로필에서 일일 목표 칼로리 조회
    let dailyCalorieGoal: number | null = null;
    try {
      const { data: healthProfile } = await supabase
        .from("user_health_profiles")
        .select("daily_calorie_goal")
        .eq("user_id", userId)
        .single();

      if (healthProfile) {
        dailyCalorieGoal = healthProfile.daily_calorie_goal;
      }
    } catch (error) {
      console.warn("⚠️ 건강 프로필 조회 실패 (무시):", error);
    }

    // 긍정적 알림 확인 (생애주기 이벤트 중 긍정적인 것)
    const hasPositiveNotifications =
      highPriorityNotifications.some(
        (n) => n.message && (n.message.includes("축하") || n.message.includes("완료"))
      ) || false;

    // 감정 결정
    const emotionInput: EmotionDetectionInput = {
      healthScore,
      healthStatus: getHealthStatus(healthScore),
      hasDiseases: Array.isArray(member.diseases) && member.diseases.length > 0,
      recentMeals: todayMeals,
      dailyCalorieGoal,
      currentCalories,
      sleepData,
      activityData,
      medicationStatus: {
        missedCount: missedMedications.length,
        totalCount: medications.length,
      },
      urgentReminders: urgentReminders.length,
      recentHealthScoreChange,
      hasPositiveNotifications,
    };

    const currentEmotion = detectCharacterEmotion(emotionInput);
    console.log("✅ 감정 결정 완료:", currentEmotion);

    // 15. 결과 조합
    const result: CharacterData = {
      member: member as CharacterData["member"],
      basicInfo: {
        name: member.name,
        age: age || 0,
        height_cm: member.height_cm || weightLog?.weight_kg ? null : member.height_cm,
        weight_kg: weightLog?.weight_kg || member.weight_kg || null,
        body_fat_percentage: weightLog?.body_fat_percentage || null,
        muscle_mass_kg: weightLog?.muscle_mass_kg || null,
        bmi: calculateBMI(
          member.height_cm || null,
          weightLog?.weight_kg || member.weight_kg || null
        ),
      },
      importantInfo: {
        diseases: Array.isArray(member.diseases) ? member.diseases : [],
        allergies: Array.isArray(member.allergies) ? member.allergies : [],
        health_score: healthScore,
        health_status: getHealthStatus(healthScore),
      },
      medications: {
        active: medications,
        todayChecked: todayCheckedIds,
        missed: missedMedications,
      },
      checkups: {
        last: lastCheckupRecord || null,
        next: nextCheckup || null,
        daysUntil: checkupDaysUntil,
      },
      vaccinations: {
        completed: completed,
        scheduled: scheduled,
        next: nextVaccination,
        daysUntil: vaccinationDaysUntil,
      },
      deworming: {
        last: lastDewormingRecord || null,
        next: nextDewormingDate,
        daysUntil: dewormingDaysUntil,
        cycleDays: lastDewormingRecord?.cycle_days || null,
      },
      reminders: {
        urgent: urgentReminders,
        upcoming: upcomingReminders,
        all: reminders,
      },
      lifecycleNotifications: {
        high: highPriorityNotifications.map((n) => ({
          id: n.id,
          title: n.title || "",
          message: n.message || "",
          priority: n.priority as "high" | "urgent",
          status: n.status,
          scheduled_at: n.scheduled_at,
        })),
        medium: mediumPriorityNotifications.map((n) => ({
          id: n.id,
          title: n.title || "",
          message: n.message || "",
          priority: n.priority as "normal" | "medium",
          status: n.status,
          scheduled_at: n.scheduled_at,
        })),
        low: lowPriorityNotifications.map((n) => ({
          id: n.id,
          title: n.title || "",
          message: n.message || "",
          priority: "low" as const,
          status: n.status,
          scheduled_at: n.scheduled_at,
        })),
      },
      healthTrends: {
        weight: weightTrendData,
        activity: activityTrendData,
        nutrition: nutritionTrendData,
        healthScore: healthScoreTrendData,
      },
      currentEmotion,
    };

    console.log("✅ 캐릭터창 데이터 조회 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ [getCharacterData] 서버 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("캐릭터창 데이터 조회 중 오류가 발생했습니다.");
  }
}

/**
 * 가족 구성원 캐릭터 카드 목록 조회 (홈페이지용)
 *
 * @returns 가족 구성원 캐릭터 카드 데이터 목록
 */
export async function getCharacterCards(): Promise<
  Array<{
    id: string;
    name: string;
    photo_url: string | null;
    avatar_type: "photo" | "icon";
    health_score: number | null;
    health_status: "excellent" | "good" | "fair" | "needs_attention";
    relationship: string | null;
    age: number;
  }>
> {
  console.group("[getCharacterCards] 가족 구성원 캐릭터 카드 목록 조회 시작");

  try {
    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      throw new Error(
        premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
      );
    }

    const supabase = getServiceRoleClient();
    const userId = premiumCheck.userId;

    // 2. 본인 정보 조회
    const { data: user } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", userId)
      .single();

    const { data: profile } = await supabase
      .from("user_health_profiles")
      .select("age")
      .eq("user_id", userId)
      .single();

    const cards: Array<{
      id: string;
      name: string;
      photo_url: string | null;
      avatar_type: "photo" | "icon";
      health_score: number | null;
      health_status: "excellent" | "good" | "fair" | "needs_attention";
      relationship: string | null;
      age: number;
    }> = [];

    if (user) {
      // 본인 건강 점수 계산
      const healthScoreResult = await calculateHealthScore(userId, null);
      const healthScore = healthScoreResult.totalScore;

      cards.push({
        id: userId,
        name: user.name || "본인",
        photo_url: null,
        avatar_type: "icon",
        health_score: healthScore,
        health_status: getHealthStatus(healthScore),
        relationship: null,
        age: profile?.age || 0,
      });
    }

    // 3. 가족 구성원 조회
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("id, name, birth_date, relationship, photo_url, avatar_type, health_score, health_score_updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (familyMembers) {
      for (const member of familyMembers) {
        const age = member.birth_date ? calculateAge(member.birth_date) : 0;

        // 건강 점수 계산 (캐시 확인)
        let healthScore: number | null = member.health_score;
        const cacheValid =
          member.health_score !== null &&
          member.health_score_updated_at &&
          new Date(member.health_score_updated_at).getTime() >
            Date.now() - 24 * 60 * 60 * 1000;

        if (!cacheValid) {
          const healthScoreResult = await calculateHealthScore(
            userId,
            member.id
          );
          healthScore = healthScoreResult.totalScore;

          // 캐시 업데이트
          await supabase
            .from("family_members")
            .update({
              health_score: healthScore,
              health_score_updated_at: new Date().toISOString(),
            })
            .eq("id", member.id);
        }

        cards.push({
          id: member.id,
          name: member.name,
          photo_url: member.photo_url || null,
          avatar_type: (member.avatar_type || "icon") as "photo" | "icon",
          health_score: healthScore,
          health_status: getHealthStatus(healthScore || 0),
          relationship: member.relationship,
          age: age || 0,
        });
      }
    }

    console.log(`✅ 가족 구성원 캐릭터 카드 ${cards.length}개 조회 완료`);
    console.groupEnd();

    return cards;
  } catch (error) {
    console.error("❌ [getCharacterCards] 서버 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("캐릭터 카드 목록 조회 중 오류가 발생했습니다.");
  }
}

