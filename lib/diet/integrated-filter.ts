/**
 * @file lib/diet/integrated-filter.ts
 * @description 통합 필터링 파이프라인
 *
 * 이 모듈은 레시피 필터링의 모든 단계를 통합하여 관리합니다.
 * 필터링 단계:
 * 1. 알레르기 필터링 (엄격한 모드)
 * 2. 질병별 제외 음식 필터링 (데이터베이스 기반)
 * 3. 질병별 영양소 제한 필터링 (칼륨, 인, 퓨린, FODMAPs 등)
 * 4. 나트륨 제한 필터링
 * 5. 선호도 필터링 (비선호 재료 제외)
 *
 * 각 단계는 독립적으로 실행되며, 하나라도 실패하면 레시피가 제외됩니다.
 */

import type { RecipeDetailForDiet, RecipeWarning } from "@/types/recipe";
import type { UserHealthProfile } from "@/types/health";
import { checkAllergyCompatibility } from "./food-filtering";
import { getExcludedFoods, isRecipeExcludedForDisease } from "./family-recommendation";
import type { ExcludedFood } from "./family-recommendation";
import { classifySideDish, estimateSugarContent } from "./recipe-classifier";
import { DailyNutritionTracker } from "./daily-nutrition-tracker";

/**
 * 필터링 결과 인터페이스
 */
export interface FilterResult {
  passed: boolean;
  reason?: string;
  stage?: string; // 필터링 단계 이름
}

/**
 * 통합 필터링 결과 인터페이스
 */
export interface IntegratedFilterResult {
  passed: boolean;
  reasons: string[]; // 제외된 이유 목록
  stages: string[]; // 통과한 단계 목록
  warnings?: RecipeWarning[]; // 주의사항
  exclusionType?: 'absolute' | 'moderate' | 'limit' | null; // 제외 유형
}

/**
 * 질병별 영양소 제한 기준
 */
const NUTRITION_LIMITS: Record<string, {
  potassium?: number; // 칼륨 (mg)
  phosphorus?: number; // 인 (mg)
  purine?: number; // 퓨린 (mg)
  sodium?: number; // 나트륨 (mg)
  carbs?: number; // 탄수화물 (g)
  protein?: number; // 단백질 (g)
  fat?: number; // 지방 (g)
  gi?: number; // GI 지수
}> = {
  diabetes: {
    carbs: 50, // 식사당 탄수화물 50g 이하
    gi: 70, // GI 지수 70 이하
  },
  hypertension: {
    sodium: 700, // 식사당 나트륨 700mg 이하
  },
  kidney_disease: {
    potassium: 200, // 식사당 칼륨 200mg 이하
    phosphorus: 200, // 식사당 인 200mg 이하
    protein: 30, // 식사당 단백질 30g 이하
    sodium: 700, // 식사당 나트륨 700mg 이하
  },
  cardiovascular_disease: {
    sodium: 400, // 식사당 나트륨 400mg 이하 (강화)
    fat: 20, // 식사당 지방 20g 이하
  },
  gout: {
    purine: 100, // 식사당 퓨린 100mg 이하
  },
  gastrointestinal_disorder: {
    fat: 15, // 식사당 지방 15g 이하
  },
};

/**
 * FODMAPs 함유 식품 목록 (위장 질환용)
 */
const FODMAP_FOODS = [
  "양파", "마늘", "사과", "배", "복숭아", "자두", "체리",
  "수박", "망고", "꿀", "설탕", "과당", "자당", "유당",
  "우유", "요거트", "치즈", "콩", "두부", "렌틸콩",
  "완두콩", "병아리콩", "밀", "보리", "호밀", "아스파라거스",
  "브로콜리", "양배추", "콜리플라워", "셀러리", "옥수수",
  "버섯", "완두콩", "피망", "시금치", "토마토",
];

/**
 * 퓨린 함유 식품 목록 (통풍용)
 */
const PURINE_FOODS = [
  "멸치", "고등어", "연어", "참치", "꽁치", "정어리",
  "새우", "게", "랍스터", "홍합", "조개", "전복",
  "소고기", "돼지고기", "닭고기", "오리", "양고기",
  "간", "콩팥", "심장", "뇌", "췌장", "곱창",
  "콩", "완두콩", "렌틸콩", "병아리콩", "버섯",
  "시금치", "아스파라거스", "콜리플라워", "브로콜리",
];

