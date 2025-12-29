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
    name: ing.ingredient_name || "",
    amount: ing.quantity?.toString() || "",
    unit: ing.unit || "",
  }));

  // 영양 정보 변환 (DB에 저장된 식약처 레시피 필드 사용)
  const nutrition: RecipeNutrition = {
    calories: recipe.foodsafety_info_eng ?? 0,
    protein: recipe.foodsafety_info_pro ?? 0,
    carbs: recipe.foodsafety_info_car ?? 0,
    fat: recipe.foodsafety_info_fat ?? 0,
    sodium: recipe.foodsafety_info_na ?? 0,
    fiber: recipe.foodsafety_info_fiber ?? 0,
  };

  // 단계 정보 변환
  const instructions = recipe.steps
    ? recipe.steps.map((step) => step.content || "").filter(Boolean)
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

