/**
 * @file recipe.ts
 * @description 현대 레시피 북 (Section B) 도메인 타입 정의.
 *
 * 주요 타입:
 * 1. Recipe: 레시피 기본 정보
 * 2. RecipeIngredient: 구조화된 재료 정보
 * 3. RecipeStep: 단계별 조리 과정
 * 4. RecipeRating: 별점 평가 (0.5점 단위)
 * 5. RecipeReport: 신고 정보
 */

export interface Recipe {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: number; // 1~5점
  cooking_time_minutes: number; // 분 단위
  servings: number;
  created_at: string;
  updated_at: string;
  // 식약처 API 필드 (옵셔널)
  foodsafety_rcp_seq?: string | null; // 식약처 레시피 순번
  foodsafety_rcp_way2?: string | null; // 조리방법
  foodsafety_rcp_pat2?: string | null; // 요리종류
  foodsafety_info_eng?: number | null; // 칼로리
  foodsafety_info_car?: number | null; // 탄수화물
  foodsafety_info_pro?: number | null; // 단백질
  foodsafety_info_fat?: number | null; // 지방
  foodsafety_info_na?: number | null; // 나트륨
  foodsafety_info_fiber?: number | null; // 식이섬유
  foodsafety_info_k?: number | null; // 칼륨
  foodsafety_info_p?: number | null; // 인
  foodsafety_info_gi?: number | null; // GI 지수
  foodsafety_rcp_parts_dtls?: string | null; // 재료 정보
  foodsafety_att_file_no_main?: string | null; // 대표 이미지 URL
  foodsafety_att_file_no_mk?: string | null; // 만드는 법 이미지 URL
  // 조인된 데이터
  user?: {
    id: string;
    name: string;
  };
  rating_stats?: {
    rating_count: number;
    average_rating: number;
  };
}

// 재료 카테고리 타입 (DB ENUM과 일치)
export type IngredientCategory =
  | "곡물"
  | "채소"
  | "과일"
  | "육류"
  | "해산물"
  | "유제품"
  | "조미료"
  | "기타";

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_name: string; // DB 필드명과 일치
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory; // 재료 카테고리
  is_optional: boolean; // 선택 재료 여부
  preparation_note: string | null; // 손질 방법 (예: "다진 것", "깍둑썰기")
  display_order: number; // 표시 순서 (DB 필드명과 일치)
  created_at: string;
  updated_at?: string;
  
  // 하위 호환성을 위한 별칭 (기존 코드에서 name, notes, order_index 사용 시)
  /** @deprecated ingredient_name 사용 */
  name?: string;
  /** @deprecated preparation_note 사용 */
  notes?: string | null;
  /** @deprecated display_order 사용 */
  order_index?: number;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  content: string;
  image_url: string | null;
  video_url: string | null;
  timer_minutes: number | null;
  created_at: string;
  foodsafety_manual_img?: string | null; // 식약처 API 조리 방법 이미지
}

export interface RecipeRating {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number; // 0.5, 1.0, 1.5, ..., 5.0 (0.5점 단위)
  created_at: string;
  updated_at: string;
}

export interface RecipeReport {
  id: string;
  recipe_id: string;
  user_id: string;
  report_type: "inappropriate" | "copyright" | "spam" | "other";
  reason: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
}

// 레시피 목록 조회용 (간소화된 정보)
export interface RecipeListItem {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  difficulty: number;
  cooking_time_minutes: number;
  rating_count: number;
  average_rating: number;
  created_at?: string; // 정렬을 위해 추가
  foodsafety_rcp_pat2?: string | null; // 요리종류 (분류 탭용)
  user: {
    name: string;
  };
}

// 레시피 상세 조회용 (모든 정보 포함)
export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  user_rating?: number; // 현재 사용자의 평가 (있는 경우)
}

// 레시피 필터 상태
export interface RecipeFilterState {
  searchTerm: string;
  difficulty: number[]; // 1~5 중 선택된 난이도들
  maxCookingTime: number | null; // 최대 조리 시간 (분)
  sortBy: "newest" | "popular" | "rating"; // 정렬 기준
}

// 조리 시간 포맷팅 헬퍼 타입
export type CookingTimeFormat = {
  hours: number;
  minutes: number;
};

// =============================================================================
// 건강 맞춤 식단 시스템 타입 정의
// =============================================================================

// 재료 정보
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

// 영양 정보
export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  fiber?: number;
  potassium?: number; // 칼륨
  phosphorus?: number; // 인
  gi?: number; // GI 지수
}

// 레시피 주의사항 인터페이스
export interface RecipeWarning {
  type: 'sugar' | 'sodium' | 'fat' | 'potassium' | 'phosphorus' | 'purine' | 'other';
  message: string; // 주의사항 메시지
  value: number; // 해당 영양소 함량
  unit: string; // 단위 (g, mg 등)
  severity: 'low' | 'moderate' | 'high'; // 심각도
}

