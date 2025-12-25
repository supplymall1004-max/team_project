/**
 * @file lib/game/random-events.ts
 * @description 랜덤 이벤트 정의 및 관리
 *
 * 일일/가족/계절 랜덤 이벤트를 정의하고 관리하는 로직입니다.
 *
 * 주요 기능:
 * 1. 랜덤 이벤트 정의
 * 2. 이벤트 발생 조건 확인
 * 3. 이벤트 보상 계산
 * 4. 이벤트 트리거 로직
 *
 * @dependencies
 * - @/types/game/event: RandomEvent 타입 정의
 */

export type EventType = "daily" | "family" | "special" | "seasonal";

export interface RandomEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  condition?: () => boolean; // 발생 조건 (선택적)
  rewardPoints: number;
  icon: string;
  rarity: "common" | "rare" | "epic";
}

/**
 * 일일 랜덤 이벤트 정의
 */
export const DAILY_EVENTS: RandomEvent[] = [
  {
    id: "daily_bonus_points",
    type: "daily",
    title: "운동 보너스 포인트!",
    description: "오늘은 운동 관련 활동 시 포인트가 2배로 지급됩니다!",
    rewardPoints: 50,
    icon: "🏃",
    rarity: "common",
  },
  {
    id: "daily_health_boost",
    type: "daily",
    title: "건강 부스트",
    description: "오늘 건강 점수가 10점 추가로 증가합니다!",
    rewardPoints: 100,
    icon: "💪",
    rarity: "rare",
  },
  {
    id: "daily_lucky_day",
    type: "daily",
    title: "행운의 날",
    description: "오늘 모든 활동에서 추가 포인트를 받을 수 있습니다!",
    rewardPoints: 200,
    icon: "🍀",
    rarity: "epic",
  },
];

/**
 * 가족 이벤트 정의
 */
export const FAMILY_EVENTS: RandomEvent[] = [
  {
    id: "family_health_challenge",
    type: "family",
    title: "가족 건강 챌린지",
    description: "가족 구성원 모두가 오늘 건강 목표를 달성하면 특별 보상을 받습니다!",
    rewardPoints: 300,
    icon: "👨‍👩‍👧‍👦",
    rarity: "rare",
  },
  {
    id: "family_bonding",
    type: "family",
    title: "가족 유대",
    description: "가족 구성원과 함께 건강 활동을 하면 친밀도가 증가합니다!",
    rewardPoints: 150,
    icon: "❤️",
    rarity: "common",
  },
];

/**
 * 계절 이벤트 정의
 */
export const SEASONAL_EVENTS: RandomEvent[] = [
  {
    id: "spring_health_festival",
    type: "seasonal",
    title: "봄 건강 축제",
    description: "봄을 맞아 건강 관리에 더욱 힘써보세요!",
    rewardPoints: 500,
    icon: "🌸",
    rarity: "epic",
  },
  {
    id: "summer_activity_boost",
    type: "seasonal",
    title: "여름 활동 부스트",
    description: "여름철 활동량이 증가하면 보너스 포인트를 받을 수 있습니다!",
    rewardPoints: 400,
    icon: "☀️",
    rarity: "rare",
  },
  {
    id: "winter_health_care",
    type: "seasonal",
    title: "겨울 건강 관리",
    description: "겨울철 건강 관리를 잘하면 특별 보상을 받습니다!",
    rewardPoints: 400,
    icon: "❄️",
    rarity: "rare",
  },
];

/**
 * 특별 이벤트 정의
 */
export const SPECIAL_EVENTS: RandomEvent[] = [
  {
    id: "special_milestone",
    type: "special",
    title: "특별 마일스톤",
    description: "건강 관리의 중요한 마일스톤을 달성했습니다!",
    rewardPoints: 1000,
    icon: "⭐",
    rarity: "epic",
  },
];

/**
 * 모든 이벤트 목록
 */
export const ALL_EVENTS: RandomEvent[] = [
  ...DAILY_EVENTS,
  ...FAMILY_EVENTS,
  ...SEASONAL_EVENTS,
  ...SPECIAL_EVENTS,
];

/**
 * 타입별 이벤트 목록 가져오기
 */
export function getEventsByType(type: EventType): RandomEvent[] {
  switch (type) {
    case "daily":
      return DAILY_EVENTS;
    case "family":
      return FAMILY_EVENTS;
    case "seasonal":
      return SEASONAL_EVENTS;
    case "special":
      return SPECIAL_EVENTS;
    default:
      return [];
  }
}

/**
 * 이벤트 ID로 이벤트 찾기
 */
export function getEventById(eventId: string): RandomEvent | undefined {
  return ALL_EVENTS.find((e) => e.id === eventId);
}

/**
 * 랜덤 이벤트 선택
 */
export function selectRandomEvent(type: EventType): RandomEvent | null {
  const events = getEventsByType(type);
  if (events.length === 0) return null;

  // 희귀도에 따른 가중치 적용
  const weightedEvents: RandomEvent[] = [];
  events.forEach((event) => {
    const weight = event.rarity === "epic" ? 1 : event.rarity === "rare" ? 3 : 5;
    for (let i = 0; i < weight; i++) {
      weightedEvents.push(event);
    }
  });

  const randomIndex = Math.floor(Math.random() * weightedEvents.length);
  return weightedEvents[randomIndex];
}

/**
 * 계절 확인
 */
export function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

/**
 * 계절별 이벤트 필터링
 */
export function getSeasonalEventsForCurrentSeason(): RandomEvent[] {
  const season = getCurrentSeason();
  return SEASONAL_EVENTS.filter((event) => {
    if (event.id.includes("spring") && season === "spring") return true;
    if (event.id.includes("summer") && season === "summer") return true;
    if (event.id.includes("winter") && season === "winter") return true;
    if (event.id.includes("fall") && season === "fall") return true;
    return false;
  });
}

