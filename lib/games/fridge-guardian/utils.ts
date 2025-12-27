/**
 * @file lib/games/fridge-guardian/utils.ts
 * @description 냉장고 파수꾼 게임 유틸리티 함수
 * 
 * 게임 로직에 필요한 헬퍼 함수들을 제공합니다.
 */

import type { GameItem, GameItemType, DifficultyConfig } from '@/types/game/fridge-guardian';
import { ITEM_CONFIG, DIFFICULTY_CONFIG, DEFAULT_GAME_CONFIG } from './config';

/**
 * 랜덤 아이템 타입 생성
 * @param difficulty 난이도 설정
 * @param userAllergies 사용자 알레르기 정보 (알레르기 아이템 확률 조정용)
 * @param level 현재 게임 레벨 (레벨이 높을수록 어려운 아이템 등장)
 */
export function generateRandomItemType(
  difficulty: DifficultyConfig = DIFFICULTY_CONFIG.NORMAL,
  userAllergies: string[] = [],
  level: number = 1
): GameItemType {
  const rand = Math.random();
  
  // 레벨 보정 (레벨이 높을수록 어려운 아이템 확률 증가)
  const levelMultiplier = 1 + (level - 1) * 0.1; // 레벨당 10% 증가
  
  // 확률 누적 계산 (우선순위 순서)
  const rates = {
    fresh: difficulty.freshSpawnRate * levelMultiplier,
    spoiled: difficulty.spoiledSpawnRate * levelMultiplier,
    allergy: difficulty.allergySpawnRate * (userAllergies.length > 0 ? 1.5 : 1) * levelMultiplier,
    powerUp: difficulty.powerUpSpawnRate * (1 / levelMultiplier), // 레벨이 높을수록 파워업 감소
    timeBonus: difficulty.timeBonusSpawnRate * (1 / levelMultiplier),
    scoreMulti: difficulty.scoreMultiSpawnRate * (1 / levelMultiplier),
    slowTime: difficulty.slowTimeSpawnRate * (1 / levelMultiplier),
    boss: difficulty.bossSpawnRate * levelMultiplier,
    virus: difficulty.virusSpawnRate * levelMultiplier,
    parasite: difficulty.parasiteSpawnRate * levelMultiplier,
  };
  
  // 누적 확률로 아이템 결정
  let cumulative = 0;
  
  // 신선식품 (최우선 - 클릭 금지)
  cumulative += rates.fresh;
  if (rand <= cumulative) return 'FRESH';
  
  // 상한 식품
  cumulative += rates.spoiled;
  if (rand <= cumulative) return 'SPOILED';
  
  // 알레르기
  cumulative += rates.allergy;
  if (rand <= cumulative) return 'ALLERGY';
  
  // 파워업 아이템들 (긍정적)
  cumulative += rates.powerUp;
  if (rand <= cumulative) return 'POWER_UP';
  
  cumulative += rates.timeBonus;
  if (rand <= cumulative) return 'TIME_BONUS';
  
  cumulative += rates.scoreMulti;
  if (rand <= cumulative) return 'SCORE_MULTI';
  
  cumulative += rates.slowTime;
  if (rand <= cumulative) return 'SLOW_TIME';
  
  // 보스급 적들
  cumulative += rates.boss;
  if (rand <= cumulative) return 'BOSS';
  
  cumulative += rates.virus;
  if (rand <= cumulative) return 'VIRUS';
  
  cumulative += rates.parasite;
  if (rand <= cumulative) return 'PARASITE';
  
  // 나머지는 일반 세균 또는 곰팡이
  if (rand > cumulative && rand <= cumulative + 0.15) {
    return 'MOLD';
  }
  
  return 'NORMAL';
}

/**
 * 게임 아이템 생성
 */
export function createGameItem(
  type: GameItemType,
  containerWidth: number = 100,
  containerHeight: number = 100
): GameItem {
  const config = ITEM_CONFIG[type];
  
  return {
    id: Date.now() + Math.random(),
    type,
    emoji: config.emoji,
    score: config.score,
    label: config.label,
    x: Math.random() * 80 + 10, // 화면의 10%~90% 사이
    y: Math.random() * 60 + 20, // 화면의 20%~80% 사이
    spawnTime: Date.now(),
  };
}

/**
 * 콤보 보너스 점수 계산
 */
