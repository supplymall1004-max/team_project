/**
 * @file recommendation.ts
 * @description AI 식단 추천 알고리즘 (규칙 기반)
 *
 * 주요 기능:
 * 1. 칼로리/영양소 기반 필터링
 * 2. 알레르기/질병 정보 기반 제외 (데이터베이스 기반 제외 음식 포함)
 * 3. 선호도 기반 가중치 적용
 * 4. 일일 식단 생성 (아침/점심/저녁)
 */

import { RecipeListItem } from "@/types/recipe";
import {
  UserHealthProfile,
  MealType,
  NutritionInfo,
  Disease,
  Allergy,
} from "@/types/health";
import { getExcludedFoods, isRecipeExcludedForDisease } from "@/lib/diet/family-recommendation";
import type { ExcludedFood } from "@/lib/diet/family-recommendation";

interface RecipeWithNutrition extends RecipeListItem {
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
}

/**
 * 레시피가 사용자의 건강 정보와 호환되는지 확인 (확장 버전)
 * 데이터베이스 기반 제외 음식 필터링 포함
 */
async function isRecipeCompatible(
  recipe: RecipeWithNutrition,
  healthProfile: UserHealthProfile
): Promise<boolean> {
  console.groupCollapsed("[DietRecommendation] 레시피 호환성 검사");
  console.log("recipeId", recipe.id);
  console.log("recipeTitle", recipe.title);

  // 1. 알레르기 체크 (재료명에 알레르기 유발 식재료가 포함되어 있는지)
  const recipeIngredients = recipe.title.toLowerCase(); // 간단한 체크 (실제로는 재료 테이블 조회 필요)
  for (const allergy of healthProfile.allergies) {
    const allergyKeywords: Record<Allergy, string[]> = {
      milk: ["우유", "치즈", "버터", "크림"],
      egg: ["계란", "달걀", "에그"],
      peanut: ["땅콩"],
      tree_nut: ["견과", "아몬드", "호두"],
      fish: ["생선", "연어", "참치"],
      shellfish: ["새우", "게", "조개"],
      wheat: ["밀", "면", "파스타"],
      soy: ["대두", "콩", "두부"],
      buckwheat: ["메밀", "메밀국수"],
      mackerel: ["고등어"],
      crab: ["게", "꽃게", "킹크랩"],
      shrimp: ["새우", "대하"],
      pork: ["돼지", "돼지고기", "삼겹살"],
      walnut: ["호두"],
      pine_nut: ["잣"],
      peach: ["복숭아"],
      tomato: ["토마토"],
      sulfites: ["아황산염", "건포도", "포도주"],
    };

    const keywords = allergyKeywords[allergy] || [];
    if (keywords.some((keyword) => recipeIngredients.includes(keyword))) {
      console.log("❌ rejected: allergy", allergy);
      console.groupEnd();
      return false;
    }
  }

  // 2. 질병별 제외 음식 데이터베이스 조회 및 필터링
  if (healthProfile.diseases && healthProfile.diseases.length > 0) {
    console.log("🔍 질병별 제외 음식 필터링 중...");
    const excludedFoods = await getExcludedFoods(healthProfile.diseases);

    if (excludedFoods.length > 0) {
      // RecipeDetailForDiet 형식으로 변환 (호환성을 위해)
      const recipeForCheck = {
        id: recipe.id,
        title: recipe.title,
        description: "", // RecipeListItem에는 description이 없으므로 빈 문자열
        ingredients: [], // 현재 레시피 타입에 재료 정보가 없으므로 빈 배열
        instructions: "",
        nutrition: {
          calories: recipe.calories || 0,
          protein: recipe.protein || 0,
          carbs: recipe.carbohydrates || 0,
          fat: recipe.fat || 0,
          sodium: recipe.sodium || 0,
          fiber: 0,
        },
        emoji: "",
      };

      const exclusionResult = isRecipeExcludedForDisease(recipeForCheck, excludedFoods);
      if (exclusionResult.excluded) {
        console.log(`❌ rejected: ${exclusionResult.reason} (${exclusionResult.severity})`);
        console.groupEnd();
        return false;
      }
    }
  }

  // 3. 기존 질병별 영양소 제한사항 체크 (보조 필터링)
  for (const disease of healthProfile.diseases) {
    // 당뇨: 고탄수화물 제한
    if (disease === "diabetes") {
      if (
        recipe.carbohydrates !== null &&
        recipe.carbohydrates > 50 // 임계값 (g)
      ) {
        console.log("❌ rejected: diabetes (high carbs)", recipe.carbohydrates);
        console.groupEnd();
        return false;
      }
    }

    // 고혈압: 고나트륨 제한
    if (disease === "hypertension") {
      if (recipe.sodium !== null && recipe.sodium > 500) {
        // 임계값 (mg)
        console.log("❌ rejected: hypertension (high sodium)", recipe.sodium);
        console.groupEnd();
        return false;
      }
    }

    // 신장질환: 고단백질 제한
    if (disease === "kidney_disease") {
      if (recipe.protein !== null && recipe.protein > 30) {
        // 임계값 (g)
        console.log("❌ rejected: kidney_disease (high protein)", recipe.protein);
        console.groupEnd();
        return false;
      }
    }
  }

  // 4. 비선호 식재료 체크
  for (const disliked of healthProfile.disliked_ingredients) {
    if (recipeIngredients.includes(disliked.toLowerCase())) {
      console.log("❌ rejected: disliked ingredient", disliked);
      console.groupEnd();
      return false;
    }
  }

  console.log("✅ accepted");
  console.groupEnd();
  return true;
}

