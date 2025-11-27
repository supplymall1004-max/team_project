/**
 * @file lib/diet/personal-diet-generator.ts
 * @description 개인 맞춤 식단 생성기 (밥+반찬3개+국/찌개 구조)
 * 
 * 핵심 로직:
 * 1. 칼로리 계산 (Harris-Benedict + 질병 조정)
 * 2. 식사별 칼로리 배분 (아침 30%, 점심 35%, 저녁 30%, 간식 5%)
 * 3. 한식 구조 - 밥(35%), 반찬3개(45%), 국/찌개(20%)
 * 4. 질병/알레르기 필터링
 * 5. 레시피 중복 방지 (30일)
 * 6. 제철 과일 간식
 */

import type { UserHealthProfile } from "@/types/family";
import type {
  DailyDietPlan,
  MealComposition,
  RecipeDetailForDiet,
  RecipeNutrition,
} from "@/types/recipe";
import { calculateUserGoalCalories } from "@/lib/diet/calorie-calculator";
import { getExcludedFoods, filterCompatibleRecipes, checkAllergyCompatibility } from "@/lib/diet/food-filtering";
import { searchFallbackRecipes } from "@/lib/recipes/fallback-recipes";
import { getRecentlyUsedRecipes } from "@/lib/diet/recipe-history";
import { recommendFruitSnack } from "@/lib/diet/seasonal-fruits";
import { calculateAge } from "@/lib/utils/age-calculator";

// 식사별 칼로리 비율
const MEAL_CALORIE_RATIOS = {
  breakfast: 0.30,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.05,
};

// 한식 식사 구성 칼로리 비율 (밥+반찬+국)
const DISH_CALORIE_RATIOS = {
  rice: 0.35,      // 밥 35%
  sides: 0.45,     // 반찬 3개 45% (각 15%)
  soup: 0.20,      // 국/찌개 20%
};

/**
 * 개인 맞춤 식단 생성
 */