/**
 * 단순당 함유 식품 목록 (당뇨용)
 */
const SIMPLE_SUGAR_FOODS = [
  "설탕", "꿀", "사탕", "초콜릿", "젤리", "잼",
  "시럽", "액상과당", "과당", "자당", "포도당",
  "탄산음료", "주스", "스포츠음료", "에너지음료",
  "케이크", "쿠키", "도넛", "파이", "아이스크림",
  "과자", "사탕", "초콜릿", "캔디",
];

/**
 * 과당 함유 식품 목록 (통풍용)
 */
const FRUCTOSE_FOODS = [
  "과당", "액상과당", "옥수수시럽", "고과당옥수수시럽",
  "사과", "배", "포도", "수박", "망고", "체리",
  "꿀", "설탕", "탄산음료", "주스", "스포츠음료",
];

/**
 * 산성 음식 목록 (위장 질환용)
 */
const ACIDIC_FOODS = [
  "오렌지", "레몬", "자몽", "라임", "귤", "한라봉",
  "토마토", "토마토소스", "케첩", "식초", "발사믹식초",
  "사과식초", "레몬즙", "오렌지즙",
];

/**
 * 자극성 조리법 키워드 (위장 질환용)
 */
const IRRITATING_COOKING_METHODS = [
  "튀김", "볶음", "매운", "고춧가루", "후추", "고추",
  "칠리", "와사비", "겨자", "마늘", "생강", "양파",
  "카레", "커리", "마라", "사천", "마파두부",
];

/**
 * 임산부 제외 음식 목록
 */
const PREGNANCY_EXCLUDED_FOODS = [
  // 수은 함량 높은 생선
  "상어", "황새치", "참치", "고등어", "옥돔", "삼치",
  // 날 음식
  "회", "스시", "사시미", "초밥", "회무침", "육회", "회덮밥",
  // 미숙한 치즈
  "브리", "카망베르", "블루치즈", "고르곤졸라", "리코타",
  // 알코올
  "술", "맥주", "와인", "소주", "막걸리", "청주",
  // 카페인 과다 (커피, 녹차 등은 제외하지 않지만 과다 섭취 경고)
];

/**
 * 레시피가 질병별 영양소 제한을 만족하는지 확인
 */
