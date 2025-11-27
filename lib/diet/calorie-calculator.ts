/**
 * @file lib/diet/calorie-calculator.ts
 * @description 정밀 칼로리 계산 시스템 - Harris-Benedict 공식 + 한국영양학회 권장 칼로리
 * 
 * 핵심 기능:
 * 1. 기초대사량(BMR) 계산 - Harris-Benedict 공식
 * 2. 연령별 권장 칼로리 (18세 미만 또는 키/몸무게 없음)
 * 3. 질병별 칼로리 조정 계수
 * 4. 활동 수준별 칼로리 계수
 */

import type { FamilyMember, UserHealthProfile } from "@/types/family";

// 질병별 칼로리 조정 계수
const DISEASE_CALORIE_MULTIPLIERS: Record<string, number> = {
  diabetes: 0.85,         // 당뇨: 85%
  hypertension: 1.0,      // 고혈압: 유지 (나트륨만 제한)
  gout: 0.9,              // 통풍: 90%
  kidney_disease: 0.9,    // 신장질환: 90%
  hyperlipidemia: 0.85,   // 고지혈증: 85%
  obesity: 0.8,           // 비만: 80%
  heart_disease: 0.9,     // 심장병: 90%
};

// 활동 수준별 칼로리 계수
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,         // 주로 앉아서 생활
  light: 1.375,           // 가벼운 운동 (주 1-3회)
  moderate: 1.55,         // 중간 강도 운동 (주 3-5회)
  active: 1.725,          // 활발한 운동 (주 6-7회)
  very_active: 1.9,       // 매우 활발한 운동 (하루 2회)
};

// 연령별 권장 칼로리 (한국영양학회 기준)
const AGE_BASED_CALORIES = {
  "1-2": { male: 1000, female: 1000 },
  "3-5": { male: 1400, female: 1400 },
  "6-8": { male: 1700, female: 1500 },
  "9-11": { male: 2100, female: 1800 },
  "12-14": { male: 2500, female: 2000 },
  "15-18": { male: 2700, female: 2000 },
  "19-29": { male: 2600, female: 2100 },
  "30-49": { male: 2400, female: 1900 },
  "50-64": { male: 2200, female: 1800 },
  "65+": { male: 2000, female: 1600 },
} as const;

/**
 * 나이에 따른 권장 칼로리 범위 결정
 */
function getAgeRangeKey(age: number): keyof typeof AGE_BASED_CALORIES {
  if (age >= 1 && age <= 2) return "1-2";
  if (age >= 3 && age <= 5) return "3-5";
  if (age >= 6 && age <= 8) return "6-8";
  if (age >= 9 && age <= 11) return "9-11";
  if (age >= 12 && age <= 14) return "12-14";
  if (age >= 15 && age <= 18) return "15-18";
  if (age >= 19 && age <= 29) return "19-29";
  if (age >= 30 && age <= 49) return "30-49";
  if (age >= 50 && age <= 64) return "50-64";
  return "65+";
}

/**
 * 기초대사량(BMR) 계산 - Harris-Benedict 공식
 * 
 * 남성: 88.362 + (13.397 × 체중kg) + (4.799 × 키cm) - (5.677 × 나이)
 * 여성: 447.593 + (9.247 × 체중kg) + (3.098 × 키cm) - (4.330 × 나이)
 */
function calculateBMR(
  gender: "male" | "female" | "other",
  weight_kg: number,
  height_cm: number,
  age: number
): number {
  if (gender === "male") {
    return 88.362 + 13.397 * weight_kg + 4.799 * height_cm - 5.677 * age;
  } else {
    // 여성 및 기타
    return 447.593 + 9.247 * weight_kg + 3.098 * height_cm - 4.33 * age;
  }
}

/**
 * 일일 권장 칼로리 계산 (개선 버전)
 * 
 * @example
 * const calories = calculateDailyCalories({
 *   gender: "female",
 *   weight_kg: 60,
 *   height_cm: 160,
 *   age: 40,
 *   activity_level: "sedentary",
 *   diseases: ["diabetes"]
 * });
 * // 결과: 약 1360 kcal (1600 × 0.85)
 */