export async function generatePersonalDiet(
  userId: string,
  profile: UserHealthProfile,
  targetDate: string, // 'YYYY-MM-DD'
  availableRecipes?: Array<{
    id: string;
    title: string;
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  }>
): Promise<DailyDietPlan> {
  console.group("🍱 개인 맞춤 식단 생성");
  console.log("사용자 ID:", userId);
  console.log("대상 날짜:", targetDate);
  console.log("건강 프로필:", profile);

  // 0. 어린이 감지 및 식단 비율 설정
  const isChild = profile.age && profile.age < 18;
  const mealCalorieRatios = isChild ? {
    breakfast: 0.25,  // 어린이: 아침 25%
    lunch: 0.35,      // 어린이: 점심 35%
    dinner: 0.30,     // 어린이: 저녁 30%
    snack: 0.10,      // 어린이: 간식 10%
  } : MEAL_CALORIE_RATIOS;

  if (isChild) {
    console.log(`👶 어린이 감지됨 (${profile.age}세) - 성장기 식단 비율 적용`);
  }

  // 1. 목표 칼로리 계산
  const dailyCalories = calculateUserGoalCalories(profile);
  console.log(`목표 칼로리: ${dailyCalories}kcal/일`);

  // 2. 질병별 제외 음식 조회
  const excludedFoods = await getExcludedFoods(profile.diseases || []);
  console.log(`제외 음식: ${excludedFoods.length}개`);

  // 3. 최근 사용 레시피 조회 (중복 방지)
  const recentlyUsed = await getRecentlyUsedRecipes(userId);
  console.log(`최근 사용 레시피: ${recentlyUsed.length}개`);

  // 4. 나이 계산 (과일 추천용)
  const age = profile.age || 30;

  // 5. 식사별 칼로리 배분 (어린이의 경우 성장기 비율 적용)
  const breakfastCalories = dailyCalories * mealCalorieRatios.breakfast;
  const lunchCalories = dailyCalories * mealCalorieRatios.lunch;
  const dinnerCalories = dailyCalories * mealCalorieRatios.dinner;
  const snackCalories = dailyCalories * mealCalorieRatios.snack;

  const breakfast = await selectMealComposition(
    "breakfast",
    breakfastCalories,
    excludedFoods,
    profile.allergies || [],
    recentlyUsed,
    availableRecipes || [],
    isChild
  );

  const lunch = await selectMealComposition(
    "lunch",
    lunchCalories,
    excludedFoods,
    profile.allergies || [],
    recentlyUsed,
    availableRecipes || [],
    isChild
  );

  const dinner = await selectMealComposition(
    "dinner",
    dinnerCalories,
    excludedFoods,
    profile.allergies || [],
    recentlyUsed,
    availableRecipes || [],
    isChild
  );

  // 6. 간식 (제철 과일)
  const currentMonth = new Date().getMonth() + 1;
  const fruitSnack = recommendFruitSnack(
    snackCalories,
    currentMonth,
    isChild,
    profile.diseases || []
  );

  const snack: RecipeDetailForDiet = {
    title: fruitSnack.fruit.name,
    description: fruitSnack.reason,
    source: "seasonal",
    ingredients: [
      {
        name: fruitSnack.fruit.name,
        amount: fruitSnack.servings.toString(),
        unit: "회분",
      },
    ],
    instructions: fruitSnack.fruit.kidsBenefits || fruitSnack.fruit.benefits.join(", "),
    nutrition: {
      calories: fruitSnack.totalCalories,
      protein: fruitSnack.fruit.nutrition.protein * fruitSnack.servings,
      carbs: fruitSnack.fruit.nutrition.carbs * fruitSnack.servings,
      fat: fruitSnack.fruit.nutrition.fat * fruitSnack.servings,
      fiber: fruitSnack.fruit.nutrition.fiber * fruitSnack.servings,
    },
    emoji: fruitSnack.fruit.emoji,
    imageUrl: fruitSnack.fruit.imageUrl,
    featureDescription: fruitSnack.fruit.goodForKids ? fruitSnack.fruit.kidsBenefits : undefined,
  };

  // 7. 총 영양 정보 계산
  const totalNutrition = calculateTotalNutrition([
    breakfast.totalNutrition,
    lunch.totalNutrition,
    dinner.totalNutrition,
    snack.nutrition,
  ]);

  console.log("✅ 식단 생성 완료");
  console.log("총 칼로리:", totalNutrition.calories, "kcal");
  console.groupEnd();

  // 구성품 요약 생성 및 로깅
  console.group("📋 식단 구성품 요약 생성");
  const breakfastComposition = [
    ...(breakfast.rice ? [breakfast.rice.title] : []),
    ...(breakfast.sides ? breakfast.sides.map(side => side.title) : []),
    ...(breakfast.soup ? [breakfast.soup.title] : []),
  ];
  const lunchComposition = [
    ...(lunch.rice ? [lunch.rice.title] : []),
    ...(lunch.sides ? lunch.sides.map(side => side.title) : []),
    ...(lunch.soup ? [lunch.soup.title] : []),
  ];
  const dinnerComposition = [
    ...(dinner.rice ? [dinner.rice.title] : []),
    ...(dinner.sides ? dinner.sides.map(side => side.title) : []),
    ...(dinner.soup ? [dinner.soup.title] : []),
  ];
  const snackComposition = [snack.title]; // 간식은 제철 과일 하나

  console.log("아침 구성품:", breakfastComposition);
  console.log("점심 구성품:", lunchComposition);
  console.log("저녁 구성품:", dinnerComposition);
  console.log("간식 구성품:", snackComposition);
  console.groupEnd();

  return {
    date: targetDate,
    breakfast: {
      ...breakfast,
      compositionSummary: breakfastComposition,
    },
    lunch: {
      ...lunch,
      compositionSummary: lunchComposition,
    },
    dinner: {
      ...dinner,
      compositionSummary: dinnerComposition,
    },
    snack: {
      ...snack,
      compositionSummary: snackComposition,
    },
    totalNutrition,
  };
}

/**
 * 식사 구성 선택 (밥 + 반찬 3개 + 국/찌개)
 */
