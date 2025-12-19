/**
 * @file health-tabs.ts
 * @description 건강 맞춤 식단 탭 시스템 타입 정의
 *
 * 주요 타입:
 * 1. HealthTabType: 건강 정보 탭 유형
 * 2. HealthTabInfo: 탭 정보 및 콘텐츠
 * 3. HealthTabContent: 탭별 상세 콘텐츠
 */

export type HealthTabType =
  | 'diabetes'           // 당뇨
  | 'cardiovascular'     // 심혈관 질환
  | 'ckd'               // 만성 신장 질환
  | 'gout'              // 통풍
  | 'gastrointestinal'   // 위장 질환
  | 'maternity'         // 임산부
  | 'allergy'           // 알레르기
  | 'diet_male'         // 남성 다이어트
  | 'diet_female'       // 여성 다이어트
  | 'growing_children'; // 성장기 어린이

export interface HealthTabInfo {
  type: HealthTabType;
  title: string;
  icon: string;
  description: string;
  isActive: boolean; // 사용자 건강 정보에 따라 활성화 여부
  content: HealthTabContent;
}

export interface HealthTabContent {
  calorieCalculation: {
    formula: string;
    explanation: string;
    example?: string;
    steps?: Array<{
      step: number;
      description: string;
      calculation?: string;
    }>;
  };
  precautions: Array<{
    title: string;
    description: string;
    severity?: 'high' | 'medium' | 'low';
  }>;
  nutritionGuidelines: {
    macronutrients: {
      carbs: { min: number; max: number; unit: string; description?: string };
      protein: { min: number; max: number; unit: string; description?: string };
      fat: { min: number; max: number; unit: string; description?: string };
    };
    micronutrients?: {
      sodium?: { max: number; unit: string; description?: string };
      potassium?: { max: number; unit: string; description?: string };
      phosphorus?: { max: number; unit: string; description?: string };
    };
  };
  excludedFoods: Array<{
    name: string;
    reason: string;
    category?: string;
  }>;
  recommendedFoods: Array<{
    name: string;
    benefit: string;
    category?: string;
  }>;
  mealPlanningTips: Array<{
    tip: string;
    description?: string;
  }>;
  references?: string[];
}

export interface HealthTabConfig {
  type: HealthTabType;
  title: string;
  icon: string;
  description: string;
  diseaseCodes?: string[]; // 이 탭을 활성화할 질병 코드 목록
  allergyCodes?: string[]; // 이 탭을 활성화할 알레르기 코드 목록
  requiresGender?: 'male' | 'female'; // 성별 기반 탭
  requiresAge?: { min?: number; max?: number }; // 나이 기반 탭
}

// 탭 설정 매핑
export const HEALTH_TAB_CONFIGS: Record<HealthTabType, HealthTabConfig> = {
  diabetes: {
    type: 'diabetes',
    title: '당뇨',
    icon: '🩺',
    description: '당뇨병 관리를 위한 칼로리 계산 및 식단 가이드',
    diseaseCodes: ['diabetes', 'diabetes_type1', 'diabetes_type2'],
  },
  cardiovascular: {
    type: 'cardiovascular',
    title: '심혈관 질환',
    icon: '❤️',
    description: '심혈관 질환 관리를 위한 칼로리 계산 및 식단 가이드',
    diseaseCodes: ['cardiovascular_disease', 'hypertension', 'high_cholesterol'],
  },
  ckd: {
    type: 'ckd',
    title: '만성 신장 질환',
    icon: '🧬',
    description: '만성 신장 질환 관리를 위한 칼로리 계산 및 식단 가이드',
    diseaseCodes: ['kidney_disease', 'ckd'],
  },
  gout: {
    type: 'gout',
    title: '통풍',
    icon: '🍗',
    description: '통풍 관리를 위한 칼로리 계산 및 식단 가이드',
    diseaseCodes: ['gout'],
  },
  gastrointestinal: {
    type: 'gastrointestinal',
    title: '위장 질환',
    icon: '🍞',
    description: '위장 질환 관리를 위한 칼로리 계산 및 식단 가이드',
    diseaseCodes: ['gastrointestinal_disorder'],
  },
  maternity: {
    type: 'maternity',
    title: '임산부',
    icon: '🤰',
    description: '임산부를 위한 칼로리 계산 및 식단 가이드',
    requiresGender: 'female',
    // 임신 상태는 별도 필드 필요 (추후 확장)
  },
  allergy: {
    type: 'allergy',
    title: '알레르기',
    icon: '🥜',
    description: '식품 알레르기 관리를 위한 식단 가이드',
    // 알레르기가 하나라도 있으면 활성화
  },
  diet_male: {
    type: 'diet_male',
    title: '남성 다이어트',
    icon: '🏃‍♂️',
    description: '남성을 위한 다이어트 칼로리 계산 및 식단 가이드',
    requiresGender: 'male',
  },
  diet_female: {
    type: 'diet_female',
    title: '여성 다이어트',
    icon: '🏃‍♀️',
    description: '여성을 위한 다이어트 칼로리 계산 및 식단 가이드',
    requiresGender: 'female',
  },
  growing_children: {
    type: 'growing_children',
    title: '성장기 어린이',
    icon: '👶',
    description: '성장기 어린이를 위한 칼로리 계산 및 식단 가이드',
    requiresAge: { min: 0, max: 18 },
  },
};
