/**
 * @file lib/health/diet-conflict-manager.ts
 * @description 질병과 특수 식단 간의 의학적 충돌을 감지하고 관리하는 모듈
 *
 * 주요 기능:
 * 1. 질병별 특수 식단 충돌 규칙 정의
 * 2. 사용자 건강 프로필 기반 충돌 검사
 * 3. 가족 구성원별 충돌 검사
 * 4. 충돌 심각도별 분류 (절대 금지, 경고, 주의)
 *
 * 의학적 근거:
 * - ACR (American College of Rheumatology): 통풍 가이드라인
 * - ADA (American Diabetes Association): 당뇨병 가이드라인
 * - KDOQI: 만성 신장질환 가이드라인
 * - 소아과/산부인과 가이드라인: 어린이 및 임신부 식단 제한
 */

import type { UserHealthProfile, SpecialDietType } from "@/types/health";
import type { FamilyMember } from "@/types/family";
import { calculateAge } from "@/lib/utils/age-calculator";

/**
 * 충돌 심각도
 * - absolute: 절대 금지 (UI 비활성화, API 거부)
 * - warning: 경고 (UI 경고 표시, 사용자 확인 후 진행 가능)
 * - caution: 주의 (툴팁 안내, 선택 가능)
 */
export type ConflictSeverity = "absolute" | "warning" | "caution";

/**
 * 식단 충돌 정보
 */
export interface DietConflict {
  diseaseCode: string;
  dietType: SpecialDietType | "diet_mode";
  severity: ConflictSeverity;
  reason: string;
  medicalSource: string;
  alternativeSuggestion?: string;
}

/**
 * 충돌 검사 결과
 */
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: DietConflict[];
  blockedOptions: (SpecialDietType | "diet_mode")[];
  warnings: DietConflict[];
  cautions: DietConflict[];
}

/**
 * 가족 구성원 충돌 검사 결과
 */
export interface FamilyMemberConflictCheck {
  memberId: string;
  memberName: string;
  conflicts: ConflictCheckResult;
}

/**
 * 충돌 규칙 정의
 * 
 * 각 질병별로 특수 식단과의 충돌 관계를 정의합니다.
 * 의학적 근거를 바탕으로 작성되었습니다.
 */
const CONFLICT_RULES: Record<
  string,
  Record<string, Omit<DietConflict, "diseaseCode" | "dietType">>
> = {
  // 만성 신장질환 (CKD)
  kidney_disease: {
    fitness: {
      severity: "absolute",
      reason:
        "CKD 환자는 단백질을 0.6-0.8g/kg로 엄격히 제한해야 합니다. 고단백 식단은 신장 부담을 증가시켜 질환을 악화시킬 수 있습니다.",
      medicalSource: "KDOQI (Kidney Disease Outcomes Quality Initiative) 가이드라인",
      alternativeSuggestion:
        "저단백 식단을 권장합니다. 단백질은 표준 체중 kg당 0.6-0.8g으로 제한하세요.",
    },
  },

  // 통풍
  gout: {
    diet_mode: {
      severity: "absolute",
      reason:
        "통풍 환자는 급격한 체중 감량을 피해야 합니다. 주당 0.5kg 이내로 서서히 감량해야 하며, 케톤체 생성은 요산 수치를 급상승시켜 통풍 발작을 유발할 수 있습니다.",
      medicalSource:
        "ACR (American College of Rheumatology) 가이드라인",
      alternativeSuggestion:
        "서서히 체중 감량 (주당 0.5kg 이내)을 목표로 하세요. 극단적인 칼로리 제한은 피하세요.",
    },
    low_carb: {
      severity: "absolute",
      reason:
        "극단적인 저탄수화물 식단은 케톤체 생성을 유발하여 요산 수치를 높이고 통풍 발작을 유발할 수 있습니다.",
      medicalSource: "ACR 가이드라인",
      alternativeSuggestion:
        "적절한 탄수화물 비율(40-55%)을 유지하세요. 극단적인 저탄수화물 식단은 피하세요.",
    },
    fitness: {
      severity: "warning",
      reason:
        "고단백 식품 중 일부는 퓨린 함량이 높을 수 있습니다. 저퓨린 단백질(닭 가슴살, 달걀 흰자)을 선택하세요.",
      medicalSource: "ACR 가이드라인",
      alternativeSuggestion:
        "저퓨린 단백질 위주로 섭취하세요. 내장, 해산물, 붉은 고기는 제한하세요.",
    },
  },

  // 당뇨병
  diabetes: {
    low_carb: {
      severity: "warning",
      reason:
        "극단적인 저탄수화물 식단은 저혈당 위험이 있습니다. 특히 인슐린이나 설포닐우레아 계열 약물을 복용 중인 경우 위험할 수 있습니다.",
      medicalSource:
        "ADA (American Diabetes Association) 가이드라인",
      alternativeSuggestion:
        "탄수화물을 40-50%로 유지하면서 복합 탄수화물을 선택하세요. 의사와 상담 후 진행하세요.",
    },
  },

  // 고혈압
  hypertension: {
    // 고혈압은 특수 식단과 직접적인 충돌은 없으나, 나트륨 제한이 중요
    // 필요시 추가 가능
  },

  // 고지혈증
  hyperlipidemia: {
    // 고지혈증은 특수 식단과 직접적인 충돌은 없으나, 지방 섭취 제한이 중요
    // 필요시 추가 가능
  },

  // 심혈관 질환
  cardiovascular_disease: {
    // 심혈관 질환은 특수 식단과 직접적인 충돌은 없으나, 나트륨 및 포화지방 제한이 중요
    // 필요시 추가 가능
  },
};

