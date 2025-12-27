/**
 * @file types/game/fridge-defense.ts
 * @description 냉장고 디펜스 게임 타입 정의
 * 
 * 타워 디펜스 게임의 타입을 정의합니다.
 */

/**
 * 타워 타입
 */
export type TowerType = 'PROTEIN' | 'VITAMIN' | 'SUGAR';

/**
 * 적 타입
 */
export type EnemyType = 'NORMAL' | 'FAST' | 'TANK' | 'BOSS';

/**
 * 게임 상태
 */
export type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'OVER';

/**
 * 타워 데이터 인터페이스
 */
export interface TowerData {
  id: TowerType;
  name: string;
  emoji: string;
  cost: number;
  upgradeCost: number;
  range: number;
  damage: number;
  fireRate: number; // ms
  color: string;
}

/**
 * 적 데이터 인터페이스
 */
export interface EnemyData {
  name: string;
  emoji: string;
  hp: number;
  speed: number;
  gold: number;
}

/**
 * 타워 공격 타입
 */
export type AttackType = 'MELEE' | 'RANGE' | 'AOE'; // 근접, 원거리, 범위

/**
 * 타워 인스턴스
 */
export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  level: number;
  lastShot?: number;
  damage: number;
  range: number;
  fireRate: number;
  color: string;
  emoji: string;
  attackType: AttackType; // 공격 타입
  attackAnimation?: number; // 공격 애니메이션 시작 시간
  hp: number; // 타워 체력
  maxHp: number; // 타워 최대 체력
  lastAttacked?: number; // 마지막으로 공격받은 시간
}

/**
 * 경로 정의
 */
export interface GamePath {
  id: number;
  startY: number; // 시작 Y 위치
  endY: number; // 끝 Y 위치 (목표 지점)
  color: string; // 경로 색상 (시각화용)
}

/**
 * 적 인스턴스
 */
export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  gold: number;
  pathId: number; // 어떤 경로를 따라가는지
  pathIndex: number; // 경로 내 위치 인덱스
  emoji: string;
  attackDamage?: number; // 타워 공격 데미지
  attackRange?: number; // 타워 공격 범위
  lastAttack?: number; // 마지막 공격 시간
  targetTowerId?: string | null; // 공격 대상 타워 ID
}

/**
 * 투사체 인터페이스
 */
export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  damage: number;
  color: string;
}

/**
 * 데미지 숫자 인터페이스
 */
export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  val: number;
}

/**
 * 게임 통계 인터페이스
 */
export interface GameStats {
  wave: number;
  enemiesKilled: number;
  towersPlaced: number;
  goldEarned: number;
  damageDealt: number;
  playTime: number; // 초
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
  game_type?: string;
}

