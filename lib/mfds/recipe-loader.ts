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
 * 특정 레시피 파일 경로 가져오기
 */
function getRecipeFilePath(rcpSeq: string): string {
  return path.join(RECIPES_DIR, `${rcpSeq}.md`);
}

/**
 * RCP_SEQ로 특정 레시피 로드
 */
export function loadRecipeBySeq(rcpSeq: string): MfdsRecipe | null {
  console.group(`[RecipeLoader] 레시피 로드 시작: ${rcpSeq}`);

  const filePath = getRecipeFilePath(rcpSeq);
  console.log("[RecipeLoader] 파일 경로:", filePath);

  try {
    if (!fs.existsSync(filePath)) {
      console.warn("[RecipeLoader] 파일이 존재하지 않습니다:", filePath);
      console.groupEnd();
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    console.log("[RecipeLoader] 파일 읽기 완료, 크기:", content.length);

    const recipe = parseRecipeMarkdown(content, rcpSeq);
    if (!recipe) {
      console.error("[RecipeLoader] 레시피 파싱 실패");
      console.groupEnd();
      return null;
    }

    console.log("[RecipeLoader] 레시피 로드 완료");
    console.groupEnd();
    return recipe;
  } catch (error) {
    console.error("[RecipeLoader] 레시피 로드 중 오류 발생:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * 전체 레시피 목록 로드
 */
export function loadAllRecipes(): MfdsRecipe[] {
  console.group("[RecipeLoader] 전체 레시피 로드 시작");

  const recipes: MfdsRecipe[] = [];

  try {
    if (!fs.existsSync(RECIPES_DIR)) {
      console.warn("[RecipeLoader] 레시피 디렉토리가 존재하지 않습니다:", RECIPES_DIR);
      console.groupEnd();
      return recipes;
    }

    const files = fs.readdirSync(RECIPES_DIR);
    console.log("[RecipeLoader] 발견된 파일 개수:", files.length);

    for (const file of files) {
      if (!file.endsWith(".md")) {
        continue;
      }

      const rcpSeq = file.replace(".md", "");
      const recipe = loadRecipeBySeq(rcpSeq);
      if (recipe) {
        recipes.push(recipe);
      }
    }

    console.log("[RecipeLoader] 전체 레시피 로드 완료, 개수:", recipes.length);
    console.groupEnd();
    return recipes;
  } catch (error) {
    console.error("[RecipeLoader] 전체 레시피 로드 중 오류 발생:", error);
    console.groupEnd();
    return recipes;
  }
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