function checkNutritionLimits(
  recipe: RecipeDetailForDiet,
  diseases: string[]
): FilterResult {
  if (!diseases || diseases.length === 0) {
    return { passed: true, stage: "nutrition-limits" };
  }

  const nutrition = recipe.nutrition;

  for (const disease of diseases) {
    const limits = NUTRITION_LIMITS[disease];
    if (!limits) continue;

    // 칼륨 제한 체크 (신장질환)
    if (limits.potassium !== undefined && nutrition.potassium !== undefined) {
      if (nutrition.potassium > limits.potassium) {
        return {
          passed: false,
          reason: `칼륨 함량이 높음 (${nutrition.potassium}mg > ${limits.potassium}mg)`,
          stage: "nutrition-limits",
        };
      }
    }

    // 인 제한 체크 (신장질환)
    if (limits.phosphorus !== undefined && nutrition.phosphorus !== undefined) {
      if (nutrition.phosphorus > limits.phosphorus) {
        return {
          passed: false,
          reason: `인 함량이 높음 (${nutrition.phosphorus}mg > ${limits.phosphorus}mg)`,
          stage: "nutrition-limits",
        };
      }
    }

    // 나트륨 제한 체크
    if (limits.sodium !== undefined && nutrition.sodium !== undefined) {
      if (nutrition.sodium > limits.sodium) {
        return {
          passed: false,
          reason: `나트륨 함량이 높음 (${nutrition.sodium}mg > ${limits.sodium}mg)`,
          stage: "nutrition-limits",
        };
      }
    }

    // 탄수화물 제한 체크 (당뇨)
    // 주의: 밥 종류는 한국 식단의 기본이므로 예외 처리
    if (limits.carbs !== undefined && nutrition.carbs !== undefined) {
      const recipeTitle = recipe.title.toLowerCase();
      const isRice = recipeTitle.includes("밥") || recipeTitle.includes("rice");
      
      // 밥 종류는 탄수화물 제한을 완화 (100g까지 허용)
      const carbLimit = isRice ? Math.max(limits.carbs * 2, 100) : limits.carbs;
      
      if (nutrition.carbs > carbLimit) {
        return {
          passed: false,
          reason: `탄수화물 함량이 높음 (${nutrition.carbs}g > ${carbLimit}g)`,
          stage: "nutrition-limits",
        };
      }
    }

    // 단백질 제한 체크 (신장질환)
    if (limits.protein !== undefined && nutrition.protein !== undefined) {
      if (nutrition.protein > limits.protein) {
        return {
          passed: false,
          reason: `단백질 함량이 높음 (${nutrition.protein}g > ${limits.protein}g)`,
          stage: "nutrition-limits",
        };
      }
    }

    // 지방 제한 체크
    if (limits.fat !== undefined && nutrition.fat !== undefined) {
      if (nutrition.fat > limits.fat) {
        return {
          passed: false,
          reason: `지방 함량이 높음 (${nutrition.fat}g > ${limits.fat}g)`,
          stage: "nutrition-limits",
        };
      }
    }

    // GI 지수 제한 체크 (당뇨)
    if (limits.gi !== undefined && nutrition.gi !== undefined) {
      if (nutrition.gi > limits.gi) {
        return {
          passed: false,
          reason: `GI 지수가 높음 (${nutrition.gi} > ${limits.gi})`,
          stage: "nutrition-limits",
        };
      }
    }

    // 단순당 함량 체크 (당뇨) - 새로운 분류 로직 사용
    if (disease === "diabetes" || disease === "diabetes_type2") {
      const classification = classifySideDish(recipe);

      // 고당류 반찬은 제외 (이미 Step 2에서 처리되지만 이중 체크)
      if (classification.type === 'high_sugar') {
        return {
          passed: false,
          reason: "고당류 반찬으로 제외",
          stage: "nutrition-limits",
        };
      }

      // 채소 요리나 저당 반찬은 통과
      if (classification.type === 'vegetable' || classification.type === 'low_sugar') {
        // 통과
      }
      // 조미료 포함 반찬은 허용 (주의사항은 Step 2에서 추가됨)
    }

    // 포화지방/트랜스지방 체크 (심혈관 질환)
    if (disease === "cardiovascular_disease") {
      // 포화지방 비율 체크 (지방의 50% 이상이 포화지방인 경우 제외)
      // 주의: 현재 영양 정보에 포화지방/트랜스지방 데이터가 없으므로 재료 기반으로 추정
      const recipeText = [
        recipe.title,
        recipe.description || "",
        ...(recipe.ingredients?.map(ing => ing.name) || []),
      ].join(" ").toLowerCase();

      const saturatedFatKeywords = [
        "삼겹살", "갈비", "닭껍질", "버터", "전지방", "크림",
        "치즈", "베이컨", "햄", "소시지", "라드",
      ];
      const transFatKeywords = [
        "마가린", "쇼트닝", "도넛", "크래커", "과자",
        "튀김", "프라이드", "가공식품",
      ];

      const hasSaturatedFat = saturatedFatKeywords.some(keyword =>
        recipeText.includes(keyword.toLowerCase())
      );
      const hasTransFat = transFatKeywords.some(keyword =>
        recipeText.includes(keyword.toLowerCase())
      );

      if (hasSaturatedFat || hasTransFat) {
        return {
          passed: false,
          reason: hasTransFat ? "트랜스지방 함유 식품 포함" : "포화지방 함유 식품 포함",
          stage: "nutrition-limits",
        };
      }
    }

    // 퓨린 함유 식품 체크 (통풍)
    if (disease === "gout") {
      const recipeText = [
        recipe.title,
        recipe.description || "",
        ...(recipe.ingredients?.map(ing => ing.name) || []),
      ].join(" ").toLowerCase();

      const hasPurineFood = PURINE_FOODS.some(food =>
        recipeText.includes(food.toLowerCase())
      );

      if (hasPurineFood) {
        return {
          passed: false,
          reason: "퓨린 함유 식품 포함",
          stage: "nutrition-limits",
        };
      }

      // 과당 함량 체크 (통풍)
      const hasFructoseFood = FRUCTOSE_FOODS.some(food =>
        recipeText.includes(food.toLowerCase())
      );

      if (hasFructoseFood) {
        return {
          passed: false,
          reason: "과당 함유 식품 포함",
          stage: "nutrition-limits",
        };
      }
    }

    // 산성 음식 및 자극성 조리법 체크 (위장 질환)
    if (disease === "gastrointestinal_disorder") {
      const recipeText = [
        recipe.title,
        recipe.description || "",
        ...(recipe.ingredients?.map(ing => ing.name) || []),
        ...(Array.isArray(recipe.instructions) 
          ? recipe.instructions 
          : recipe.instructions ? [recipe.instructions] : []),
      ].join(" ").toLowerCase();

      // FODMAPs 함유 식품 체크
      const hasFodmapFood = FODMAP_FOODS.some(food =>
        recipeText.includes(food.toLowerCase())
      );

      if (hasFodmapFood) {
        return {
          passed: false,
          reason: "FODMAPs 함유 식품 포함",
          stage: "nutrition-limits",
        };
      }

      // 산성 음식 체크
      const hasAcidicFood = ACIDIC_FOODS.some(food =>
        recipeText.includes(food.toLowerCase())
      );

      if (hasAcidicFood) {
        return {
          passed: false,
          reason: "산성 음식 포함",
          stage: "nutrition-limits",
        };
      }

      // 자극성 조리법 체크
      const hasIrritatingMethod = IRRITATING_COOKING_METHODS.some(method =>
        recipeText.includes(method.toLowerCase())
      );

      if (hasIrritatingMethod) {
        return {
          passed: false,
          reason: "자극성 조리법 포함",
          stage: "nutrition-limits",
        };
      }
    }
  }

  return { passed: true, stage: "nutrition-limits" };
}

