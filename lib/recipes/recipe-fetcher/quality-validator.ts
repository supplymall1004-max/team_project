/**
 * @file lib/recipes/recipe-fetcher/quality-validator.ts
 * @description 레시피 품질 검증 및 중복 제거
 *
 * 주요 기능:
 * 1. 레시피 품질 검증 (필수 필드, 영양소 정보 등)
 * 2. 중복 제거 (제목 유사도 + 재료 유사도)
 * 3. 품질 점수 계산
 */

import type { StandardizedRecipe } from "./index";

/**
 * 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 점수
  reasons: string[]; // 실패 이유 또는 경고
}

/**
 * 레시피 품질 검증
 * 
 * @param recipe 레시피
 * @returns 검증 결과
 */
export async function validateRecipe(
  recipe: StandardizedRecipe
): Promise<ValidationResult> {
  const reasons: string[] = [];
  let score = 100;

  // 1. 필수 필드 검증
  if (!recipe.title || recipe.title.trim().length < 2) {
    reasons.push("제목이 없거나 너무 짧습니다");
    score -= 50;
  }

  if (recipe.ingredients.length === 0) {
    reasons.push("재료 정보가 없습니다");
    score -= 30;
  }

  if (recipe.steps.length === 0) {
    reasons.push("조리 단계가 없습니다");
    score -= 20;
  }

  // 2. 영양소 정보 검증
  const hasNutrition = recipe.nutrition.calories !== null ||
    recipe.nutrition.protein !== null ||
    recipe.nutrition.carbohydrates !== null;

  if (!hasNutrition) {
    reasons.push("영양소 정보가 없습니다 (경고)");
    score -= 10; // 필수는 아니지만 점수 감점
  }

  // 3. 메인 재료 검증
  if (recipe.main_ingredients.length === 0) {
    reasons.push("메인 재료 정보가 없습니다 (경고)");
    score -= 5;
  }

  // 4. 조리법 검증
  if (!recipe.cooking_method) {
    reasons.push("조리법 정보가 없습니다 (경고)");
    score -= 5;
  }

  const isValid = score >= 50; // 50점 이상이면 유효

  return {
    isValid,
    score: Math.max(0, score),
    reasons,
  };
}

/**
 * 중복 레시피 제거
 * 
 * @param recipes 레시피 목록
 * @returns 중복 제거된 레시피 목록
 */
export async function removeDuplicates(
  recipes: StandardizedRecipe[]
): Promise<StandardizedRecipe[]> {
  console.group("🔍 중복 레시피 제거");
  console.log(`원본 레시피 수: ${recipes.length}`);

  const unique: StandardizedRecipe[] = [];
  const seen = new Set<string>();

  for (const recipe of recipes) {
    // 제목 기반 중복 체크
    const titleKey = normalizeTitleForComparison(recipe.title);
    
    if (seen.has(titleKey)) {
      console.log(`⚠️ 중복 레시피 제거: ${recipe.title}`);
      continue;
    }

    // 재료 유사도 체크 (선택적)
    const isSimilar = unique.some(existing => 
      calculateSimilarity(recipe, existing) > 0.8
    );

    if (isSimilar) {
      console.log(`⚠️ 유사 레시피 제거: ${recipe.title}`);
      continue;
    }

    seen.add(titleKey);
    unique.push(recipe);
  }

  console.log(`✅ 중복 제거 완료: ${unique.length}개 레시피`);
  console.groupEnd();

  return unique;
}

/**
 * 제목 정규화 (비교용)
 */
function normalizeTitleForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w가-힣]/g, "")
    .trim();
}

/**
 * 두 레시피 간 유사도 계산
 */
function calculateSimilarity(
  recipe1: StandardizedRecipe,
  recipe2: StandardizedRecipe
): number {
  let similarity = 0;

  // 1. 제목 유사도 (50%)
  const title1 = normalizeTitleForComparison(recipe1.title);
  const title2 = normalizeTitleForComparison(recipe2.title);
  const titleSimilarity = calculateStringSimilarity(title1, title2);
  similarity += titleSimilarity * 0.5;

  // 2. 재료 유사도 (30%)
  const ingredientSimilarity = calculateIngredientSimilarity(
    recipe1.main_ingredients,
    recipe2.main_ingredients
  );
  similarity += ingredientSimilarity * 0.3;

  // 3. 조리법 유사도 (20%)
  if (recipe1.cooking_method && recipe2.cooking_method) {
    const methodSimilarity = recipe1.cooking_method === recipe2.cooking_method ? 1 : 0;
    similarity += methodSimilarity * 0.2;
  }

  return similarity;
}

/**
 * 문자열 유사도 계산 (간단한 Jaccard 유사도)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const set1 = new Set(str1.split(""));
  const set2 = new Set(str2.split(""));

  let intersection = 0;
  for (const char of set1) {
    if (set2.has(char)) {
      intersection++;
    }
  }

  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * 재료 유사도 계산
 */
function calculateIngredientSimilarity(
  ingredients1: string[],
  ingredients2: string[]
): number {
  if (ingredients1.length === 0 && ingredients2.length === 0) return 1;
  if (ingredients1.length === 0 || ingredients2.length === 0) return 0;

  const set1 = new Set(ingredients1.map(i => i.toLowerCase()));
  const set2 = new Set(ingredients2.map(i => i.toLowerCase()));

  let intersection = 0;
  for (const ing of set1) {
    if (set2.has(ing)) {
      intersection++;
    }
  }

  const union = new Set([...ingredients1, ...ingredients2]).size;
  return union > 0 ? intersection / union : 0;
}

