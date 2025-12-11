/**
 * @file recommendation.ts
 * @description 건강 맞춤 식단 추천 알고리즘 (규칙 기반)
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
import { filterRecipes as integratedFilterRecipes } from "@/lib/diet/integrated-filter";
import { calculateMacroGoals, calculateMealMacroGoals } from "@/lib/diet/macro-calculator";

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
 * 레시피에 점수 부여 (개선된 버전: 매크로 목표 및 질병별 권장 식품 고려)
 */
function calculateRecipeScore(
  recipe: RecipeWithNutrition,
  healthProfile: UserHealthProfile,
  targetCalories?: number,
  macroGoals?: {
    protein: { target: number };
    carbohydrates: { target: number };
    fat: { target: number };
  }
): number {
  let score = 0;

  // 1. 기본 점수 (별점 기반)
  score += (recipe.average_rating || 0) * 10;

  // 2. 선호 식재료 매칭
  const recipeText = recipe.title.toLowerCase();
  for (const preferred of healthProfile.preferred_ingredients) {
    if (recipeText.includes(preferred.toLowerCase())) {
      score += 20;
    }
  }

  // 3. 칼로리 목표 근접도 점수
  if (recipe.calories !== null && targetCalories) {
    const calorieDiff = Math.abs(recipe.calories - targetCalories);
    const calorieScore = Math.max(0, 30 - calorieDiff / 10);
    score += calorieScore;
  } else if (recipe.calories !== null) {
    // 목표 칼로리가 없으면 일일 목표의 1/3 기준
    const calorieDiff = Math.abs(
      recipe.calories - healthProfile.daily_calorie_goal / 3
    );
    score += Math.max(0, 30 - calorieDiff / 10);
  }

  // 4. 매크로 목표 충족도 점수 (매크로 목표가 있는 경우)
  if (macroGoals && recipe.protein !== null && recipe.carbohydrates !== null && recipe.fat !== null) {
    // 단백질 점수 (목표에 가까울수록 높은 점수, 단백질 최우선)
    const proteinDiff = Math.abs(recipe.protein - macroGoals.protein.target);
    const proteinScore = Math.max(0, 40 - proteinDiff / 2); // 단백질은 가중치 높게
    score += proteinScore;

    // 탄수화물 점수
    const carbDiff = Math.abs(recipe.carbohydrates - macroGoals.carbohydrates.target);
    const carbScore = Math.max(0, 20 - carbDiff / 5);
    score += carbScore;

    // 지방 점수
    const fatDiff = Math.abs(recipe.fat - macroGoals.fat.target);
    const fatScore = Math.max(0, 20 - fatDiff / 5);
    score += fatScore;
  }

  // 5. 질병별 권장 식품 가산점
  const diseases = healthProfile.diseases || [];
  
  // 당뇨: 저GI 식품, 고섬유 식품
  if (diseases.includes("diabetes")) {
    const lowGIFoods = ["현미", "잡곡", "귀리", "퀴노아", "고구마", "콩", "두부", "야채"];
    const highFiberFoods = ["콩", "두부", "야채", "과일", "견과"];
    if (lowGIFoods.some(food => recipeText.includes(food))) {
      score += 15;
    }
    if (highFiberFoods.some(food => recipeText.includes(food))) {
      score += 10;
    }
  }

  // CKD: 저칼륨, 저인 식품
  if (diseases.includes("kidney_disease")) {
    const lowPotassiumFoods = ["사과", "배", "양배추", "오이", "당근", "양파"];
    const lowPhosphorusFoods = ["사과", "배", "양배추", "오이", "당근"];
    if (lowPotassiumFoods.some(food => recipeText.includes(food))) {
      score += 15;
    }
    if (lowPhosphorusFoods.some(food => recipeText.includes(food))) {
      score += 15;
    }
  }

  // 심혈관 질환: 저나트륨, 저지방 식품
  if (diseases.includes("cardiovascular_disease")) {
    const lowSodiumFoods = ["야채", "과일", "생선", "닭가슴살"];
    const lowFatFoods = ["닭가슴살", "생선", "두부", "콩"];
    if (lowSodiumFoods.some(food => recipeText.includes(food))) {
      score += 10;
    }
    if (lowFatFoods.some(food => recipeText.includes(food))) {
      score += 10;
    }
    // 나트륨이 낮으면 가산점
    if (recipe.sodium !== null && recipe.sodium < 400) {
      score += 15;
    }
  }

  // 통풍: 저퓨린 식품
  if (diseases.includes("gout")) {
    const lowPurineFoods = ["달걀", "계란", "두부", "콩", "우유", "치즈", "야채"];
    if (lowPurineFoods.some(food => recipeText.includes(food))) {
      score += 15;
    }
  }

  // 어린이: 성장기 필수 영양소 (단백질, 칼슘, 비타민)
  if (healthProfile.age !== null && healthProfile.age < 18) {
    const growthFoods = ["우유", "치즈", "달걀", "생선", "콩", "두부", "야채"];
    if (growthFoods.some(food => recipeText.includes(food))) {
      score += 10;
    }
    // 단백질 함량이 높으면 가산점
    if (recipe.protein !== null && recipe.protein > 15) {
      score += 10;
    }
  }

  // 임산부: 엽산, 철분, 칼슘 함유 식품
  const isPregnant = (healthProfile as any).pregnancy_trimester !== undefined;
  if (isPregnant) {
    const pregnancyFoods = ["시금치", "브로콜리", "콩", "두부", "달걀", "우유", "치즈", "생선"];
    if (pregnancyFoods.some(food => recipeText.includes(food))) {
      score += 15;
    }
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

  // 매크로 목표 계산
  const dailyMacroGoals = calculateMacroGoals(
    healthProfile.daily_calorie_goal,
    healthProfile
  );
  console.log("매크로 목표:", dailyMacroGoals);

  // 호환되는 레시피만 필터링 (통합 필터링 파이프라인 사용)
  console.log("🔍 레시피 호환성 검사 시작...");
  
  // RecipeWithNutrition을 RecipeDetailForDiet로 변환
  const recipeDetails = recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    description: "",
    source: "database" as const,
    ingredients: [],
    instructions: "",
    nutrition: {
      calories: recipe.calories || 0,
      protein: recipe.protein || 0,
      carbs: recipe.carbohydrates || 0,
      fat: recipe.fat || 0,
      sodium: recipe.sodium || 0,
      fiber: 0,
      potassium: undefined,
      phosphorus: undefined,
      gi: undefined,
    },
    emoji: "",
  }));

  // 통합 필터링 파이프라인 적용
  const filteredRecipeDetails = await integratedFilterRecipes(recipeDetails, healthProfile);
  const filteredIds = new Set(filteredRecipeDetails.map(r => r.id));
  let compatibleRecipes = recipes.filter(r => filteredIds.has(r.id));

  // 특수 식단 필터 적용
  if (healthProfile.dietary_preferences && healthProfile.dietary_preferences.length > 0) {
    console.log("🔍 특수 식단 필터 적용:", healthProfile.dietary_preferences);
    const { filterRecipesBySpecialDiet } = await import("./special-diet-filters");
    
    // RecipeWithNutrition을 RecipeDetailForDiet로 변환
    const recipeDetails: any[] = compatibleRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      description: "",
      ingredients: [],
      nutrition: {
        calories: r.calories || 0,
        protein: r.protein || 0,
        carbs: r.carbohydrates || 0,
        fat: r.fat || 0,
      },
    }));

    const filtered = filterRecipesBySpecialDiet(recipeDetails, healthProfile.dietary_preferences);
    const filteredIds = new Set(filtered.map((r) => r.id));
    compatibleRecipes = compatibleRecipes.filter((r) => filteredIds.has(r.id));
    console.log("✅ 특수 식단 필터 적용 후:", compatibleRecipes.length, "개");
  }

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

    // 식사별 매크로 목표 계산
    const mealCalorieRatio = {
      breakfast: 0.30,
      lunch: 0.35,
      dinner: 0.30,
      snack: 0.05,
    }[mealType];
    const mealMacroGoals = calculateMealMacroGoals(
      mealType,
      dailyMacroGoals,
      mealCalorieRatio
    );

    console.log(`🍽️ ${mealType} 칼로리 범위:`, calorieRange);
    console.log(`🍽️ ${mealType} 매크로 목표:`, mealMacroGoals);

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

    // 점수 계산 및 정렬 (매크로 목표 포함)
    const scored = candidates
      .map((recipe) => ({
        recipe,
        score: calculateRecipeScore(
          recipe,
          healthProfile,
          calorieRange.min + (calorieRange.max - calorieRange.min) / 2, // 목표 칼로리 (중간값)
          mealMacroGoals // 매크로 목표 전달
        ),
      }))
      .sort((a, b) => b.score - a.score);

    // 최고 점수 레시피 선택
    const selectedRecipe = scored[0].recipe;
    recommendations[mealType] = selectedRecipe;

    console.log(`✅ ${mealType} 선택:`, {
      title: selectedRecipe.title,
      calories: selectedRecipe.calories,
      protein: selectedRecipe.protein,
      carbs: selectedRecipe.carbohydrates,
      fat: selectedRecipe.fat,
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

