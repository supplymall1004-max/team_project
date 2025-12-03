/**
 * @file types/weekly-diet.ts
 * @description 주간 식단 관련 타입 정의
 */

import type {
  DailyDietPlan as LegacyDailyDietPlan,
  RecipeDetailForDiet,
} from "./recipe";
import type { DailyDietPlan as StoredDailyDietPlan } from "./health";

export type WeeklyDailyPlan = LegacyDailyDietPlan | StoredDailyDietPlan;
import type { FamilyMember, UserHealthProfile } from "./family";

/**
 * 주간 식단 메타데이터
 */
export interface WeeklyDietPlan {
  id: string;
  user_id: string;
  week_start_date: string; // 'YYYY-MM-DD' (월요일)
  week_year: number;
  week_number: number;
  is_family: boolean;
  total_recipes_count: number;
  generation_duration_ms?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 주간 식단 (7일치)
 */
export interface WeeklyDiet {
  metadata: WeeklyDietPlan;
  dailyPlans: {
    [date: string]: WeeklyDailyPlan; // 'YYYY-MM-DD' → DailyDietPlan
  };
  dailyPlansPersisted?: boolean;
  shoppingList: ShoppingListItem[];
  nutritionStats: WeeklyNutritionStats[];
}

/**
 * 장보기 리스트 항목
 */
export interface ShoppingListItem {
  id?: string;
  weekly_diet_plan_id?: string;
  ingredient_name: string;
  total_quantity: number;
  unit: string;
  category: string;
  recipes_using: string[]; // 레시피 ID 배열
  is_purchased: boolean;
}

/**
 * 주간 영양 통계
 */
export interface WeeklyNutritionStats {
  id?: string;
  weekly_diet_plan_id?: string;
  day_of_week: number; // 1=월요일, 7=일요일
  date: string; // 'YYYY-MM-DD'
  total_calories: number;
  total_carbohydrates: number;
  total_protein: number;
  total_fat: number;
  total_sodium: number;
  meal_count: number;
}

/**
 * 주간 식단 생성 옵션
 */
export interface WeeklyDietGenerationOptions {
  userId: string;
  weekStartDate: string; // 'YYYY-MM-DD' (월요일)
  profile: UserHealthProfile;
  familyMembers?: FamilyMember[];
  avoidRecentRecipes?: boolean; // 최근 사용 레시피 회피 (기본 true)
  diversityLevel?: "low" | "medium" | "high"; // 다양성 수준 (기본 medium)
  existingUsedByCategory?: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  }; // 기존 식단의 반찬/국/찌개 제외 목록 (재생성 시 사용)
}

/**
 * 재료 카테고리
 */
export type IngredientCategory =
  | "곡물"
  | "채소"
  | "과일"
  | "육류"
  | "해산물"
  | "유제품"
  | "조미료"
  | "기타";

/**
 * 재료 정보 (레시피에서 추출)
 */
export interface IngredientInfo {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipe_id: string;
  recipe_title: string;
}







