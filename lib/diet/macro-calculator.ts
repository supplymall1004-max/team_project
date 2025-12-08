/**
 * @file lib/diet/macro-calculator.ts
 * @description 매크로 목표 계산 시스템
 * 
 * 질병 및 상태에 따른 단백질, 탄수화물, 지방 목표를 계산합니다.
 * 문서 기준: docs/1.Calorie-counting-method/math.md
 */

import type { UserHealthProfile } from "@/types/health";

export interface MacroGoals {
  protein: {
    min: number; // g
    max: number; // g
    target: number; // g
  };
  carbohydrates: {
    min: number; // g
    max: number; // g
    target: number; // g
  };
  fat: {
    min: number; // g
    max: number; // g
    target: number; // g
  };
  sodium: {
    max: number; // mg
  };
}

/**
 * 표준 체중 계산 (Ideal Body Weight)
 * 남성: (키cm - 100) × 0.9
 * 여성: (키cm - 100) × 0.85
 */
function calculateIdealBodyWeight(
  height_cm: number,
  gender: "male" | "female" | "other"
): number {
  const base = height_cm - 100;
  if (gender === "male") {
    return base * 0.9;
  }
  return base * 0.85;
}

/**
 * 매크로 목표 계산
 */
export function calculateMacroGoals(
  dailyCalories: number,
  profile: UserHealthProfile
): MacroGoals {
  const diseases = profile.diseases || [];
  const hasCKD = diseases.includes("kidney_disease");
  const hasDiabetes = diseases.includes("diabetes");
  const hasCardiovascularDisease = diseases.includes("cardiovascular_disease");
  const hasGout = diseases.includes("gout");
  const isChild = profile.age !== null && profile.age < 18;

  // 표준 체중 계산 (CKD용)
  let idealBodyWeight: number | null = null;
  if (profile.height_cm && profile.gender) {
    idealBodyWeight = calculateIdealBodyWeight(
      profile.height_cm,
      profile.gender
    );
  }

  // 단백질 목표 계산 (질병별)
  let proteinMin = 0;
  let proteinMax = 0;
  let proteinTarget = 0;

  if (hasCKD && idealBodyWeight) {
    // CKD: 0.6~0.8 g/kg 표준 체중 (엄격히 제한)
    proteinMin = idealBodyWeight * 0.6;
    proteinMax = idealBodyWeight * 0.8;
    proteinTarget = idealBodyWeight * 0.7; // 중간값
  } else if (isChild) {
    // 어린이: 성장기 단백질 필요량 증가 (1.2~1.5 g/kg)
    const weight = profile.weight_kg || idealBodyWeight || 50;
    proteinMin = weight * 1.2;
    proteinMax = weight * 1.5;
    proteinTarget = weight * 1.35;
  } else {
    // 일반/다이어트: 1.2~1.6 g/kg 목표
    const weight = profile.weight_kg || idealBodyWeight || 60;
    proteinMin = weight * 1.2;
    proteinMax = weight * 1.6;
    proteinTarget = weight * 1.4;
  }

  // 탄수화물 목표 계산
  let carbMin = 0;
  let carbMax = 0;
  let carbTarget = 0;

  if (hasDiabetes) {
    // 당뇨: 탄수화물 제한 (일일 칼로리의 40-50%)
    // 1g 탄수화물 = 4kcal
    carbMin = (dailyCalories * 0.40) / 4;
    carbMax = (dailyCalories * 0.50) / 4;
    carbTarget = (dailyCalories * 0.45) / 4;
  } else if (isChild) {
    // 어린이: 성장기 탄수화물 필요량 증가 (50-60%)
    carbMin = (dailyCalories * 0.50) / 4;
    carbMax = (dailyCalories * 0.60) / 4;
    carbTarget = (dailyCalories * 0.55) / 4;
  } else {
    // 일반: 50-60%
    carbMin = (dailyCalories * 0.50) / 4;
    carbMax = (dailyCalories * 0.60) / 4;
    carbTarget = (dailyCalories * 0.55) / 4;
  }

  // 지방 목표 계산
  let fatMin = 0;
  let fatMax = 0;
  let fatTarget = 0;

  if (hasCardiovascularDisease) {
    // 심혈관 질환: 지방 제한 (일일 칼로리의 20-25%)
    // 1g 지방 = 9kcal
    fatMin = (dailyCalories * 0.20) / 9;
    fatMax = (dailyCalories * 0.25) / 9;
    fatTarget = (dailyCalories * 0.22) / 9;
  } else if (isChild) {
    // 어린이: 성장기 지방 필요량 (25-30%)
    fatMin = (dailyCalories * 0.25) / 9;
    fatMax = (dailyCalories * 0.30) / 9;
    fatTarget = (dailyCalories * 0.27) / 9;
  } else {
    // 일반: 25-30%
    fatMin = (dailyCalories * 0.25) / 9;
    fatMax = (dailyCalories * 0.30) / 9;
    fatTarget = (dailyCalories * 0.27) / 9;
  }

  // 나트륨 목표 (모든 경우 2,000 mg/일 이하)
  const sodiumMax = 2000;

  return {
    protein: {
      min: Math.round(proteinMin),
      max: Math.round(proteinMax),
      target: Math.round(proteinTarget),
    },
    carbohydrates: {
      min: Math.round(carbMin),
      max: Math.round(carbMax),
      target: Math.round(carbTarget),
    },
    fat: {
      min: Math.round(fatMin),
      max: Math.round(fatMax),
      target: Math.round(fatTarget),
    },
    sodium: {
      max: sodiumMax,
    },
  };
}

