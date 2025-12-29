/**
 * @file lib/game/auto-quest-tracker.ts
 * @description 자동 퀘스트 진행 상황 추적 시스템
 *
 * 건강 데이터베이스의 실제 기록을 기반으로 퀘스트 진행 상황을 자동으로 계산합니다.
 * 사용자가 수동으로 클릭할 필요 없이, 실제 건강 관리 활동이 자동으로 퀘스트 진행 상황에 반영됩니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/game/quest-system: getQuestById, Quest
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getQuestById, type Quest } from "@/lib/game/quest-system";

export interface QuestProgressResult {
  progress: number;
  target: number;
  completed: boolean;
  lastUpdated: string;
}

/**
 * 퀘스트 타입별 진행 상황 계산
 */
export async function calculateQuestProgress(
  questId: string,
  userId: string,
  familyMemberId: string | null,
  date: string
): Promise<QuestProgressResult> {
  const quest = getQuestById(questId);
  if (!quest) {
    throw new Error(`퀘스트를 찾을 수 없습니다: ${questId}`);
  }

  console.group(`[AutoQuestTracker] 퀘스트 진행 상황 계산: ${questId}`);
  console.log("userId:", userId, "familyMemberId:", familyMemberId, "date:", date);

  let result: QuestProgressResult;

  switch (questId) {
    case "daily_medication":
      result = await calculateMedicationQuestProgress(userId, familyMemberId, date);
      break;
    case "daily_walk_10000":
    case "daily_activity":
      result = await calculateActivityQuestProgress(userId, familyMemberId, date, quest);
      break;
    case "daily_sleep":
      result = await calculateSleepQuestProgress(userId, familyMemberId, date, quest);
      break;
    case "daily_water":
      // 물 마시기는 현재 추적할 데이터가 없으므로 0 반환
      result = {
        progress: 0,
        target: quest.target,
        completed: false,
        lastUpdated: new Date().toISOString(),
      };
      break;
    case "daily_nutrition":
      // 식사 기록은 meal_logs를 확인해야 하지만, 현재는 간단히 처리
      result = await calculateNutritionQuestProgress(userId, familyMemberId, date, quest);
      break;
    case "weekly_exercise":
      result = await calculateWeeklyExerciseQuestProgress(userId, familyMemberId, date, quest);
      break;
    case "weekly_checkup":
      result = await calculateCheckupQuestProgress(userId, familyMemberId, date);
      break;
    case "weekly_vaccine":
      result = await calculateVaccinationQuestProgress(userId, familyMemberId, date);
      break;
    case "special_health_improvement":
      result = await calculateHealthScoreImprovementQuestProgress(userId, familyMemberId, quest);
      break;
    case "special_streak":
      result = await calculateStreakQuestProgress(userId, familyMemberId, quest);
      break;
    default:
      console.warn(`⚠️ 알 수 없는 퀘스트 ID: ${questId}`);
      result = {
        progress: 0,
        target: quest.target,
        completed: false,
        lastUpdated: new Date().toISOString(),
      };
  }

  console.log("✅ 계산 완료:", result);
  console.groupEnd();

  return result;
}

/**
 * 약물 복용 퀘스트 진행 상황 계산
 */
