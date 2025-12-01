/**
 * @file special-diet-filters.ts
 * @description 특수 식단 필터링 로직
 *
 * 주요 기능:
 * 1. 도시락 반찬 위주 식단 필터
 * 2. 헬스인 닭가슴살 위주 식단 필터
 * 3. 다이어트 저탄수화물 식단 필터
 * 4. 비건/베지테리언 식단 필터
 */

import type { RecipeDetailForDiet } from "@/types/recipe";
import type { SpecialDietType } from "@/types/health";

/**
 * 도시락 반찬 위주 식단 필터
 * - 반찬류 위주 (밥, 국 제외)
 * - 보관이 잘 되는 음식
 * - 간단한 조리법
 */
function filterBentoDiet(recipe: RecipeDetailForDiet): boolean {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || "").toLowerCase();

  // 밥이나 국은 제외
  if (title.includes("밥") || title.includes("국") || title.includes("찌개") || title.includes("탕")) {
    return false;
  }

  // 반찬류 키워드
  const sideDishKeywords = [
    "나물",
    "무침",
    "볶음",
    "조림",
    "전",
    "부침",
    "김치",
    "절임",
    "장아찌",
    "피클",
  ];

  const hasSideDishKeyword = sideDishKeywords.some((keyword) =>
    title.includes(keyword) || description.includes(keyword)
  );

  return hasSideDishKeyword;
}

/**
 * 헬스인 닭가슴살 위주 식단 필터
 * - 닭가슴살 포함
 * - 고단백 저지방
 * - 탄수화물 적당
 */
function filterFitnessDiet(recipe: RecipeDetailForDiet): boolean {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || "").toLowerCase();
  const ingredients = recipe.ingredients.map((ing) => ing.name.toLowerCase()).join(" ");

  const text = `${title} ${description} ${ingredients}`;

  // 닭가슴살 키워드
  const chickenKeywords = ["닭가슴살", "닭 가슴살", "치킨", "닭고기"];
  const hasChicken = chickenKeywords.some((keyword) => text.includes(keyword));

  if (!hasChicken) {
    return false;
  }

  // 고단백 저지방 체크
  const protein = recipe.nutrition.protein || 0;
  const fat = recipe.nutrition.fat || 0;
  const carbs = recipe.nutrition.carbs || 0;

  // 단백질이 20g 이상이고, 지방이 단백질의 1.5배 이하
  const isHighProtein = protein >= 20;
  const isLowFat = fat <= protein * 1.5;

  return isHighProtein && isLowFat;
}

/**
 * 다이어트 저탄수화물 식단 필터
 * - 탄수화물 30g 이하
 * - 밥, 면, 빵 등 탄수화물 주식 제외
 */
function filterLowCarbDiet(recipe: RecipeDetailForDiet): boolean {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || "").toLowerCase();

  // 탄수화물 주식 제외
  const carbKeywords = ["밥", "면", "국수", "빵", "떡", "파스타", "스파게티"];
  const hasCarbKeyword = carbKeywords.some((keyword) =>
    title.includes(keyword) || description.includes(keyword)
  );

  if (hasCarbKeyword) {
    return false;
  }

  // 탄수화물 30g 이하
  const carbs = recipe.nutrition.carbs || 0;
  return carbs <= 30;
}

/**
 * 비건 식단 필터
 * - 모든 동물성 식품 제외
 */
function filterVeganDiet(recipe: RecipeDetailForDiet): boolean {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || "").toLowerCase();
  const ingredients = recipe.ingredients.map((ing) => ing.name.toLowerCase()).join(" ");

  const text = `${title} ${description} ${ingredients}`;

  // 동물성 식품 키워드
  const animalKeywords = [
    "고기",
    "육류",
    "돼지",
    "소고기",
    "쇠고기",
    "닭",
    "치킨",
    "오리",
    "생선",
    "고등어",
    "연어",
    "참치",
    "새우",
    "게",
    "조개",
    "굴",
    "전복",
    "해삼",
    "우유",
    "치즈",
    "버터",
    "크림",
    "계란",
    "달걀",
    "에그",
    "꿀",
    "벌꿀",
  ];

  const hasAnimalProduct = animalKeywords.some((keyword) => text.includes(keyword));

  return !hasAnimalProduct;
}

/**
 * 베지테리언 식단 필터
 * - 육류와 생선 제외 (유제품, 계란은 허용)
 */
function filterVegetarianDiet(recipe: RecipeDetailForDiet): boolean {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || "").toLowerCase();
  const ingredients = recipe.ingredients.map((ing) => ing.name.toLowerCase()).join(" ");

  const text = `${title} ${description} ${ingredients}`;

  // 육류 및 생선 키워드
  const meatFishKeywords = [
    "고기",
    "육류",
    "돼지",
    "소고기",
    "쇠고기",
    "닭",
    "치킨",
    "오리",
    "생선",
    "고등어",
    "연어",
    "참치",
    "새우",
    "게",
    "조개",
    "굴",
    "전복",
    "해삼",
  ];

  const hasMeatOrFish = meatFishKeywords.some((keyword) => text.includes(keyword));

  return !hasMeatOrFish;
}

/**
 * 특수 식단 타입에 따라 레시피 필터링
 */
export function filterRecipeBySpecialDiet(
  recipe: RecipeDetailForDiet,
  dietTypes: SpecialDietType[]
): boolean {
  console.groupCollapsed("[SpecialDietFilter] 레시피 필터링");
  console.log("recipe:", recipe.title);
  console.log("dietTypes:", dietTypes);

  // 식단 타입이 없으면 모든 레시피 통과
  if (dietTypes.length === 0) {
    console.log("✅ 식단 타입 없음 - 통과");
    console.groupEnd();
    return true;
  }

  // 모든 선택된 식단 타입을 만족해야 함 (AND 조건)
  for (const dietType of dietTypes) {
    let passes = false;

    switch (dietType) {
      case "bento":
        passes = filterBentoDiet(recipe);
        break;
      case "fitness":
        passes = filterFitnessDiet(recipe);
        break;
      case "low_carb":
        passes = filterLowCarbDiet(recipe);
        break;
      case "vegan":
        passes = filterVeganDiet(recipe);
        break;
      case "vegetarian":
        passes = filterVegetarianDiet(recipe);
        break;
      default:
        passes = true;
    }

    if (!passes) {
      console.log(`❌ ${dietType} 필터 통과 실패`);
      console.groupEnd();
      return false;
    }
  }

  console.log("✅ 모든 필터 통과");
  console.groupEnd();
  return true;
}

/**
 * 레시피 목록을 특수 식단 타입에 따라 필터링
 */
export function filterRecipesBySpecialDiet(
  recipes: RecipeDetailForDiet[],
  dietTypes: SpecialDietType[]
): RecipeDetailForDiet[] {
  if (dietTypes.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => filterRecipeBySpecialDiet(recipe, dietTypes));
}













