/**
 * @file lib/recipes/recipe-fetcher/normalizer.ts
 * @description 레시피 데이터 정규화 - 파싱된 데이터를 표준 형식으로 변환
 *
 * 주요 기능:
 * 1. 재료명 표준화 (예: "닭고기" → "닭고기")
 * 2. 단위 표준화 (예: "큰술" → "Tbsp")
 * 3. 영양소 데이터 정규화
 * 4. StandardizedRecipe 형식으로 변환
 */

import type { StandardizedRecipe } from "./index";

/**
 * 파싱된 레시피를 표준 형식으로 정규화
 * 
 * @param parsed 파싱된 레시피 (부분)
 * @returns 정규화된 레시피
 */
export async function normalizeRecipe(
  parsed: Partial<StandardizedRecipe>
): Promise<StandardizedRecipe> {
  console.group(`🔧 레시피 정규화: ${parsed.title}`);

  try {
    const normalized: StandardizedRecipe = {
      title: normalizeTitle(parsed.title || ""),
      description: parsed.description || "",
      main_ingredients: normalizeIngredients(parsed.main_ingredients || []),
      category: parsed.category || "side",
      cooking_method: parsed.cooking_method || null,
      nutrition: normalizeNutrition(parsed.nutrition || {
        calories: null,
        protein: null,
        carbohydrates: null,
        fat: null,
        sodium: null,
      }),
      steps: normalizeSteps(parsed.steps || []),
      ingredients: normalizeIngredientList(parsed.ingredients || []),
      source: parsed.source || "unknown",
      source_url: parsed.source_url,
    };

    console.log("✅ 정규화 완료");
    console.groupEnd();

    return normalized;
  } catch (error) {
    console.error("❌ 레시피 정규화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 제목 정규화
 */
function normalizeTitle(title: string): string {
  // HTML 태그 제거
  let normalized = title.replace(/<[^>]*>/g, "");
  
  // 공백 정리
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  // 특수 문자 정리
  normalized = normalized.replace(/[^\w\s가-힣]/g, "");
  
  return normalized;
}

/**
 * 재료명 목록 정규화
 */
function normalizeIngredients(ingredients: string[]): string[] {
  const normalized: string[] = [];

  // 재료명 표준화 매핑
  const ingredientMap: Record<string, string> = {
    "닭": "닭고기",
    "돼지": "돼지고기",
    "소": "소고기",
    "양": "양고기",
    "계란": "계란",
    "달걀": "계란",
  };

  for (const ingredient of ingredients) {
    const normalizedName = ingredientMap[ingredient] || ingredient;
    if (!normalized.includes(normalizedName)) {
      normalized.push(normalizedName);
    }
  }

  return normalized;
}

/**
 * 재료 목록 정규화
 */
function normalizeIngredientList(
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>
): Array<{ name: string; quantity: number | null; unit: string | null }> {
  // 단위 표준화 매핑
  const unitMap: Record<string, string> = {
    "큰술": "Tbsp",
    "작은술": "tsp",
    "컵": "cup",
    "줌": "handful",
    "개": "ea",
    "g": "g",
    "kg": "kg",
    "ml": "ml",
    "l": "l",
  };

  return ingredients.map(ing => ({
    name: normalizeIngredientName(ing.name),
    quantity: ing.quantity,
    unit: ing.unit ? (unitMap[ing.unit] || ing.unit) : null,
  }));
}

/**
 * 재료명 정규화
 */
function normalizeIngredientName(name: string): string {
  // 공백 제거
  const normalized = name.trim();
  
  // 일반적인 재료명 정규화
  const nameMap: Record<string, string> = {
    "닭": "닭고기",
    "돼지": "돼지고기",
    "소": "소고기",
  };

  return nameMap[normalized] || normalized;
}

/**
 * 영양소 데이터 정규화
 */
function normalizeNutrition(nutrition: {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  sodium: number | null;
  fiber?: number | null;
}): StandardizedRecipe['nutrition'] {
  return {
    calories: normalizeNumber(nutrition.calories),
    protein: normalizeNumber(nutrition.protein),
    carbohydrates: normalizeNumber(nutrition.carbohydrates),
    fat: normalizeNumber(nutrition.fat),
    sodium: normalizeNumber(nutrition.sodium),
    fiber: normalizeNumber(nutrition.fiber),
  };
}

/**
 * 숫자 정규화 (null 체크 및 범위 검증)
 */
function normalizeNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  // 음수는 null로 처리
  if (value < 0) {
    return null;
  }

  // 비현실적인 값 필터링 (예: 칼로리 10000 이상)
  if (value > 10000) {
    return null;
  }

  return Math.round(value * 100) / 100; // 소수점 2자리
}

/**
 * 조리 단계 정규화
 */
function normalizeSteps(
  steps: Array<{ step_number: number; content: string; image_url?: string | null }>
): Array<{ step_number: number; content: string; image_url?: string | null }> {
  return steps.map(step => ({
    step_number: step.step_number,
    content: normalizeStepContent(step.content),
    image_url: step.image_url || null,
  }));
}

/**
 * 조리 단계 내용 정규화
 */
function normalizeStepContent(content: string): string {
  // HTML 태그 제거
  let normalized = content.replace(/<[^>]*>/g, "");
  
  // 공백 정리
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  // 최소 길이 체크
  if (normalized.length < 5) {
    return "";
  }

  return normalized;
}