/**
 * 나이 기반 충돌 규칙 (어린이)
 */
const AGE_BASED_CONFLICTS: Record<
  string,
  Omit<DietConflict, "diseaseCode" | "dietType">
> = {
  diet_mode: {
    severity: "absolute",
    reason:
      "성장기 어린이(18세 미만)는 체중 감량 식단을 피해야 합니다. 성장에 필요한 충분한 영양소와 칼로리가 필요합니다.",
    medicalSource: "소아과 가이드라인",
    alternativeSuggestion:
      "균형 잡힌 식단을 유지하고, 규칙적인 운동을 통해 건강한 성장을 도모하세요.",
  },
  low_carb: {
    severity: "absolute",
    reason:
      "성장기 어린이(18세 미만)는 충분한 탄수화물 섭취가 필요합니다. 극단적인 저탄수화물 식단은 성장 발달을 저해할 수 있습니다.",
    medicalSource: "소아과 가이드라인",
    alternativeSuggestion:
      "균형 잡힌 식단을 유지하세요. 탄수화물은 성장과 뇌 발달에 필수적입니다.",
  },
};

/**
 * 임신 상태 기반 충돌 규칙
 */
const PREGNANCY_CONFLICTS: Record<
  string,
  Omit<DietConflict, "diseaseCode" | "dietType">
> = {
  diet_mode: {
    severity: "absolute",
    reason:
      "임신 중에는 체중 감량을 목표로 하는 식단을 피해야 합니다. 태아의 건강한 발달을 위해 충분한 영양소와 칼로리가 필요합니다.",
    medicalSource: "산부인과 가이드라인",
    alternativeSuggestion:
      "임신 전 BMI에 맞는 적절한 체중 증가를 목표로 하세요. 극단적인 칼로리 제한은 피하세요.",
  },
  low_carb: {
    severity: "absolute",
    reason:
      "임신 중에는 태아 발달에 필요한 충분한 탄수화물 섭취가 필요합니다. 극단적인 저탄수화물 식단은 태아 발달에 부정적인 영향을 줄 수 있습니다.",
    medicalSource: "산부인과 가이드라인",
    alternativeSuggestion:
      "균형 잡힌 식단을 유지하세요. 복합 탄수화물을 통해 태아 발달에 필요한 영양소를 공급하세요.",
  },
};

