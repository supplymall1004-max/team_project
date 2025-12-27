/**
 * @file types/game/fridge-guardian.ts
 * @description 냉장고 파수꾼 게임 타입 정의
 * 
 * 게임 아이템, 상태, 점수, 통계 등의 타입을 정의합니다.
 */

/**
 * 게임 아이템 타입
 */
export type GameItemType = 
  | 'NORMAL'      // 일반 세균
  | 'BOSS'        // 대장균 (보스)
  | 'MOLD'        // 곰팡이
  | 'VIRUS'       // 바이러스 (고득점)
  | 'PARASITE'    // 기생충 (중간 난이도)
  | 'SPOILED'     // 상한 식품 (위험)
  | 'ALLERGY'     // 알레르기 유발물 (위험)
  | 'FRESH'       // 신선식품 (클릭 금지)
  | 'POWER_UP'    // 파워업 (생명력 회복)
  | 'TIME_BONUS'  // 시간 보너스 (시간 추가)
  | 'SCORE_MULTI' // 점수 배율 (일시적)
  | 'SLOW_TIME';  // 시간 감속 (일시적)

/**
 * 게임 상태
 */
export type GameState = 
  | 'READY'       // 시작 전
  | 'PLAYING'     // 게임 중
  | 'PAUSED'      // 일시정지
  | 'OVER';       // 게임 종료

/**
 * 게임 아이템 인터페이스
 */
export interface GameItem {
  id: number;
  type: GameItemType;
  emoji: string;
  score: number;
  label: string;
  x: number;      // 화면 위치 (%)
  y: number;      // 화면 위치 (%)
  spawnTime: number; // 생성 시간 (ms)
}

/**
 * 게임 설정 인터페이스
 */
export interface GameConfig {
  duration: number;           // 게임 시간 (초)
  spawnInterval: number;      // 아이템 생성 간격 (ms)
  maxLives: number;           // 최대 생명력
  itemLifetime: number;       // 아이템 자동 소멸 시간 (ms)
  comboBonusThreshold: number; // 콤보 보너스 기준
  comboBonusAmount: number;   // 콤보 보너스 점수
}

/**
 * 게임 통계 인터페이스
 */
export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  itemsCaught: number;
  itemsMissed: number;
  correctClicks: number;
  wrongClicks: number;
  bossDefeated: number;
  moldDefeated: number;
  normalDefeated: number;
  virusDefeated: number;
  parasiteDefeated: number;
  powerUpsCollected: number;
  timeBonusesCollected: number;
  level: number;
  maxLevel: number;
}

/**
 * 게임 결과 인터페이스
 */
export interface GameResult {
  score: number;
  stats: GameStats;
  playedAt: string;
  duration: number;
  isHighScore: boolean;
  rank?: number;
}

/**
 * 게임 점수 기록 (Supabase 저장용)
 */
export interface GameScoreRecord {
  id?: string;
  user_id: string;
  score: number;
  stats: GameStats;
  played_at: string;
  created_at?: string;
}

/**
 * 가족 프로필 알레르기 정보 (게임 연동용)
 */
export interface AllergyInfo {
  allergies: string[];
  familyMemberAllergies: Record<string, string[]>; // { familyMemberId: [allergies] }
}

/**
 * 게임 난이도 설정
 */
export type GameDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';

/**
 * 난이도별 설정
 */
export interface DifficultyConfig {
  spawnRate: number;        // 생성 속도 (ms)
  itemLifetime: number;     // 아이템 생존 시간 (ms)
  bossSpawnRate: number;    // 보스 등장 확률
  virusSpawnRate: number;   // 바이러스 등장 확률
  parasiteSpawnRate: number; // 기생충 등장 확률
  allergySpawnRate: number; // 알레르기 아이템 등장 확률
  freshSpawnRate: number;   // 신선식품 등장 확률
  spoiledSpawnRate: number; // 상한 식품 등장 확률
  powerUpSpawnRate: number; // 파워업 등장 확률
  timeBonusSpawnRate: number; // 시간 보너스 등장 확률
  scoreMultiSpawnRate: number; // 점수 배율 등장 확률
  slowTimeSpawnRate: number; // 시간 감속 등장 확률
  levelUpThreshold: number; // 레벨업 점수 기준
}