/**
 * 비선호 재료 필터링
 */
function checkDislikedIngredients(
  recipe: RecipeDetailForDiet,
  dislikedIngredients: string[]
): FilterResult {
  if (!dislikedIngredients || dislikedIngredients.length === 0) {
    return { passed: true, stage: "preferences" };
  }

  const recipeText = [
    recipe.title,
    recipe.description,
    ...(recipe.ingredients?.map(ing => ing.name) || []),
  ].join(" ").toLowerCase();

  for (const disliked of dislikedIngredients) {
    if (recipeText.includes(disliked.toLowerCase())) {
      return {
        passed: false,
        reason: `비선호 재료 포함: ${disliked}`,
        stage: "preferences",
      };
    }
  }

  return { passed: true, stage: "preferences" };
}

/**
 * 절대 금지 필터링 (Step 1)
 */
function checkAbsoluteExclusion(
  recipe: RecipeDetailForDiet,
  excludedFoods?: ExcludedFood[]
): { excluded: boolean; reason?: string } {
  if (!excludedFoods || excludedFoods.length === 0) {
    return { excluded: false };
  }

  // exclusion_type이 'absolute'이거나 severity가 'high'인 음식만 체크
  const absoluteExcluded = excludedFoods.filter(food => 
    food.exclusion_type === 'absolute' || 
    (food.exclusion_type === undefined && food.severity === 'severe')
  );

  if (absoluteExcluded.length === 0) {
    return { excluded: false };
  }

  const result = isRecipeExcludedForDisease(recipe, absoluteExcluded);
  return {
    excluded: result.excluded,
    reason: result.reason
  };
}

/**
 * 양 조절 필터링 (Step 2)
 */
