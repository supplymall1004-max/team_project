/**
 * @file lib/modern-recipes/recipe-parser.ts
 * @description 현대 레시피 마크다운 파서
 *
 * 주요 기능:
 * 1. 마크다운 파일에서 JSON 블록 추출
 * 2. 레시피 ID 생성
 * 3. ModernRecipe 타입으로 변환
 */

import { ModernRecipe, ModernRecipeJson } from "@/types/modern-recipe";

/**
 * 마크다운 파일에서 JSON 블록 추출
 */
export function extractJsonFromMarkdown(content: string): ModernRecipeJson[] {
  const recipes: ModernRecipeJson[] = [];
  
  // ```json ... ``` 블록 찾기
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const jsonText = match[1];
      const recipe = JSON.parse(jsonText) as ModernRecipeJson;
      recipes.push(recipe);
    } catch (error) {
      console.warn("[ModernRecipeParser] JSON 파싱 실패:", error);
      // 계속 진행
    }
  }
  
  return recipes;
}

/**
 * 제목에서 ID 생성
 */
function generateId(title: string, index: number): string {
  // 한글 제목을 그대로 사용하되, 공백을 하이픈으로 변경
  const baseId = title.replace(/\s+/g, "-").toLowerCase();
  return `modern-${index + 1}-${baseId}`;
}

/**
 * 마크다운 파일 전체를 파싱하여 ModernRecipe 배열 반환
 */
export function parseModernRecipesMarkdown(content: string): ModernRecipe[] {
  const jsonRecipes = extractJsonFromMarkdown(content);
  
  return jsonRecipes.map((recipe, index) => ({
    id: generateId(recipe.title, index),
    title: recipe.title,
    description: recipe.description,
    source: recipe.source,
    dishType: recipe.dishType,
    mealType: recipe.mealType,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    imageUrl: recipe.imageUrl,
    emoji: recipe.emoji,
  }));
}

