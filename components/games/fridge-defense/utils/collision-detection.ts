/**
 * @file components/games/fridge-defense/utils/collision-detection.ts
 * @description 충돌 감지 및 거리 계산 유틸리티
 */

import type { Tower, Enemy } from '@/types/game/fridge-defense';
import { GAME_CONFIG } from './game-constants';

/**
 * 두 점 사이의 거리 계산
 */
export const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.hypot(x2 - x1, y2 - y1);
};

/**
 * 특정 위치에 타워가 있는지 확인
 */
export const hasTowerAt = (x: number, y: number, towers: Tower[]): boolean => {
  return towers.some(t => {
    const dist = getDistance(t.x, t.y, x, y);
    return dist < GAME_CONFIG.TILE_SIZE / 2;
  });
};

/**
 * 금지 구역인지 확인
 */
export const isForbiddenZone = (
  x: number, 
  y: number, 
  forbiddenZones: Array<{ x: number; y: number }>
): boolean => {
  return forbiddenZones.some(zone => {
    const dist = getDistance(zone.x, zone.y, x, y);
    return dist < GAME_CONFIG.TILE_SIZE / 2;
  });
};

/**
 * 타워 범위 내의 적 찾기
 */
export const findEnemiesInRange = (tower: Tower, enemies: Enemy[]): Enemy[] => {
  return enemies.filter(e => {
    const dist = getDistance(e.x, e.y, tower.x, tower.y);
    return dist < tower.range;
  });
};

/**
 * 가장 가까운 적 찾기
 */
export const findNearestEnemy = (tower: Tower, enemies: Enemy[]): Enemy | null => {
  const enemiesInRange = findEnemiesInRange(tower, enemies);
  
  if (enemiesInRange.length === 0) return null;
  
  return enemiesInRange.reduce((closest, enemy) => {
    const distClosest = getDistance(closest.x, closest.y, tower.x, tower.y);
    const distEnemy = getDistance(enemy.x, enemy.y, tower.x, tower.y);
    return distEnemy < distClosest ? enemy : closest;
  });
};

/**
 * 가장 가까운 N개의 적 찾기 (AOE 공격용)
 */
export const findNearestEnemies = (
  tower: Tower, 
  enemies: Enemy[], 
  count: number
): Enemy[] => {
  const enemiesInRange = findEnemiesInRange(tower, enemies);
  
  return enemiesInRange
    .sort((a, b) => {
      const distA = getDistance(a.x, a.y, tower.x, tower.y);
      const distB = getDistance(b.x, b.y, tower.x, tower.y);
      return distA - distB;
    })
    .slice(0, count);
};

/**
 * 적과 타워 사이의 충돌 체크
 */
export const checkEnemyTowerCollision = (
  enemy: Enemy, 
  towers: Tower[]
): Tower | null => {
  const attackRange = enemy.attackRange || 50;
  
  for (const tower of towers) {
    if (tower.hp <= 0) continue; // 체력이 0인 타워는 무시
    
    const dist = getDistance(enemy.x, enemy.y, tower.x, tower.y);
    if (dist < attackRange) {
      return tower;
    }
  }
  
  return null;
};

/**
 * 투사체와 적 사이의 충돌 체크
 */
export const checkProjectileEnemyCollision = (
  projX: number, 
  projY: number, 
  enemy: Enemy, 
  threshold: number = 15
): boolean => {
  const dist = getDistance(projX, projY, enemy.x, enemy.y);
  return dist < threshold;
};

/**
 * 화면 경계 체크
 */
export const isWithinBounds = (
  x: number, 
  y: number, 
  width: number, 
  height: number,
  padding: number = 0
): boolean => {
  return x >= padding && 
         x <= width - padding && 
         y >= padding && 
         y <= height - padding;
};

/**
 * 타일 위치로 변환하여 경계 체크
 */
export const canPlaceTowerAt = (
  x: number, 
  y: number, 
  boardWidth: number, 
  boardHeight: number
): boolean => {
  const { TILE_SIZE } = GAME_CONFIG;
  return x >= TILE_SIZE / 2 && 
         x <= boardWidth - TILE_SIZE / 2 &&
         y >= TILE_SIZE / 2 && 
         y <= boardHeight - TILE_SIZE / 2;
};

