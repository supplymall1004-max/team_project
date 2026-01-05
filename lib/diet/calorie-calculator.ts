/**
 * @file lib/diet/calorie-calculator.ts
 * @description 정밀 칼로리 계산 시스템 - Mifflin-St Jeor 공식 (개선됨) + 한국영양학회 권장 칼로리
 * 
 * 핵심 기능:
 * 1. 기초대사량(BMR) 계산 - Mifflin-St Jeor 공식 (가장 정확도가 높음)
 * 2. 연령별 권장 칼로리 (18세 미만 또는 키/몸무게 없음)
 * 3. 질병별 칼로리 조정 계수
 * 4. 활동 수준별 칼로리 계수
 */

import type { FamilyMember } from "@/types/family";
import type { UserHealthProfile } from "@/types/health";

// 질병별 칼로리 조정 계수 (문서 기준 업데이트)
const DISEASE_CALORIE_MULTIPLIERS: Record<string, number> = {
  diabetes: 0.80,         // 당뇨: 80-90% (문서 기준, 보수적으로 80% 사용)
  hypertension: 1.0,      // 고혈압: 유지 (나트륨만 제한, 체중 감량 필요 시 -500~-1000 kcal 별도 처리)
  gout: 0.9,              // 통풍: 90%
  kidney_disease: 0.9,    // 신장질환: 90% (CKD는 별도 공식 사용)
  hyperlipidemia: 0.85,   // 고지혈증: 85%
  obesity: 0.8,           // 비만: 80%
  heart_disease: 0.9,     // 심장병: 90% (체중 감량 필요 시 -500~-1000 kcal 별도 처리)
};

// 활동 수준별 칼로리 계수
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,         // 거의 활동 없음 (좌식 생활)
  light: 1.375,           // 가벼운 활동 (주 1-3회 운동)
  moderate: 1.55,         // 보통 활동 (주 3-5회 운동)
  active: 1.725,          // 활동적 (주 6-7회 운동)
  very_active: 1.9,       // 매우 활동적 (매일 2회 운동/육체노동)
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
 * 기초대사량(BMR) 계산 - Mifflin-St Jeor 공식
 * 
 * 남성: (10 × 체중kg) + (6.25 × 키cm) - (5 × 나이) + 5
 * 여성: (10 × 체중kg) + (6.25 × 키cm) - (5 × 나이) - 161
 */
export function calculateBMR(
  gender: "male" | "female" | "other",
  weight_kg: number,
  height_cm: number,
  age: number
): number {
  // 기본 계산: (10 × 체중) + (6.25 × 키) - (5 × 나이)
  let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);

  if (gender === "male") {
    bmr += 5;
  } else {
    // 여성 및 기타 (기본적으로 여성 기준으로 보수적 접근)
    bmr -= 161;
  }
  
  return bmr;
}

/**
 * 일일 권장 칼로리 계산 (고도화된 버전)
 * CalorieCalculatorEnhanced를 사용하여 다중 공식 지원
 */
