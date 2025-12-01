/**
 * @file lib/diet/food-filtering.ts
 * @description 질병 및 알레르기 기반 음식 필터링
 *
 * 핵심 기능:
 * 1. 질병별 제외 음식 조회 (family-recommendation.ts와 연동)
 * 2. 레시피 호환성 검사 (재료 + 키워드)
 * 3. 나트륨 제한 확인
 */

import {
  getExcludedFoods as getExcludedFoodsFromRecommendation,
  filterRecipesByExcludedFoods,
  isRecipeExcludedForDisease as checkRecipeExclusion
} from "@/lib/diet/family-recommendation";
import type { ExcludedFood } from "@/lib/diet/family-recommendation";
import type { RecipeDetailForDiet } from "@/types/recipe";

// 하위 호환성을 위한 타입 별칭
export type DiseaseExcludedFood = ExcludedFood;

/**
 * 질병별 제외 음식 조회 (새로운 family-recommendation.ts 사용)
 */
export async function getExcludedFoods(diseases: string[]): Promise<DiseaseExcludedFood[]> {
  return getExcludedFoodsFromRecommendation(diseases);
}

/**
 * 레시피가 제외 음식을 포함하는지 확인
 *
 * @returns true: 레시피 사용 가능, false: 제외해야 함
 */
export function isRecipeCompatible(
  recipe: RecipeDetailForDiet,
  excludedFoods: DiseaseExcludedFood[]
): boolean {
  if (excludedFoods.length === 0) return true;

  console.group(`🔍 레시피 호환성 체크: ${recipe.title}`);

  // 새로운 로직 사용
  const result = isRecipeExcludedForDisease(recipe, excludedFoods);

  console.groupEnd();
  return !result.excluded;
}

/**
 * 레시피가 질병에 대해 제외되는지 확인 (새로운 함수)
 */
export function isRecipeExcludedForDisease(
  recipe: RecipeDetailForDiet,
  excludedFoods: ExcludedFood[]
): { excluded: boolean; reason?: string; severity?: string } {
  // family-recommendation.ts에서 import한 함수 사용
  return checkRecipeExclusion(recipe, excludedFoods);
}

/**
 * 레시피 목록에서 호환 가능한 레시피만 필터링
 */
export function filterCompatibleRecipes(
  recipes: RecipeDetailForDiet[],
  diseases: string[],
  excludedFoods: DiseaseExcludedFood[]
): RecipeDetailForDiet[] {
  console.group(`🔍 레시피 필터링: 총 ${recipes.length}개`);

  // 새로운 필터링 함수 사용
  const compatible = filterRecipesByExcludedFoods(recipes, excludedFoods);

  console.log(`✅ 호환 가능: ${compatible.length}개`);
  console.groupEnd();

  return compatible;
}

/**
 * 나트륨 제한 확인
 */
export function checkSodiumLimit(
  recipe: RecipeDetailForDiet,
  diseases?: string[]
): boolean {
  if (!diseases || diseases.length === 0) return true;
  if (!recipe.nutrition.sodium) return true;  // 나트륨 정보 없으면 통과

  const lowSodiumDiseases = ["hypertension", "kidney_disease", "heart_disease"];
  const hasLowSodiumRequirement = diseases.some(d => lowSodiumDiseases.includes(d));

  if (hasLowSodiumRequirement) {
    // 식사당 나트륨 권장량: 약 600-700mg (하루 2000mg ÷ 3식)
    const MAX_SODIUM_PER_MEAL = 700;

    if (recipe.nutrition.sodium > MAX_SODIUM_PER_MEAL) {
      console.warn(`⚠️ 나트륨 과다: ${recipe.nutrition.sodium}mg (권장: ${MAX_SODIUM_PER_MEAL}mg 이하)`);
      return false;
    }
  }

  return true;
}

/**
 * 알레르기 유발 가능성이 있는 파생 재료 매핑
 * 키: 알레르기 유발 원재료 (영어/한글)
 * 값: 해당 재료가 포함될 수 있는 음식/소스 목록
 */
