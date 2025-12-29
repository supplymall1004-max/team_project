/**
 * @file types/game/codebreaker.ts
 * @description 코드 브레이커 게임 타입 정의
 * 
 * 비밀번호 탈출 작전 게임의 타입을 정의합니다.
 */

/**
 * 게임 상태
 */
export type GameState = 
  | 'READY'       // 시작 전
  | 'PLAYING'     // 게임 중
  | 'PAUSED'      // 일시정지
  | 'SUCCESS'     // 성공
  | 'FAILED';     // 실패

/**
 * 게임 레벨
 */
export type GameLevel = 1 | 2 | 3;

/**
 * 힌트 타입
 */
export type HintType = 
  | 'SUM'           // 합계 힌트
  | 'ODD_EVEN'      // 홀짝 힌트
  | 'COMPARISON'    // 비교 힌트
  | 'POSITION'      // 위치 힌트
  | 'MULTIPLE'      // 배수 힌트
  | 'PRIME'         // 소수 힌트
  | 'RELATION';     // 관계 힌트

/**
 * 힌트 인터페이스
 */
export interface Hint {
  id: number;
  type: HintType;
  text: string;
  revealed: boolean;
}

/**
 * 숫자 야구 피드백
 */
export interface BaseballFeedback {
  strikes: number;  // 스트라이크 (숫자와 위치 모두 맞음)
  balls: number;    // 볼 (숫자는 맞지만 위치가 틀림)
}

/**
 * 게임 레벨 설정
 */
export interface LevelConfig {
  level: GameLevel;
  codeLength: number;        // 비밀번호 자릿수
  maxAttempts: number;      // 최대 시도 횟수
  timeLimit?: number;       // 제한 시간 (초, 선택사항)
  hints: Hint[];            // 힌트 목록
  useBaseballFeedback: boolean; // 숫자 야구 피드백 사용 여부
}

/**
 * 게임 통계
 */
export interface GameStats {
  level: GameLevel;
  attempts: number;
  timeSpent: number;        // 소요 시간 (초)
  hintsUsed: number;        // 사용한 힌트 수
  score: number;            // 점수
  isSuccess: boolean;
}

/**
 * 게임 결과
 */
export interface GameResult {
  level: GameLevel;
  stats: GameStats;
  secretCode: string;
  playedAt: string;
  isHighScore?: boolean;
  rank?: number;
}

/**
 * 게임 점수 기록 (Supabase 저장용)
 */
export interface GameScoreRecord {
  id?: string;
  user_id: string;
  level: GameLevel;
  score: number;
  attempts: number;
  time_spent: number;
  is_success: boolean;
  played_at: string;
  created_at?: string;
}

/**
 * 등급 시스템
 */
export type Grade = 
  | 'BRONZE'      // 브론즈
  | 'SILVER'      // 실버
  | 'GOLD'        // 골드
  | 'PLATINUM'    // 플래티넘
  | 'DIAMOND'     // 다이아몬드
  | 'EINSTEIN';   // 아인슈타인

