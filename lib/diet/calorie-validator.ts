/**
 * @file lib/diet/calorie-validator.ts
 * @description 질병별 최소 칼로리 검증 및 경고 시스템
 * 
 * 핵심 기능:
 * 1. 질병별 최소 안전 칼로리 검증
 * 2. 프리미엄 식단 + 질병 조합 시 안전한 칼로리 범위 계산
 * 3. 강력한 경고 메시지 생성
 */

import type { UserHealthProfile } from "@/types/health";

/**
 * 질병별 최소 안전 칼로리 (성인 기준)
 */
const DISEASE_MIN_CALORIES: Record<string, { male: number; female: number }> = {
  diabetes: { male: 1500, female: 1200 },
  hypertension: { male: 1500, female: 1200 },
  obesity: { male: 1500, female: 1200 },
  kidney_disease: { male: 1500, female: 1200 },
  cardiovascular_disease: { male: 1500, female: 1200 },
  gastrointestinal_disorder: { male: 1500, female: 1200 },
  liver_disease: { male: 1500, female: 1200 },
  gout: { male: 1500, female: 1200 },
  high_cholesterol: { male: 1500, female: 1200 },
  thyroid_disorder: { male: 1500, female: 1200 },
};

/**
 * 기본 최소 칼로리 (질병이 없는 경우)
 */
const DEFAULT_MIN_CALORIES = {
  male: 1500,
  female: 1200,
  other: 1200, // 안전을 위해 여성 기준 사용
};

/**
 * 칼로리 검증 결과
 */
export interface CalorieValidationResult {
  isValid: boolean;
  severity: "critical" | "warning" | "info" | "none";
  message: string;
  recommendedCalories: number;
  currentCalories: number;
  minRequiredCalories: number;
  details: string[];
}

/**
 * 질병별 최소 칼로리 계산
 */
function getMinimumCalories(
  profile: UserHealthProfile
): number {
  const gender = profile.gender || "other";
  const age = profile.age || 30;
  
  // 18세 미만은 별도 처리 (성장기)
  if (age < 18) {
    // 어린이/청소년은 연령별 권장 칼로리 사용
    if (age < 12) return 1000;
    if (age < 15) return 1500;
    return 1800;
  }

  // 질병이 있는 경우 가장 엄격한 기준 적용
  if (profile.diseases && profile.diseases.length > 0) {
    let maxMinCalories = DEFAULT_MIN_CALORIES[gender];
    
    for (const disease of profile.diseases) {
      const diseaseMin = DISEASE_MIN_CALORIES[disease.code];
      if (diseaseMin) {
        const minForDisease = diseaseMin[gender === "male" ? "male" : "female"];
        maxMinCalories = Math.max(maxMinCalories, minForDisease);
      }
    }
    
    return maxMinCalories;
  }

  // 질병이 없는 경우 기본 최소 칼로리
  return DEFAULT_MIN_CALORIES[gender];
}

/**
 * 프리미엄 식단 + 질병 조합 시 안전한 칼로리 범위 계산
 */
function calculateSafeCalorieRange(
  profile: UserHealthProfile,
  calculatedCalories: number
): { min: number; max: number; recommended: number } {
  const minCalories = getMinimumCalories(profile);
  const gender = profile.gender || "other";
  
  // 프리미엄 식단이 있는 경우
  const hasPremiumDiet = profile.premium_features && profile.premium_features.length > 0;
  const hasDiseases = profile.diseases && profile.diseases.length > 0;
  
  if (hasPremiumDiet && hasDiseases) {
    // 프리미엄 식단 + 질병 조합: 최소 칼로리 보장 + 적절한 감량 범위
    // 몸에 무리 없는 선: 최소 칼로리 ~ 계산된 칼로리의 90% 사이
    const safeMin = minCalories;
    const safeMax = Math.max(calculatedCalories * 0.9, minCalories * 1.1);
    const recommended = Math.max(
      minCalories * 1.1, // 최소 칼로리의 110% (안전 마진)
      Math.min(calculatedCalories * 0.85, safeMax) // 계산된 칼로리의 85% 또는 안전 최대값 중 작은 값
    );
    
    return {
      min: Math.round(safeMin),
      max: Math.round(safeMax),
      recommended: Math.round(recommended),
    };
  }
  
  // 일반 경우: 최소 칼로리 보장
  return {
    min: minCalories,
    max: calculatedCalories,
    recommended: Math.max(minCalories, calculatedCalories * 0.9),
  };
}

/**
 * 칼로리 검증 및 경고 메시지 생성
 */