async function selectMealComposition(
  mealType: "breakfast" | "lunch" | "dinner",
  targetCalories: number,
  excludedFoods: any[],
  allergies: string[],
  recentlyUsed: string[],
  availableRecipes: Array<{
    id: string;
    title: string;
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  }>,
  isChildDiet: boolean = false
): Promise<MealComposition> {
  console.group(`🍽️ ${mealType.toUpperCase()} 식사 구성`);
  console.log(`목표 칼로리: ${Math.round(targetCalories)}kcal`);

  // 칼로리 배분
  const riceCalories = targetCalories * DISH_CALORIE_RATIOS.rice;
  const sidesCalories = targetCalories * DISH_CALORIE_RATIOS.sides;
  const soupCalories = targetCalories * DISH_CALORIE_RATIOS.soup;

  // 1. 밥 선택
  const rice = await selectDishForMeal(
    "rice",
    mealType,
    riceCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    availableRecipes,
    isChildDiet
  );

  // 2. 반찬 3개 선택 (각 15%)
  const sideCaloriesEach = sidesCalories / 3;
  const sides: RecipeDetailForDiet[] = [];

  for (let i = 0; i < 3; i++) {
    const side = await selectDishForMeal(
      "side",
      mealType,
      sideCaloriesEach,
      excludedFoods,
      allergies,
      [...recentlyUsed, ...sides.map(s => s.title)], // 이미 선택한 반찬 제외
      availableRecipes,
      isChildDiet
    );
    if (side) sides.push(side);
  }

  // 3. 국/찌개 선택
  const soup = await selectDishForMeal(
    "soup",
    mealType,
    soupCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    availableRecipes,
    isChildDiet
  );

  // 총 영양 정보
  const allDishes = [rice, ...sides, soup].filter(Boolean) as RecipeDetailForDiet[];
  const totalNutrition = calculateMealNutrition(allDishes);

  // 구성품 요약 생성 (밥/반찬/국 등 이름 리스트)
  const compositionSummary: string[] = [];
  if (rice) compositionSummary.push(rice.title);
  compositionSummary.push(...sides.map(side => side.title));
  if (soup) compositionSummary.push(soup.title);

  console.log(`✅ 구성 완료: 밥 + 반찬${sides.length}개 + 국/찌개`);
  console.log(`구성품 요약: ${compositionSummary.join(', ')}`);
  console.log(`실제 칼로리: ${totalNutrition.calories}kcal`);
  console.groupEnd();

  return {
    rice,
    sides,
    soup,
    totalNutrition,
    compositionSummary,
  };
}

/**
 * 특정 요리 선택 (폴백 레시피 사용)
 */
