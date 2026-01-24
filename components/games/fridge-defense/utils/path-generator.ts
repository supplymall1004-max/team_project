/**
 * @file components/games/fridge-defense/utils/path-generator.ts
 * @description 게임 경로 생성 유틸리티
 */

import { PATH_COLORS, GAME_CONFIG } from './game-constants';

export interface GamePath {
  id: number;
  startY: number;
  endY: number;
  color: string;
}

/**
 * 게임 경로 생성
 */
export const generatePaths = (
  boardWidth: number, 
  boardHeight: number, 
  pathCount: number
): GamePath[] => {
  const paths: GamePath[] = [];
  
  if (pathCount === 1) {
    // 단일 경로: 화면 중앙
    paths.push({
      id: 0,
      startY: boardHeight * 0.5,
      endY: boardHeight * 0.5,
      color: PATH_COLORS[0],
    });
  } else if (pathCount === 2) {
    // 2개 경로: 상단, 하단
    paths.push({
      id: 0,
      startY: boardHeight * 0.3,
      endY: boardHeight * 0.3,
      color: PATH_COLORS[0],
    });
    paths.push({
      id: 1,
      startY: boardHeight * 0.7,
      endY: boardHeight * 0.7,
      color: PATH_COLORS[1],
    });
  } else {
    // 3개 경로: 상단, 중앙, 하단
    paths.push({
      id: 0,
      startY: boardHeight * 0.25,
      endY: boardHeight * 0.25,
      color: PATH_COLORS[0],
    });
    paths.push({
      id: 1,
      startY: boardHeight * 0.5,
      endY: boardHeight * 0.5,
      color: PATH_COLORS[1],
    });
    paths.push({
      id: 2,
      startY: boardHeight * 0.75,
      endY: boardHeight * 0.75,
      color: PATH_COLORS[2],
    });
  }
  
  return paths;
};

/**
 * 금지 구역 생성 (타워 배치 불가 영역)
 */
export const generateForbiddenZones = (
  boardWidth: number, 
  boardHeight: number
): Array<{ x: number; y: number }> => {
  const zones: Array<{ x: number; y: number }> = [];
  const cols = Math.floor(boardWidth / GAME_CONFIG.TILE_SIZE);
  const rows = Math.floor(boardHeight / GAME_CONFIG.TILE_SIZE);
  
  // 랜덤하게 일부 타일을 금지 구역으로 설정 (약 15-20%)
  const forbiddenCount = Math.floor(cols * rows * 0.18);
  const usedPositions = new Set<string>();
  
  for (let i = 0; i < forbiddenCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      const key = `${col}-${row}`;
      
      // 경로 근처는 제외 (경로 Y ± PATH_WIDTH)
      const y = row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const isNearPath = Math.abs(y - boardHeight * 0.25) < GAME_CONFIG.PATH_WIDTH ||
                         Math.abs(y - boardHeight * 0.5) < GAME_CONFIG.PATH_WIDTH ||
                         Math.abs(y - boardHeight * 0.75) < GAME_CONFIG.PATH_WIDTH;
      
      if (!usedPositions.has(key) && !isNearPath) {
        usedPositions.add(key);
        zones.push({
          x: col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          y: row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
        });
        break;
      }
      attempts++;
    }
  }
  
  return zones;
};

/**
 * 위치가 경로 위인지 확인
 */
export const isOnPath = (x: number, y: number, paths: GamePath[]): boolean => {
  return paths.some(path => {
    const pathTop = path.startY - GAME_CONFIG.PATH_WIDTH / 2;
    const pathBottom = path.startY + GAME_CONFIG.PATH_WIDTH / 2;
    return y >= pathTop && y <= pathBottom;
  });
};

/**
 * 그리드 위치로 변환 (타일 기반 배치)
 */
export const getGridPosition = (x: number, y: number) => {
  const { TILE_SIZE } = GAME_CONFIG;
  const gridX = Math.floor(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
  const gridY = Math.floor(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
  return { gridX, gridY };
};

