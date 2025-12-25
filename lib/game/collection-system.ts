/**
 * @file lib/game/collection-system.ts
 * @description 컬렉션 관리 로직
 *
 * 캐릭터 스킨, 배지, 아이템 컬렉션을 관리하는 로직입니다.
 *
 * 주요 기능:
 * 1. 스킨 컬렉션 관리
 * 2. 배지 컬렉션 관리
 * 3. 아이템 컬렉션 관리
 * 4. 컬렉션 해금 조건 확인
 *
 * @dependencies
 * - @/lib/health/gamification: BADGES
 */

import { BADGES, type Badge } from "@/lib/health/gamification";

export interface Skin {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  unlockCondition: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface CollectionItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * 스킨 정의
 */
export const SKINS: Skin[] = [
  {
    id: "default",
    name: "기본 스킨",
    description: "기본 캐릭터 스킨",
    unlockCondition: "기본 제공",
    rarity: "common",
  },
  {
    id: "level_5_skin",
    name: "레벨 5 스킨",
    description: "레벨 5 달성 시 해금",
    unlockCondition: "레벨 5 달성",
    rarity: "rare",
  },
  {
    id: "level_10_skin",
    name: "레벨 10 스킨",
    description: "레벨 10 달성 시 해금",
    unlockCondition: "레벨 10 달성",
    rarity: "epic",
  },
  {
    id: "level_20_skin",
    name: "레벨 20 스킨",
    description: "레벨 20 달성 시 해금",
    unlockCondition: "레벨 20 달성",
    rarity: "epic",
  },
  {
    id: "level_50_skin",
    name: "레벨 50 스킨",
    description: "레벨 50 달성 시 해금",
    unlockCondition: "레벨 50 달성",
    rarity: "legendary",
  },
  {
    id: "health_excellent_skin",
    name: "건강 우수 스킨",
    description: "건강 점수 90점 이상 달성 시 해금",
    unlockCondition: "건강 점수 90점 이상",
    rarity: "rare",
  },
  {
    id: "quest_master_skin",
    name: "퀘스트 마스터 스킨",
    description: "일일 퀘스트 30일 연속 완료 시 해금",
    unlockCondition: "일일 퀘스트 30일 연속 완료",
    rarity: "epic",
  },
];

/**
 * 스킨 ID로 스킨 찾기
 */
export function getSkinById(skinId: string): Skin | undefined {
  return SKINS.find((s) => s.id === skinId);
}

/**
 * 희귀도별 스킨 목록 가져오기
 */
export function getSkinsByRarity(rarity: Skin["rarity"]): Skin[] {
  return SKINS.filter((s) => s.rarity === rarity);
}

/**
 * 배지 목록 가져오기 (gamification에서 가져옴)
 */
export function getAllBadges(): Badge[] {
  return BADGES;
}

/**
 * 배지 ID로 배지 찾기
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find((b) => b.id === badgeId);
}

/**
 * 컬렉션 진행률 계산
 */
export function calculateCollectionProgress(
  unlockedItems: number,
  totalItems: number
): number {
  if (totalItems === 0) return 100;
  return Math.floor((unlockedItems / totalItems) * 100);
}

/**
 * 희귀도별 색상
 */
export function getRarityColor(rarity: Skin["rarity"]): string {
  const colors = {
    common: "text-gray-400 border-gray-400",
    rare: "text-blue-400 border-blue-400",
    epic: "text-purple-400 border-purple-400",
    legendary: "text-yellow-400 border-yellow-400",
  };
  return colors[rarity];
}

/**
 * 희귀도별 배경 색상
 */
export function getRarityBgColor(rarity: Skin["rarity"]): string {
  const colors = {
    common: "bg-gray-500/20",
    rare: "bg-blue-500/20",
    epic: "bg-purple-500/20",
    legendary: "bg-yellow-500/20",
  };
  return colors[rarity];
}

