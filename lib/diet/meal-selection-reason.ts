/**
 * @file lib/diet/meal-selection-reason.ts
 * @description 식단 선택 이유 자동 계산 로직
 *
 * 건강 프로필, 영양소 정보, 질병 정보를 기반으로
 * 식단이 왜 선택되었는지 자동으로 계산합니다.
 */

import type { UserHealthProfile } from '@/types/health';
import type { MfdsNutritionInfo } from '@/types/mfds-recipe';
import { DISEASE_LABELS } from '@/types/health';

/**
 * 식단 선택 이유 인터페이스
 */
export interface MealSelectionReason {
  /** 주요 선택 이유 (간단한 설명) */
  primaryReasons: string[];
  /** 영양소별 이점 */
  nutritionBenefits: {
    nutrient: string;
    amount: number;
    unit: string;
    benefit: string;
    currentStatus: string;
    improvement: string;
  }[];
  /** 건강 상태별 선택 이유 */
  healthConditions: {
    condition: string;
    whySelected: string;
    expectedImprovement: string;
  }[];
}

/**
 * BMI 계산
 */
function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  return weightKg / Math.pow(heightCm / 100, 2);
}

/**
 * 질병 코드 추출 (정규화)
 */
function extractDiseaseCodes(profile: UserHealthProfile): string[] {
  if (!Array.isArray(profile.diseases)) return [];
  
  return profile.diseases
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'code' in item) {
        return (item as { code?: unknown }).code;
      }
      return null;
    })
    .filter((code): code is string => typeof code === 'string' && code.length > 0);
}

/**
 * 질병 코드 매칭 (부분 일치 포함)
 */
function hasDisease(profile: UserHealthProfile, matchers: Array<(code: string) => boolean>): boolean {
  const codes = extractDiseaseCodes(profile);
  return codes.some((code) => matchers.some((m) => m(code)));
}

/**
 * 식단 선택 이유 계산
 */