export async function calculateDailyCalories(params: {
  gender: "male" | "female" | "other";
  weight_kg?: number;
  height_cm?: number;
  age: number;
  activity_level: keyof typeof ACTIVITY_MULTIPLIERS;
  diseases?: string[];
  premium_features?: string[]; // 프리미엄 기능 (예: diet 모드)
  pregnancy_trimester?: 1 | 2 | 3; // 임신 삼분기
}): Promise<number> {
  console.group("🔢 일일 권장 칼로리 계산 (고도화)");
  console.log("입력 정보:", params);

  // CalorieCalculatorEnhanced 사용
  const { CalorieCalculatorEnhanced } = await import("@/lib/health/calorie-calculator-enhanced");
  const { DiseaseManager } = await import("@/lib/health/disease-manager");

  // 질병 정보 조회 (있는 경우)
  let diseaseObjects: any[] = [];
  if (params.diseases && params.diseases.length > 0) {
    const allDiseases = await DiseaseManager.getAllDiseases();
    diseaseObjects = allDiseases.filter(d => params.diseases!.includes(d.code));
  }

  // 임신부인 경우
  if (params.pregnancy_trimester) {
    const result = CalorieCalculatorEnhanced.calculateMaternityCalories({
      gender: params.gender === "male" ? "male" : "female",
      age: params.age,
      weight: params.weight_kg || 60,
      height: params.height_cm || 160,
      activityLevel: params.activity_level,
      diseases: diseaseObjects,
      trimester: params.pregnancy_trimester,
    });
    console.log(`✅ 임신부 칼로리 계산 완료: ${result.calories}kcal`);
    console.groupEnd();
    return result.calories;
  }

  // CKD 환자인 경우
  const hasCKD = diseaseObjects.some(d => d.code === 'kidney_disease' || d.name_ko?.includes('신장'));
  if (hasCKD && params.weight_kg && params.height_cm) {
    const result = CalorieCalculatorEnhanced.calculateCKDCalories({
      gender: params.gender === "male" ? "male" : "female",
      age: params.age,
      weight: params.weight_kg,
      height: params.height_cm,
    });
    console.log(`✅ CKD 칼로리 계산 완료: ${result.calories}kcal`);
    console.groupEnd();
    return result.calories;
  }

  // 자동 공식 선택 (연령대 및 질병 기반)
  if (params.age >= 3 && params.weight_kg && params.height_cm) {
    const result = CalorieCalculatorEnhanced.calculateAuto({
      gender: params.gender === "male" ? "male" : "female",
      age: params.age,
      weight: params.weight_kg,
      height: params.height_cm,
      activityLevel: params.activity_level,
      diseases: diseaseObjects,
    });
    
    let dailyCalories = result.calories;
    
    // 심혈관 질환 체중 감량 필요 시 -500~-1000 kcal
    const hasCVD = diseaseObjects.some(d => 
      d.code === 'heart_disease' || 
      d.code === 'hypertension' || 
      d.name_ko?.includes('심혈관') || 
      d.name_ko?.includes('고혈압')
    );
    if (hasCVD) {
      // 비만/과체중 판단 (BMI 25 이상)
      const bmi = params.weight_kg! / Math.pow(params.height_cm! / 100, 2);
      if (bmi >= 25) {
        const reduction = 750; // 중간값 사용
        dailyCalories = Math.max(dailyCalories - reduction, params.gender === "male" ? 1500 : 1200);
        console.log(`심혈관 질환 체중 감량 조정: -${reduction}kcal`);
      }
    }

    // 프리미엄 기능: 다이어트 모드 (질병이 있는 경우 안전 범위 고려)
    if (params.premium_features && params.premium_features.includes("diet")) {
      console.log("💎 프리미엄 기능: 다이어트 모드 적용");
      
      // 질병이 있는 경우 안전한 감량 범위 적용
      const hasDiseases = params.diseases && params.diseases.length > 0;
      if (hasDiseases) {
        // 질병 + 프리미엄 식단: 최소 칼로리 보장 + 적절한 감량 (85% ~ 90%)
        const minCalories = params.gender === "male" ? 1500 : 1200;
        const safeMin = minCalories;
        const safeMax = dailyCalories * 0.9;
        const recommended = Math.max(safeMin * 1.1, dailyCalories * 0.85);
        
        console.log(`질병 + 프리미엄 식단: 안전 범위 고려`);
        console.log(`안전 최소: ${safeMin}kcal, 안전 최대: ${Math.round(safeMax)}kcal`);
        console.log(`권장 칼로리: ${Math.round(recommended)}kcal`);
        
        // 권장 칼로리 사용 (최소 칼로리보다 높게 보장)
        dailyCalories = Math.max(recommended, safeMin);
      } else {
        // 질병이 없는 경우: 기존 로직 (85%)
        const dietMultiplier = 0.85;
        dailyCalories *= dietMultiplier;
        console.log(`다이어트 모드 조정: ×${dietMultiplier}`);
      }
    }

    console.log(`✅ 최종 권장 칼로리: ${Math.round(dailyCalories)}kcal`);
    console.groupEnd();
    return Math.round(dailyCalories);
  }

  // 3세 미만 또는 키/몸무게 없음 → 연령별 권장 칼로리
  console.log("📊 한국영양학회 권장 칼로리 사용");
  
  const ageRangeKey = getAgeRangeKey(params.age);
  const genderKey = params.gender === "male" ? "male" : "female";
  const baseCalories = AGE_BASED_CALORIES[ageRangeKey][genderKey];
  
  console.log(`연령대: ${ageRangeKey}, 성별: ${genderKey}`);
  console.log(`기본 권장 칼로리: ${baseCalories}kcal`);

  // 활동 수준 반영 (경미하게, ±15%)
  const activityMultiplier = ACTIVITY_MULTIPLIERS[params.activity_level] || 1.2;
  const activityAdjustment = (activityMultiplier - 1.2) * 0.15 + 1; // 0.85 ~ 1.15
  let dailyCalories = baseCalories * activityAdjustment;
  
  console.log(`활동 조정: ×${activityAdjustment.toFixed(2)} = ${Math.round(dailyCalories)}kcal`);

  // 질병별 조정 (가장 낮은 계수 적용)
  if (params.diseases && params.diseases.length > 0) {
    console.log(`질병 정보: ${params.diseases.join(", ")}`);
    
    let lowestMultiplier = 1.0;
    let appliedDisease = "";
    
    for (const disease of params.diseases) {
      // CKD는 이미 별도 공식으로 처리되었으므로 건너뛰기
      if (disease === 'kidney_disease') continue;
      
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
  
  // 최소 칼로리 보장 (문서 기준: 남성 1500, 여성 1200)
  let minCalories = 1200;
  if (params.gender === "male") minCalories = 1500;
  
  if (result < minCalories && params.age >= 19) { // 성인인 경우만 최소 칼로리 적용
     console.log(`⚠️ 계산된 칼로리(${result})가 최소 권장량(${minCalories})보다 낮아 조정함`);
     console.groupEnd();
     return minCalories;
  }

  console.log(`✅ 최종 권장 칼로리: ${result}kcal`);
  console.groupEnd();

  return result;
}

/**
 * 일일 권장 칼로리 계산 (동기 버전, 하위 호환성 유지)
 * @deprecated 비동기 버전 사용 권장
 */
export function calculateDailyCaloriesSync(params: {
  gender: "male" | "female" | "other";
  weight_kg?: number;
  height_cm?: number;
  age: number;
  activity_level: keyof typeof ACTIVITY_MULTIPLIERS;
  diseases?: string[];
  premium_features?: string[]; // 프리미엄 기능 (예: diet 모드)
}): number {
  // 동기 버전은 기본 계산만 수행 (고도화된 공식은 비동기 버전에서만 사용)
  console.group("🔢 일일 권장 칼로리 계산 (동기 버전)");
  console.log("입력 정보:", params);

  let dailyCalories: number;

  // 12세 이상 + 키/몸무게 있음 → Mifflin-St Jeor 공식 사용
  if (params.age >= 12 && params.weight_kg && params.height_cm) {
    console.log("📐 Mifflin-St Jeor 공식 사용");
    
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

  // 프리미엄 기능: 다이어트 모드 (질병이 있는 경우 안전 범위 고려)
  if (params.premium_features && params.premium_features.includes("diet")) {
    console.log("💎 프리미엄 기능: 다이어트 모드 적용");
    
    // 질병이 있는 경우 안전한 감량 범위 적용
    const hasDiseases = params.diseases && params.diseases.length > 0;
    if (hasDiseases) {
      // 질병 + 프리미엄 식단: 최소 칼로리 보장 + 적절한 감량 (85% ~ 90%)
      const minCalories = params.gender === "male" ? 1500 : 1200;
      const safeMin = minCalories;
      const safeMax = dailyCalories * 0.9;
      const recommended = Math.max(safeMin * 1.1, dailyCalories * 0.85);
      
      console.log(`질병 + 프리미엄 식단: 안전 범위 고려`);
      console.log(`안전 최소: ${safeMin}kcal, 안전 최대: ${Math.round(safeMax)}kcal`);
      console.log(`권장 칼로리: ${Math.round(recommended)}kcal`);
      
      // 권장 칼로리 사용 (최소 칼로리보다 높게 보장)
      dailyCalories = Math.max(recommended, safeMin);
    } else {
      // 질병이 없는 경우: 기존 로직 (85%)
      const dietMultiplier = 0.85;
      dailyCalories *= dietMultiplier;
      console.log(`다이어트 모드 조정: ×${dietMultiplier}`);
    }
  }

  const result = Math.round(dailyCalories);
  
  // 최소 칼로리 보장 (문서 기준: 남성 1500, 여성 1200)
  let minCalories = 1200;
  if (params.gender === "male") minCalories = 1500;
  
  if (result < minCalories && params.age >= 19) { // 성인인 경우만 최소 칼로리 적용
     console.log(`⚠️ 계산된 칼로리(${result})가 최소 권장량(${minCalories})보다 낮아 조정함`);
     console.groupEnd();
     return minCalories;
  }

  console.log(`✅ 최종 권장 칼로리: ${result}kcal`);
  console.groupEnd();

  return result;
}

/**
 * 가족 구성원의 목표 칼로리 계산 (비동기)
 */
export async function calculateMemberGoalCalories(
  member: FamilyMember,
  age: number
): Promise<number> {
  return await calculateDailyCalories({
    gender: member.gender || "other",
    weight_kg: member.weight_kg,
    height_cm: member.height_cm,
    age,
    activity_level: member.activity_level || "sedentary",
    diseases: member.diseases,
    // 가족 멤버에는 아직 premium_features 필드가 명시적으로 없지만, 추후 확장 가능
  });
}

/**
 * 사용자 본인의 목표 칼로리 계산 (비동기)
 */
export async function calculateUserGoalCalories(
  profile: UserHealthProfile
): Promise<number> {
  // daily_calorie_goal이 수동 설정되어 있으면 그것을 사용
  if (profile.daily_calorie_goal) {
    return profile.daily_calorie_goal;
  }

  return await calculateDailyCalories({
    gender: profile.gender || "other",
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    age: profile.age || 30,
    activity_level: profile.activity_level || "sedentary",
    diseases: profile.diseases?.map(d => d.code),
    premium_features: profile.premium_features,
    pregnancy_trimester: (profile as any).pregnancy_trimester, // 임신 삼분기 (있는 경우)
  });
}

/**
 * 사용자 본인의 목표 칼로리 계산 (동기 버전, 하위 호환성)
 * @deprecated 비동기 버전 사용 권장
 */
export function calculateUserGoalCaloriesSync(
  profile: UserHealthProfile
): number {
  // daily_calorie_goal이 수동 설정되어 있으면 그것을 사용
  if (profile.daily_calorie_goal) {
    return profile.daily_calorie_goal;
  }

  return calculateDailyCaloriesSync({
    gender: profile.gender || "other",
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    age: profile.age || 30,
    activity_level: profile.activity_level || "sedentary",
    diseases: profile.diseases?.map(d => d.code),
    premium_features: profile.premium_features,
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

