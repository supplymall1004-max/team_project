/**
 * @file lib/health/gamification.ts
 * @description 생애주기별 알림 게임화 시스템
 * 
 * 알림 완료 시 포인트 적립, 연속 완료 일수 추적, 배지 시스템을 제공합니다.
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface UserGamificationData {
  totalPoints: number;
  streakDays: number;
  badges: string[];
  lastCompletedDate: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (data: UserGamificationData) => boolean;
}

/**
 * 배지 정의
 */
export const BADGES: Badge[] = [
  {
    id: 'first_complete',
    name: '첫 걸음',
    description: '첫 알림을 완료했습니다',
    icon: '🎯',
    condition: (data) => data.totalPoints >= 10,
  },
  {
    id: 'streak_3',
    name: '3일 연속',
    description: '3일 연속으로 알림을 완료했습니다',
    icon: '🔥',
    condition: (data) => data.streakDays >= 3,
  },
  {
    id: 'streak_7',
    name: '일주일 마스터',
    description: '7일 연속으로 알림을 완료했습니다',
    icon: '⭐',
    condition: (data) => data.streakDays >= 7,
  },
  {
    id: 'streak_30',
    name: '한 달 도전자',
    description: '30일 연속으로 알림을 완료했습니다',
    icon: '🏆',
    condition: (data) => data.streakDays >= 30,
  },
  {
    id: 'points_100',
    name: '백점 클럽',
    description: '100점을 달성했습니다',
    icon: '💯',
    condition: (data) => data.totalPoints >= 100,
  },
  {
    id: 'points_500',
    name: '오백점 마스터',
    description: '500점을 달성했습니다',
    icon: '🌟',
    condition: (data) => data.totalPoints >= 500,
  },
  {
    id: 'points_1000',
    name: '천점 레전드',
    description: '1000점을 달성했습니다',
    icon: '👑',
    condition: (data) => data.totalPoints >= 1000,
  },
];

/**
 * 알림 완료 시 포인트 계산
 */
export function calculatePointsForCompletion(
  priority: 'low' | 'normal' | 'high' | 'urgent'
): number {
  const pointsMap: Record<string, number> = {
    urgent: 20,
    high: 15,
    normal: 10,
    low: 5,
  };
  return pointsMap[priority] || 5;
}

/**
 * 연속 완료 일수 계산
 * @param lastCompletedDate 마지막 완료 날짜
 * @param currentStreakDays 현재 연속 일수
 * @param currentDate 현재 날짜
 */
export function calculateStreakDays(
  lastCompletedDate: string | null,
  currentStreakDays: number = 0,
  currentDate: Date = new Date()
): number {
  if (!lastCompletedDate) return 1; // 첫 완료

  const lastDate = new Date(lastCompletedDate);
  lastDate.setHours(0, 0, 0, 0);
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // 같은 날 다시 완료 (연속 유지)
    return currentStreakDays;
  } else if (diffDays === 1) {
    // 어제 완료했으면 연속 증가
    return currentStreakDays + 1;
  } else {
    // 연속 끊김, 오늘부터 다시 시작
    return 1;
  }
}

/**
 * 사용자 게임화 데이터 조회
 */
export async function getUserGamificationData(
  userId: string
): Promise<UserGamificationData> {
  const supabase = getServiceRoleClient();

  // 사용자 게임화 데이터 조회 (없으면 생성)
  const { data: existing } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return {
      totalPoints: existing.total_points || 0,
      streakDays: existing.streak_days || 0,
      badges: existing.badges || [],
      lastCompletedDate: existing.last_completed_date,
    };
  }

  // 기본 데이터 반환
  return {
    totalPoints: 0,
    streakDays: 0,
    badges: [],
    lastCompletedDate: null,
  };
}

/**
 * 알림 완료 시 포인트 적립 및 게임화 데이터 업데이트
 */
