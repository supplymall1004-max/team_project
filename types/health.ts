/**
 * @file health.ts
 * @description AI 기반 개인 맞춤 식단 큐레이션 (Section C) 도메인 타입 정의.
 *
 * 주요 타입:
 * 1. UserHealthProfile: 사용자 건강 정보
 * 2. DietPlan: 추천 식단
 * 3. MealType: 식사 유형
 * 4. NutritionInfo: 영양소 정보
 */

export type Gender = "male" | "female" | "other";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// 질병 타입
export type Disease =
  | "diabetes"
  | "hypertension"
  | "high_cholesterol"
  | "kidney_disease"
  | "cardiovascular_disease"
  | "gastrointestinal_disorder"
  | "liver_disease"
  | "obesity"
  | "gout"
  | "thyroid_disorder";

// 알레르기 타입
export type Allergy =
  | "milk"
  | "egg"
  | "peanut"
  | "tree_nut"
  | "fish"
  | "shellfish"
  | "wheat"
  | "soy"
  | "buckwheat"
  | "mackerel"
  | "crab"
  | "shrimp"
  | "pork"
  | "walnut"
  | "pine_nut"
  | "peach"
  | "tomato"
  | "sulfites";

export interface UserHealthProfile {
  id: string;
  user_id: string;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  daily_calorie_goal: number;
  diseases: Disease[];
  allergies: Allergy[];
  preferred_ingredients: string[];
  disliked_ingredients: string[];
  created_at: string;
  updated_at: string;
}

export interface NutritionInfo {
  calories: number | null;
  carbohydrates: number | null; // g
  protein: number | null; // g
  fat: number | null; // g
  sodium: number | null; // mg
}

export interface DietPlan {
  id: string;
  user_id: string;
  plan_date: string; // YYYY-MM-DD
  meal_type: MealType;
  recipe_id: string | null;
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
  created_at: string;
  // 식사 구성품 요약 (밥/반찬/국/간식 등)
  compositionSummary?: string[];
  // 조인된 데이터
  recipe?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    slug: string;
  };
}

export interface DailyDietPlan {
  date: string; // YYYY-MM-DD
  breakfast: DietPlan | null;
  lunch: DietPlan | null;
  dinner: DietPlan | null;
  snack: DietPlan | null;
  totalNutrition: NutritionInfo;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}

// 상수 정의
export const DISEASE_LABELS: Record<Disease, string> = {
  diabetes: "당뇨",
  hypertension: "고혈압",
  high_cholesterol: "고지혈증",
  kidney_disease: "신장질환",
  cardiovascular_disease: "심혈관질환",
  gastrointestinal_disorder: "위장 장애",
  liver_disease: "간질환",
  obesity: "비만",
  gout: "통풍",
  thyroid_disorder: "갑상선 질환",
};

export const ALLERGY_LABELS: Record<Allergy, string> = {
  milk: "우유",
  egg: "계란",
  peanut: "땅콩",
  tree_nut: "견과류",
  fish: "생선",
  shellfish: "조개류",
  wheat: "밀",
  soy: "대두",
  buckwheat: "메밀",
  mackerel: "고등어",
  crab: "게",
  shrimp: "새우",
  pork: "돼지고기",
  walnut: "호두",
  pine_nut: "잣",
  peach: "복숭아",
  tomato: "토마토",
  sulfites: "아황산류",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: "거의 활동 없음",
  light: "가벼운 활동 (주 1-3일 운동)",
  moderate: "보통 활동 (주 3-5일 운동)",
  active: "활발한 활동 (주 6-7일 운동)",
  very_active: "매우 활발한 활동 (하루 2회 이상 운동)",
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

