/**
 * @file types/modern-recipe.ts
 * @description 현대 레시피 타입 정의
 *
 * 주요 기능:
 * - 현대 레시피 데이터 구조 정의
 * - 영양 정보, 재료, 조리 방법 타입
 */

/**
 * 재료 타입
 */
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

/**
 * 영양 정보 타입
 */
export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  fiber: number;
  potassium?: number;
  phosphorus?: number;
}

/**
 * 현대 레시피 타입
 */
export interface ModernRecipe {
  id: string;
  title: string;
  description: string;
  source: string;
  dishType: ("side" | "soup" | "stew" | "rice" | "dessert" | "main")[];
  mealType: ("breakfast" | "lunch" | "dinner")[];
  ingredients: Ingredient[];
  instructions: string;
  nutrition: Nutrition;
  imageUrl?: string;
  emoji?: string;
}

/**
 * 마크다운 파일에서 파싱된 레시피 JSON 타입
 */
export interface ModernRecipeJson {
  title: string;
  description: string;
  source: string;
  dishType: ("side" | "soup" | "stew" | "rice" | "dessert" | "main")[];
  mealType: ("breakfast" | "lunch" | "dinner")[];
  ingredients: Ingredient[];
  instructions: string;
  nutrition: Nutrition;
  imageUrl?: string;
  emoji?: string;
}

