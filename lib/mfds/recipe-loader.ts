/**
 * @file lib/mfds/recipe-loader.ts
 * @description 식약처 레시피 파일 로더
 *
 * 주요 기능:
 * 1. 파일 시스템에서 레시피 마크다운 파일 읽기
 * 2. RCP_SEQ로 특정 레시피 로드
 * 3. 전체 레시피 목록 로드
 * 4. 레시피 검색
 */

import fs from "fs";
import path from "path";
import { parseRecipeMarkdown } from "./recipe-parser";
import { MfdsRecipe } from "@/types/mfds-recipe";

const RECIPES_DIR = path.join(process.cwd(), "docs", "mfds-recipes", "recipes");

/**
 * 메모리 캐시: 서버 시작 시 한 번만 로드하여 재사용
 * Map<rcpSeq, MfdsRecipe> 형태로 저장하여 O(1) 조회 가능
 */
let recipeCache: Map<string, MfdsRecipe> | null = null;
let recipeListCache: MfdsRecipe[] | null = null;
let cacheInitialized = false;

/**
 * 특정 레시피 파일 경로 가져오기
 */
function getRecipeFilePath(rcpSeq: string): string {
  return path.join(RECIPES_DIR, `${rcpSeq}.md`);
}

/**
 * RCP_SEQ로 특정 레시피 로드 (캐시 우선 사용)
 */
