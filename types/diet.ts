/**
 * @file diet.ts
 * @description 식단 관련 추가 타입 정의
 *
 * 주요 타입:
 * 1. FavoriteMeal: 즐겨찾기한 식단
 * 2. MealKit: 밀키트 제품 정보
 * 3. MealKitProduct: 쿠팡 API 제품 정보
 */

import type { MealType } from "./health";

/**
 * 즐겨찾기한 식단
 */
export interface FavoriteMeal {
  id: string;
  user_id: string;
  recipe_id: string | null;
  recipe_title: string;
  meal_type: MealType | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 수동 등록 밀키트 제품
 */
export interface MealKit {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  serving_size: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  category: string | null;
  meal_type: MealType[];
  purchase_url: string | null;
  is_active: boolean;
  is_premium_only: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 쿠팡 API 제품 정보 (캐시)
 */
export interface MealKitProduct {
  id: string;
  coupang_product_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  original_price: number | null;
  discount_rate: number | null;
  product_url: string;
  affiliate_link: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  category: string | null;
  meal_type: MealType[];
  last_synced_at: string;
  sync_status: "success" | "failed" | "pending";
  sync_error: string | null;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 밀키트 카테고리
 */
export type MealKitCategory = "korean" | "western" | "japanese" | "chinese" | "fusion" | "other";

export const MEAL_KIT_CATEGORY_LABELS: Record<MealKitCategory, string> = {
  korean: "한식",
  western: "양식",
  japanese: "일식",
  chinese: "중식",
  fusion: "퓨전",
  other: "기타",
};













