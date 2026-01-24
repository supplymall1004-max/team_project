/**
 * @file lib/modern-recipes/recipe-loader.ts
 * @description 현대 레시피 파일 로더
 *
 * 주요 기능:
 * 1. 파일 시스템에서 레시피 마크다운 파일 읽기
 * 2. ID로 특정 레시피 로드
 * 3. 전체 레시피 목록 로드
 * 4. 레시피 검색 및 필터
 */

import fs from "fs";
import path from "path";
import { parseModernRecipesMarkdown } from "./recipe-parser";
import { ModernRecipe } from "@/types/modern-recipe";

const RECIPE_FILE_PATH = path.join(
  process.cwd(),
  "docs",
  "recipes",
  "modern recipe",
  "modern recipe.md"
);

/**
 * 메모리 캐시: 서버 시작 시 한 번만 로드하여 재사용
 */
let recipeCache: Map<string, ModernRecipe> | null = null;
let recipeListCache: ModernRecipe[] | null = null;
let cacheInitialized = false;

/**
 * 캐시 초기화
 */
function initializeCache(): void {
  if (cacheInitialized) {
    return;
  }

  console.log("[ModernRecipeLoader] 캐시 초기화 시작...");
  const startTime = Date.now();

  try {
    if (!fs.existsSync(RECIPE_FILE_PATH)) {
      console.warn("[ModernRecipeLoader] 레시피 파일을 찾을 수 없습니다:", RECIPE_FILE_PATH);
      recipeCache = new Map();
      recipeListCache = [];
      cacheInitialized = true;
      return;
    }

    const content = fs.readFileSync(RECIPE_FILE_PATH, "utf-8");
    const recipes = parseModernRecipesMarkdown(content);

    recipeCache = new Map();
    recipeListCache = recipes;

    recipes.forEach((recipe) => {
      recipeCache!.set(recipe.id, recipe);
    });

    const duration = Date.now() - startTime;
    console.log(
      `[ModernRecipeLoader] 캐시 초기화 완료: ${recipes.length}개 레시피 (${duration}ms)`
    );
    cacheInitialized = true;
  } catch (error) {
    console.error("[ModernRecipeLoader] 캐시 초기화 중 오류 발생:", error);
    recipeCache = new Map();
    recipeListCache = [];
    cacheInitialized = true;
  }
}

/**
 * ID로 특정 레시피 로드
 */
export function loadRecipeById(id: string): ModernRecipe | null {
  if (!cacheInitialized) {
    initializeCache();
  }

  return recipeCache?.get(id) ?? null;
}

/**
 * 전체 레시피 목록 로드
 */
export function loadAllRecipes(): ModernRecipe[] {
  if (!cacheInitialized) {
    initializeCache();
  }

  return recipeListCache ?? [];
}

/**
 * 레시피 검색
 */
export function searchRecipes(query: string): ModernRecipe[] {
  const allRecipes = loadAllRecipes();
  const lowerQuery = query.toLowerCase();

  return allRecipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * dishType으로 필터링
 */
export function filterByDishType(
  dishType: "side" | "soup" | "stew" | "rice" | "dessert" | "main"
): ModernRecipe[] {
  const allRecipes = loadAllRecipes();

  return allRecipes.filter((recipe) => recipe.dishType.includes(dishType));
}

/**
 * mealType으로 필터링
 */
export function filterByMealType(
  mealType: "breakfast" | "lunch" | "dinner"
): ModernRecipe[] {
  const allRecipes = loadAllRecipes();

  return allRecipes.filter((recipe) => recipe.mealType.includes(mealType));
}

