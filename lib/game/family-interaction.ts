/**
 * @file lib/game/family-interaction.ts
 * @description 가족 친밀도 관리 로직
 *
 * 가족 구성원 간의 상호작용을 게임화하여 가족 건강 관리를 함께 할 수 있도록 돕는 로직입니다.
 *
 * 주요 기능:
 * 1. 가족 친밀도 계산
 * 2. 상호작용에 따른 친밀도 증가
 * 3. 친밀도 레벨 계산
 * 4. 가족 챌린지 관리
 *
 * @dependencies
 * - @/types/family: FamilyMember 타입 정의
 */

export interface FamilyIntimacy {
  familyMemberId: string;
  intimacyScore: number;
  intimacyLevel: number;
  lastInteractionAt?: string;
}

/**
 * 친밀도 레벨 계산
 */
export function calculateIntimacyLevel(intimacyScore: number): number {
  // 친밀도 점수에 따른 레벨 계산
  // 0-100: 레벨 1, 101-200: 레벨 2, 201-300: 레벨 3...
  return Math.floor(intimacyScore / 100) + 1;
}

/**
 * 친밀도 점수 증가량 계산
 */
export function calculateIntimacyIncrease(
  interactionType: "health_help" | "challenge_participation" | "daily_interaction"
): number {
  const increaseMap = {
    health_help: 20, // 건강 관리 도움
    challenge_participation: 15, // 챌린지 참여
    daily_interaction: 5, // 일일 상호작용
  };
  return increaseMap[interactionType];
}

/**
 * 친밀도 점수 업데이트
 */
export function updateIntimacyScore(
  currentScore: number,
  interactionType: "health_help" | "challenge_participation" | "daily_interaction"
): FamilyIntimacy {
  const increase = calculateIntimacyIncrease(interactionType);
  const newScore = Math.min(currentScore + increase, 1000); // 최대 1000점
  const newLevel = calculateIntimacyLevel(newScore);

  return {
    familyMemberId: "", // 실제 사용 시 전달
    intimacyScore: newScore,
    intimacyLevel: newLevel,
    lastInteractionAt: new Date().toISOString(),
  };
}

/**
 * 친밀도 레벨별 보너스 계산
 */
export function calculateIntimacyBonus(intimacyLevel: number): {
  healthScoreBonus: number;
  pointBonus: number;
} {
  // 친밀도 레벨이 높을수록 건강 점수 및 포인트 보너스 증가
  const healthScoreBonus = intimacyLevel * 2; // 레벨당 2점
  const pointBonus = intimacyLevel * 5; // 레벨당 5포인트

  return {
    healthScoreBonus,
    pointBonus,
  };
}

/**
 * 친밀도 레벨 이름
 */
export function getIntimacyLevelName(level: number): string {
  if (level >= 10) return "최고의 가족";
  if (level >= 7) return "가까운 가족";
  if (level >= 5) return "친한 가족";
  if (level >= 3) return "좋은 가족";
  if (level >= 1) return "일반 가족";
  return "낯선 가족";
}