async function calculateMedicationQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // medication_records를 통해 medication_reminder_logs 조회
  const { data: medicationRecords, error: recordsError } = await supabase
    .from("medication_records")
    .select("id")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .lte("start_date", date)
    .or(`end_date.is.null,end_date.gte.${date}`)
    .eq("reminder_enabled", true);

  if (recordsError) {
    console.error("❌ 약물 기록 조회 실패:", recordsError);
    return {
      progress: 0,
      target: 1,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  if (!medicationRecords || medicationRecords.length === 0) {
    return {
      progress: 0,
      target: 0,
      completed: true, // 약물이 없으면 완료로 처리
      lastUpdated: new Date().toISOString(),
    };
  }

  const medicationRecordIds = medicationRecords.map((r) => r.id);

  // 오늘 예정된 약물 복용 횟수
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: scheduledLogs, error: logsError } = await supabase
    .from("medication_reminder_logs")
    .select("id, status, confirmed_at")
    .in("medication_record_id", medicationRecordIds)
    .gte("scheduled_time", startOfDay)
    .lte("scheduled_time", endOfDay);

  if (logsError) {
    console.error("❌ 약물 알림 로그 조회 실패:", logsError);
    return {
      progress: 0,
      target: medicationRecordIds.length,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 오늘 완료된 약물 복용 횟수
  const completedCount =
    scheduledLogs?.filter((log) => log.status === "confirmed").length || 0;
  const totalScheduled = scheduledLogs?.length || medicationRecordIds.length;

  return {
    progress: completedCount,
    target: totalScheduled,
    completed: completedCount >= totalScheduled && totalScheduled > 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 활동량 퀘스트 진행 상황 계산
 */
async function calculateActivityQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string,
  quest: Quest
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  const { data: activityLog, error } = await supabase
    .from("activity_logs")
    .select("steps, exercise_minutes")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .eq("date", date)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("❌ 활동량 기록 조회 실패:", error);
    return {
      progress: 0,
      target: quest.target,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 만보 걷기 퀘스트인 경우 steps 사용
  if (quest.id === "daily_walk_10000") {
    const steps = activityLog?.steps || 0;
    return {
      progress: steps,
      target: quest.target,
      completed: steps >= quest.target,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 일반 활동량 퀘스트인 경우 exercise_minutes 사용
  const exerciseMinutes = activityLog?.exercise_minutes || 0;
  return {
    progress: exerciseMinutes,
    target: quest.target,
    completed: exerciseMinutes >= quest.target,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 수면 퀘스트 진행 상황 계산
 */
async function calculateSleepQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string,
  quest: Quest
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  const { data: sleepLog, error } = await supabase
    .from("sleep_logs")
    .select("sleep_duration_minutes")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .eq("date", date)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("❌ 수면 기록 조회 실패:", error);
    return {
      progress: 0,
      target: quest.target,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 수면 시간을 시간 단위로 변환 (목표는 시간 단위)
  const sleepHours = (sleepLog?.sleep_duration_minutes || 0) / 60;

  return {
    progress: sleepHours,
    target: quest.target,
    completed: sleepHours >= quest.target,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 영양 퀘스트 진행 상황 계산 (식사 횟수)
 */
async function calculateNutritionQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string,
  quest: Quest
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // meal_logs 테이블이 있다고 가정 (없으면 다른 방법 사용)
  const { data: mealLogs, error } = await supabase
    .from("meal_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .eq("date", date);

  if (error && error.code !== "PGRST116") {
    // meal_logs 테이블이 없을 수 있으므로, 다른 방법으로 확인
    // 예: activity_logs나 다른 건강 데이터 입력 여부로 대체
    console.warn("⚠️ 식사 기록 조회 실패 (무시):", error);
    return {
      progress: 0,
      target: quest.target,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  const mealCount = mealLogs?.length || 0;

  return {
    progress: mealCount,
    target: quest.target,
    completed: mealCount >= quest.target,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 주간 운동 퀘스트 진행 상황 계산
 */
async function calculateWeeklyExerciseQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string,
  quest: Quest
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // 이번 주의 시작일과 종료일 계산
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDateStr = startOfWeek.toISOString().split("T")[0];
  const endDateStr = endOfWeek.toISOString().split("T")[0];

  const { data: activityLogs, error } = await supabase
    .from("activity_logs")
    .select("exercise_minutes")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  if (error) {
    console.error("❌ 주간 활동량 기록 조회 실패:", error);
    return {
      progress: 0,
      target: quest.target,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  const totalExerciseMinutes =
    activityLogs?.reduce((sum, log) => sum + (log.exercise_minutes || 0), 0) || 0;

  return {
    progress: totalExerciseMinutes,
    target: quest.target,
    completed: totalExerciseMinutes >= quest.target,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 건강검진 퀘스트 진행 상황 계산
 */
async function calculateCheckupQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // 이번 주의 시작일과 종료일 계산
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDateStr = startOfWeek.toISOString().split("T")[0];
  const endDateStr = endOfWeek.toISOString().split("T")[0];

  // 이번 주에 예약되거나 완료된 건강검진 확인
  const { data: checkups, error } = await supabase
    .from("user_health_checkup_records")
    .select("id, checkup_date")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .or(`checkup_date.gte.${startDateStr},checkup_date.lte.${endDateStr}`);

  if (error && error.code !== "PGRST116") {
    console.error("❌ 건강검진 기록 조회 실패:", error);
    return {
      progress: 0,
      target: 1,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  const checkupCount = checkups?.length || 0;

  return {
    progress: checkupCount,
    target: 1,
    completed: checkupCount >= 1,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 예방접종 퀘스트 진행 상황 계산
 */
async function calculateVaccinationQuestProgress(
  userId: string,
  familyMemberId: string | null,
  date: string
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // 이번 주의 시작일과 종료일 계산
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDateStr = startOfWeek.toISOString().split("T")[0];
  const endDateStr = endOfWeek.toISOString().split("T")[0];

  // 이번 주에 완료된 예방접종 확인
  const { data: vaccinations, error } = await supabase
    .from("user_vaccination_records")
    .select("id, vaccination_date")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId || null)
    .gte("vaccination_date", startDateStr)
    .lte("vaccination_date", endDateStr);

  if (error && error.code !== "PGRST116") {
    console.error("❌ 예방접종 기록 조회 실패:", error);
    return {
      progress: 0,
      target: 1,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  const vaccinationCount = vaccinations?.length || 0;

  return {
    progress: vaccinationCount,
    target: 1,
    completed: vaccinationCount >= 1,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 건강 점수 개선 퀘스트 진행 상황 계산
 */
async function calculateHealthScoreImprovementQuestProgress(
  userId: string,
  familyMemberId: string | null,
  quest: Quest
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // 현재 건강 점수 조회
  const { data: member, error } = await supabase
    .from("family_members")
    .select("health_score, health_score_updated_at")
    .eq("user_id", userId)
    .eq("id", familyMemberId || userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("❌ 가족 구성원 조회 실패:", error);
    return {
      progress: 0,
      target: quest.target,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 이전 건강 점수는 별도로 추적해야 하므로, 현재는 0으로 처리
  // TODO: 건강 점수 변경 이력을 추적하는 테이블이 필요할 수 있음
  const currentScore = member?.health_score || 0;

  return {
    progress: 0, // 개선량은 별도 추적 필요
    target: quest.target,
    completed: false, // 개선량 추적이 필요하므로 현재는 false
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 연속 달성 퀘스트 진행 상황 계산
 */
async function calculateStreakQuestProgress(
  userId: string,
  familyMemberId: string | null,
  quest: Quest
): Promise<QuestProgressResult> {
  const supabase = getServiceRoleClient();

  // daily_quests 테이블에서 연속 완료 일수 계산
  const { data: completedQuests, error } = await supabase
    .from("daily_quests")
    .select("quest_date, completed")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("quest_date", { ascending: false })
    .limit(100); // 최근 100일 확인

  if (error && error.code !== "PGRST116") {
    console.error("❌ 퀘스트 기록 조회 실패:", error);
    return {
      progress: 0,
      target: quest.target,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 연속 완료 일수 계산
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < (completedQuests?.length || 0); i++) {
    const questDate = new Date(completedQuests![i].quest_date);
    questDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (
      questDate.getTime() === expectedDate.getTime() &&
      completedQuests![i].completed
    ) {
      streak++;
    } else {
      break;
    }
  }

  return {
    progress: streak,
    target: quest.target,
    completed: streak >= quest.target,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 데이터 타입별 관련 퀘스트 목록 가져오기
 */
export function getQuestsByDataType(
  dataType: "medication" | "activity" | "sleep" | "checkup" | "vaccination"
): Quest[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DAILY_QUESTS, WEEKLY_QUESTS } = require("./quest-system");

  const allQuests = [...DAILY_QUESTS, ...WEEKLY_QUESTS];

  switch (dataType) {
    case "medication":
      return allQuests.filter((q) => q.id === "daily_medication");
    case "activity":
      return allQuests.filter(
        (q) => q.id === "daily_walk_10000" || q.id === "weekly_exercise"
      );
    case "sleep":
      return allQuests.filter((q) => q.id === "daily_sleep");
    case "checkup":
      return allQuests.filter((q) => q.id === "weekly_checkup");
    case "vaccination":
      return allQuests.filter((q) => q.id === "weekly_vaccine");
    default:
      return [];
  }
}

