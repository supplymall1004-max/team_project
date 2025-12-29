/**
 * @file game-menu-context.tsx
 * @description 게임 섹션 메뉴 상태를 전역으로 관리하는 Context
 */

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface GameMenuContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  setMenuOpen: (open: boolean) => void;
}

export const GameMenuContext = createContext<GameMenuContextType | undefined>(undefined);

export function GameMenuProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <GameMenuContext.Provider value={{ isMenuOpen, toggleMenu, setMenuOpen }}>
      {children}
    </GameMenuContext.Provider>
  );
}

export function useGameMenu() {
  const context = useContext(GameMenuContext);
  if (context === undefined) {
    throw new Error("useGameMenu must be used within a GameMenuProvider");
  }
  return context;
}

