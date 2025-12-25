/**
 * @file types/admin/character.ts
 * @description 관리자 캐릭터 관리 타입 정의
 */

/**
 * 캐릭터 통계 데이터
 */
export interface AdminCharacterStats {
  totalCharacters: number;
  averageHealthScore: number;
  averageLevel: number;
  activeQuests: number;
  healthScoreDistribution: {
    range: string; // "0-20", "21-40", "41-60", "61-80", "81-100"
    count: number;
  }[];
  levelDistribution: {
    level: number;
    count: number;
  }[];
  dailyActivity: {
    date: string;
    questsCompleted: number;
    levelUps: number;
  }[];
  weeklyActivity: {
    week: string;
    questsCompleted: number;
    levelUps: number;
  }[];
  monthlyActivity: {
    month: string;
    questsCompleted: number;
    levelUps: number;
  }[];
}

/**
 * 관리자용 캐릭터 정보
 */
export interface AdminCharacter {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  familyMemberId: string | null;
  name: string;
  relationship?: string;
  avatarType: "photo" | "icon" | null;
  photoUrl: string | null;
  healthScore: number | null;
  healthScoreUpdatedAt: string | null;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  lastLevelUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 게임화 데이터
 */
export interface AdminGameData {
  characterId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperience: number;
  lastLevelUpAt: string | null;
  quests: {
    id: string;
    questId: string;
    type: "daily" | "weekly" | "special";
    title: string;
    progress: number;
    target: number;
    completed: boolean;
    completedAt: string | null;
    questDate: string;
  }[];
  skins: {
    id: string;
    skinId: string;
    name: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    unlocked: boolean;
    unlockedAt: string | null;
    isActive: boolean;
  }[];
}

/**
 * 건강 점수 이력
 */
export interface AdminHealthScoreHistory {
  characterId: string;
  history: {
    date: string;
    healthScore: number;
    reason?: string; // 점수 변경 사유
  }[];
}

/**
 * 캐릭터 관리 필터 옵션
 */
export interface AdminCharacterFilters {
  search?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
  levelMin?: number;
  levelMax?: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

