/**
 * @file premium-diet-report-generator.ts
 * @description 프리미엄 종합 식단 리포트 생성기
 *
 * 주요 기능:
 * 1. 모든 건강 정보를 종합하여 최종 칼로리 및 영양소 목표 계산
 * 2. 각 건강 상태별 적용된 필터링 규칙 통합
 * 3. 식단 구성 원리 설명 생성
 */

import type { UserHealthProfile } from '@/types/health';
import { getActiveHealthTabs } from '@/lib/health/health-tab-activator';
import { getHealthTabContent } from '@/lib/health/health-content-loader';
import { HEALTH_TAB_CONFIGS } from '@/types/health-tabs';
import type { HealthTabType } from '@/types/health-tabs';

export interface PremiumDietReport {
  totalCalories: {
    base: number; // 기본 칼로리 (BMR × 활동 계수)
    adjustments: Array<{
      type: string;
      value: number;
      reason: string;
    }>;
    final: number; // 최종 목표 칼로리
  };
  macronutrients: {
    carbs: { min: number; max: number; calories: { min: number; max: number } };
    protein: { min: number; max: number; calories: { min: number; max: number } };
    fat: { min: number; max: number; calories: { min: number; max: number } };
  };
  micronutrients?: {
    sodium?: { max: number };
    potassium?: { max: number };
    phosphorus?: { max: number };
  };
  appliedRestrictions: Array<{
    category: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  dietCompositionLogic: string;
}

/**
 * BMR 계산 (Mifflin-St Jeor 공식)
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/**
 * 활동 계수 매핑
 */
function getActivityMultiplier(activityLevel: string | null): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return multipliers[activityLevel || 'sedentary'] || 1.2;
}

/**
 * 프리미엄 종합 식단 리포트 생성
 */
export function generatePremiumDietReport(
  healthProfile: UserHealthProfile
): PremiumDietReport {
  const activeTabs = getActiveHealthTabs(healthProfile);
  const adjustments: Array<{ type: string; value: number; reason: string }> = [];
  const appliedRestrictions: Array<{
    category: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }> = [];

  // 기본 칼로리 계산
  let baseCalories = 2000; // 기본값
  if (
    healthProfile.weight_kg &&
    healthProfile.height_cm &&
    healthProfile.age &&
    healthProfile.gender
  ) {
    const bmr = calculateBMR(
      healthProfile.weight_kg,
      healthProfile.height_cm,
      healthProfile.age,
      healthProfile.gender
    );
    const activityMultiplier = getActivityMultiplier(healthProfile.activity_level);
    baseCalories = Math.round(bmr * activityMultiplier);
  }

  // 질병별 칼로리 조정
  activeTabs.forEach((tabType) => {
    const content = getHealthTabContent(tabType);

    // CKD는 특별 처리 (30-35 kcal/kg)
    if (tabType === 'ckd' && healthProfile.weight_kg) {
      const standardWeight = calculateStandardWeight(
        healthProfile.height_cm || 170,
        healthProfile.gender || 'male'
      );
      const ckdCalories = Math.round(standardWeight * 32.5); // 30-35의 중간값
      if (ckdCalories !== baseCalories) {
        adjustments.push({
          type: 'CKD',
          value: ckdCalories - baseCalories,
          reason: '만성 신장 질환: 표준 체중 기준 30-35 kcal/kg 적용',
        });
        baseCalories = ckdCalories;
      }
    }

    // 당뇨: 체중 감량 필요 시 -500 kcal
    if (tabType === 'diabetes') {
      adjustments.push({
        type: '당뇨',
        value: -500,
        reason: '당뇨: 과체중/비만 시 체중 감량을 위한 칼로리 감소',
      });
      appliedRestrictions.push({
        category: '당뇨',
        description: '고GI 탄수화물 및 단순당 제외',
        severity: 'high',
      });
    }

    // 심혈관 질환: 체중 감량 필요 시 -500~-1000 kcal
    if (tabType === 'cardiovascular') {
      adjustments.push({
        type: '심혈관 질환',
        value: -750,
        reason: '심혈관 질환: 체중 감량을 위한 칼로리 감소',
      });
      appliedRestrictions.push({
        category: '심혈관 질환',
        description: '저염식(1,500mg 이하), 포화지방/트랜스지방 제한',
        severity: 'high',
      });
    }

    // 통풍: 급격한 체중 감량 방지
    if (tabType === 'gout') {
      appliedRestrictions.push({
        category: '통풍',
        description: '고퓨린 식품 제외, 주당 0.5kg 이내 서서히 감량',
        severity: 'high',
      });
    }
  })

  // 알레르기 제한 추가
  if (healthProfile.allergies.length > 0) {
    const allergyNames = healthProfile.allergies
      .map((a) => a.custom_name || a.code)
      .join(', ');
    appliedRestrictions.push({
      category: '알레르기',
      description: `${allergyNames} 성분 일체 제외`,
      severity: 'high',
    });
  }

  // 최종 칼로리 계산
  const finalCalories = Math.max(
    healthProfile.gender === 'male' ? 1500 : 1200,
    baseCalories + adjustments.reduce((sum, adj) => sum + adj.value, 0)
  );

  // 영양소 비율 계산 (가장 엄격한 기준 적용)
  const macronutrientRatios = calculateMacronutrientRatios(activeTabs, healthProfile);
  const totalCalories = finalCalories;

  // 미네랄 제한 통합
  const micronutrients = calculateMicronutrientLimits(activeTabs);

  // 식단 구성 원리 설명 생성
  const dietCompositionLogic = generateDietCompositionLogic(
    activeTabs,
    healthProfile,
    appliedRestrictions
  );

  return {
    totalCalories: {
      base: baseCalories,
      adjustments,
      final: finalCalories,
    },
    macronutrients: {
      carbs: {
        min: Math.round((totalCalories * macronutrientRatios.carbs.min) / 100 / 4),
        max: Math.round((totalCalories * macronutrientRatios.carbs.max) / 100 / 4),
        calories: {
          min: Math.round((totalCalories * macronutrientRatios.carbs.min) / 100),
          max: Math.round((totalCalories * macronutrientRatios.carbs.max) / 100),
        },
      },
      protein: {
        min: Math.round((totalCalories * macronutrientRatios.protein.min) / 100 / 4),
        max: Math.round((totalCalories * macronutrientRatios.protein.max) / 100 / 4),
        calories: {
          min: Math.round((totalCalories * macronutrientRatios.protein.min) / 100),
          max: Math.round((totalCalories * macronutrientRatios.protein.max) / 100),
        },
      },
      fat: {
        min: Math.round((totalCalories * macronutrientRatios.fat.min) / 100 / 9),
        max: Math.round((totalCalories * macronutrientRatios.fat.max) / 100 / 9),
        calories: {
          min: Math.round((totalCalories * macronutrientRatios.fat.min) / 100),
          max: Math.round((totalCalories * macronutrientRatios.fat.max) / 100),
        },
      },
    },
    micronutrients,
    appliedRestrictions,
    dietCompositionLogic,
  };
}

