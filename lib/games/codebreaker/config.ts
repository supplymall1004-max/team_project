/**
 * @file lib/games/codebreaker/config.ts
 * @description 코드 브레이커 게임 설정 상수
 * 
 * 게임의 기본 설정값, 레벨별 설정 등을 정의합니다.
 */

import type { LevelConfig, GameLevel } from '@/types/game/codebreaker';

/**
 * 레벨별 게임 설정
 */
export const LEVEL_CONFIGS: Record<GameLevel, LevelConfig> = {
  1: {
    level: 1,
    codeLength: 3,
    maxAttempts: 10,
    timeLimit: null, // 레벨 1은 시간 제한 없음
    hints: [], // 동적으로 생성됨
    useBaseballFeedback: true,
  },
  2: {
    level: 2,
    codeLength: 4,
    maxAttempts: 10,
    timeLimit: 180, // 3분
    hints: [], // 동적으로 생성됨
    useBaseballFeedback: true,
  },
  3: {
    level: 3,
    codeLength: 5,
    maxAttempts: 7,
    timeLimit: 240, // 4분
    hints: [], // 동적으로 생성됨
    useBaseballFeedback: true,
  },
};

/**
 * 인지 능력 분석 메시지
 */
export const COGNITIVE_FEEDBACK = {
  FAST_THINKING: '당신의 뇌 회전 속도는 "매우 빠름"입니다.',
  INTUITIVE: '당신은 "최소한의 정보"로 정답을 도출하는 직관력이 뛰어납니다.',
  LOGICAL: '당신은 논리적 추론 능력이 뛰어납니다.',
  PATIENT: '당신은 침착하게 문제를 해결하는 능력이 뛰어납니다.',
  STRATEGIC: '당신은 전략적 사고 능력이 뛰어납니다.',
};

/**
 * 전문가 피드백 메시지
 */
export const EXPERT_FEEDBACK = {
  MASTER: '당신은 복합적인 정보를 처리하는 "작업 기억력"과 "속도"가 최상위권입니다.',
  GOOD: '수리적 추론 능력은 안정적입니다. 처리 속도를 높이는 훈련을 권장합니다.',
  PRACTICE: '논리적 소거법을 연습해보세요. 힌트를 메모하며 푸는 것이 도움이 됩니다.',
};