export function loadRecipeBySeq(rcpSeq: string): MfdsRecipe | null {
  // 캐시가 초기화되지 않았으면 초기화
  if (!cacheInitialized) {
    initializeCache();
  }

  // 캐시에서 먼저 조회 (O(1))
  if (recipeCache && recipeCache.has(rcpSeq)) {
    return recipeCache.get(rcpSeq)!;
  }

  // 캐시에 없으면 파일에서 로드 (캐시 미스)
  console.groupCollapsed(`[RecipeLoader] 캐시 미스 - 레시피 로드: ${rcpSeq}`);
  const filePath = getRecipeFilePath(rcpSeq);

  try {
    if (!fs.existsSync(filePath)) {
      console.warn("[RecipeLoader] 파일이 존재하지 않습니다:", filePath);
      console.groupEnd();
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const recipe = parseRecipeMarkdown(content, rcpSeq);
    
    if (recipe && recipeCache) {
      // 캐시에 추가 (다음 조회 시 빠르게 접근 가능)
      recipeCache.set(rcpSeq, recipe);
      if (recipeListCache) {
        recipeListCache.push(recipe);
      }
    }

    console.log("[RecipeLoader] 레시피 로드 완료 (캐시에 추가됨)");
    console.groupEnd();
    return recipe;
  } catch (error) {
    console.error("[RecipeLoader] 레시피 로드 중 오류 발생:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * 캐시 초기화 (서버 시작 시 또는 첫 호출 시 한 번만 실행)
 */
function initializeCache(): void {
  if (cacheInitialized) {
    return;
  }

  console.group("[RecipeLoader] 캐시 초기화 시작");
  const startTime = Date.now();

  recipeCache = new Map<string, MfdsRecipe>();
  recipeListCache = [];

  try {
    if (!fs.existsSync(RECIPES_DIR)) {
      console.warn("[RecipeLoader] 레시피 디렉토리가 존재하지 않습니다:", RECIPES_DIR);
      cacheInitialized = true;
      console.groupEnd();
      return;
    }

    const files = fs.readdirSync(RECIPES_DIR);
    console.log("[RecipeLoader] 발견된 파일 개수:", files.length);

    for (const file of files) {
      if (!file.endsWith(".md")) {
        continue;
      }

      const rcpSeq = file.replace(".md", "");
      const filePath = getRecipeFilePath(rcpSeq);

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const recipe = parseRecipeMarkdown(content, rcpSeq);
        if (recipe) {
          recipeCache.set(rcpSeq, recipe);
          recipeListCache.push(recipe);
        }
      } catch (error) {
        // 개별 파일 로드 실패는 무시하고 계속 진행
        console.warn(`[RecipeLoader] 파일 로드 실패: ${rcpSeq}`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RecipeLoader] 캐시 초기화 완료: ${recipeCache.size}개 레시피 (${duration}ms)`);
    cacheInitialized = true;
    console.groupEnd();
  } catch (error) {
    console.error("[RecipeLoader] 캐시 초기화 중 오류 발생:", error);
    cacheInitialized = true; // 에러가 나도 재시도 방지
    console.groupEnd();
  }
}

/**
 * 전체 레시피 목록 로드 (캐시 사용)
 */
export function loadAllRecipes(): MfdsRecipe[] {
  if (!cacheInitialized) {
    initializeCache();
  }

  return recipeListCache || [];
}

/**
 * 캐시 무효화 (필요한 경우에만 사용)
 */
export function clearRecipeCache(): void {
  recipeCache = null;
  recipeListCache = null;
  cacheInitialized = false;
  console.log("[RecipeLoader] 캐시 무효화 완료");
}

/**
 * 레시피 검색
 */
export function searchRecipes(query: string): MfdsRecipe[] {
  console.group(`[RecipeLoader] 레시피 검색 시작: "${query}"`);

  const allRecipes = loadAllRecipes();
  const lowerQuery = query.toLowerCase();

  const results = allRecipes.filter((recipe) => {
    // 제목으로 검색
    if (recipe.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 설명으로 검색
    if (recipe.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 재료로 검색
    if (
      recipe.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(lowerQuery)
      )
    ) {
      return true;
    }

    return false;
  });

  console.log("[RecipeLoader] 검색 결과 개수:", results.length);
  console.groupEnd();
  return results;
}

/**
 * 카테고리별 레시피 필터링
 */
export function filterRecipesByCategory(
  category: string
): MfdsRecipe[] {
  console.group(`[RecipeLoader] 카테고리 필터링: "${category}"`);

  const allRecipes = loadAllRecipes();

  const results = allRecipes.filter((recipe) => {
    // 요리종류로 필터링
    if (recipe.frontmatter.rcp_pat2 === category) {
      return true;
    }

    // 조리방법으로 필터링
    if (recipe.frontmatter.rcp_way2 === category) {
      return true;
    }

    return false;
  });

  console.log("[RecipeLoader] 필터링 결과 개수:", results.length);
  console.groupEnd();
  return results;
}

/**
 * 제목으로 레시피 찾기 (최적화: 캐시 우선 사용)
 * 
 * 캐시가 초기화되어 있으면 캐시에서 빠르게 검색하고,
 * 캐시가 없으면 초기화 후 검색합니다.
 */
export function loadRecipeByTitle(title: string): MfdsRecipe | null {
  console.groupCollapsed(`[RecipeLoader] 제목으로 레시피 찾기: "${title}"`);

  try {
    // 캐시 초기화 (아직 안 되어 있으면)
    if (!cacheInitialized) {
      initializeCache();
    }

    const lowerTitle = title.toLowerCase().trim();

    // 캐시에서 정확한 매칭 검색 (O(n)이지만 메모리에서 빠름)
    if (recipeListCache) {
      // 정확한 매칭 먼저 시도
      const exactMatch = recipeListCache.find(
        (recipe) => recipe.title.toLowerCase().trim() === lowerTitle
      );

      if (exactMatch) {
        console.log(`[RecipeLoader] 제목 일치 레시피 찾음 (캐시): ${exactMatch.title} (${exactMatch.frontmatter.rcp_seq})`);
        console.groupEnd();
        return exactMatch;
      }

      // 부분 매칭 시도 (최대 10개까지만)
      const partialMatches = recipeListCache
        .filter((recipe) => recipe.title.toLowerCase().includes(lowerTitle))
        .slice(0, 10);

      if (partialMatches.length > 0) {
        // 가장 관련성 높은 레시피 선택 (제목 길이가 비슷한 것 우선)
        const bestMatch = partialMatches.reduce((best, current) => {
          const bestDiff = Math.abs(best.title.length - title.length);
          const currentDiff = Math.abs(current.title.length - title.length);
          return currentDiff < bestDiff ? current : best;
        });

        console.log(`[RecipeLoader] 부분 매칭 레시피 찾음 (캐시): ${bestMatch.title}`);
        console.groupEnd();
        return bestMatch;
      }
    }

    console.log(`[RecipeLoader] 레시피를 찾을 수 없음: "${title}"`);
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("[RecipeLoader] 제목으로 레시피 찾기 중 오류 발생:", error);
    console.groupEnd();
    return null;
  }
}