/**
 * 사용자 건강 프로필 기반 충돌 검사
 *
 * @param healthProfile - 사용자 건강 프로필
 * @returns 충돌 검사 결과
 */
export function checkDietConflicts(
  healthProfile: UserHealthProfile
): ConflictCheckResult {
  console.group("🔍 [DietConflictManager] 충돌 검사 시작");
  console.log("건강 프로필:", {
    diseases: healthProfile.diseases?.map((d) => d.code || d),
    dietary_preferences: healthProfile.dietary_preferences,
    premium_features: healthProfile.premium_features,
    age: healthProfile.age,
  });

  const conflicts: DietConflict[] = [];
  const blockedOptions: (SpecialDietType | "diet_mode")[] = [];
  const warnings: DietConflict[] = [];
  const cautions: DietConflict[] = [];

  // 1. 질병 기반 충돌 검사
  const diseases = healthProfile.diseases || [];
  const diseaseCodes = diseases.map((d) =>
    typeof d === "string" ? d : d.code
  );

  for (const diseaseCode of diseaseCodes) {
    const diseaseRules = CONFLICT_RULES[diseaseCode];
    if (!diseaseRules) continue;

    // 선택된 특수 식단 확인
    const dietaryPreferences = healthProfile.dietary_preferences || [];
    for (const dietType of dietaryPreferences) {
      const rule = diseaseRules[dietType];
      if (rule) {
        const conflict: DietConflict = {
          diseaseCode,
          dietType,
          ...rule,
        };
        conflicts.push(conflict);

        if (rule.severity === "absolute") {
          blockedOptions.push(dietType);
        } else if (rule.severity === "warning") {
          warnings.push(conflict);
        } else if (rule.severity === "caution") {
          cautions.push(conflict);
        }
      }
    }

    // 프리미엄 diet 모드 확인
    const premiumFeatures = healthProfile.premium_features || [];
    if (premiumFeatures.includes("diet")) {
      const rule = diseaseRules["diet_mode"];
      if (rule) {
        const conflict: DietConflict = {
          diseaseCode,
          dietType: "diet_mode",
          ...rule,
        };
        conflicts.push(conflict);

        if (rule.severity === "absolute") {
          blockedOptions.push("diet_mode");
        } else if (rule.severity === "warning") {
          warnings.push(conflict);
        } else if (rule.severity === "caution") {
          cautions.push(conflict);
        }
      }
    }
  }

  // 2. 나이 기반 충돌 검사 (어린이)
  const age = healthProfile.age;
  if (age !== null && age !== undefined && age < 18) {
    console.log("⚠️ 어린이 감지 (18세 미만): 나이 기반 충돌 검사 실행");

    const dietaryPreferences = healthProfile.dietary_preferences || [];
    for (const dietType of dietaryPreferences) {
      const rule = AGE_BASED_CONFLICTS[dietType];
      if (rule) {
        const conflict: DietConflict = {
          diseaseCode: "age_restriction",
          dietType,
          ...rule,
        };
        conflicts.push(conflict);

        if (rule.severity === "absolute") {
          blockedOptions.push(dietType);
        } else if (rule.severity === "warning") {
          warnings.push(conflict);
        } else if (rule.severity === "caution") {
          cautions.push(conflict);
        }
      }
    }

    // 프리미엄 diet 모드 확인
    const premiumFeatures = healthProfile.premium_features || [];
    if (premiumFeatures.includes("diet")) {
      const rule = AGE_BASED_CONFLICTS["diet_mode"];
      if (rule) {
        const conflict: DietConflict = {
          diseaseCode: "age_restriction",
          dietType: "diet_mode",
          ...rule,
        };
        conflicts.push(conflict);

        if (rule.severity === "absolute") {
          blockedOptions.push("diet_mode");
        } else if (rule.severity === "warning") {
          warnings.push(conflict);
        } else if (rule.severity === "caution") {
          cautions.push(conflict);
        }
      }
    }
  }

  // 3. 임신 상태 기반 충돌 검사
  // TODO: 임신 상태를 healthProfile에 추가할 경우 활성화
  // 현재는 임시로 gender와 특정 질병 코드로 판단
  // const isPregnant = healthProfile.diseases?.some(d => {
  //   const code = typeof d === 'string' ? d : d.code;
  //   return code === 'pregnancy' || code === 'gestational_diabetes';
  // });

  const result: ConflictCheckResult = {
    hasConflict: conflicts.length > 0,
    conflicts,
    blockedOptions: Array.from(new Set(blockedOptions)),
    warnings,
    cautions,
  };

  console.log("✅ 충돌 검사 완료:", {
    hasConflict: result.hasConflict,
    totalConflicts: conflicts.length,
    blockedOptions: result.blockedOptions,
    warnings: warnings.length,
    cautions: cautions.length,
  });
  console.groupEnd();

  return result;
}