function checkModerateExclusion(
  recipe: RecipeDetailForDiet,
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[]
): {
  passed: boolean;
  reasons: string[];
  warnings?: RecipeWarning[];
  exclusionType?: 'moderate' | null;
} {
  const warnings: RecipeWarning[] = [];
  const reasons: string[] = [];

  if (!healthProfile.diseases || healthProfile.diseases.length === 0) {
    return { passed: true, reasons: [] };
  }

  const diseases = healthProfile.diseases;

  // 당뇨병 처리
  if (diseases.includes('diabetes') || diseases.includes('diabetes_type2')) {
    const classification = classifySideDish(recipe);

    // 고당류 반찬 제외
    if (classification.type === 'high_sugar') {
      return {
        passed: false,
        reasons: ['고당류 반찬으로 제외'],
        exclusionType: 'moderate'
      };
    }

    // 조미료 포함 반찬: 주의사항 추가
    if (classification.type === 'moderate_sugar') {
      const sugarContent = estimateSugarContent(recipe);
      warnings.push({
        type: 'sugar',
        message: '설탕 또는 당을 조절하여 섭취하시기 바랍니다',
        value: sugarContent,
        unit: 'g',
        severity: sugarContent > 10 ? 'high' : 'moderate'
      });
    }
  }

  // 고혈압: 나트륨 함량이 높은 경우 주의사항 추가
  if (diseases.includes('hypertension')) {
    const sodium = recipe.nutrition.sodium || 0;
    if (sodium > 500) {
      warnings.push({
        type: 'sodium',
        message: '나트륨을 조절하여 섭취하시기 바랍니다',
        value: sodium,
        unit: 'mg',
        severity: sodium > 700 ? 'high' : 'moderate'
      });
    }
  }

  // 고지혈증: 지방 함량이 높은 경우 주의사항 추가
  if (diseases.includes('hyperlipidemia')) {
    const fat = recipe.nutrition.fat || 0;
    if (fat > 15) {
      warnings.push({
        type: 'fat',
        message: '지방을 조절하여 섭취하시기 바랍니다',
        value: fat,
        unit: 'g',
        severity: fat > 25 ? 'high' : 'moderate'
      });
    }
  }

  // 신장 질환: 칼륨/인 함량이 높은 경우 주의사항 추가
  if (diseases.includes('ckd') || diseases.includes('kidney_disease')) {
    const potassium = recipe.nutrition.potassium || 0;
    const phosphorus = recipe.nutrition.phosphorus || 0;

    if (potassium > 200) {
      warnings.push({
        type: 'potassium',
        message: '칼륨을 조절하여 섭취하시기 바랍니다',
        value: potassium,
        unit: 'mg',
        severity: potassium > 300 ? 'high' : 'moderate'
      });
    }

    if (phosphorus > 150) {
      warnings.push({
        type: 'phosphorus',
        message: '인을 조절하여 섭취하시기 바랍니다',
        value: phosphorus,
        unit: 'mg',
        severity: phosphorus > 200 ? 'high' : 'moderate'
      });
    }
  }

  return {
    passed: true,
    reasons: [],
    warnings: warnings.length > 0 ? warnings : undefined,
    exclusionType: warnings.length > 0 ? 'moderate' : null
  };
}

/**
 * 단일 레시피에 대한 통합 필터링 (3단계 구조)
 */