const ALLERGY_DERIVED_INGREDIENTS: Record<string, string[]> = {
  // 갑각류 (Shellfish)
  shellfish: ["새우", "게", "가재", "랍스터", "대하", "꽃게", "젓갈", "새우젓", "멸치젓", "액젓", "김치", "해물", "짬뽕", "오징어", "낙지", "쭈꾸미", "조개", "굴", "홍합", "전복"],
  shrimp: ["새우", "대하", "칵테일새우", "새우젓", "새우가루", "건새우", "김치", "해물", "짬뽕", "튀김"],
  crab: ["게", "꽃게", "대게", "게맛살", "크래미", "게장", "해물", "짬뽕"],

  // 우유 (Milk/Dairy)
  dairy: ["우유", "치즈", "버터", "크림", "요거트", "유청", "분유", "라떼", "빵", "케이크", "쿠키", "초콜릿", "피자", "파스타", "스프"],
  milk: ["우유", "치즈", "버터", "크림", "요거트", "유청", "분유", "라떼", "빵", "케이크", "쿠키", "초콜릿"],

  // 계란 (Eggs)
  eggs: ["계란", "달걀", "난황", "난백", "마요네즈", "빵", "케이크", "쿠키", "지단", "전", "튀김", "머랭"],

  // 땅콩 (Peanuts)
  peanuts: ["땅콩", "피넛", "땅콩버터", "견과류", "초콜릿", "시리얼", "쿠키", "탄탄면"],

  // 견과류 (Tree Nuts)
  tree_nuts: ["호두", "아몬드", "잣", "캐슈넛", "피스타치오", "마카다미아", "견과류", "초콜릿", "시리얼", "쿠키", "페스토"],

  // 밀 (Wheat)
  wheat: ["밀", "밀가루", "빵", "면", "국수", "파스타", "라면", "만두", "튀김", "부침가루", "튀김가루", "간장", "된장", "고추장", "맥주"],

  // 대두 (Soy)
  soy: ["콩", "대두", "두부", "두유", "간장", "된장", "고추장", "쌈장", "청국장", "콩기름", "유부", "어묵"],

  // 생선 (Fish)
  fish: ["생선", "고등어", "갈치", "참치", "연어", "대구", "명태", "멸치", "어묵", "액젓", "젓갈", "김치", "해물", "육수"],
};

/**
 * 알레르기 체크 (엄격한 모드)
 */
export function checkAllergyCompatibility(
  recipe: RecipeDetailForDiet,
  allergies: string[]
): boolean {
  if (!allergies || allergies.length === 0) return true;

  // console.group(`🔍 알레르기 체크: ${recipe.title}`);

  // 1. 레시피 제목 체크
  for (const allergy of allergies) {
    const allergyKey = allergy.toLowerCase();

    // 직접적인 알레르기명 체크
    if (recipe.title.includes(allergyKey)) {
      // console.warn(`⚠️ 제목에 알레르기 포함: ${recipe.title} (알레르기: ${allergy})`);
      // console.groupEnd();
      return false;
    }

    // 파생 재료 체크
    const derived = ALLERGY_DERIVED_INGREDIENTS[allergyKey];
    if (derived) {
      for (const riskItem of derived) {
        if (recipe.title.includes(riskItem)) {
          // 김치의 경우, '비건 김치'나 '백김치' 등 예외가 있을 수 있지만, 
          // 안전을 위해 기본적으로 제외하고, 추후 '비건' 태그 등으로 살릴 수 있음.
          // 여기서는 엄격하게 제외.
          // console.warn(`⚠️ 제목에 알레르기 위험군 포함: ${recipe.title} (위험군: ${riskItem}, 알레르기: ${allergy})`);
          // console.groupEnd();
          return false;
        }
      }
    }
  }

  // 2. 재료 목록 체크
  for (const ingredient of recipe.ingredients) {
    const ingredientName = ingredient.name.toLowerCase();

    for (const allergy of allergies) {
      const allergyKey = allergy.toLowerCase();

      // 직접 매칭
      if (ingredientName.includes(allergyKey)) {
        // console.warn(`⚠️ 알레르기 성분 발견: ${ingredient.name} (알레르기: ${allergy})`);
        // console.groupEnd();
        return false;
      }

      // 파생 재료 매칭
      const derived = ALLERGY_DERIVED_INGREDIENTS[allergyKey];
      if (derived) {
        for (const riskItem of derived) {
          if (ingredientName.includes(riskItem)) {
            // console.warn(`⚠️ 알레르기 위험 성분 발견: ${ingredient.name} (위험군: ${riskItem}, 알레르기: ${allergy})`);
            // console.groupEnd();
            return false;
          }
        }
      }
    }
  }

  // console.log(`✅ 알레르기 성분 없음`);
  // console.groupEnd();
  return true;
}

