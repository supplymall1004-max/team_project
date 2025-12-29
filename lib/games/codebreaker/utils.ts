/**
 * @file lib/games/codebreaker/utils.ts
 * @description 코드 브레이커 게임 유틸리티 함수
 * 
 * 게임 로직에 필요한 헬퍼 함수들을 제공합니다.
 */

import type { Hint, HintType, BaseballFeedback, GameLevel } from '@/types/game/codebreaker';

/**
 * 소수 판별 함수
 */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * 숫자 배열에서 합계 계산
 */
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

/**
 * 숫자 배열에서 짝수 개수 계산
 */
export function countEvens(numbers: number[]): number {
  return numbers.filter(n => n % 2 === 0).length;
}

/**
 * 숫자 야구 피드백 계산
 * @param secret 정답 코드 (문자열)
 * @param guess 사용자가 입력한 코드 (문자열)
 */
export function calculateBaseballFeedback(secret: string, guess: string): BaseballFeedback {
  let strikes = 0;
  let balls = 0;
  
  const secretArray = secret.split('');
  const guessArray = guess.split('');
  
  // 스트라이크 계산 (위치와 숫자 모두 맞음)
  for (let i = 0; i < secretArray.length; i++) {
    if (secretArray[i] === guessArray[i]) {
      strikes++;
    }
  }
  
  // 볼 계산 (숫자는 있지만 위치가 틀림)
  const secretCounts: Record<string, number> = {};
  const guessCounts: Record<string, number> = {};
  
  for (let i = 0; i < secretArray.length; i++) {
    if (secretArray[i] !== guessArray[i]) {
      secretCounts[secretArray[i]] = (secretCounts[secretArray[i]] || 0) + 1;
      guessCounts[guessArray[i]] = (guessCounts[guessArray[i]] || 0) + 1;
    }
  }
  
  for (const digit in guessCounts) {
    if (secretCounts[digit]) {
      balls += Math.min(guessCounts[digit], secretCounts[digit]);
    }
  }
  
  return { strikes, balls };
}

/**
 * 힌트 생성 함수
 * @param secretCode 정답 코드 (숫자 배열)
 * @param level 게임 레벨
 */
export function generateHints(secretCode: number[], level: GameLevel): Hint[] {
  const hints: Hint[] = [];
  const codeLength = secretCode.length;
  let hintId = 1;
  
  // 레벨 1: 힌트 없음 (숫자 야구 피드백만 사용)
  if (level === 1) {
    return [];
  }
  
  // 힌트 1: 합계 힌트
  const sum = calculateSum(secretCode);
  hints.push({
    id: hintId++,
    type: 'SUM',
    text: `모든 숫자의 합은 ${sum}입니다.`,
    revealed: true,
  });
  
  // 힌트 2: 홀짝 힌트
  const evens = countEvens(secretCode);
  hints.push({
    id: hintId++,
    type: 'ODD_EVEN',
    text: `짝수의 개수는 ${evens}개입니다.`,
    revealed: true,
  });
  
  // 레벨 2 이상: 비교 힌트
  if (level >= 2 && codeLength >= 2) {
    if (secretCode[0] > secretCode[codeLength - 1]) {
      hints.push({
        id: hintId++,
        type: 'COMPARISON',
        text: '첫 번째 숫자가 마지막 숫자보다 큽니다.',
        revealed: true,
      });
    } else {
      hints.push({
        id: hintId++,
        type: 'COMPARISON',
        text: '마지막 숫자가 첫 번째 숫자보다 크거나 같습니다.',
        revealed: true,
      });
    }
  }
  
  // 레벨 3: 위치 힌트 (하나만)
  if (level >= 3 && codeLength >= 3) {
    const randomIndex = Math.floor(Math.random() * codeLength);
    hints.push({
      id: hintId++,
      type: 'POSITION',
      text: `${randomIndex + 1}번째 숫자는 ${secretCode[randomIndex]}입니다.`,
      revealed: true,
    });
  }
  
  // 레벨 2 이상: 관계 힌트
  if (level >= 2 && codeLength >= 2) {
    const diff = secretCode[0] - secretCode[1];
    if (Math.abs(diff) <= 3) {
      hints.push({
        id: hintId++,
        type: 'RELATION',
        text: `첫 번째 숫자는 두 번째 숫자보다 ${Math.abs(diff)} ${diff > 0 ? '큽니다' : '작습니다'}.`,
        revealed: true,
      });
    }
  }
  
  // 레벨 3: 소수 힌트
  if (level >= 3) {
    const primes = secretCode.filter(isPrime);
    if (primes.length > 0) {
      hints.push({
        id: hintId++,
        type: 'PRIME',
        text: `소수(Prime Number)는 ${primes.length}개입니다.`,
        revealed: true,
      });
    }
  }
  
  return hints;
}

/**
 * 랜덤 비밀번호 생성
 * @param length 비밀번호 길이
 * @param allowDuplicates 중복 허용 여부
 */
export function generateSecretCode(length: number, allowDuplicates: boolean = false): number[] {
  if (allowDuplicates) {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  } else {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, length);
  }
}

/**
 * 점수 계산
 * @param level 게임 레벨
 * @param attempts 시도 횟수
 * @param timeSpent 소요 시간 (초)
 * @param maxAttempts 최대 시도 횟수
 * @param timeLimit 제한 시간 (초, 선택사항)
 */
export function calculateScore(
  level: GameLevel,
  attempts: number,
  timeSpent: number,
  maxAttempts: number,
  timeLimit?: number
): number {
  // 기본 점수 (레벨별)
  const baseScore = level * 100;
  
  // 시도 횟수 보너스 (적을수록 높은 점수)
  const attemptBonus = Math.max(0, (maxAttempts - attempts + 1) * 20);
  
  // 시간 보너스 (빠를수록 높은 점수)
  let timeBonus = 0;
  if (timeLimit) {
    const remainingTime = Math.max(0, timeLimit - timeSpent);
    timeBonus = Math.floor(remainingTime * 2);
  } else {
    // 시간 제한이 없으면 소요 시간이 적을수록 높은 점수
    timeBonus = Math.max(0, 100 - timeSpent);
  }
  
  return baseScore + attemptBonus + timeBonus;
}

/**
 * 등급 계산
 * @param totalScore 총 점수
 */
export function getGrade(totalScore: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'EINSTEIN' {
  if (totalScore >= 400) return 'EINSTEIN';
  if (totalScore >= 300) return 'DIAMOND';
  if (totalScore >= 200) return 'PLATINUM';
  if (totalScore >= 100) return 'GOLD';
  if (totalScore >= 50) return 'SILVER';
  return 'BRONZE';
}

/**
 * 등급 이름 (한글)
 */
export function getGradeName(grade: string): string {
  const gradeNames: Record<string, string> = {
    BRONZE: '브론즈',
    SILVER: '실버',
    GOLD: '골드',
    PLATINUM: '플래티넘',
    DIAMOND: '다이아몬드',
    EINSTEIN: '아인슈타인',
  };
  return gradeNames[grade] || '브론즈';
}

/**
 * 시간 포맷팅 (초 -> MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

