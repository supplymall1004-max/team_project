/**
 * @file components/game/game-state/quest-types.ts
 * @description 퀘스트 타입 정의
 *
 * Phase 6: 게임 요소
 * - 퀘스트 데이터 구조
 * - 퀘스트 상태 관리
 */

export type QuestStatus = "available" | "in_progress" | "completed";

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  targetCount?: number;
  currentCount?: number;
}

export interface QuestReward {
  type: "experience" | "item" | "health" | "energy";
  amount: number;
  itemId?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  status: QuestStatus;
  npcId?: string; // 퀘스트를 제공하는 NPC ID
  location?: [number, number, number]; // 퀘스트 위치
}

