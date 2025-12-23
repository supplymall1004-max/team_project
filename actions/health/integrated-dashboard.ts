/**
 * @file actions/health/integrated-dashboard.ts
 * @description 통합 건강 대시보드 Server Actions
 *
 * 모든 건강 시각화 자료를 통합하여 반환합니다.
 * 수면, 활동량, 혈압/혈당, 체중 기록 등을 포함합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/server: createClerkSupabaseClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/health-visualization: IntegratedHealthDashboard
 * - @/actions/health/metrics: getHealthMetrics
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getHealthMetrics } from "@/actions/health/metrics";
import { getHealthProfile } from "@/actions/health/profile";
import type {
  IntegratedHealthDashboard,
  SleepData,
  ActivityData,
  VitalSigns,
  WeightLog,
  HealthInsight,
} from "@/types/health-visualization";

/**
 * 기간 타입
 */
export type Period = "today" | "week" | "month" | "quarter";

/**
 * 통합 건강 대시보드 데이터 조회
 *
 * @param period 조회 기간 (기본값: "week")
 * @returns 통합 건강 대시보드 데이터
 */
export async function getIntegratedHealthDashboard(
  period: Period = "week"
): Promise<IntegratedHealthDashboard> {
  try {
    console.group("[getIntegratedHealthDashboard] 통합 건강 대시보드 조회 시작");
    console.log("기간:", period);

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    // Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 사용자 확인 및 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 동기화할 수 없습니다.");
    }

    console.log("[getIntegratedHealthDashboard] 사용자 확인 완료:", userData.id);

    // 기간 계산
    const { startDate, endDate } = calculatePeriodDates(period);

    // 병렬로 모든 데이터 조회
    const [
      healthMetrics,
      healthProfile,
      sleepData,
      activityData,
      vitalSigns,
      weightLogs,
    ] = await Promise.all([
      getHealthMetrics(),
      getHealthProfile().catch(() => null), // 프로필이 없어도 계속 진행
      getSleepData(userData.id, startDate, endDate),
      getActivityData(userData.id, startDate, endDate),
      getVitalSigns(userData.id, startDate, endDate),
      getWeightLogs(userData.id, startDate, endDate),
    ]);

    // 건강 트렌드 계산 (간단한 버전, 향후 확장 가능)
    const healthScoreTrend = await calculateHealthScoreTrend(
      userData.id,
      startDate,
      endDate
    );
    const nutritionTrend = await calculateNutritionTrend(
      userData.id,
      startDate,
      endDate
    );

    // 요약 데이터 계산
    // 오늘 날짜의 데이터 찾기
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = activityData.find(a => a.date === today);
    const todaySleep = sleepData.find(s => s.date === today);

    const summary = {
      healthScore: healthMetrics.metrics.overallHealthScore,
      bmi: healthMetrics.metrics.bmi,
      dailySteps: todayActivity?.steps || healthMetrics.metrics.dailyActivity.steps || 0,
      sleepHours:
        todaySleep?.sleep_duration_minutes
          ? todaySleep.sleep_duration_minutes / 60
          : 0,
    };

    // 건강 인사이트 생성
    const insights = generateHealthInsights(
      healthMetrics.metrics,
      sleepData,
      activityData,
      vitalSigns,
      weightLogs
    );

    const result: IntegratedHealthDashboard & { heightCm?: number } = {
      summary,
      healthIndicators: healthMetrics.metrics,
      lifestylePatterns: {
        activity: activityData,
        sleep: sleepData,
      },
      healthMonitoring: {
        vitalSigns,
        weightTrend: weightLogs,
      },
      healthTrends: {
        healthScoreTrend,
        nutritionTrend,
      },
      insights,
      heightCm: healthProfile?.height_cm || undefined, // BMI 계산용 키 정보
    };

    console.log("✅ 통합 건강 대시보드 조회 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("[getIntegratedHealthDashboard] 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("통합 건강 대시보드 조회 중 오류가 발생했습니다.");
  }
}

