/**
 * @file lib/game/level-system.ts
 * @description 레벨 계산 및 관리 로직
 *
 * 건강 점수 기반으로 캐릭터 레벨을 계산하고 관리하는 로직입니다.
 *
 * 주요 기능:
 * 1. 건강 점수 기반 경험치 계산
 * 2. 레벨 계산
 * 3. 다음 레벨까지 필요한 경험치 계산
 * 4. 레벨업 보상 계산
 *
 * @dependencies
 * - @/types/game/level: LevelData 타입 정의
 */

export interface LevelData {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperience: number;
}

/**
 * 레벨별 필요 경험치 계산
 * 레벨이 올라갈수록 더 많은 경험치 필요
 */
export function calculateExperienceForLevel(level: number): number {
  // 레벨 1: 100, 레벨 2: 200, 레벨 3: 300... (선형 증가)
  // 또는 레벨 1: 100, 레벨 2: 250, 레벨 3: 450... (지수적 증가)
  // 여기서는 선형 증가 사용
  return level * 100;
}

/**
 * 총 경험치로 레벨 계산
 */
export function calculateLevelFromExperience(totalExperience: number): {
  level: number;
  currentLevelExperience: number;
  nextLevelExperience: number;
} {
  let level = 1;
  let accumulatedExp = 0;
  let currentLevelExp = 0;
  let nextLevelExp = calculateExperienceForLevel(level);

  while (accumulatedExp + nextLevelExp <= totalExperience) {
    accumulatedExp += nextLevelExp;
    level++;
    currentLevelExp = 0;
    nextLevelExp = calculateExperienceForLevel(level);
  }

  currentLevelExp = totalExperience - accumulatedExp;

  return {
    level,
    currentLevelExperience: currentLevelExp,
    nextLevelExperience: nextLevelExp,
  };
}

/**
 * 건강 점수를 경험치로 변환
 */
export function convertHealthScoreToExperience(healthScore: number): number {
  // 건강 점수 1점 = 경험치 10점
  return Math.floor(healthScore * 10);
}

/**
 * 레벨 데이터 생성
 */
export function createLevelData(
  currentExperience: number,
  additionalExperience: number = 0
): LevelData {
  const totalExperience = currentExperience + additionalExperience;
  const { level, currentLevelExperience, nextLevelExperience } =
    calculateLevelFromExperience(totalExperience);

  return {
    level,
    experience: currentLevelExperience,
    experienceToNextLevel: nextLevelExperience,
    totalExperience,
  };
}

/**
 * 레벨업 여부 확인
 */
export function checkLevelUp(
  oldTotalExperience: number,
  newTotalExperience: number
): boolean {
  const oldLevel = calculateLevelFromExperience(oldTotalExperience).level;
  const newLevel = calculateLevelFromExperience(newTotalExperience).level;
  return newLevel > oldLevel;
}

/**
 * 레벨업 보상 계산
 */
export function calculateLevelUpReward(newLevel: number): {
  points: number;
  skinId?: string;
} {
  // 레벨업 시 기본 포인트 보상
  const basePoints = newLevel * 50;

  // 특정 레벨 달성 시 스킨 보상
  let skinId: string | undefined;
  if (newLevel === 5) {
    skinId = "level_5_skin";
  } else if (newLevel === 10) {
    skinId = "level_10_skin";
  } else if (newLevel === 20) {
    skinId = "level_20_skin";
  } else if (newLevel === 50) {
    skinId = "level_50_skin";
  }

  return {
    points: basePoints,
    skinId,
  };
}

/**
 * 레벨 진행률 계산 (0-100)
 */
export function calculateLevelProgress(levelData: LevelData): number {
  if (levelData.experienceToNextLevel === 0) return 100;
  return Math.floor(
    (levelData.experience / levelData.experienceToNextLevel) * 100
  );
}

