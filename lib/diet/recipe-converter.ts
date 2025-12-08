/**
 * @file recipe-converter.ts
 * @description 레시피 타입 변환 유틸리티
 * 
 * 주요 기능:
 * 1. RecipeDetail → RecipeDetailForDiet 변환
 */

import type { RecipeDetail } from "@/types/recipe";
import type { RecipeDetailForDiet, Ingredient, RecipeNutrition } from "@/types/recipe";

/**
 * RecipeDetail을 RecipeDetailForDiet로 변환
 */
export async function convertRecipeToRecipeDetailForDiet(
  recipe: RecipeDetail
): Promise<RecipeDetailForDiet> {
  // 재료 변환
  const ingredients: Ingredient[] = (recipe.ingredients || []).map((ing) => ({
    name: ing.ingredient_name || ing.name || "",
    amount: ing.amount || "",
    unit: ing.unit || "",
  }));

  // 영양 정보 변환
  const nutrition: RecipeNutrition = {
    calories: recipe.calories ?? 0,
    protein: recipe.protein ?? 0,
    carbs: recipe.carbohydrates ?? 0,
    fat: recipe.fat ?? 0,
    sodium: recipe.sodium ?? 0,
    fiber: 0, // DB에 fiber 정보가 없으면 0
  };

  // 단계 정보 변환
  const instructions = recipe.steps
    ? recipe.steps.map((step) => step.instruction || "").filter(Boolean)
    : undefined;

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || undefined,
    image: recipe.thumbnail_url || undefined,
    source: "database",
    ingredients,
    instructions,
    nutrition,
    mealType: undefined, // DB 레시피에는 mealType 정보가 없을 수 있음
    dishType: undefined,
  };
}

