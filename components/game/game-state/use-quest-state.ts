/**
 * @file components/game/game-state/use-quest-state.ts
 * @description 퀘스트 상태 관리 Hook
 *
 * Phase 6: 게임 요소
 * - 퀘스트 진행 상태 관리
 * - 퀘스트 목표 추적
 * - 퀘스트 완료 처리
 *
 * @dependencies
 * - zustand: 상태 관리
 */

import { create } from "zustand";
import { Quest, QuestStatus } from "./quest-types";

interface QuestState {
  quests: Quest[];
  activeQuestId: string | null;
  
  // Actions
  addQuest: (quest: Quest) => void;
  updateQuestStatus: (questId: string, status: QuestStatus) => void;
  completeObjective: (questId: string, objectiveId: string) => void;
  setActiveQuest: (questId: string | null) => void;
  getQuestById: (questId: string) => Quest | undefined;
  getActiveQuests: () => Quest[];
}

/**
 * 퀘스트 상태 관리 Store
 */
export const useQuestState = create<QuestState>((set, get) => ({
  quests: [],
  activeQuestId: null,

  addQuest: (quest) =>
    set((state) => ({
      quests: [...state.quests, quest],
    })),

  updateQuestStatus: (questId, status) =>
    set((state) => ({
      quests: state.quests.map((quest) =>
        quest.id === questId ? { ...quest, status } : quest
      ),
    })),

  completeObjective: (questId, objectiveId) =>
    set((state) => ({
      quests: state.quests.map((quest) => {
        if (quest.id !== questId) return quest;

        const updatedObjectives = quest.objectives.map((obj) =>
          obj.id === objectiveId ? { ...obj, completed: true } : obj
        );

        // 모든 목표가 완료되었는지 확인
        const allCompleted = updatedObjectives.every((obj) => obj.completed);
        const newStatus: QuestStatus = allCompleted ? "completed" : quest.status;

        return {
          ...quest,
          objectives: updatedObjectives,
          status: newStatus,
        };
      }),
    })),

  setActiveQuest: (questId) =>
    set({ activeQuestId: questId }),

  getQuestById: (questId) => {
    const state = get();
    return state.quests.find((q) => q.id === questId);
  },

  getActiveQuests: () => {
    const state = get();
    return state.quests.filter((q) => q.status === "in_progress");
  },
}));

