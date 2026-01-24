/**
 * @file components/games/fridge-defense/utils/game-constants.ts
 * @description Django Defender 게임 상수 정의
 */

import type { TowerType, EnemyType } from '@/types/game/fridge-defense';

// ============================================================================
// 게임 기본 설정
// ============================================================================

export const GAME_CONFIG = {
  TILE_SIZE: 60,
  MAX_TOWERS: 20, // 15 -> 20 증가
  PATH_WIDTH: 80,
  GAME_LOOP_INTERVAL: 33, // 33ms (~30fps)
  INITIAL_GOLD: 800, // 600 -> 800 증가
  INITIAL_LIVES: 5,
  INITIAL_WAVE: 1,
  MAX_DAMAGE_NUMBERS: 15,
} as const;

// ============================================================================
// 웨이브 시스템
// ============================================================================

/**
 * 웨이브에 따른 경로 수 계산
 */
export const getPathCount = (wave: number): number => {
  if (wave <= 3) return 1; // 초반: 1개 경로
  if (wave <= 7) return 2; // 중반: 2개 경로
  return 3; // 후반: 3개 경로
};

/**
 * 웨이브 클리어 보너스 골드 계산
 */
export const getWaveClearBonus = (wave: number): number => {
  return 100 + (wave * 10); // 80+8*wave -> 100+10*wave
};

// ============================================================================
// 적 타입 정의
// ============================================================================

export const ENEMY_TYPES = {
  NORMAL: { 
    name: 'GERM', 
    emoji: '🦠', 
    hp: 120,
    speed: 1.5,
    gold: 35,
    attackDamage: 6,
    attackRange: 50,
    attackRate: 1800,
  },
  FAST: { 
    name: 'SUGAR_SPIKE', 
    emoji: '🍭', 
    hp: 70,
    speed: 3.2,
    gold: 50,
    attackDamage: 4,
    attackRange: 40,
    attackRate: 1300,
  },
  TANK: { 
    name: 'FATTY_BOMB', 
    emoji: '🍟', 
    hp: 450,
    speed: 0.7,
    gold: 120,
    attackDamage: 10,
    attackRange: 60,
    attackRate: 2200,
  },
  BOSS: { 
    name: 'MEGA_GERM', 
    emoji: '👹', 
    hp: 800,
    speed: 1.0,
    gold: 250,
    attackDamage: 15,
    attackRange: 70,
    attackRate: 1800,
  },
} as const;

/**
 * 웨이브에 따른 적 체력 증가량 계산
 */
export const getEnemyHpIncrease = (wave: number, isCrisis: boolean = false): number => {
  const baseIncrease = Math.floor(wave * 15); // 20 -> 15 감소
  return isCrisis ? Math.floor(baseIncrease * 1.5) : baseIncrease;
};

/**
 * 웨이브에 따른 적 속도 증가량 계산
 */
export const getEnemySpeedIncrease = (wave: number, isCrisis: boolean = false): number => {
  const baseIncrease = wave * 0.03; // 0.05 -> 0.03 감소
  return isCrisis ? baseIncrease + 0.2 : baseIncrease;
};

/**
 * 웨이브에 따른 적 골드 증가량 계산
 */
export const getEnemyGoldIncrease = (wave: number): number => {
  return Math.floor(wave * 1.5);
};

/**
 * 보스 등장 웨이브 체크
 */
export const canSpawnBoss = (wave: number): boolean => {
  return wave >= 7; // 5 -> 7 증가
};

// ============================================================================
// 타워 데이터 정의
// ============================================================================

