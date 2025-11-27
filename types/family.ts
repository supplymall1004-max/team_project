/**
 * @file types/family.ts
 * @description 가족 구성원 및 건강 정보 타입 정의
 */

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  birth_date: string; // 'YYYY-MM-DD' 형식
  gender: "male" | "female" | "other";
  relationship: string; // 'spouse', 'child', 'parent', etc.
  diseases?: string[];
  allergies?: string[];
  height_cm?: number;
  weight_kg?: number;
  activity_level?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietary_preferences?: string[];
  include_in_unified_diet?: boolean; // 통합 식단에 포함할지 여부 (기본값: true)
  created_at: string;
  updated_at: string;
}

export interface UserHealthProfile {
  id: string;
  user_id: string;
  diseases?: string[];
  allergies?: string[];
  preferred_ingredients?: string[];
  disliked_ingredients?: string[];
  daily_calorie_goal?: number;
  dietary_preferences?: string[];
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: "male" | "female" | "other";
  activity_level?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  created_at: string;
  updated_at: string;
}

export type Disease = 
  | "diabetes" 
  | "hypertension" 
  | "gout" 
  | "kidney_disease" 
  | "hyperlipidemia" 
  | "obesity" 
  | "heart_disease";

export interface DiseaseExcludedFood {
  id: string;
  disease: string;
  excluded_food_type: "ingredient" | "recipe_keyword";
  food_name: string;
  reason?: string;
  severity: "low" | "medium" | "high";
  created_at: string;
}

// 질병 한글명 맵
export const DISEASE_LABELS: Record<string, string> = {
  diabetes: "당뇨병",
  hypertension: "고혈압",
  gout: "통풍",
  kidney_disease: "신장질환",
  hyperlipidemia: "고지혈증",
  obesity: "비만",
  heart_disease: "심장병",
};

// 알레르기 한글명 맵
export const ALLERGY_LABELS: Record<string, string> = {
  peanuts: "땅콩",
  shellfish: "갑각류",
  dairy: "유제품",
  eggs: "계란",
  soy: "대두",
  wheat: "밀",
  fish: "생선",
  tree_nuts: "견과류",
};

// 활동 수준 한글명 맵
export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: "주로 앉아서 생활",
  light: "가벼운 운동 (주 1-3회)",
  moderate: "중간 강도 운동 (주 3-5회)",
  active: "활발한 운동 (주 6-7회)",
  very_active: "매우 활발한 운동 (하루 2회)",
};

// 관계 한글명 맵
export const RELATIONSHIP_LABELS: Record<string, string> = {
  spouse: "배우자",
  child: "자녀",
  parent: "부모",
  sibling: "형제/자매",
  grandparent: "조부모",
  grandchild: "손자/손녀",
  other: "기타",
};

