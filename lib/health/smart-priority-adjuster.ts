/**
 * @file lib/health/smart-priority-adjuster.ts
 * @description 스마트 알림 우선순위 조정 로직
 * 
 * 사용자 행동 패턴을 학습하여 알림 우선순위를 자동으로 조정합니다.
 * - 자주 놓치는 알림은 자동으로 High로 상향
 * - 자주 완료하는 알림은 Medium/Low로 하향
 * - 환경 알림은 항상 High 유지
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface PriorityAdjustment {
  notificationId: string;
  oldPriority: 'low' | 'normal' | 'high' | 'urgent';
  newPriority: 'low' | 'normal' | 'high' | 'urgent';
  reason: string;
}

/**
 * 사용자 행동 패턴 분석
 */
export interface UserBehaviorPattern {
  userId: string;
  familyMemberId?: string;
  missedNotifications: {
    category: string;
    count: number;
    averagePriority: string;
  }[];
  completedNotifications: {
    category: string;
    count: number;
    averagePriority: string;
  }[];
  dismissedNotifications: {
    category: string;
    count: number;
    averagePriority: string;
  }[];
}

/**
 * 사용자 행동 패턴 분석
 */
export async function analyzeUserBehavior(
  userId: string,
  familyMemberId?: string
): Promise<UserBehaviorPattern> {
  const supabase = getServiceRoleClient();

  // 최근 30일 알림 조회
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "lifecycle_event")
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (familyMemberId) {
    query = query.eq("family_member_id", familyMemberId);
  } else {
    query = query.is("family_member_id", null);
  }

  const { data: notifications } = await query;

  // 카테고리별 통계
  const missedByCategory: Record<string, number> = {};
  const completedByCategory: Record<string, number> = {};
  const dismissedByCategory: Record<string, number> = {};
  const priorityByCategory: Record<string, string[]> = {};

  notifications?.forEach((notification) => {
    const category = notification.category || "unknown";
    const priority = notification.priority || "normal";

    if (!priorityByCategory[category]) {
      priorityByCategory[category] = [];
    }
    priorityByCategory[category].push(priority);

    if (notification.status === "missed") {
      missedByCategory[category] = (missedByCategory[category] || 0) + 1;
    } else if (notification.status === "confirmed") {
      completedByCategory[category] = (completedByCategory[category] || 0) + 1;
    } else if (notification.status === "dismissed") {
      dismissedByCategory[category] = (dismissedByCategory[category] || 0) + 1;
    }
  });

  // 평균 우선순위 계산
  const calculateAveragePriority = (priorities: string[]): string => {
    if (priorities.length === 0) return "normal";
    const priorityValues: Record<string, number> = { low: 1, normal: 2, high: 3, urgent: 4 };
    const sum = priorities.reduce((acc, p) => acc + (priorityValues[p] || 2), 0);
    const avg = sum / priorities.length;
    if (avg >= 3.5) return "urgent";
    if (avg >= 2.5) return "high";
    if (avg >= 1.5) return "normal";
    return "low";
  };

  return {
    userId,
    familyMemberId,
    missedNotifications: Object.entries(missedByCategory).map(([category, count]) => ({
      category,
      count,
      averagePriority: calculateAveragePriority(priorityByCategory[category] || []),
    })),
    completedNotifications: Object.entries(completedByCategory).map(([category, count]) => ({
      category,
      count,
      averagePriority: calculateAveragePriority(priorityByCategory[category] || []),
    })),
    dismissedNotifications: Object.entries(dismissedByCategory).map(([category, count]) => ({
      category,
      count,
      averagePriority: calculateAveragePriority(priorityByCategory[category] || []),
    })),
  };
}

/**
 * 알림 우선순위 자동 조정
 */
export async function adjustNotificationPriorities(
  userId: string,
  familyMemberId?: string
): Promise<PriorityAdjustment[]> {
  const supabase = getServiceRoleClient();
  const adjustments: PriorityAdjustment[] = [];

  // 행동 패턴 분석
  const pattern = await analyzeUserBehavior(userId, familyMemberId);

  // 대기 중인 알림 조회
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "lifecycle_event")
    .eq("status", "pending");

  if (familyMemberId) {
    query = query.eq("family_member_id", familyMemberId);
  } else {
    query = query.is("family_member_id", null);
  }

  const { data: pendingNotifications } = await query;

  if (!pendingNotifications) return adjustments;

  // 각 알림에 대해 우선순위 조정
  for (const notification of pendingNotifications) {
    const category = notification.category || "unknown";
    const currentPriority = notification.priority || "normal";

    // 환경 알림은 항상 High 유지
    if (category === "environment" || category === "kcdc") {
      continue;
    }

    // 자주 놓치는 카테고리면 우선순위 상향
    const missedCategory = pattern.missedNotifications.find((m) => m.category === category);
    if (missedCategory && missedCategory.count >= 3) {
      let newPriority: 'low' | 'normal' | 'high' | 'urgent' = currentPriority as any;
      
      if (currentPriority === "low") {
        newPriority = "normal";
      } else if (currentPriority === "normal") {
        newPriority = "high";
      } else if (currentPriority === "high") {
        newPriority = "urgent";
      }

      if (newPriority !== currentPriority) {
        adjustments.push({
          notificationId: notification.id,
          oldPriority: currentPriority as any,
          newPriority,
          reason: `${category} 카테고리 알림을 자주 놓치셔서 우선순위를 상향했습니다.`,
        });

        // 데이터베이스 업데이트
        await supabase
          .from("notifications")
          .update({ priority: newPriority })
          .eq("id", notification.id);
      }
    }

    // 자주 완료하는 카테고리면 우선순위 하향 (단, High 이상은 유지)
    const completedCategory = pattern.completedNotifications.find((c) => c.category === category);
    if (completedCategory && completedCategory.count >= 5 && currentPriority !== "high" && currentPriority !== "urgent") {
      let newPriority: 'low' | 'normal' | 'high' | 'urgent' = currentPriority as any;
      
      if (currentPriority === "normal") {
        newPriority = "low";
      }

      if (newPriority !== currentPriority) {
        adjustments.push({
          notificationId: notification.id,
          oldPriority: currentPriority as any,
          newPriority,
          reason: `${category} 카테고리 알림을 자주 완료하셔서 우선순위를 하향했습니다.`,
        });

        // 데이터베이스 업데이트
        await supabase
          .from("notifications")
          .update({ priority: newPriority })
          .eq("id", notification.id);
      }
    }
  }

  return adjustments;
}