export async function filterRecipe(
  recipe: RecipeDetailForDiet,
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[],
  dailyNutrition?: DailyNutritionTracker
): Promise<IntegratedFilterResult> {
  const reasons: string[] = [];
  const stages: string[] = [];
  const warnings: RecipeWarning[] = [];

  console.group(`[IntegratedFilter] 레시피 필터링: ${recipe.title}`);

  // 1. 알레르기 필터링
  const allergyResult = checkAllergyCompatibility(
    recipe,
    healthProfile.allergies || []
  );
  if (!allergyResult) {
    reasons.push("알레르기 유발 재료 포함");
    console.log("❌ 알레르기 필터링 실패");
    console.groupEnd();
    return { passed: false, reasons, stages };
  }
  stages.push("allergy");
  console.log("✅ 알레르기 필터링 통과");

  // 2. 질병별 제외 음식 조회
  if (healthProfile.diseases && healthProfile.diseases.length > 0) {
    const diseases = healthProfile.diseases;
    const excludedFoodsList = excludedFoods || await getExcludedFoods(diseases);

    // Step 1: 절대 금지 필터링
    const absoluteExclusion = checkAbsoluteExclusion(recipe, excludedFoodsList);
    if (absoluteExclusion.excluded) {
      reasons.push(absoluteExclusion.reason || "절대 금지 음식 포함");
      console.log("❌ 절대 금지 필터링 실패:", absoluteExclusion.reason);
      console.groupEnd();
      return { 
        passed: false, 
        reasons, 
        stages,
        exclusionType: 'absolute'
      };
    }
    stages.push("absolute-exclusion");
    console.log("✅ 절대 금지 필터링 통과");

    // Step 2: 양 조절 필터링
    const moderateResult = checkModerateExclusion(recipe, healthProfile, excludedFoodsList);
    if (!moderateResult.passed) {
      reasons.push(...moderateResult.reasons);
      console.log("❌ 양 조절 필터링 실패:", moderateResult.reasons);
      console.groupEnd();
      return {
        passed: false,
        reasons,
        stages,
        exclusionType: moderateResult.exclusionType || 'moderate'
      };
    }
    stages.push("moderate-exclusion");
    console.log("✅ 양 조절 필터링 통과");
    
    // 주의사항 수집
    if (moderateResult.warnings) {
      warnings.push(...moderateResult.warnings);
    }

    // Step 3: 일일 총량 관리
    if (dailyNutrition) {
      const limitResult = dailyNutrition.canAddRecipe(recipe);
      if (!limitResult.canAdd) {
        reasons.push(...(limitResult.reasons || []));
        console.log("❌ 일일 총량 제한 초과:", limitResult.reasons);
        console.groupEnd();
        return {
          passed: false,
          reasons,
          stages,
          exclusionType: 'limit'
        };
      }
      stages.push("daily-limit");
      console.log("✅ 일일 총량 필터링 통과");
      
      // 일일 총량 관련 주의사항 추가
      if (limitResult.warnings) {
        warnings.push(...limitResult.warnings);
      }
    }
  }

  // 3. 질병별 영양소 제한 필터링 (기존 로직 유지)
  const nutritionResult = checkNutritionLimits(
    recipe,
    healthProfile.diseases || []
  );
  if (!nutritionResult.passed) {
    reasons.push(nutritionResult.reason || "영양소 제한 초과");
    console.log("❌ 영양소 제한 필터링 실패:", nutritionResult.reason);
    console.groupEnd();
    return { passed: false, reasons, stages };
  }
  stages.push("nutrition-limits");
  console.log("✅ 영양소 제한 필터링 통과");

  // 4. 나트륨 제한 필터링
  const { checkSodiumLimit } = await import("./food-filtering");
  const sodiumResult = checkSodiumLimit(recipe, healthProfile.diseases || []);
  if (!sodiumResult) {
    reasons.push("나트륨 함량이 높음");
    console.log("❌ 나트륨 제한 필터링 실패");
    console.groupEnd();
    return { passed: false, reasons, stages };
  }
  stages.push("sodium-limit");
  console.log("✅ 나트륨 제한 필터링 통과");

  // 5. 비선호 재료 필터링
  const preferenceResult = checkDislikedIngredients(
    recipe,
    healthProfile.disliked_ingredients || []
  );
  if (!preferenceResult.passed) {
    reasons.push(preferenceResult.reason || "비선호 재료 포함");
    console.log("❌ 비선호 재료 필터링 실패:", preferenceResult.reason);
    console.groupEnd();
    return { passed: false, reasons, stages };
  }
  stages.push("preferences");
  console.log("✅ 비선호 재료 필터링 통과");

  // 2-1. 임산부 제외 음식 필터링 (절대 금지)
  const isPregnant = (healthProfile as any).pregnancy_trimester !== undefined && 
                     (healthProfile as any).pregnancy_trimester !== null;
  if (isPregnant) {
    const recipeText = [
      recipe.title,
      recipe.description || "",
      ...(recipe.ingredients?.map(ing => ing.name) || []),
    ].join(" ").toLowerCase();

    const hasPregnancyExcludedFood = PREGNANCY_EXCLUDED_FOODS.some(food =>
      recipeText.includes(food.toLowerCase())
    );

    if (hasPregnancyExcludedFood) {
      reasons.push("임산부 제외 음식 포함");
      console.log("❌ 임산부 제외 음식 필터링 실패");
      console.groupEnd();
      return { 
        passed: false, 
        reasons, 
        stages,
        exclusionType: 'absolute'
      };
    }
    stages.push("pregnancy-excluded-foods");
    console.log("✅ 임산부 제외 음식 필터링 통과");
  }

  console.log(`✅ 모든 필터링 통과 (주의사항 ${warnings.length}개)`);
  console.groupEnd();

  return { 
    passed: true, 
    reasons: [], 
    stages,
    warnings: warnings.length > 0 ? warnings : undefined,
    exclusionType: warnings.length > 0 ? 'moderate' : null
  };
}

/**
 * 레시피 목록에 대한 통합 필터링 (일일 영양소 추적 포함)
 */