export function calculateComboBonus(
  combo: number,
  baseScore: number,
  bonusThreshold: number = 5,
  bonusAmount: number = 50
): number {
  if (combo < bonusThreshold) {
    return 0;
  }
  
  const bonusMultiplier = Math.floor(combo / bonusThreshold);
  return bonusMultiplier * bonusAmount;
}

/**
 * 최종 점수 계산 (콤보 보너스 포함)
 */
export function calculateFinalScore(
  baseScore: number,
  combo: number,
  bonusThreshold: number = 5,
  bonusAmount: number = 50
): number {
  const bonus = calculateComboBonus(combo, baseScore, bonusThreshold, bonusAmount);
  return baseScore + bonus;
}

/**
 * 게임 통계 초기화
 */
export function createInitialStats() {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    itemsCaught: 0,
    itemsMissed: 0,
    correctClicks: 0,
    wrongClicks: 0,
    bossDefeated: 0,
    moldDefeated: 0,
    normalDefeated: 0,
    virusDefeated: 0,
    parasiteDefeated: 0,
    powerUpsCollected: 0,
    timeBonusesCollected: 0,
    level: 1,
    maxLevel: 1,
  };
}

/**
 * 시간 포맷팅 (초 → MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 점수 포맷팅 (천 단위 콤마)
 */
export function formatScore(score: number): string {
  return score.toLocaleString('ko-KR');
}

/**
 * 아이템이 클릭 가능한지 확인 (생명력 체크)
 */
export function canClickItem(item: GameItem, lives: number): boolean {
  if (lives <= 0) {
    return false;
  }
  
  // 신선식품이나 알레르기 아이템은 클릭 가능하지만 생명력이 깎임
  return true;
}

/**
 * 아이템 클릭 결과 계산
 */
export function processItemClick(
  item: GameItem,
  currentScore: number,
  currentLives: number,
  currentCombo: number,
  scoreMultiplier: number = 1
): {
  newScore: number;
  newLives: number;
  newCombo: number;
  isCorrect: boolean;
  effect?: {
    type: 'heal' | 'time' | 'multiplier' | 'slow';
    value: number;
    duration?: number;
  };
} {
  const positiveTypes: GameItemType[] = ['NORMAL', 'BOSS', 'MOLD', 'VIRUS', 'PARASITE'];
  const isCorrect = positiveTypes.includes(item.type);
  
  let newScore = currentScore;
  let newLives = currentLives;
  let newCombo = currentCombo;
  let effect: { type: 'heal' | 'time' | 'multiplier' | 'slow'; value: number; duration?: number } | undefined;
  
  // 특수 아이템 처리
  if (item.type === 'POWER_UP') {
    newLives = Math.min(DEFAULT_GAME_CONFIG.maxLives, currentLives + 1);
    effect = { type: 'heal', value: 1 };
    return { newScore, newLives, newCombo, isCorrect: true, effect };
  }
  
  if (item.type === 'TIME_BONUS') {
    effect = { type: 'time', value: 5 };
    return { newScore, newLives, newCombo, isCorrect: true, effect };
  }
  
  if (item.type === 'SCORE_MULTI') {
    effect = { type: 'multiplier', value: 2, duration: 10 };
    return { newScore, newLives, newCombo, isCorrect: true, effect };
  }
  
  if (item.type === 'SLOW_TIME') {
    effect = { type: 'slow', value: 0.5, duration: 10 };
    return { newScore, newLives, newCombo, isCorrect: true, effect };
  }
  
  if (isCorrect) {
    // 정답: 점수 증가, 콤보 증가
    const bonus = calculateComboBonus(newCombo, item.score);
    const finalScore = item.score * scoreMultiplier;
    newScore = Math.max(0, currentScore + finalScore + bonus);
    newCombo = currentCombo + 1;
  } else {
    // 오답: 점수 감소, 생명력 감소, 콤보 초기화
    newScore = Math.max(0, currentScore + item.score);
    newLives = Math.max(0, currentLives - 1);
    newCombo = 0;
  }
  
  return {
    newScore,
    newLives,
    newCombo,
    isCorrect,
    effect,
  };
}

/**
 * 레벨 계산 (점수 기반)
 */
export function calculateLevel(score: number, levelUpThreshold: number): number {
  return Math.floor(score / levelUpThreshold) + 1;
}

