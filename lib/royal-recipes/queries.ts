/**
 * @file lib/royal-recipes/queries.ts
 * @description 궁중 레시피 데이터 조회 함수
 */

import { parseRoyalRecipes, parseAllRoyalRecipes, RecipeEra, RoyalRecipe } from "./parser";
import { unstable_cache } from "next/cache";

// 타입 re-export
export type { RecipeEra, RoyalRecipe };

/**
 * 시대별 레시피 목록 조회 (캐싱)
 */
export const getRoyalRecipesByEra = unstable_cache(
  async (era: RecipeEra): Promise<RoyalRecipe[]> => {
    try {
      const recipes = parseRoyalRecipes(era);
      console.log(`[getRoyalRecipesByEra] ${era} 시대 레시피 ${recipes.length}개 반환`);
      return recipes;
    } catch (error) {
      console.error(`[getRoyalRecipesByEra] ${era} 시대 레시피 조회 실패:`, error);
      throw error;
    }
  },
  ["royal-recipes-by-era"],
  {
    revalidate: 3600, // 1시간
    tags: ["royal-recipes"],
  }
);

/**
 * 특정 레시피 조회 (캐싱)
 */
export const getRoyalRecipe = unstable_cache(
  async (era: RecipeEra, slug: string): Promise<RoyalRecipe | null> => {
    const recipes = await getRoyalRecipesByEra(era);
    return recipes.find((r) => r.id === slug) || null;
  },
  ["royal-recipe"],
  {
    revalidate: 3600,
    tags: ["royal-recipes"],
  }
);

/**
 * 모든 시대의 레시피 조회
 */
export async function getAllRoyalRecipes(): Promise<Record<RecipeEra, RoyalRecipe[]>> {
  return parseAllRoyalRecipes();
}

/**
 * 시대 이름을 한글로 변환
 */
export function getEraName(era: RecipeEra): string {
  const names: Record<RecipeEra, string> = {
    sanguk: "삼국시대",
    goryeo: "고려시대",
    joseon: "조선시대",
  };
  return names[era];
}

