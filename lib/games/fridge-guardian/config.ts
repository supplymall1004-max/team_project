/**
 * @file lib/games/fridge-guardian/config.ts
 * @description 냉장고 파수꾼 게임 설정 상수
 * 
 * 게임의 기본 설정값, 아이템 점수, 확률 등을 정의합니다.
 */

import type { GameConfig, DifficultyConfig, GameItemType } from '@/types/game/fridge-guardian';

/**
 * 기본 게임 설정
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  duration: 40,              // 40초 게임
  spawnInterval: 800,       // 0.8초마다 아이템 생성
  maxLives: 3,              // 최대 생명력 3
  itemLifetime: 1200,        // 아이템 1.2초 후 자동 소멸
  comboBonusThreshold: 5,   // 5콤보마다 보너스
  comboBonusAmount: 50,     // 보너스 점수 50점
};

/**
 * 아이템 타입별 설정
 */
export const ITEM_CONFIG: Record<GameItemType, {
  emoji: string;
  score: number;
  label: string;
  spawnProbability: number; // 등장 확률 (0-1) - 기본값, 난이도/레벨에 따라 조정됨
  isPositive?: boolean; // 긍정적 아이템인지 (클릭하면 좋은 것)
  effect?: string; // 특수 효과 설명
}> = {
  NORMAL: {
    emoji: '🦠',
    score: 100,
    label: '일반 세균',
    spawnProbability: 0.35,
    isPositive: true,
  },
  BOSS: {
    emoji: '👾',
    score: 300,
    label: '대장균',
    spawnProbability: 0.12,
    isPositive: true,
  },
  MOLD: {
    emoji: '🍄',
    score: 200,
    label: '곰팡이',
    spawnProbability: 0.15,
    isPositive: true,
  },
  VIRUS: {
    emoji: '🦠',
    score: 500,
    label: '바이러스',
    spawnProbability: 0.08,
    isPositive: true,
  },
  PARASITE: {
    emoji: '🐛',
    score: 150,
    label: '기생충',
    spawnProbability: 0.1,
    isPositive: true,
  },
  SPOILED: {
    emoji: '🤢',
    score: -300,
    label: '상한 식품',
    spawnProbability: 0.08,
    isPositive: false,
  },
  ALLERGY: {
    emoji: '🥜',
    score: -200,
    label: '알레르기 주의',
    spawnProbability: 0.08,
    isPositive: false,
  },
  FRESH: {
    emoji: '🍓',
    score: -500,
    label: '신선식품',
    spawnProbability: 0.05,
    isPositive: false,
  },
  POWER_UP: {
    emoji: '💚',
    score: 0,
    label: '생명력 회복',
    spawnProbability: 0.03,
    isPositive: true,
    effect: '생명력 +1',
  },
  TIME_BONUS: {
    emoji: '⏰',
    score: 0,
    label: '시간 보너스',
    spawnProbability: 0.02,
    isPositive: true,
    effect: '시간 +5초',
  },
  SCORE_MULTI: {
    emoji: '⭐',
    score: 0,
    label: '점수 배율',
    spawnProbability: 0.02,
    isPositive: true,
    effect: '10초간 점수 2배',
  },
  SLOW_TIME: {
    emoji: '🐌',
    score: 0,
    label: '시간 감속',
    spawnProbability: 0.02,
    isPositive: true,
    effect: '10초간 속도 감소',
  },
};

/**
 * 난이도별 설정
 */
