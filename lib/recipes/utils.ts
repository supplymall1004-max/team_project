/**
 * @file utils.ts
 * @description 레시피 관련 유틸리티 함수들.
 *
 * 주요 기능:
 * 1. 조리 시간 포맷팅 (분 → "1시간 30분" 형식)
 * 2. 난이도 표시 변환 (숫자 → 텍스트)
 * 3. 별점 표시 포맷팅
 */

import { CookingTimeFormat } from "@/types/recipe";

/**
 * 분 단위 시간을 "1시간 30분" 형식으로 변환
 */
export function formatCookingTime(minutes: number): string {
  console.groupCollapsed("[RecipeUtils] 조리 시간 포맷팅");
  console.log("input minutes", minutes);

  if (minutes < 60) {
    console.log("result", `${minutes}분`);
    console.groupEnd();
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    console.log("result", `${hours}시간`);
    console.groupEnd();
    return `${hours}시간`;
  }

  const result = `${hours}시간 ${remainingMinutes}분`;
  console.log("result", result);
  console.groupEnd();
  return result;
}

/**
 * 분 단위 시간을 시간/분 객체로 분해
 */
export function parseCookingTime(minutes: number): CookingTimeFormat {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return { hours, minutes: remainingMinutes };
}

/**
 * 난이도 숫자(1~5)를 텍스트로 변환
 */
export function formatDifficulty(difficulty: number): string {
  const difficultyMap: Record<number, string> = {
    1: "매우 쉬움",
    2: "쉬움",
    3: "보통",
    4: "어려움",
    5: "매우 어려움",
  };

  return difficultyMap[difficulty] || "알 수 없음";
}

/**
 * 난이도 숫자(1~5)를 별 아이콘으로 표시할 수 있는 배열로 변환
 */
export function getDifficultyStars(difficulty: number): boolean[] {
  return Array.from({ length: 5 }, (_, i) => i < difficulty);
}

/**
 * 별점을 소수점 첫째 자리까지 포맷팅
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * 별점을 별 아이콘으로 표시할 수 있는 배열로 변환 (1점 단위)
 * 평균 별점의 경우 반올림하여 표시
 */
export function getRatingStars(rating: number): Array<"full" | "empty"> {
  const stars: Array<"full" | "empty"> = [];
  const roundedRating = Math.round(rating);

  for (let i = 0; i < 5; i++) {
    if (i < roundedRating) {
      stars.push("full");
    } else {
      stars.push("empty");
    }
  }

  return stars;
}