export async function filterRecipes(
  recipes: RecipeDetailForDiet[],
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[],
  dailyNutrition?: DailyNutritionTracker
): Promise<RecipeDetailForDiet[]> {
  console.group(`🔍 통합 필터링 파이프라인 실행 (${recipes.length}개 레시피)`);

  const filteredRecipes: RecipeDetailForDiet[] = [];
  const excludedCounts: Record<string, number> = {};

  // 제외 음식 목록을 한 번만 조회 (성능 최적화)
  const excludedFoodsList = excludedFoods || 
    (healthProfile.diseases && healthProfile.diseases.length > 0
      ? await getExcludedFoods(healthProfile.diseases)
      : []);

  for (const recipe of recipes) {
    const result = await filterRecipe(recipe, healthProfile, excludedFoodsList, dailyNutrition);

    if (result.passed) {
      // 주의사항과 영양소 상세 정보 추가
      const enrichedRecipe: RecipeDetailForDiet = {
        ...recipe,
        warnings: result.warnings,
        exclusionType: result.exclusionType || null,
        nutritionDetails: {
          sugar: estimateSugarContent(recipe),
          sodium: recipe.nutrition.sodium,
          fat: recipe.nutrition.fat,
          potassium: recipe.nutrition.potassium,
          phosphorus: recipe.nutrition.phosphorus,
        }
      };
      filteredRecipes.push(enrichedRecipe);
    } else {
      // 제외된 이유별 카운트
      for (const reason of result.reasons) {
        excludedCounts[reason] = (excludedCounts[reason] || 0) + 1;
      }
    }
  }

  console.log(`✅ 필터링 완료: ${filteredRecipes.length}개 통과, ${recipes.length - filteredRecipes.length}개 제외`);
  if (Object.keys(excludedCounts).length > 0) {
    console.log("📊 제외 이유별 통계:", excludedCounts);
  }
  console.groupEnd();

  return filteredRecipes;
}

/**
 * 필터링 결과 상세 정보 반환 (디버깅용)
 */
export async function filterRecipeWithDetails(
  recipe: RecipeDetailForDiet,
  healthProfile: UserHealthProfile,
  excludedFoods?: ExcludedFood[]
): Promise<{
  passed: boolean;
  details: {
    stage: string;
    passed: boolean;
    reason?: string;
  }[];
}> {
  const details: { stage: string; passed: boolean; reason?: string }[] = [];

  // 1. 알레르기 필터링
  const allergyResult = checkAllergyCompatibility(
    recipe,
    healthProfile.allergies || []
  );
  details.push({
    stage: "allergy",
    passed: allergyResult,
    reason: allergyResult ? undefined : "알레르기 유발 재료 포함",
  });
  if (!allergyResult) {
    return { passed: false, details };
  }

  // 2. 질병별 제외 음식 필터링
  if (healthProfile.diseases && healthProfile.diseases.length > 0) {
    const excludedFoodsList = excludedFoods || await getExcludedFoods(healthProfile.diseases);
    if (excludedFoodsList.length > 0) {
      const exclusionResult = isRecipeExcludedForDisease(recipe, excludedFoodsList);
      details.push({
        stage: "disease-excluded-foods",
        passed: !exclusionResult.excluded,
        reason: exclusionResult.excluded ? exclusionResult.reason : undefined,
      });
      if (exclusionResult.excluded) {
        return { passed: false, details };
      }
    }
  }

  // 3. 질병별 영양소 제한 필터링
  const nutritionResult = checkNutritionLimits(
    recipe,
    healthProfile.diseases || []
  );
  details.push({
    stage: "nutrition-limits",
    passed: nutritionResult.passed,
    reason: nutritionResult.passed ? undefined : nutritionResult.reason,
  });
  if (!nutritionResult.passed) {
    return { passed: false, details };
  }

  // 4. 나트륨 제한 필터링
  const { checkSodiumLimit } = await import("./food-filtering");
  const sodiumResult = checkSodiumLimit(recipe, healthProfile.diseases || []);
  details.push({
    stage: "sodium-limit",
    passed: sodiumResult,
    reason: sodiumResult ? undefined : "나트륨 함량이 높음",
  });
  if (!sodiumResult) {
    return { passed: false, details };
  }

  // 5. 비선호 재료 필터링
  const preferenceResult = checkDislikedIngredients(
    recipe,
    healthProfile.disliked_ingredients || []
  );
  details.push({
    stage: "preferences",
    passed: preferenceResult.passed,
    reason: preferenceResult.passed ? undefined : preferenceResult.reason,
  });
  if (!preferenceResult.passed) {
    return { passed: false, details };
  }

  return { passed: true, details };
}