/**
 * 기간에 따른 시작일/종료일 계산
 */
function calculatePeriodDates(period: Period): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate.setMonth(endDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      startDate.setMonth(endDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * 수면 데이터 조회
 */
async function getSleepData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SleepData[]> {
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("[getSleepData] 조회 실패:", error);
      return [];
    }

    return (data as SleepData[]) || [];
  } catch (error) {
    console.error("[getSleepData] 오류:", error);
    return [];
  }
}

/**
 * 활동량 데이터 조회
 */
async function getActivityData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ActivityData[]> {
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("[getActivityData] 조회 실패:", error);
      return [];
    }

    return (data as ActivityData[]) || [];
  } catch (error) {
    console.error("[getActivityData] 오류:", error);
    return [];
  }
}

/**
 * 혈압/혈당 데이터 조회
 */
async function getVitalSigns(
  userId: string,
  startDate: string,
  endDate: string
): Promise<VitalSigns[]> {
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .gte("measured_at", startDate)
      .lte("measured_at", endDate)
      .order("measured_at", { ascending: false });

    if (error) {
      console.error("[getVitalSigns] 조회 실패:", error);
      return [];
    }

    return (data as VitalSigns[]) || [];
  } catch (error) {
    console.error("[getVitalSigns] 오류:", error);
    return [];
  }
}

/**
 * 체중 기록 조회
 */
async function getWeightLogs(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WeightLog[]> {
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("[getWeightLogs] 조회 실패:", error);
      return [];
    }

    return (data as WeightLog[]) || [];
  } catch (error) {
    console.error("[getWeightLogs] 오류:", error);
    return [];
  }
}

/**
 * 건강 점수 추이 계산
 */
async function calculateHealthScoreTrend(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; score: number }[]> {
  // 간단한 구현: 날짜별로 건강 점수를 계산
  // 향후 실제 히스토리 데이터를 저장하는 테이블이 있으면 활용
  const trend: { date: string; score: number }[] = [];

  try {
    // 현재는 기본값 반환 (향후 확장)
    const today = new Date();
    const start = new Date(startDate);

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      // 실제로는 해당 날짜의 건강 점수를 계산해야 함
      // 현재는 기본값 사용
      trend.push({
        date: dateStr,
        score: 75, // 기본값
      });
    }
  } catch (error) {
    console.error("[calculateHealthScoreTrend] 오류:", error);
  }

  return trend;
}

/**
 * 영양소 섭취 추이 계산
 */
async function calculateNutritionTrend(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; nutrition: any }[]> {
  // 간단한 구현: 날짜별로 영양소 섭취량 계산
  const trend: { date: string; nutrition: any }[] = [];

  try {
    const supabase = await createClerkSupabaseClient();

    // diet_plans 테이블에서 영양소 데이터 조회
    const { data: dietPlans, error } = await supabase
      .from("diet_plans")
      .select("plan_date, carbs_g, protein_g, fat_g, fiber_g, sodium_mg")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .gte("plan_date", startDate)
      .lte("plan_date", endDate)
      .order("plan_date", { ascending: true });

    if (error) {
      console.error("[calculateNutritionTrend] 조회 실패:", error);
      return trend;
    }

    if (dietPlans) {
      dietPlans.forEach((plan) => {
        trend.push({
          date: plan.plan_date,
          nutrition: {
            carbohydrates: plan.carbs_g || 0,
            protein: plan.protein_g || 0,
            fat: plan.fat_g || 0,
            fiber: plan.fiber_g || 0,
            sodium: plan.sodium_mg || 0,
            sugar: 0, // 기본값
            cholesterol: 0, // 기본값
          },
        });
      });
    }
  } catch (error) {
    console.error("[calculateNutritionTrend] 오류:", error);
  }

  return trend;
}

/**
 * 건강 인사이트 생성
 */