export function validateCalories(
  profile: UserHealthProfile,
  calculatedCalories: number,
  actualCalories?: number
): CalorieValidationResult {
  const minCalories = getMinimumCalories(profile);
  const gender = profile.gender || "other";
  const age = profile.age || 30;
  const diseases = profile.diseases || [];
  const hasDiseases = diseases.length > 0;
  const hasPremiumDiet = profile.premium_features && profile.premium_features.length > 0;
  
  // 실제 칼로리 또는 계산된 칼로리 사용
  const caloriesToCheck = actualCalories ?? calculatedCalories;
  
  // 프리미엄 식단 + 질병 조합 시 안전 범위 계산
  const safeRange = calculateSafeCalorieRange(profile, calculatedCalories);
  
  const details: string[] = [];
  let severity: CalorieValidationResult["severity"] = "none";
  let message = "";
  
  // 1. 최소 칼로리 미만 (치명적)
  if (caloriesToCheck < minCalories) {
    severity = "critical";
    const deficit = minCalories - caloriesToCheck;
    const percentage = ((deficit / minCalories) * 100).toFixed(1);
    
    message = `⚠️ [치명적 경고] 현재 칼로리(${caloriesToCheck}kcal)가 최소 필요량(${minCalories}kcal)보다 ${deficit}kcal(${percentage}%) 부족합니다.`;
    
    details.push(`현재 칼로리: ${caloriesToCheck}kcal`);
    details.push(`최소 필요량: ${minCalories}kcal`);
    details.push(`부족량: ${deficit}kcal`);
    
    if (hasDiseases) {
      const diseaseNames = diseases.map(d => d.custom_name || d.code).join(", ");
      details.push(`질병 상태: ${diseaseNames}`);
      message += `\n\n질병(${diseaseNames})을 고려할 때 최소 ${minCalories}kcal 이상 섭취해야 합니다.`;
    }
    
    if (hasPremiumDiet) {
      message += `\n\n프리미엄 식단과 질병을 함께 고려할 때, 안전한 칼로리 범위는 ${safeRange.min}kcal ~ ${safeRange.max}kcal입니다.`;
      message += `\n권장 칼로리: ${safeRange.recommended}kcal`;
      details.push(`안전 범위: ${safeRange.min}kcal ~ ${safeRange.max}kcal`);
      details.push(`권장 칼로리: ${safeRange.recommended}kcal`);
    }
    
    message += `\n\n이 정도의 칼로리 부족은 신체 기능 저하, 근육 손실, 면역력 저하를 일으킬 수 있습니다. 반드시 ${minCalories}kcal 이상 섭취하시기 바랍니다.`;
  }
  // 2. 최소 칼로리 근처 (경고)
  else if (caloriesToCheck < minCalories * 1.1) {
    severity = "warning";
    const margin = (minCalories * 1.1) - caloriesToCheck;
    
    message = `⚠️ [주의] 현재 칼로리(${caloriesToCheck}kcal)가 최소 필요량(${minCalories}kcal)에 근접합니다.`;
    
    details.push(`현재 칼로리: ${caloriesToCheck}kcal`);
    details.push(`최소 필요량: ${minCalories}kcal`);
    details.push(`안전 마진: ${Math.round(margin)}kcal`);
    
    if (hasDiseases) {
      message += `\n\n질병을 고려할 때 최소 ${minCalories}kcal 이상 섭취하는 것이 안전합니다.`;
    }
    
    if (hasPremiumDiet) {
      message += `\n\n프리미엄 식단과 질병을 함께 고려할 때, 권장 칼로리는 ${safeRange.recommended}kcal입니다.`;
      details.push(`권장 칼로리: ${safeRange.recommended}kcal`);
    }
  }
  // 3. 프리미엄 식단 + 질병 조합 시 안전 범위 안내
  else if (hasPremiumDiet && hasDiseases) {
    if (caloriesToCheck < safeRange.recommended) {
      severity = "info";
      message = `💡 [안내] 프리미엄 식단과 질병을 함께 고려할 때, 권장 칼로리는 ${safeRange.recommended}kcal입니다.`;
      message += `\n현재 칼로리(${caloriesToCheck}kcal)는 안전 범위(${safeRange.min}kcal ~ ${safeRange.max}kcal) 내에 있지만, 권장 칼로리에 근접하면 더욱 안전합니다.`;
      details.push(`현재 칼로리: ${caloriesToCheck}kcal`);
      details.push(`권장 칼로리: ${safeRange.recommended}kcal`);
      details.push(`안전 범위: ${safeRange.min}kcal ~ ${safeRange.max}kcal`);
    } else {
      severity = "none";
      message = `✅ 현재 칼로리(${caloriesToCheck}kcal)가 안전 범위 내에 있습니다.`;
      details.push(`현재 칼로리: ${caloriesToCheck}kcal`);
      details.push(`안전 범위: ${safeRange.min}kcal ~ ${safeRange.max}kcal`);
    }
  }
  // 4. 정상 범위
  else {
    severity = "none";
    message = `✅ 현재 칼로리(${caloriesToCheck}kcal)가 적정 범위 내에 있습니다.`;
    details.push(`현재 칼로리: ${caloriesToCheck}kcal`);
    details.push(`최소 필요량: ${minCalories}kcal`);
  }
  
  return {
    isValid: severity !== "critical",
    severity,
    message,
    recommendedCalories: hasPremiumDiet && hasDiseases ? safeRange.recommended : Math.max(minCalories, calculatedCalories * 0.9),
    currentCalories: caloriesToCheck,
    minRequiredCalories: minCalories,
    details,
  };
}

/**
 * 식단 생성 전 칼로리 목표 검증 (최우선)
 */
export function validateCalorieGoal(
  profile: UserHealthProfile,
  goalCalories: number
): CalorieValidationResult {
  return validateCalories(profile, goalCalories, goalCalories);
}