async function selectDishForMeal(
  dishType: "rice" | "side" | "soup",
  mealType: "breakfast" | "lunch" | "dinner",
  targetCalories: number,
  excludedFoods: any[],
  allergies: string[],
  excludeNames: string[],
  availableRecipes: Array<{
    id: string;
    title: string;
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  }>,
  isChildDiet: boolean = false
): Promise<RecipeDetailForDiet | undefined> {
  console.log(`  - ${dishType} 선택 중 (목표: ${Math.round(targetCalories)}kcal)`);

  // availableRecipes에서 dishType에 맞는 레시피 필터링
  let candidates: RecipeDetailForDiet[] = [];

  if (availableRecipes && availableRecipes.length > 0) {
    // availableRecipes를 RecipeDetailForDiet 형식으로 변환
    candidates = availableRecipes
      .filter(recipe => {
        // dishType에 따라 필터링 (간단한 키워드 매칭)
        const title = recipe.title.toLowerCase();
        switch (dishType) {
          case "rice":
            return title.includes("밥") || title.includes("rice");
          case "side":
            return !title.includes("국") && !title.includes("찌개") && !title.includes("밥");
          case "soup":
            return title.includes("국") || title.includes("찌개") || title.includes("탕");
          default:
            return true;
        }
      })
      .map(recipe => ({
        title: recipe.title,
        description: "",
        source: "database",
        ingredients: [],
        instructions: "",
        nutrition: {
          calories: recipe.calories || 0,
          protein: recipe.protein || 0,
          carbs: recipe.carbohydrates || 0,
          fat: recipe.fat || 0,
          fiber: 0,
          sodium: recipe.sodium || 0,
        },
        dishType: [dishType],
        mealType: [mealType],
        emoji: dishType === "rice" ? "🍚" : dishType === "soup" ? "🍲" : "🍽️",
      }))
      .filter(recipe => !excludeNames.includes(recipe.title));
  } else {
    // 폴백 레시피 검색 (기존 방식)
    const { searchFallbackRecipes } = await import("@/lib/recipes/fallback-recipes");
    candidates = searchFallbackRecipes({
      dishType: [dishType],
      mealType,
      excludeNames,
      limit: 10,
    });
  }

  // 질병 필터링
  candidates = filterCompatibleRecipes(candidates, [], excludedFoods);

  // 알레르기 필터링
  candidates = candidates.filter(recipe => 
    checkAllergyCompatibility(recipe, allergies)
  );

  // 정렬 기준 설정 (칼로리 근접도 + 영양소 비율)
  candidates.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // 1. 칼로리 근접도 (기본 우선순위)
    const calorieDiffA = Math.abs(a.nutrition.calories - targetCalories);
    const calorieDiffB = Math.abs(b.nutrition.calories - targetCalories);
    scoreA += (1000 - calorieDiffA); // 칼로리 차이가 적을수록 높은 점수
    scoreB += (1000 - calorieDiffB);

    // 2. 어린이 식단의 경우 영양소 비율 고려
    if (isChildDiet) {
      // 어린이 성장기 권장 비율: 탄수화물 50%, 단백질 20%, 지방 30%
      const targetRatios = { carbs: 0.5, protein: 0.2, fat: 0.3 };
      const totalNutritionA = (a.nutrition.carbs || 0) + (a.nutrition.protein || 0) + (a.nutrition.fat || 0);
      const totalNutritionB = (b.nutrition.carbs || 0) + (b.nutrition.protein || 0) + (b.nutrition.fat || 0);

      if (totalNutritionA > 0) {
        const ratioDiffA =
          Math.abs((a.nutrition.carbs || 0) / totalNutritionA - targetRatios.carbs) +
          Math.abs((a.nutrition.protein || 0) / totalNutritionA - targetRatios.protein) +
          Math.abs((a.nutrition.fat || 0) / totalNutritionA - targetRatios.fat);
        scoreA += (100 - ratioDiffA * 100); // 비율 차이가 적을수록 높은 점수
      }

      if (totalNutritionB > 0) {
        const ratioDiffB =
          Math.abs((b.nutrition.carbs || 0) / totalNutritionB - targetRatios.carbs) +
          Math.abs((b.nutrition.protein || 0) / totalNutritionB - targetRatios.protein) +
          Math.abs((b.nutrition.fat || 0) / totalNutritionB - targetRatios.fat);
        scoreB += (100 - ratioDiffB * 100);
      }
    }

    return scoreB - scoreA; // 높은 점수가 먼저 오도록
  });

  const selected = candidates[0];

  if (selected) {
    console.log(`    ✅ 선택: ${selected.title} (${selected.nutrition.calories}kcal)` +
      (isChildDiet ? ` [어린이 식단]` : ''));
  } else {
    console.warn(`    ⚠️ 선택 실패 (후보 없음)`);
  }

  return selected;
}

/**
 * 식사 영양 정보 계산
 */
function calculateMealNutrition(dishes: RecipeDetailForDiet[]): RecipeNutrition {
  return dishes.reduce(
    (total, dish) => ({
      calories: total.calories + dish.nutrition.calories,
      protein: total.protein + dish.nutrition.protein,
      carbs: total.carbs + dish.nutrition.carbs,
      fat: total.fat + dish.nutrition.fat,
      sodium: (total.sodium || 0) + (dish.nutrition.sodium || 0),
      fiber: (total.fiber || 0) + (dish.nutrition.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 }
  );
}

/**
 * 하루 총 영양 정보 계산
 */
function calculateTotalNutrition(nutritions: RecipeNutrition[]): RecipeNutrition {
  return nutritions.reduce(
    (total, nutrition) => ({
      calories: total.calories + nutrition.calories,
      protein: total.protein + nutrition.protein,
      carbs: total.carbs + nutrition.carbs,
      fat: total.fat + nutrition.fat,
      sodium: (total.sodium || 0) + (nutrition.sodium || 0),
      fiber: (total.fiber || 0) + (nutrition.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 }
  );
}

