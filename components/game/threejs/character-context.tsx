/**
 * @file components/game/threejs/character-context.tsx
 * @description 캐릭터 위치 공유 Context
 *
 * 카메라가 캐릭터 위치를 추적할 수 있도록 Context를 제공합니다.
 *
 * @dependencies
 * - React: createContext, useContext
 */

"use client";

import { createContext, useContext, useRef, ReactNode } from "react";
import { Vector3 } from "three";

interface CharacterContextValue {
  characterPositionRef: React.MutableRefObject<Vector3>;
  characterRotationRef: React.MutableRefObject<number>;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

/**
 * CharacterProvider 컴포넌트
 */
export function CharacterProvider({ children }: { children: ReactNode }) {
  const characterPositionRef = useRef<Vector3>(new Vector3(0, 0, 0));
  const characterRotationRef = useRef<number>(0);

  return (
    <CharacterContext.Provider
      value={{
        characterPositionRef,
        characterRotationRef,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

/**
 * Character Context 사용 Hook
 */
export function useCharacterContext() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacterContext must be used within CharacterProvider");
  }
  return context;
}

