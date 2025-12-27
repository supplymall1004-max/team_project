/**
 * @file lib/game/character-game-state.ts
 * @description 캐릭터 게임 상태 관리 유틸리티
 *
 * 게임 상태 관리에 필요한 유틸리티 함수들을 제공합니다.
 * 실제 상태 관리는 컴포넌트 레벨에서 useState나 React Context를 사용합니다.
 *
 * @dependencies
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

import type {
  CharacterGameEvent,
  CharacterPositionData,
  CharacterGameSettings,
} from "@/types/game/character-game-events";

/**
 * 게임 설정 기본값
 */
export const DEFAULT_GAME_SETTINGS: CharacterGameSettings = {
  characterGameEnabled: true,
  autoWalkEnabled: true,
  soundEnabled: true,
  notificationEnabled: true,
  gameTheme: "default",
};

/**
 * 이벤트 우선순위 정렬
 */
export function sortEventsByPriority(events: CharacterGameEvent[]): CharacterGameEvent[] {
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  return [...events].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // 우선순위가 같으면 시간순
    return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
  });
}

/**
 * 가장 우선순위가 높은 이벤트 선택
 */
export function getHighestPriorityEvent(events: CharacterGameEvent[]): CharacterGameEvent | null {
  if (events.length === 0) return null;
  const sorted = sortEventsByPriority(events);
  return sorted[0];
}

