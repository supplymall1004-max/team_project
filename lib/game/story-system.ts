/**
 * @file lib/game/story-system.ts
 * @description 스토리 이벤트 정의 및 관리
 *
 * 건강 관리 과정을 스토리로 풀어내어 몰입도를 높이는 로직입니다.
 *
 * 주요 기능:
 * 1. 건강 스토리 이벤트 정의
 * 2. 계절 이벤트 정의
 * 3. 스토리 진행 상황 추적
 * 4. 스토리 선택지 및 결과 관리
 *
 * @dependencies
 * - @/lib/game/random-events: getCurrentSeason
 */

import { getCurrentSeason } from "./random-events";

export type StoryEventType = "health_improvement" | "health_milestone" | "seasonal" | "special";

export interface StoryChoice {
  id: string;
  text: string;
  result: string;
  rewardPoints?: number;
  healthScoreChange?: number;
}

export interface StoryEvent {
  id: string;
  type: StoryEventType;
  title: string;
  description: string;
  imageUrl?: string;
  choices: StoryChoice[];
  condition?: () => boolean; // 발생 조건 (선택적)
  rewardPoints: number;
  icon: string;
}

/**
 * 건강 개선 스토리 이벤트
 */
export const HEALTH_STORY_EVENTS: StoryEvent[] = [
  {
    id: "health_improvement_10",
    type: "health_improvement",
    title: "건강이 좋아지고 있어요!",
    description: "건강 점수가 10점 이상 올랐습니다. 계속 노력하세요!",
    choices: [
      {
        id: "continue",
        text: "계속 노력하겠습니다!",
        result: "좋은 선택입니다! 건강 관리를 계속하세요.",
        rewardPoints: 50,
        healthScoreChange: 5,
      },
    ],
    rewardPoints: 50,
    icon: "💪",
  },
  {
    id: "health_milestone_80",
    type: "health_milestone",
    title: "건강 점수 80점 달성!",
    description: "축하합니다! 건강 점수 80점을 달성했습니다.",
    choices: [
      {
        id: "celebrate",
        text: "축하합니다!",
        result: "훌륭한 성과입니다! 특별 보상을 받았습니다.",
        rewardPoints: 200,
      },
    ],
    rewardPoints: 200,
    icon: "🎉",
  },
];

/**
 * 계절 스토리 이벤트
 */
export const SEASONAL_STORY_EVENTS: StoryEvent[] = [
  {
    id: "spring_health_festival",
    type: "seasonal",
    title: "봄 건강 축제",
    description: "봄이 왔습니다! 따뜻한 날씨에 건강 관리에 더욱 힘써보세요.",
    choices: [
      {
        id: "spring_walk",
        text: "봄 산책을 나가요",
        result: "봄 산책으로 기분이 좋아졌습니다!",
        rewardPoints: 100,
        healthScoreChange: 10,
      },
      {
        id: "spring_garden",
        text: "정원 가꾸기를 해요",
        result: "정원 가꾸기로 스트레스가 해소되었습니다!",
        rewardPoints: 80,
        healthScoreChange: 8,
      },
    ],
    rewardPoints: 100,
    icon: "🌸",
  },
  {
    id: "winter_cold_prevention",
    type: "seasonal",
    title: "겨울 감기 예방",
    description: "겨울이 왔습니다. 감기 예방에 신경 쓰세요.",
    choices: [
      {
        id: "winter_warm",
        text: "따뜻하게 입고 나가요",
        result: "따뜻하게 입어서 건강을 지켰습니다!",
        rewardPoints: 80,
        healthScoreChange: 5,
      },
      {
        id: "winter_vitamin",
        text: "비타민을 섭취해요",
        result: "비타민 섭취로 면역력이 향상되었습니다!",
        rewardPoints: 100,
        healthScoreChange: 8,
      },
    ],
    rewardPoints: 100,
    icon: "❄️",
  },
];

/**
 * 특별 스토리 이벤트
 */
export const SPECIAL_STORY_EVENTS: StoryEvent[] = [
  {
    id: "special_health_legend",
    type: "special",
    title: "건강 전설",
    description: "건강 점수 100점을 달성했습니다! 당신은 건강 관리의 전설이 되었습니다!",
    choices: [
      {
        id: "legend_continue",
        text: "계속 노력하겠습니다!",
        result: "훌륭합니다! 건강 관리의 전설이 되었습니다!",
        rewardPoints: 1000,
        healthScoreChange: 10,
      },
    ],
    rewardPoints: 1000,
    icon: "👑",
  },
];

/**
 * 모든 스토리 이벤트 목록
 */
export const ALL_STORY_EVENTS: StoryEvent[] = [
  ...HEALTH_STORY_EVENTS,
  ...SEASONAL_STORY_EVENTS,
  ...SPECIAL_STORY_EVENTS,
];

/**
 * 타입별 스토리 이벤트 목록 가져오기
 */
export function getStoryEventsByType(type: StoryEventType): StoryEvent[] {
  switch (type) {
    case "health_improvement":
    case "health_milestone":
      return HEALTH_STORY_EVENTS;
    case "seasonal":
      return SEASONAL_STORY_EVENTS.filter((event) => {
        const season = getCurrentSeason();
        return event.id.includes(season);
      });
    case "special":
      return SPECIAL_STORY_EVENTS;
    default:
      return [];
  }
}

/**
 * 스토리 이벤트 ID로 이벤트 찾기
 */
export function getStoryEventById(eventId: string): StoryEvent | undefined {
  return ALL_STORY_EVENTS.find((e) => e.id === eventId);
}

/**
 * 건강 점수 기반 스토리 이벤트 트리거 조건 확인
 */
export function checkStoryEventTrigger(
  eventId: string,
  healthScore: number,
  previousHealthScore?: number
): boolean {
  const event = getStoryEventById(eventId);
  if (!event) return false;

  switch (event.id) {
    case "health_improvement_10":
      return (
        previousHealthScore !== undefined &&
        healthScore - previousHealthScore >= 10
      );
    case "health_milestone_80":
      return healthScore >= 80 && (previousHealthScore === undefined || previousHealthScore < 80);
    case "special_health_legend":
      return healthScore >= 100 && (previousHealthScore === undefined || previousHealthScore < 100);
    default:
      return false;
  }
}