export const TOWERS_DATA = {
  PROTEIN: { 
    id: 'PROTEIN' as TowerType, 
    name: '닭다리', 
    emoji: '🍗', 
    cost: 150, // 180 -> 150 감소
    baseUpgradeCost: 100, // 120 -> 100 감소
    range: 80,
    damage: 45,
    fireRate: 1200,
    color: '#f97316',
    attackType: 'MELEE' as const,
    description: '근접 공격: 1명에게 강력한 데미지',
    maxHp: 200,
  },
  VITAMIN: { 
    id: 'VITAMIN' as TowerType, 
    name: '브로콜리', 
    emoji: '🥦', 
    cost: 120, // 150 -> 120 감소
    baseUpgradeCost: 75, // 90 -> 75 감소
    range: 140, 
    damage: 25,
    fireRate: 800, 
    color: '#10b981',
    attackType: 'AOE' as const,
    description: '범위 공격: 2명에게 동시 공격',
    maxHp: 120,
  },
  SUGAR: { 
    id: 'SUGAR' as TowerType, 
    name: '아보카도', 
    emoji: '🥑', 
    cost: 200, // 240 -> 200 감소
    baseUpgradeCost: 150, // 180 -> 150 감소
    range: 220,
    damage: 50, 
    fireRate: 1500, 
    color: '#84cc16',
    attackType: 'RANGE' as const,
    description: '원거리 공격: 씨를 던져 1명 공격',
    maxHp: 60,
  },
} as const;

/**
 * 타워 업그레이드 비용 계산
 */
export const getUpgradeCost = (towerType: TowerType, currentLevel: number): number => {
  const baseCost = TOWERS_DATA[towerType].baseUpgradeCost;
  return Math.floor(baseCost * (1 + currentLevel * 0.5)); // 0.7 -> 0.5 감소
};

/**
 * 타워 업그레이드 스탯 계산
 */
export const getUpgradeStats = (towerType: TowerType, currentLevel: number) => {
  const baseData = TOWERS_DATA[towerType];
  return {
    damage: Math.floor(baseData.damage * (1 + currentLevel * 0.3)),
    range: Math.floor(baseData.range * (1 + currentLevel * 0.1)),
    fireRate: Math.floor(baseData.fireRate * (1 - currentLevel * 0.1)),
  };
};

/**
 * 타워 최대 HP 계산 (업그레이드 시)
 */
export const getTowerMaxHp = (towerType: TowerType, level: number): number => {
  const baseMaxHp = TOWERS_DATA[towerType].maxHp;
  return Math.floor(baseMaxHp * (1 + level * 0.2));
};

// ============================================================================
// 웨이브 난이도 설정
// ============================================================================

/**
 * 위기 웨이브 체크
 */
export const isCrisisWave = (wave: number): boolean => {
  return wave % 5 === 0; // 5, 10, 15, 20
};

/**
 * 적 스폰률 계산
 */
export const getSpawnRate = (wave: number, pathCount: number, isCrisis: boolean): number => {
  let baseSpawnRate = 0.020 + (wave * 0.002) + (pathCount * 0.002); // 0.025 -> 0.020 감소
  if (isCrisis) {
    baseSpawnRate *= 2.5;
  }
  return baseSpawnRate;
};

/**
 * 적 타입 선택 (웨이브 및 위기 상황 고려)
 */
export const selectEnemyType = (wave: number, isCrisis: boolean): EnemyType => {
  const typeKeys = Object.keys(ENEMY_TYPES) as Array<keyof typeof ENEMY_TYPES>;
  
  if (isCrisis) {
    // 위기 상황: 보스 30%, 탱크 40%, 일반 30%
    const rand = Math.random();
    if (canSpawnBoss(wave) && rand < 0.3) {
      return 'BOSS';
    } else if (rand < 0.7) {
      return 'TANK';
    } else {
      const normalTypes = typeKeys.filter(k => k !== 'BOSS' && k !== 'TANK');
      return normalTypes[Math.floor(Math.random() * normalTypes.length)];
    }
  } else {
    // 일반 상황
    if (canSpawnBoss(wave) && Math.random() < 0.15) {
      return 'BOSS';
    } else {
      const normalTypes = typeKeys.filter(k => k !== 'BOSS');
      return normalTypes[Math.floor(Math.random() * normalTypes.length)];
    }
  }
};

// ============================================================================
// 스킬 설정
// ============================================================================

export const SKILL_CONFIG = {
  SHOCKWAVE: {
    name: '비타민 충격파',
    damage: 150,
    cooldown: 30, // 초
  },
} as const;

// ============================================================================
// 경로 색상
// ============================================================================

export const PATH_COLORS = ['#94a3b8', '#64748b', '#475569'] as const;