/**
 * 가족 구성원 충돌 검사
 *
 * @param member - 가족 구성원 정보
 * @returns 충돌 검사 결과
 */
export function checkFamilyMemberConflicts(
  member: FamilyMember
): ConflictCheckResult {
  console.group(`🔍 [DietConflictManager] 가족 구성원 충돌 검사: ${member.name}`);

  // FamilyMember를 UserHealthProfile 형식으로 변환
  const { years: age } = calculateAge(member.birth_date);

  const memberProfile: UserHealthProfile = {
    id: member.id,
    user_id: member.user_id,
    diseases: (member.diseases || []).map((code) => ({
      code,
      custom_name: null,
    })),
    allergies: (member.allergies || []).map((code) => ({
      code,
      custom_name: null,
    })),
    height_cm: member.height_cm || null,
    weight_kg: member.weight_kg || null,
    age: age || null,
    gender: member.gender || null,
    activity_level: member.activity_level || null,
    daily_calorie_goal: 0,
    preferred_ingredients: [],
    disliked_ingredients: [],
    dietary_preferences: (member.dietary_preferences || []) as SpecialDietType[],
    created_at: member.created_at,
    updated_at: member.updated_at,
  };

  const result = checkDietConflicts(memberProfile);
  console.groupEnd();
  return result;
}

/**
 * 전체 가족 충돌 검사
 *
 * @param userProfile - 사용자 건강 프로필
 * @param familyMembers - 가족 구성원 목록
 * @returns 가족 구성원별 충돌 검사 결과 배열
 */
export function checkAllFamilyConflicts(
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[]
): FamilyMemberConflictCheck[] {
  console.group("🔍 [DietConflictManager] 전체 가족 충돌 검사");

  const results: FamilyMemberConflictCheck[] = [];

  // 사용자 본인 충돌 검사
  const userConflicts = checkDietConflicts(userProfile);
  results.push({
    memberId: "user",
    memberName: "본인",
    conflicts: userConflicts,
  });

  // 각 가족 구성원별 충돌 검사
  for (const member of familyMembers) {
    const memberConflicts = checkFamilyMemberConflicts(member);
    results.push({
      memberId: member.id,
      memberName: member.name,
      conflicts: memberConflicts,
    });
  }

  console.log(`✅ 전체 가족 충돌 검사 완료: ${results.length}명`);
  console.groupEnd();

  return results;
}

/**
 * 특정 식단 타입이 차단되었는지 확인
 *
 * @param conflictResult - 충돌 검사 결과
 * @param dietType - 확인할 식단 타입
 * @returns 차단 여부
 */
export function isDietTypeBlocked(
  conflictResult: ConflictCheckResult,
  dietType: SpecialDietType | "diet_mode"
): boolean {
  return conflictResult.blockedOptions.includes(dietType);
}

/**
 * 특정 식단 타입에 대한 경고가 있는지 확인
 *
 * @param conflictResult - 충돌 검사 결과
 * @param dietType - 확인할 식단 타입
 * @returns 경고 여부
 */
export function hasDietTypeWarning(
  conflictResult: ConflictCheckResult,
  dietType: SpecialDietType | "diet_type"
): boolean {
  return conflictResult.warnings.some((w) => w.dietType === dietType);
}