/**
 * 식사별 매크로 목표 계산
 */
export function calculateMealMacroGoals(
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  dailyMacroGoals: MacroGoals,
  mealCalorieRatio: number
): MacroGoals {
  return {
    protein: {
      min: Math.round(dailyMacroGoals.protein.min * mealCalorieRatio),
      max: Math.round(dailyMacroGoals.protein.max * mealCalorieRatio),
      target: Math.round(dailyMacroGoals.protein.target * mealCalorieRatio),
    },
    carbohydrates: {
      min: Math.round(dailyMacroGoals.carbohydrates.min * mealCalorieRatio),
      max: Math.round(dailyMacroGoals.carbohydrates.max * mealCalorieRatio),
      target: Math.round(dailyMacroGoals.carbohydrates.target * mealCalorieRatio),
    },
    fat: {
      min: Math.round(dailyMacroGoals.fat.min * mealCalorieRatio),
      max: Math.round(dailyMacroGoals.fat.max * mealCalorieRatio),
      target: Math.round(dailyMacroGoals.fat.target * mealCalorieRatio),
    },
    sodium: {
      max: Math.round(dailyMacroGoals.sodium.max * mealCalorieRatio),
    },
  };
}

/**
 * 현재 영양소가 매크로 목표 범위 내에 있는지 확인
 */
export function isWithinMacroRange(
  current: { protein: number; carbs: number; fat: number },
  goals: MacroGoals
): {
  passed: boolean;
  proteinScore: number; // 0-100 (목표 달성도)
  carbScore: number;
  fatScore: number;
  totalScore: number; // 평균 점수
} {
  // 단백질 점수 (목표에 가까울수록 높은 점수)
  const proteinDiff = Math.abs(current.protein - goals.protein.target);
  const proteinRange = goals.protein.max - goals.protein.min;
  const proteinScore = Math.max(
    0,
    100 - (proteinDiff / (proteinRange || 1)) * 100
  );

  // 탄수화물 점수
  const carbDiff = Math.abs(current.carbs - goals.carbohydrates.target);
  const carbRange = goals.carbohydrates.max - goals.carbohydrates.min;
  const carbScore = Math.max(
    0,
    100 - (carbDiff / (carbRange || 1)) * 100
  );

  // 지방 점수
  const fatDiff = Math.abs(current.fat - goals.fat.target);
  const fatRange = goals.fat.max - goals.fat.min;
  const fatScore = Math.max(0, 100 - (fatDiff / (fatRange || 1)) * 100);

  // 범위 내 여부 확인
  const proteinInRange =
    current.protein >= goals.protein.min &&
    current.protein <= goals.protein.max;
  const carbInRange =
    current.carbs >= goals.carbohydrates.min &&
    current.carbs <= goals.carbohydrates.max;
  const fatInRange =
    current.fat >= goals.fat.min && current.fat <= goals.fat.max;

  const passed = proteinInRange && carbInRange && fatInRange;
  const totalScore = (proteinScore + carbScore + fatScore) / 3;

  return {
    passed,
    proteinScore,
    carbScore,
    fatScore,
    totalScore,
  };
}


