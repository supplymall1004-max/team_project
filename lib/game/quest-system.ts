/**
 * @file lib/game/quest-system.ts
 * @description 퀘스트 정의 및 관리 로직
 *
 * 일일/주간/특별 퀘스트를 정의하고 관리하는 로직입니다.
 *
 * 주요 기능:
 * 1. 퀘스트 정의 및 타입 관리
 * 2. 퀘스트 진행 상황 추적
 * 3. 퀘스트 완료 조건 확인
 * 4. 보상 계산
 *
 * @dependencies
 * - @/types/game/quest: Quest 타입 정의
 */

export type QuestType = "daily" | "weekly" | "special";
export type QuestCategory = "health" | "exercise" | "nutrition" | "medication" | "checkup" | "vaccine";

export interface Quest {
  id: string;
  type: QuestType;
  category: QuestCategory;
  title: string;
  description: string;
  target: number; // 목표 수치
  unit?: string; // 단위 (예: "회", "분", "kcal")
  rewardPoints: number; // 보상 포인트
  icon?: string; // 아이콘 이모지
}

/**
 * 일일 퀘스트 정의
 */
export const DAILY_QUESTS: Quest[] = [
  {
    id: "daily_walk_10000",
    type: "daily",
    category: "exercise",
    title: "만보 걷기",
    description: "오늘 10,000보를 걸어보세요!",
    target: 10000,
    unit: "보",
    rewardPoints: 50,
    icon: "🚶",
  },
  {
    id: "daily_medication",
    type: "daily",
    category: "medication",
    title: "약물 복용",
    description: "오늘 약물을 정해진 시간에 복용하세요!",
    target: 1,
    unit: "회",
    rewardPoints: 30,
    icon: "💊",
  },
  {
    id: "daily_water",
    type: "daily",
    category: "health",
    title: "물 마시기",
    description: "오늘 물 2L를 마셔보세요!",
    target: 2000,
    unit: "ml",
    rewardPoints: 40,
    icon: "💧",
  },
  {
    id: "daily_sleep",
    type: "daily",
    category: "health",
    title: "충분한 수면",
    description: "오늘 7시간 이상 잠을 자세요!",
    target: 7,
    unit: "시간",
    rewardPoints: 50,
    icon: "😴",
  },
  {
    id: "daily_nutrition",
    type: "daily",
    category: "nutrition",
    title: "균형잡힌 식사",
    description: "오늘 3끼 식사를 모두 드세요!",
    target: 3,
    unit: "끼",
    rewardPoints: 60,
    icon: "🍽️",
  },
];

/**
 * 주간 퀘스트 정의
 */
export const WEEKLY_QUESTS: Quest[] = [
  {
    id: "weekly_exercise",
    type: "weekly",
    category: "exercise",
    title: "주간 운동",
    description: "이번 주에 총 150분 이상 운동하세요!",
    target: 150,
    unit: "분",
    rewardPoints: 200,
    icon: "🏃",
  },
  {
    id: "weekly_checkup",
    type: "weekly",
    category: "checkup",
    title: "건강검진 예약",
    description: "이번 주에 건강검진을 예약하세요!",
    target: 1,
    unit: "회",
    rewardPoints: 300,
    icon: "🏥",
  },
  {
    id: "weekly_vaccine",
    type: "weekly",
    category: "vaccine",
    title: "백신 접종",
    description: "이번 주에 예정된 백신을 접종하세요!",
    target: 1,
    unit: "회",
    rewardPoints: 250,
    icon: "💉",
  },
];

/**
 * 특별 퀘스트 정의 (랜덤 이벤트 기반)
 */
export const SPECIAL_QUESTS: Quest[] = [
  {
    id: "special_health_improvement",
    type: "special",
    category: "health",
    title: "건강 점수 개선",
    description: "건강 점수를 10점 이상 올려보세요!",
    target: 10,
    unit: "점",
    rewardPoints: 500,
    icon: "⭐",
  },
  {
    id: "special_streak",
    type: "special",
    category: "health",
    title: "연속 달성",
    description: "일일 퀘스트를 7일 연속 완료하세요!",
    target: 7,
    unit: "일",
    rewardPoints: 1000,
    icon: "🔥",
  },
];

/**
 * 퀘스트 ID로 퀘스트 찾기
 */
export function getQuestById(questId: string): Quest | undefined {
  return [...DAILY_QUESTS, ...WEEKLY_QUESTS, ...SPECIAL_QUESTS].find(
    (q) => q.id === questId
  );
}

/**
 * 타입별 퀘스트 목록 가져오기
 */
export function getQuestsByType(type: QuestType): Quest[] {
  switch (type) {
    case "daily":
      return DAILY_QUESTS;
    case "weekly":
      return WEEKLY_QUESTS;
    case "special":
      return SPECIAL_QUESTS;
    default:
      return [];
  }
}

/**
 * 카테고리별 퀘스트 목록 가져오기
 */
export function getQuestsByCategory(category: QuestCategory): Quest[] {
  return [...DAILY_QUESTS, ...WEEKLY_QUESTS, ...SPECIAL_QUESTS].filter(
    (q) => q.category === category
  );
}

/**
 * 퀘스트 완료 여부 확인
 */
export function isQuestCompleted(progress: number, target: number): boolean {
  return progress >= target;
}

/**
 * 퀘스트 진행률 계산 (0-100)
 */
export function calculateQuestProgress(progress: number, target: number): number {
  return Math.min(Math.floor((progress / target) * 100), 100);
}

