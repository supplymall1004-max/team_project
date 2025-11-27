/**
 * @file food-image-search.ts
 * @description foodreaserch2.md 기반 한국 음식 검색어 변환 및 검색 플랜 생성 서비스
 *
 * 이 모듈은 foodreaserch2.md 문서의 3단계 검색 우선순위를 따릅니다:
 * 🥇 1순위: 로마자 표기 (고유명사) - "Bibimbap", "Jjigae", "Banchan"
 * 🥈 2순위: 영어 설명 (Descriptive) - "Kimchi Stew", "Spicy Beef Soup"
 * 🥉 3순위: 핵심 재료명 + 분류 - "Spinach side dish", "Radish kimchi"
 *
 * 검색 로직: 1순위에서 결과가 있으면 즉시 종료, 없으면 2순위, 그래도 없으면 3순위
 *
 * @see {@link docs/foodreaserch2.md} - 한국 음식 검색 가이드
 */

import {
  getKoreanFoodSearchQueries,
  getSearchPriority,
} from './korean-food-search';

/**
 * 검색 플랜 타입
 */
export type SearchPlan = {
  query: string;
  priority: number; // 1, 2, 3 (우선순위)
};

/**
 * 음식 이미지 검색 결과 타입
 * (실제 이미지 소스는 나중에 추가될 수 있음)
 */
export interface FoodImageResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  source?: string;
  tags?: string[];
  qualityScore?: number;
}

/**
 * foodreaserch2.md의 3단계 검색 우선순위를 따르는 검색 플랜을 생성합니다.
 * 
 * 검색 우선순위 (foodreaserch2.md 기준):
 * 🥇 1순위: 로마자 표기 (고유명사) - "Bibimbap", "Jjigae", "Banchan"
 * 🥈 2순위: 영어 설명 (Descriptive) - "Kimchi Stew", "Spicy Beef Soup"
 * 🥉 3순위: 핵심 재료명 + 분류 - "Spinach side dish", "Radish kimchi"
 * 
 * 검색 로직: 1순위에서 결과가 있으면 즉시 종료, 없으면 2순위, 그래도 없으면 3순위
 */
export function buildFoodSearchPlans(foodName: string): SearchPlan[] {
  const trimmedName = foodName.trim();
  const plans: SearchPlan[] = [];
  const seenQueries = new Set<string>();

  // foodreaserch2.md 기반 검색어 생성
  const { priority1, priority2, priority3 } = getKoreanFoodSearchQueries(trimmedName);

  // 🥇 1순위: 로마자 표기 (고유명사)
  if (priority1 && priority1 !== trimmedName && !seenQueries.has(priority1.toLowerCase())) {
    plans.push({
      query: priority1,
      priority: 1,
    });
    seenQueries.add(priority1.toLowerCase());
  }

  // 🥈 2순위: 영어 설명 (Descriptive)
  if (priority2 && priority2 !== priority1 && !seenQueries.has(priority2.toLowerCase())) {
    plans.push({
      query: priority2,
      priority: 2,
    });
    seenQueries.add(priority2.toLowerCase());
  }

  // 🥉 3순위: 핵심 재료명 + 분류
  if (priority3 && priority3 !== priority2 && priority3 !== priority1 && !seenQueries.has(priority3.toLowerCase())) {
    plans.push({
      query: priority3,
      priority: 3,
    });
    seenQueries.add(priority3.toLowerCase());
  }

  // 보조: "Korean food" + 로마자 표기 조합 (2순위로 추가)
  if (priority1 && priority1 !== trimmedName) {
    const koreanFoodQuery = `Korean food ${priority1}`;
    if (!seenQueries.has(koreanFoodQuery.toLowerCase())) {
      plans.push({
        query: koreanFoodQuery,
        priority: 2,
      });
      seenQueries.add(koreanFoodQuery.toLowerCase());
    }
  }

  // 최종 폴백: 원본 이름 (한국어인 경우)
  const hasHangul = /[가-힣]/.test(trimmedName);
  if (hasHangul && trimmedName.length > 1 && !seenQueries.has(trimmedName.toLowerCase())) {
    plans.push({
      query: trimmedName,
      priority: 4,
    });
    seenQueries.add(trimmedName.toLowerCase());
  }

  // 최종 폴백: 기본 키워드
  if (plans.length === 0) {
    plans.push({
      query: 'Korean food',
      priority: 4,
    });
  }

  return plans;
}

/**
 * 일반적인 카테고리명인지 확인합니다.
 * 카테고리명은 실제 음식명이 아니므로 검색에서 제외하거나 특별 처리합니다.
 */
export function isGenericCategoryName(foodName: string): boolean {
  const genericCategories = [
    '반찬', '국', '찌개', '탕', '밥', '면', '나물', '무침', 
    '볶음', '구이', '찜', '전', '튀김', '조림', '김치',
    'side dish', 'soup', 'stew', 'rice', 'noodle'
  ];
  
  const trimmedName = foodName.trim().toLowerCase();
  return genericCategories.some(category => 
    trimmedName === category.toLowerCase() || 
    trimmedName === category
  );
}

/**
 * 특정 음식명에 대한 검색 플랜을 반환합니다.
 * foodreaserch2.md의 3단계 검색 우선순위를 따릅니다.
 *
 * @param foodName 음식 이름 (예: "순두부찌개", "김치찌개", "불고기")
 * @returns 검색 플랜 배열 (우선순위 순)
 */
export function getFoodSearchPlans(foodName: string): SearchPlan[] {
  // 일반적인 카테고리명은 검색하지 않음
  if (isGenericCategoryName(foodName)) {
    console.log(`🍽️ "${foodName}"는 일반 카테고리명이므로 검색을 건너뜁니다.`);
    return [];
  }
  
  return buildFoodSearchPlans(foodName);
}

/**
 * 여러 음식명에 대한 검색 플랜을 반환합니다.
 *
 * @param foodNames 음식 이름 배열
 * @returns 음식명별 검색 플랜 맵
 */
export function getMultipleFoodSearchPlans(
  foodNames: string[]
): Record<string, SearchPlan[]> {
  const results: Record<string, SearchPlan[]> = {};

  for (const foodName of foodNames) {
    results[foodName] = getFoodSearchPlans(foodName);
  }

  return results;
}

/**
 * 검색 플랜을 우선순위 순으로 정렬합니다.
 *
 * @param plans 검색 플랜 배열
 * @returns 정렬된 검색 플랜 배열
 */
export function sortSearchPlansByPriority(plans: SearchPlan[]): SearchPlan[] {
  return [...plans].sort((a, b) => a.priority - b.priority);
}

/**
 * 검색 플랜의 우선순위를 설명하는 텍스트를 반환합니다.
 *
 * @param priority 우선순위 (1, 2, 3, 4)
 * @returns 우선순위 설명
 */
export function getPriorityDescription(priority: number): string {
  const descriptions: Record<number, string> = {
    1: '로마자 표기 (고유명사)',
    2: '영어 설명 (Descriptive)',
    3: '재료명 + 분류',
    4: '기타',
  };

  return descriptions[priority] || '알 수 없음';
}