export function calculateDailyCalories(params: {
  gender: "male" | "female" | "other";
  weight_kg?: number;
  height_cm?: number;
  age: number;
  activity_level: keyof typeof ACTIVITY_MULTIPLIERS;
  diseases?: string[];
}): number {
  console.group("🔢 일일 권장 칼로리 계산");
  console.log("입력 정보:", params);

  let dailyCalories: number;

  // 12세 이상 + 키/몸무게 있음 → Harris-Benedict 공식 사용
  if (params.age >= 12 && params.weight_kg && params.height_cm) {
    console.log("📐 Harris-Benedict 공식 사용 (12세 이상 + 키/몸무게 있음)");
    
    const bmr = calculateBMR(
      params.gender,
      params.weight_kg,
      params.height_cm,
      params.age
    );
    console.log(`기초대사량 (BMR): ${Math.round(bmr)}kcal`);

    const activityMultiplier = ACTIVITY_MULTIPLIERS[params.activity_level] || 1.2;
    dailyCalories = bmr * activityMultiplier;
    console.log(`활동 수준 (${params.activity_level}): ×${activityMultiplier} = ${Math.round(dailyCalories)}kcal`);
  }
  // 12세 미만 또는 키/몸무게 없음 → 연령별 권장 칼로리
  else {
    console.log("📊 한국영양학회 권장 칼로리 사용");
    
    const ageRangeKey = getAgeRangeKey(params.age);
    const genderKey = params.gender === "male" ? "male" : "female";
    const baseCalories = AGE_BASED_CALORIES[ageRangeKey][genderKey];
    
    console.log(`연령대: ${ageRangeKey}, 성별: ${genderKey}`);
    console.log(`기본 권장 칼로리: ${baseCalories}kcal`);

    // 활동 수준 반영 (경미하게, ±15%)
    const activityMultiplier = ACTIVITY_MULTIPLIERS[params.activity_level] || 1.2;
    const activityAdjustment = (activityMultiplier - 1.2) * 0.15 + 1; // 0.85 ~ 1.15
    dailyCalories = baseCalories * activityAdjustment;
    
    console.log(`활동 조정: ×${activityAdjustment.toFixed(2)} = ${Math.round(dailyCalories)}kcal`);
  }

  // 질병별 조정 (가장 낮은 계수 적용)
  if (params.diseases && params.diseases.length > 0) {
    console.log(`질병 정보: ${params.diseases.join(", ")}`);
    
    let lowestMultiplier = 1.0;
    let appliedDisease = "";
    
    for (const disease of params.diseases) {
      const multiplier = DISEASE_CALORIE_MULTIPLIERS[disease];
      if (multiplier && multiplier < lowestMultiplier) {
        lowestMultiplier = multiplier;
        appliedDisease = disease;
      }
    }
    
    if (appliedDisease) {
      console.log(`질병 조정 (${appliedDisease}): ×${lowestMultiplier}`);
      dailyCalories *= lowestMultiplier;
    }
  }

  const result = Math.round(dailyCalories);
  console.log(`✅ 최종 권장 칼로리: ${result}kcal`);
  console.groupEnd();

  return result;
}

/**
 * 가족 구성원의 목표 칼로리 계산
 */
export function calculateMemberGoalCalories(
  member: FamilyMember,
  age: number
): number {
  return calculateDailyCalories({
    gender: member.gender || "other",
    weight_kg: member.weight_kg,
    height_cm: member.height_cm,
    age,
    activity_level: member.activity_level || "sedentary",
    diseases: member.diseases,
  });
}

/**
 * 사용자 본인의 목표 칼로리 계산
 */
export function calculateUserGoalCalories(
  profile: UserHealthProfile
): number {
  // daily_calorie_goal이 수동 설정되어 있으면 그것을 사용
  if (profile.daily_calorie_goal) {
    return profile.daily_calorie_goal;
  }

  return calculateDailyCalories({
    gender: profile.gender || "other",
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    age: profile.age || 30,
    activity_level: profile.activity_level || "sedentary",
    diseases: profile.diseases,
  });
}

/**
 * 질병별 나트륨 제한 (mg/일)
 */
export const DISEASE_SODIUM_LIMITS: Record<string, number> = {
  hypertension: 2000,      // 고혈압: 2000mg 이하
  kidney_disease: 1500,    // 신장질환: 1500mg 이하
  heart_disease: 1500,     // 심장질환: 1500mg 이하
};

/**
 * 저염식 여부 판단
 */
export function requiresLowSodiumDiet(diseases?: string[]): boolean {
  if (!diseases || diseases.length === 0) {
    return false;
  }

  const lowSodiumDiseases = ["hypertension", "kidney_disease", "heart_disease"];
  return diseases.some(d => lowSodiumDiseases.includes(d));
}