export async function awardPointsForCompletion(
  userId: string,
  notificationPriority: 'low' | 'normal' | 'high' | 'urgent'
): Promise<{
  pointsAwarded: number;
  newTotalPoints: number;
  newStreakDays: number;
  newBadges: string[];
}> {
  const supabase = getServiceRoleClient();
  const pointsAwarded = calculatePointsForCompletion(notificationPriority);

  // 기존 데이터 조회
  const currentData = await getUserGamificationData(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 연속 완료 일수 계산
  const newStreakDays = calculateStreakDays(
    currentData.lastCompletedDate,
    currentData.streakDays,
    today
  );

  const newTotalPoints = currentData.totalPoints + pointsAwarded;

  // 새로 획득한 배지 확인
  const updatedData: UserGamificationData = {
    totalPoints: newTotalPoints,
    streakDays: newStreakDays,
    badges: [...currentData.badges],
    lastCompletedDate: today.toISOString(),
  };

  const newBadges: string[] = [];
  for (const badge of BADGES) {
    if (!currentData.badges.includes(badge.id) && badge.condition(updatedData)) {
      newBadges.push(badge.id);
      updatedData.badges.push(badge.id);
    }
  }

  // 데이터베이스 업데이트 (upsert)
  await supabase
    .from('user_gamification')
    .upsert({
      user_id: userId,
      total_points: newTotalPoints,
      streak_days: newStreakDays,
      badges: updatedData.badges,
      last_completed_date: today.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  return {
    pointsAwarded,
    newTotalPoints,
    newStreakDays,
    newBadges,
  };
}

/**
 * 배지 정보 조회
 */
export function getBadgeInfo(badgeId: string): Badge | undefined {
  return BADGES.find((b) => b.id === badgeId);
}

/**
 * 포인트 추가 함수
 * 게임 요소(퀘스트, 미니게임, 퀴즈, 이벤트 등)에서 포인트를 추가할 때 사용
 * @param userId 사용자 ID
 * @param points 추가할 포인트
 * @param reason 포인트 추가 사유 (로깅용)
 */
export async function addPoints(
  userId: string,
  points: number,
  reason?: string
): Promise<{
  success: boolean;
  newTotalPoints: number;
  newBadges: string[];
  error?: string;
}> {
  try {
    console.group("[AddPoints] 포인트 추가 시작");
    console.log("userId", userId);
    console.log("points", points);
    console.log("reason", reason);

    if (points <= 0) {
      console.warn("⚠️ 추가할 포인트가 0 이하입니다");
      console.groupEnd();
      return {
        success: false,
        newTotalPoints: 0,
        newBadges: [],
        error: "추가할 포인트는 0보다 커야 합니다.",
      };
    }

    const supabase = getServiceRoleClient();

    // 기존 데이터 조회
    const currentData = await getUserGamificationData(userId);
    const newTotalPoints = currentData.totalPoints + points;

    // 새로 획득한 배지 확인
    const updatedData: UserGamificationData = {
      totalPoints: newTotalPoints,
      streakDays: currentData.streakDays,
      badges: [...currentData.badges],
      lastCompletedDate: currentData.lastCompletedDate,
    };

    const newBadges: string[] = [];
    for (const badge of BADGES) {
      if (!currentData.badges.includes(badge.id) && badge.condition(updatedData)) {
        newBadges.push(badge.id);
        updatedData.badges.push(badge.id);
      }
    }

    // 데이터베이스 업데이트 (upsert)
    const { error: upsertError } = await supabase
      .from('user_gamification')
      .upsert({
        user_id: userId,
        total_points: newTotalPoints,
        streak_days: currentData.streakDays,
        badges: updatedData.badges,
        last_completed_date: currentData.lastCompletedDate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error("❌ 포인트 추가 실패:", upsertError);
      console.groupEnd();
      return {
        success: false,
        newTotalPoints: currentData.totalPoints,
        newBadges: [],
        error: upsertError.message,
      };
    }

    console.log("✅ 포인트 추가 완료");
    console.log("이전 포인트:", currentData.totalPoints);
    console.log("추가 포인트:", points);
    console.log("새 총 포인트:", newTotalPoints);
    console.log("새 배지:", newBadges);
    console.groupEnd();

    // 포인트 획득 후 레벨 계산이 필요한지 확인 (비동기로 처리하여 응답 지연 방지)
    // 큰 포인트 획득 시에만 레벨 계산 트리거
    if (points >= 50) {
      // 레벨 계산은 별도로 트리거되므로 여기서는 로그만 남김
      console.log("💡 큰 포인트 획득 감지. 레벨 계산을 고려해주세요.");
    }

    return {
      success: true,
      newTotalPoints,
      newBadges,
    };
  } catch (error) {
    console.error("❌ 포인트 추가 중 오류:", error);
    console.groupEnd();
    return {
      success: false,
      newTotalPoints: 0,
      newBadges: [],
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

