/**
 * @file components/game/game-state/use-game-state.ts
 * @description 게임 상태 관리 Hook
 *
 * Phase 2: 기본 게임 상태 관리
 * 향후 확장 예정
 *
 * @dependencies
 * - React hooks
 */

"use client";

import { useState, useCallback } from "react";

export interface GameState {
  character: {
    position: [number, number, number];
    rotation: number;
    health: number;
    energy: number;
    level: number;
    experience: number;
  };
  isPlaying: boolean;
}

const initialState: GameState = {
  character: {
    position: [0, 0, 0],
    rotation: 0,
    health: 100,
    energy: 100,
    level: 1,
    experience: 0,
  },
  isPlaying: false,
};

/**
 * 게임 상태 관리 Hook
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const updateCharacterPosition = useCallback((position: [number, number, number]) => {
    setGameState((prev) => ({
      ...prev,
      character: {
        ...prev.character,
        position,
      },
    }));
  }, []);

  const updateCharacterRotation = useCallback((rotation: number) => {
    setGameState((prev) => ({
      ...prev,
      character: {
        ...prev.character,
        rotation,
      },
    }));
  }, []);

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialState);
  }, []);

  return {
    gameState,
    updateCharacterPosition,
    updateCharacterRotation,
    startGame,
    resetGame,
  };
}