export const DIFFICULTY_CONFIG: Record<string, DifficultyConfig> = {
  EASY: {
    spawnRate: 1200,
    itemLifetime: 2000,
    bossSpawnRate: 0.03,
    virusSpawnRate: 0.0,      // 쉬움 난이도에서는 바이러스 없음
    parasiteSpawnRate: 0.05,
    allergySpawnRate: 0.03,
    freshSpawnRate: 0.01,
    spoiledSpawnRate: 0.02,
    powerUpSpawnRate: 0.05,   // 쉬움에서는 파워업 많이
    timeBonusSpawnRate: 0.04,
    scoreMultiSpawnRate: 0.03,
    slowTimeSpawnRate: 0.03,
    levelUpThreshold: 500,    // 500점마다 레벨업
  },
  NORMAL: {
    spawnRate: 800,
    itemLifetime: 1200,
    bossSpawnRate: 0.12,
    virusSpawnRate: 0.06,
    parasiteSpawnRate: 0.08,
    allergySpawnRate: 0.08,
    freshSpawnRate: 0.04,
    spoiledSpawnRate: 0.06,
    powerUpSpawnRate: 0.03,
    timeBonusSpawnRate: 0.02,
    scoreMultiSpawnRate: 0.02,
    slowTimeSpawnRate: 0.02,
    levelUpThreshold: 800,    // 800점마다 레벨업
  },
  HARD: {
    spawnRate: 600,
    itemLifetime: 1000,
    bossSpawnRate: 0.18,
    virusSpawnRate: 0.12,
    parasiteSpawnRate: 0.1,
    allergySpawnRate: 0.12,
    freshSpawnRate: 0.06,
    spoiledSpawnRate: 0.08,
    powerUpSpawnRate: 0.02,
    timeBonusSpawnRate: 0.015,
    scoreMultiSpawnRate: 0.015,
    slowTimeSpawnRate: 0.015,
    levelUpThreshold: 1000,   // 1000점마다 레벨업
  },
  EXPERT: {
    spawnRate: 400,
    itemLifetime: 800,
    bossSpawnRate: 0.22,
    virusSpawnRate: 0.15,
    parasiteSpawnRate: 0.12,
    allergySpawnRate: 0.15,
    freshSpawnRate: 0.08,
    spoiledSpawnRate: 0.1,
    powerUpSpawnRate: 0.01,   // 전문가에서는 파워업 거의 없음
    timeBonusSpawnRate: 0.01,
    scoreMultiSpawnRate: 0.01,
    slowTimeSpawnRate: 0.01,
    levelUpThreshold: 1500,   // 1500점마다 레벨업
  },
};

/**
 * 건강 팁 메시지 목록 (게임 종료 시 표시)
 */
export const HEALTH_TIPS = [
  '냉장고 온도를 4°C 이하로 유지하면 세균 번식을 막을 수 있습니다.',
  '알레르기 유발 식품은 보관 시 밀봉하여 다른 식재료와 닿지 않게 주의하세요!',
  '곰팡이가 생긴 식재료는 즉시 버리고, 주변 식재료도 함께 확인하세요.',
  '냉장고 내부는 주 1회 이상 청소하여 위생을 유지하세요.',
  '신선한 식재료는 구매 후 즉시 냉장고에 보관하세요.',
  '냉장고 문을 자주 열고 닫으면 온도가 올라가 세균이 번식하기 쉽습니다.',
  '식재료는 유통기한을 확인하고, 오래된 것부터 사용하세요.',
  '냉장고 내부 습도가 높으면 곰팡이가 생기기 쉽습니다. 습도 조절에 주의하세요.',
];

/**
 * 콤보 메시지 목록
 */
export const COMBO_MESSAGES = [
  { threshold: 3, message: '좋아요!', emoji: '👍' },
  { threshold: 5, message: '훌륭해요!', emoji: '🔥' },
  { threshold: 10, message: '완벽해요!', emoji: '⭐' },
  { threshold: 15, message: '대단해요!', emoji: '💯' },
  { threshold: 20, message: '전설적이에요!', emoji: '👑' },
];

/**
 * 점수 등급 기준
 */
export const SCORE_RANKS = [
  { min: 0, max: 1000, rank: '초보 파수꾼', emoji: '🌱' },
  { min: 1000, max: 3000, rank: '숙련 파수꾼', emoji: '⭐' },
  { min: 3000, max: 5000, rank: '전문 파수꾼', emoji: '🔥' },
  { min: 5000, max: 8000, rank: '마스터 파수꾼', emoji: '👑' },
  { min: 8000, max: Infinity, rank: '전설의 파수꾼', emoji: '💎' },
];

/**
 * 랜덤 건강 팁 가져오기
 */
export function getRandomHealthTip(): string {
  return HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)] || HEALTH_TIPS[0];
}

/**
 * 점수에 따른 등급 가져오기
 */
export function getScoreRank(score: number): { rank: string; emoji: string } {
  const rank = SCORE_RANKS.find(r => score >= r.min && score < r.max);
  return rank || SCORE_RANKS[0];
}

/**
 * 콤보에 따른 메시지 가져오기
 */
export function getComboMessage(combo: number): { message: string; emoji: string } | null {
  const message = COMBO_MESSAGES
    .filter(m => combo >= m.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0];
  
  return message || null;
}