function generateHealthInsights(
  metrics: any,
  sleepData: SleepData[],
  activityData: ActivityData[],
  vitalSigns: VitalSigns[],
  weightLogs: WeightLog[]
): HealthInsight[] {
  const insights: HealthInsight[] = [];

  // 수면 인사이트
  if (sleepData.length > 0) {
    const latestSleep = sleepData[sleepData.length - 1];
    if (latestSleep.sleep_duration_minutes) {
      const sleepHours = latestSleep.sleep_duration_minutes / 60;
      if (sleepHours < 6) {
        insights.push({
          type: "warning",
          title: "수면 부족",
          description: `최근 수면 시간이 ${sleepHours.toFixed(1)}시간으로 권장 시간(7-9시간)보다 부족합니다.`,
          actionable: true,
          priority: "high",
        });
      } else if (sleepHours >= 7 && sleepHours <= 9) {
        insights.push({
          type: "positive",
          title: "적정 수면 시간",
          description: "수면 시간이 권장 범위 내에 있습니다.",
          actionable: false,
          priority: "low",
        });
      }
    }
  } else {
    insights.push({
      type: "info",
      title: "수면 기록 추가",
      description: "수면 패턴을 추적하려면 수면 기록을 입력해주세요.",
      actionable: true,
      priority: "medium",
    });
  }

  // 활동량 인사이트
  if (activityData.length > 0) {
    const latestActivity = activityData[activityData.length - 1];
    if (latestActivity.steps < 5000) {
      insights.push({
        type: "warning",
        title: "활동량 부족",
        description: `오늘 걸음 수가 ${latestActivity.steps.toLocaleString()}보로 권장량(10,000보)보다 부족합니다.`,
        actionable: true,
        priority: "high",
      });
    } else if (latestActivity.steps >= 10000) {
      insights.push({
        type: "positive",
        title: "충분한 활동량",
        description: "오늘 목표 걸음 수를 달성했습니다!",
        actionable: false,
        priority: "low",
      });
    }
  } else {
    insights.push({
      type: "info",
      title: "활동량 기록 추가",
      description: "활동량을 추적하려면 걸음 수나 운동 시간을 기록해주세요.",
      actionable: true,
      priority: "medium",
    });
  }

  // BMI 인사이트
  if (metrics.bmi < 18.5) {
    insights.push({
      type: "warning",
      title: "저체중 상태",
      description: "BMI가 18.5 미만입니다. 균형 잡힌 식단으로 건강한 체중을 유지하는 것이 중요합니다.",
      actionable: true,
      priority: "high",
    });
  } else if (metrics.bmi > 25) {
    insights.push({
      type: "warning",
      title: "체중 관리 필요",
      description: "BMI가 25를 초과합니다. 적정 칼로리 섭취와 운동으로 건강한 체중을 목표로 하세요.",
      actionable: true,
      priority: "high",
    });
  }

  // 영양 균형 인사이트
  if (metrics.nutritionBalance.protein < 50) {
    insights.push({
      type: "info",
      title: "단백질 섭취량 확인",
      description: "근육 유지와 면역력 강화를 위해 단백질 섭취를 늘려보세요.",
      actionable: true,
      priority: "medium",
    });
  }

  // 질병 위험도 인사이트
  if (metrics.diseaseRiskScores.cardiovascular > 70) {
    insights.push({
      type: "warning",
      title: "심혈관 건강 주의",
      description: "심혈관 건강을 위해 지방 섭취를 조절하고 운동을 늘려보세요.",
      actionable: true,
      priority: "high",
    });
  }

  if (metrics.diseaseRiskScores.diabetes > 70) {
    insights.push({
      type: "warning",
      title: "혈당 관리 필요",
      description: "혈당 조절을 위해 식이섬유가 풍부한 음식을 추천합니다.",
      actionable: true,
      priority: "high",
    });
  }

  return insights;
}