/**
 * 표준 체중 계산
 */
function calculateStandardWeight(height: number, gender: 'male' | 'female' | 'other'): number {
  if (gender === 'male') {
    return 50 + 0.91 * (height - 152.4);
  } else {
    return 45.5 + 0.91 * (height - 152.4);
  }
}

/**
 * 영양소 비율 계산 (가장 엄격한 기준 적용)
 */
function calculateMacronutrientRatios(
  activeTabs: HealthTabType[],
  healthProfile: UserHealthProfile
): {
  carbs: { min: number; max: number };
  protein: { min: number; max: number };
  fat: { min: number; max: number };
} {
  // 기본 비율
  let carbs = { min: 45, max: 55 };
  let protein = { min: 15, max: 20 };
  const fat = { min: 20, max: 30 };

  // CKD는 단백질 제한
  if (activeTabs.includes('ckd')) {
    protein = { min: 0.6, max: 0.8 }; // g/kg 단위로 처리 필요
    carbs = { min: 40, max: 55 }; // 단백질 부족분 보충
  }

  // 당뇨는 탄수화물 비율 조정
  if (activeTabs.includes('diabetes')) {
    carbs = { min: 45, max: 60 };
  }

  // 다이어트는 단백질 증가
  if (activeTabs.includes('diet_male') || activeTabs.includes('diet_female')) {
    protein = { min: 25, max: 35 };
  }

  return { carbs, protein, fat };
}

/**
 * 미네랄 제한 통합
 */
function calculateMicronutrientLimits(activeTabs: HealthTabType[]): {
  sodium?: number;
  potassium?: number;
  phosphorus?: number;
} {
  const limits: {
    sodium?: number;
    potassium?: number;
    phosphorus?: number;
  } = {};

  activeTabs.forEach((tabType) => {
    const content = getHealthTabContent(tabType);
    if (content.nutritionGuidelines.micronutrients) {
      const micro = content.nutritionGuidelines.micronutrients;
      if (micro.sodium && (!limits.sodium || micro.sodium.max < limits.sodium)) {
        limits.sodium = micro.sodium.max;
      }
      if (micro.potassium && (!limits.potassium || micro.potassium.max < limits.potassium)) {
        limits.potassium = micro.potassium.max;
      }
      if (micro.phosphorus && (!limits.phosphorus || micro.phosphorus.max < limits.phosphorus)) {
        limits.phosphorus = micro.phosphorus.max;
      }
    }
  });

  return limits;
}

/**
 * 식단 구성 원리 설명 생성
 */
function generateDietCompositionLogic(
  activeTabs: HealthTabType[],
  healthProfile: UserHealthProfile,
  restrictions: Array<{ category: string; description: string; severity: string }>
): string {
  const parts: string[] = [];

  parts.push('이 식단은 입력하신 건강 정보를 종합하여 다음과 같이 구성되었습니다:');

  if (activeTabs.length > 0) {
    parts.push(`\n• 적용된 건강 상태: ${activeTabs.length}개`);
    activeTabs.forEach((tab) => {
      const config = HEALTH_TAB_CONFIGS[tab];
      parts.push(`  - ${config.title}`);
    });
  }

  if (restrictions.length > 0) {
    parts.push('\n• 적용된 제한 사항:');
    restrictions.forEach((r) => {
      parts.push(`  - ${r.category}: ${r.description}`);
    });
  }

  parts.push(
    '\n• 식단 생성 원칙:',
    '  1. 가장 엄격한 기준을 우선 적용하여 안전성을 최우선으로 고려했습니다.',
    '  2. 각 건강 상태별 권장 영양소 비율을 종합하여 균형 잡힌 식단을 구성했습니다.',
    '  3. 제외 음식은 완전히 배제하고, 권장 식품을 우선적으로 포함했습니다.',
    '  4. 칼로리 목표는 건강 상태와 체중 관리 목표를 모두 고려하여 설정했습니다.'
  );

  return parts.join('\n');
}