export function calculateMealSelectionReason(
  mealNutrition: MfdsNutritionInfo,
  healthProfile: UserHealthProfile,
  mealName: string = '이 식단'
): MealSelectionReason {
  console.group('[MealSelectionReason] 식단 선택 이유 계산 시작');
  console.log('식단명:', mealName);
  console.log('영양소:', mealNutrition);
  
  const primaryReasons: string[] = [];
  const nutritionBenefits: MealSelectionReason['nutritionBenefits'] = [];
  const healthConditions: MealSelectionReason['healthConditions'] = [];

  // BMI 계산
  const bmi = calculateBMI(healthProfile.weight_kg, healthProfile.height_cm);
  const isOverweight = bmi !== null && bmi >= 25;
  const isUnderweight = bmi !== null && bmi < 18.5;

  // 질병 코드 확인 헬퍼
  const isDiabetes = hasDisease(healthProfile, [
    (code) => code.includes('diabetes'),
  ]);
  const isHypertension = hasDisease(healthProfile, [
    (code) => code.includes('hypertension') || code.includes('high_blood_pressure'),
  ]);
  const isHighCholesterol = hasDisease(healthProfile, [
    (code) => code.includes('hyperlipidemia') || 
             code.includes('high_cholesterol') || 
             code.includes('dyslipidemia'),
  ]);
  const isKidneyDisease = hasDisease(healthProfile, [
    (code) => code.includes('kidney') || code === 'ckd' || code.includes('renal'),
  ]);
  const isObesity = hasDisease(healthProfile, [
    (code) => code.includes('obesity') || code.includes('overweight'),
  ]);
  const isGout = hasDisease(healthProfile, [
    (code) => code.includes('gout'),
  ]);

  // 1. 칼로리 기반 선택 이유
  const dailyGoal = healthProfile.daily_calorie_goal || 2000;
  const mealCalories = mealNutrition.calories || 0;
  const mealCalorieRatio = (mealCalories / dailyGoal) * 100;

  if (isOverweight && mealCalories < dailyGoal * 0.35) {
    primaryReasons.push('칼로리가 적절하여 체중 관리에 도움이 됩니다');
    nutritionBenefits.push({
      nutrient: '칼로리',
      amount: mealCalories,
      unit: 'kcal',
      benefit: '적정 칼로리로 체중 관리에 적합합니다',
      currentStatus: `현재 BMI ${bmi?.toFixed(1)} (과체중)`,
      improvement: '규칙적인 식사로 점진적인 체중 감량이 기대됩니다',
    });
  } else if (isUnderweight && mealCalories > dailyGoal * 0.25) {
    primaryReasons.push('충분한 칼로리로 영양 보충에 도움이 됩니다');
    nutritionBenefits.push({
      nutrient: '칼로리',
      amount: mealCalories,
      unit: 'kcal',
      benefit: '적정 칼로리로 건강한 체중 증가를 돕습니다',
      currentStatus: `현재 BMI ${bmi?.toFixed(1)} (저체중)`,
      improvement: '규칙적인 식사로 건강한 체중 증가가 기대됩니다',
    });
  } else if (mealCalorieRatio >= 25 && mealCalorieRatio <= 35) {
    primaryReasons.push('하루 권장 칼로리의 적정 비율을 제공합니다');
  }

  // 2. 단백질 기반 선택 이유
  const protein = mealNutrition.protein || 0;
  const recommendedProtein = (dailyGoal * 0.15) / 4; // 칼로리의 15%를 단백질로, 1g = 4kcal

  if (protein >= recommendedProtein * 0.8) {
    primaryReasons.push('단백질이 풍부하여 근육 유지와 회복에 도움이 됩니다');
    nutritionBenefits.push({
      nutrient: '단백질',
      amount: protein,
      unit: 'g',
      benefit: '근육 합성과 회복에 필요한 단백질을 제공합니다',
      currentStatus: '단백질 섭취 부족 시 근육량 감소 위험',
      improvement: '규칙적인 단백질 섭취로 근육량 유지 및 증가가 기대됩니다',
    });
  }

  // 3. 나트륨 기반 선택 이유 (고혈압, 신장질환 고려)
  const sodium = mealNutrition.sodium || 0;
  const dailySodiumLimit = isHypertension || isKidneyDisease ? 1500 : 2000; // mg

  if (sodium <= dailySodiumLimit * 0.4) {
    if (isHypertension) {
      primaryReasons.push('나트륨 함량이 낮아 고혈압 관리에 적합합니다');
      healthConditions.push({
        condition: '고혈압',
        whySelected: `나트륨 함량이 ${sodium}mg으로 낮아 혈압 관리에 도움이 됩니다`,
        expectedImprovement: '지속적인 저나트륨 식단으로 혈압 안정화가 기대됩니다',
      });
    } else if (isKidneyDisease) {
      primaryReasons.push('나트륨 함량이 낮아 신장 보호에 도움이 됩니다');
      healthConditions.push({
        condition: '신장질환',
        whySelected: `나트륨 함량이 ${sodium}mg으로 낮아 신장 부담을 줄입니다`,
        expectedImprovement: '지속적인 저나트륨 식단으로 신장 기능 보호가 기대됩니다',
      });
    } else {
      primaryReasons.push('나트륨 함량이 적절하여 건강한 식단입니다');
    }
  } else if (sodium > dailySodiumLimit * 0.5) {
    // 나트륨이 높은 경우 주의사항으로 처리 (이 함수에서는 선택 이유만 계산)
  }

  // 4. 탄수화물 기반 선택 이유 (당뇨 고려)
  const carbs = mealNutrition.carbohydrates || 0;
  const recommendedCarbs = (dailyGoal * 0.5) / 4; // 칼로리의 50%를 탄수화물로

  if (isDiabetes) {
    if (carbs <= recommendedCarbs * 0.8) {
      primaryReasons.push('탄수화물 함량이 적절하여 혈당 관리에 도움이 됩니다');
      healthConditions.push({
        condition: '당뇨',
        whySelected: `탄수화물 함량이 ${carbs.toFixed(1)}g으로 적절하여 혈당 급상승을 방지합니다`,
        expectedImprovement: '지속적인 혈당 관리로 당화혈색소 수치 개선이 기대됩니다',
      });
    }
  } else if (carbs >= recommendedCarbs * 0.7) {
    nutritionBenefits.push({
      nutrient: '탄수화물',
      amount: carbs,
      unit: 'g',
      benefit: '에너지원으로 활용되어 활동력 유지에 도움이 됩니다',
      currentStatus: '탄수화물 부족 시 피로감 증가',
      improvement: '충분한 탄수화물 섭취로 지속적인 에너지 공급이 가능합니다',
    });
  }

  // 5. 지방 기반 선택 이유 (고지혈증 고려)
  const fat = mealNutrition.fat || 0;
  const recommendedFat = (dailyGoal * 0.25) / 9; // 칼로리의 25%를 지방으로, 1g = 9kcal

  if (isHighCholesterol) {
    if (fat <= recommendedFat * 0.9) {
      primaryReasons.push('지방 함량이 적절하여 콜레스테롤 관리에 도움이 됩니다');
      healthConditions.push({
        condition: '고지혈증',
        whySelected: `지방 함량이 ${fat.toFixed(1)}g으로 적절하여 콜레스테롤 수치 관리에 도움이 됩니다`,
        expectedImprovement: '지속적인 지방 관리로 콜레스테롤 수치 개선이 기대됩니다',
      });
    }
  } else if (fat >= recommendedFat * 0.6) {
    nutritionBenefits.push({
      nutrient: '지방',
      amount: fat,
      unit: 'g',
      benefit: '필수 지방산 공급 및 지용성 비타민 흡수에 도움이 됩니다',
      currentStatus: '지방 부족 시 호르몬 불균형 위험',
      improvement: '적정 지방 섭취로 건강한 신진대사 유지가 기대됩니다',
    });
  }

  // 6. 식이섬유 기반 선택 이유
  const fiber = mealNutrition.fiber || 0;
  const recommendedFiber = 25; // g (일일 권장량)

  if (fiber >= recommendedFiber * 0.2) {
    primaryReasons.push('식이섬유가 풍부하여 소화 건강과 포만감 유지에 도움이 됩니다');
    nutritionBenefits.push({
      nutrient: '식이섬유',
      amount: fiber,
      unit: 'g',
      benefit: '소화 개선, 포만감 증가, 콜레스테롤 감소에 도움이 됩니다',
      currentStatus: '식이섬유 부족 시 변비 및 소화 장애 위험',
      improvement: '규칙적인 식이섬유 섭취로 소화 건강 개선이 기대됩니다',
    });
  }

  // 7. 통풍 고려 (퓨린 함량은 레시피 데이터에 없으므로 일반적인 가이드라인 적용)
  if (isGout) {
    // 통풍 환자는 일반적으로 저퓨린 식단이 필요하지만, 레시피 데이터에 퓨린 정보가 없으므로
    // 일반적인 건강 식단으로 간주
    healthConditions.push({
      condition: '통풍',
      whySelected: '균형 잡힌 영양소 구성으로 통풍 관리에 도움이 됩니다',
      expectedImprovement: '규칙적인 식사와 적절한 영양소 섭취로 통풍 증상 완화가 기대됩니다',
    });
  }

  // 8. 기본 선택 이유 (위 조건에 해당하지 않는 경우)
  if (primaryReasons.length === 0) {
    primaryReasons.push('균형 잡힌 영양소 구성으로 건강한 식단입니다');
  }

  console.log('계산 결과:', { primaryReasons, nutritionBenefits, healthConditions });
  console.groupEnd();

  return {
    primaryReasons,
    nutritionBenefits,
    healthConditions,
  };
}

