/**
 * @file components/games/fridge-defense/hooks/use-board-size.ts
 * @description 게임 보드 크기 관리 훅
 */

import { useEffect, RefObject } from 'react';
import type { BoardSize } from '@/types/game/fridge-defense';

export interface UseBoardSizeProps {
  gameBoardRef: RefObject<HTMLDivElement>;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  isFullscreen: boolean;
}

export function useBoardSize({ 
  gameBoardRef, 
  setBoardSize, 
  isFullscreen 
}: UseBoardSizeProps) {
  // 게임 보드 크기 동적 계산
  useEffect(() => {
    const updateBoardSize = () => {
      if (gameBoardRef.current) {
        const rect = gameBoardRef.current.getBoundingClientRect();
        const newSize = {
          width: Math.max(300, rect.width),
          height: Math.max(300, rect.height),
        };
        setBoardSize(newSize);
        console.log('[FridgeDefense] 게임 보드 크기 업데이트:', newSize, '전체화면:', isFullscreen);
      }
    };

    // 초기 크기 계산
    const timer = setTimeout(updateBoardSize, 100);
    updateBoardSize();
    
    window.addEventListener('resize', updateBoardSize);
    
    // ResizeObserver 사용
    const resizeObserver = new ResizeObserver(updateBoardSize);
    if (gameBoardRef.current) {
      resizeObserver.observe(gameBoardRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateBoardSize);
      resizeObserver.disconnect();
    };
  }, [gameBoardRef, setBoardSize, isFullscreen]);

  // 전체화면 모드 변경 시 크기 재계산
  useEffect(() => {
    if (gameBoardRef.current) {
      const timer = setTimeout(() => {
        const rect = gameBoardRef.current?.getBoundingClientRect();
        if (rect) {
          const newSize = {
            width: Math.max(300, rect.width),
            height: Math.max(300, rect.height),
          };
          setBoardSize(newSize);
          console.log('[FridgeDefense] 전체화면 모드 변경으로 게임 보드 크기 업데이트:', newSize);
        }
      }, isFullscreen ? 200 : 100);
      
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, gameBoardRef, setBoardSize]);
}