// 영양소 상세 정보
export interface NutritionDetails {
  sugar?: number; // 당 함량 (g)
  sodium?: number; // 나트륨 (mg)
  fat?: number; // 지방 (g)
  potassium?: number; // 칼륨 (mg)
  phosphorus?: number; // 인 (mg)
  purine?: number; // 퓨린 (mg)
}

// 레시피 상세 정보 (건강 맞춤 식단용)
export interface RecipeDetailForDiet {
  id?: string;
  title: string;
  description?: string;
  image?: string;
  url?: string;
  source?: string; // 'edamam', 'foodsafety', 'fallback', 'seasonal'
  ingredients: Ingredient[];
  instructions?: string | string[];
  nutrition: RecipeNutrition;
  cuisineType?: string[];
  mealType?: string | string[];
  dishType?: string[];
  tags?: string[];
  emoji?: string; // 제철 과일용 이모지
  imageUrl?: string; // 과일 이미지 URL
  featureDescription?: string; // 어린이 추천 이유 등
  compositionSummary?: string[]; // 식사 구성품 요약 (밥/반찬/국 등 이름 리스트)
  warnings?: RecipeWarning[]; // 주의사항 배열
  nutritionDetails?: NutritionDetails; // 영양소 상세 정보
  exclusionType?: 'absolute' | 'moderate' | 'limit' | null; // 제외 유형
}

// 식사 구성 (밥 + 반찬 3개 + 국/찌개)
export interface MealComposition {
  rice?: RecipeDetailForDiet;
  sides: RecipeDetailForDiet[];
  soup?: RecipeDetailForDiet;
  totalNutrition: RecipeNutrition;
  compositionSummary?: string[]; // 식사 구성품 요약 (밥/반찬/국 등 이름 리스트)
}

// 하루 식단 계획
export interface DailyDietPlan {
  date: string; // 'YYYY-MM-DD'
  breakfast?: MealComposition | RecipeDetailForDiet;
  lunch?: MealComposition | RecipeDetailForDiet;
  dinner?: MealComposition | RecipeDetailForDiet;
  snack?: RecipeDetailForDiet;
  totalNutrition: RecipeNutrition;
}

// 가족 식단 계획 (개인별 + 통합)
export interface FamilyDietPlan {
  date: string;
  individualPlans: {
    [memberId: string]: DailyDietPlan; // 가족 구성원별 식단
  };
  unifiedPlan?: DailyDietPlan; // 가족 통합 식단
}

// 식사 타입
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// =============================================================================
// 식약처 API 타입 정의
// =============================================================================

/**
 * 식약처 API 원본 레시피 데이터
 * lib/recipes/foodsafety-api.ts의 FoodSafetyRecipeRow와 동일한 구조
 */
export interface FoodSafetyRecipe {
  RCP_SEQ: string;
  RCP_NM: string;
  RCP_WAY2: string;
  RCP_PAT2: string;
  INFO_ENG: string;
  INFO_CAR: string;
  INFO_PRO: string;
  INFO_FAT: string;
  INFO_NA: string;
  INFO_FIBER: string;
  RCP_PARTS_DTLS: string;
  MANUAL01: string | null;
  MANUAL02: string | null;
  MANUAL03: string | null;
  MANUAL04: string | null;
  MANUAL05: string | null;
  MANUAL06: string | null;
  MANUAL07: string | null;
  MANUAL08: string | null;
  MANUAL09: string | null;
  MANUAL10: string | null;
  MANUAL11: string | null;
  MANUAL12: string | null;
  MANUAL13: string | null;
  MANUAL14: string | null;
  MANUAL15: string | null;
  MANUAL16: string | null;
  MANUAL17: string | null;
  MANUAL18: string | null;
  MANUAL19: string | null;
  MANUAL20: string | null;
  MANUAL_IMG01: string | null;
  MANUAL_IMG02: string | null;
  MANUAL_IMG03: string | null;
  MANUAL_IMG04: string | null;
  MANUAL_IMG05: string | null;
  MANUAL_IMG06: string | null;
  MANUAL_IMG07: string | null;
  MANUAL_IMG08: string | null;
  MANUAL_IMG09: string | null;
  MANUAL_IMG10: string | null;
  MANUAL_IMG11: string | null;
  MANUAL_IMG12: string | null;
  MANUAL_IMG13: string | null;
  MANUAL_IMG14: string | null;
  MANUAL_IMG15: string | null;
  MANUAL_IMG16: string | null;
  MANUAL_IMG17: string | null;
  MANUAL_IMG18: string | null;
  MANUAL_IMG19: string | null;
  MANUAL_IMG20: string | null;
  ATT_FILE_NO_MAIN: string | null;
  ATT_FILE_NO_MK: string | null;
}