/**
 * 레시피에 점수 부여 (선호도 기반)
 */
function calculateRecipeScore(
  recipe: RecipeWithNutrition,
  healthProfile: UserHealthProfile
): number {
  let score = 0;

  // 기본 점수 (별점 기반)
  score += (recipe.average_rating || 0) * 10;

  // 선호 식재료 매칭
  const recipeText = recipe.title.toLowerCase();
  for (const preferred of healthProfile.preferred_ingredients) {
    if (recipeText.includes(preferred.toLowerCase())) {
      score += 20;
    }
  }

  // 영양소 균형 점수 (칼로리 목표에 가까울수록 높은 점수)
  if (recipe.calories !== null) {
    const calorieDiff = Math.abs(
      recipe.calories - healthProfile.daily_calorie_goal / 3
    );
    score += Math.max(0, 30 - calorieDiff / 10);
  }

  return score;
}

/**
 * 식사 유형별 적합한 칼로리 범위
 */
function getMealCalorieRange(
  mealType: MealType,
  dailyGoal: number
): { min: number; max: number } {
  const ranges: Record<MealType, { min: number; max: number }> = {
    breakfast: { min: dailyGoal * 0.2, max: dailyGoal * 0.3 }, // 20-30%
    lunch: { min: dailyGoal * 0.3, max: dailyGoal * 0.4 }, // 30-40%
    dinner: { min: dailyGoal * 0.25, max: dailyGoal * 0.35 }, // 25-35%
    snack: { min: dailyGoal * 0.05, max: dailyGoal * 0.15 }, // 5-15%
  };

  return ranges[mealType];
}

/**
 * 일일 식단 추천 생성
 */
export async function recommendDailyDiet(
  recipes: RecipeWithNutrition[],
  healthProfile: UserHealthProfile,
  date: string
): Promise<{
  breakfast: RecipeWithNutrition | null;
  lunch: RecipeWithNutrition | null;
  dinner: RecipeWithNutrition | null;
  snack: RecipeWithNutrition | null;
  totalNutrition: NutritionInfo;
}> {
  console.groupCollapsed("[DietRecommendation] 일일 식단 추천");
  console.log("date", date);
  console.log("dailyGoal", healthProfile.daily_calorie_goal);

  // 호환되는 레시피만 필터링 (비동기)
  console.log("🔍 레시피 호환성 검사 시작...");
  const compatibilityResults = await Promise.all(
    recipes.map(recipe => isRecipeCompatible(recipe, healthProfile))
  );

  const compatibleRecipes = recipes.filter((_, index) => compatibilityResults[index]);

  console.log("✅ 호환되는 레시피 수:", compatibleRecipes.length);
  console.log("📊 호환 레시피 샘플:", compatibleRecipes.slice(0, 3).map(r => ({
    id: r.id,
    title: r.title,
    calories: r.calories
  })));

  if (compatibleRecipes.length === 0) {
    console.warn("❌ 호환되는 레시피가 하나도 없습니다!");
    console.groupEnd();
    return {
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
      totalNutrition: {
        calories: 0,
        carbohydrates: 0,
        protein: 0,
        fat: 0,
        sodium: 0,
      },
    };
  }

  // 식사 유형별 추천
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const recommendations: Partial<
    Record<MealType, RecipeWithNutrition | null>
  > = {};

  for (const mealType of mealTypes) {
    const calorieRange = getMealCalorieRange(
      mealType,
      healthProfile.daily_calorie_goal
    );

    console.log(`🍽️ ${mealType} 칼로리 범위:`, calorieRange);

    // 칼로리 범위에 맞는 레시피 필터링
    const candidates = compatibleRecipes.filter((recipe) => {
      if (recipe.calories === null) return true; // 영양소 정보가 없으면 포함
      return (
        recipe.calories >= calorieRange.min &&
        recipe.calories <= calorieRange.max
      );
    });

    console.log(`🍽️ ${mealType} 후보 레시피:`, candidates.length);

    if (candidates.length === 0) {
      console.log(`⚠️ ${mealType}에 적합한 레시피가 없습니다`);
      recommendations[mealType] = null;
      continue;
    }

    // 점수 계산 및 정렬
    const scored = candidates
      .map((recipe) => ({
        recipe,
        score: calculateRecipeScore(recipe, healthProfile),
      }))
      .sort((a, b) => b.score - a.score);

    // 최고 점수 레시피 선택
    const selectedRecipe = scored[0].recipe;
    recommendations[mealType] = selectedRecipe;

    console.log(`✅ ${mealType} 선택:`, {
      title: selectedRecipe.title,
      calories: selectedRecipe.calories,
      score: scored[0].score
    });
  }

  // 총 영양소 계산
  const totalNutrition: NutritionInfo = {
    calories: 0,
    carbohydrates: 0,
    protein: 0,
    fat: 0,
    sodium: 0,
  };

  Object.values(recommendations).forEach((recipe) => {
    if (recipe) {
      totalNutrition.calories += recipe.calories || 0;
      totalNutrition.carbohydrates += recipe.carbohydrates || 0;
      totalNutrition.protein += recipe.protein || 0;
      totalNutrition.fat += recipe.fat || 0;
      totalNutrition.sodium += recipe.sodium || 0;
    }
  });

  console.log("recommendations", recommendations);
  console.log("totalNutrition", totalNutrition);
  console.groupEnd();

  return {
    breakfast: recommendations.breakfast || null,
    lunch: recommendations.lunch || null,
    dinner: recommendations.dinner || null,
    snack: recommendations.snack || null,
    totalNutrition,
  };
}

