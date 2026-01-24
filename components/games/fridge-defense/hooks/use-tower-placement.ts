/**
 * @file components/games/fridge-defense/hooks/use-tower-placement.ts
 * @description 타워 배치 관리 훅
 */

import { useCallback } from 'react';
import type { Tower, TowerType, BoardSize, ForbiddenZone, GamePath } from '@/types/game/fridge-defense';
import { TOWERS_DATA, GAME_CONFIG } from '../utils/game-constants';
import { getGridPosition, isOnPath } from '../utils/path-generator';
import { hasTowerAt, isForbiddenZone, canPlaceTowerAt } from '../utils/collision-detection';

export interface UseTowerPlacementProps {
  isPlaying: boolean;
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  towers: Tower[];
  setTowers: React.Dispatch<React.SetStateAction<Tower[]>>;
  selectedTowerType: TowerType;
  boardSize: BoardSize;
  gamePaths: GamePath[];
  forbiddenZones: ForbiddenZone[];
  setShowUpgradeMenu: React.Dispatch<React.SetStateAction<number | null>>;
  onTowerPlaced?: () => void;
}

export interface UseTowerPlacementReturn {
  handleGameBoardClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  canPlaceTower: (x: number, y: number) => { canPlace: boolean; reason?: string };
}

export function useTowerPlacement({
  isPlaying,
  gold,
  setGold,
  towers,
  setTowers,
  selectedTowerType,
  boardSize,
  gamePaths,
  forbiddenZones,
  setShowUpgradeMenu,
  onTowerPlaced,
}: UseTowerPlacementProps): UseTowerPlacementReturn {
  
  // 타워 배치 가능 여부 확인
  const canPlaceTower = useCallback((x: number, y: number): { canPlace: boolean; reason?: string } => {
    // 경계 체크
    if (!canPlaceTowerAt(x, y, boardSize.width, boardSize.height)) {
      return { canPlace: false, reason: '보드 경계를 벗어났습니다.' };
    }

    // 경로 위 체크
    if (isOnPath(x, y, gamePaths)) {
      return { canPlace: false, reason: '경로 위에는 배치할 수 없습니다.' };
    }

    // 이미 타워가 있는지 체크
    if (hasTowerAt(x, y, towers)) {
      return { canPlace: false, reason: '이미 타워가 있습니다.' };
    }

    // 금지 구역 체크
    if (isForbiddenZone(x, y, forbiddenZones)) {
      return { canPlace: false, reason: '배치 불가 구역입니다.' };
    }

    // 최대 타워 개수 체크
    if (towers.length >= GAME_CONFIG.MAX_TOWERS) {
      return { canPlace: false, reason: `최대 타워 개수(${GAME_CONFIG.MAX_TOWERS}개)에 도달했습니다.` };
    }

    // 골드 체크
    const towerData = TOWERS_DATA[selectedTowerType];
    if (gold < towerData.cost) {
      return { canPlace: false, reason: '골드가 부족합니다.' };
    }

    return { canPlace: true };
  }, [boardSize, gamePaths, towers, forbiddenZones, gold, selectedTowerType]);

  // 타워 배치
  const handleGameBoardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying) return;
    
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // 그리드 위치로 변환
    const { gridX, gridY } = getGridPosition(clickX, clickY);

    // 배치 가능 여부 확인
    const validation = canPlaceTower(gridX, gridY);
    if (!validation.canPlace) {
      if (validation.reason) {
        console.log('[FridgeDefense]', validation.reason);
      }
      return;
    }
    
    const towerData = TOWERS_DATA[selectedTowerType];
    const newTower: Tower = {
      id: `${selectedTowerType}-${Date.now()}`,
      type: selectedTowerType,
      x: gridX,
      y: gridY,
      level: 1,
      lastShot: 0,
      damage: towerData.damage,
      range: towerData.range,
      fireRate: towerData.fireRate,
      color: towerData.color,
      emoji: towerData.emoji,
      attackType: towerData.attackType,
      hp: towerData.maxHp,
      maxHp: towerData.maxHp,
    };
    
    setTowers(prev => [...prev, newTower]);
    setGold(g => g - towerData.cost);
    setShowUpgradeMenu(null);
    
    console.log(`[FridgeDefense] 타워 배치: ${selectedTowerType} at (${gridX}, ${gridY}), 남은 타워: ${GAME_CONFIG.MAX_TOWERS - towers.length - 1}개`);
    
    if (onTowerPlaced) {
      onTowerPlaced();
    }
  }, [
    isPlaying, 
    selectedTowerType, 
    canPlaceTower, 
    towers.length,
    setTowers, 
    setGold, 
    setShowUpgradeMenu,
    onTowerPlaced
  ]);

  return {
    handleGameBoardClick,
    canPlaceTower,
  };
}

