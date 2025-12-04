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

import type { UserHealthProfile } from "@/types/health";
import type {
  DailyDietPlan,
  MealComposition,
  RecipeDetailForDiet,
  RecipeNutrition,
} from "@/types/recipe";
import { calculateUserGoalCalories } from "@/lib/diet/calorie-calculator";
import { getExcludedFoods, filterCompatibleRecipes, checkAllergyCompatibility } from "@/lib/diet/food-filtering";
import { filterRecipes as integratedFilterRecipes } from "@/lib/diet/integrated-filter";
import { searchFallbackRecipes } from "@/lib/recipes/fallback-recipes";
import { getRecentlyUsedRecipes } from "@/lib/diet/recipe-history";
import { recommendFruitSnack } from "@/lib/diet/seasonal-fruits";
import { calculateAge } from "@/lib/utils/age-calculator";
import { calculateMacroGoals, calculateMealMacroGoals, isWithinMacroRange } from "@/lib/diet/macro-calculator";

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
  }>,
  usedByCategory?: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string,
  premiumFeatures?: string[]
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
  const dailyCalories = await calculateUserGoalCalories(profile);
  console.log(`목표 칼로리: ${dailyCalories}kcal/일`);

  // 1-1. 매크로 목표 계산
  const dailyMacroGoals = calculateMacroGoals(dailyCalories, profile);
  console.log(`매크로 목표:`, {
    단백질: `${dailyMacroGoals.protein.target}g (${dailyMacroGoals.protein.min}-${dailyMacroGoals.protein.max}g)`,
    탄수화물: `${dailyMacroGoals.carbohydrates.target}g (${dailyMacroGoals.carbohydrates.min}-${dailyMacroGoals.carbohydrates.max}g)`,
    지방: `${dailyMacroGoals.fat.target}g (${dailyMacroGoals.fat.min}-${dailyMacroGoals.fat.max}g)`,
    나트륨: `${dailyMacroGoals.sodium.max}mg 이하`,
  });

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

  // 주간 컨텍스트 전달 (있는 경우)
  const breakfastMacroGoals = calculateMealMacroGoals("breakfast", dailyMacroGoals, mealCalorieRatios.breakfast);
  const breakfast = await selectMealComposition(
    "breakfast",
    breakfastCalories,
    excludedFoods,
    profile.allergies || [],
    recentlyUsed,
    availableRecipes || [],
    isChild,
    profile.dietary_preferences || [],
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType, // 밥 종류 다양화
    profile.premium_features, // 프리미엄 기능
    profile, // 통합 필터링을 위한 건강 프로필
    breakfastMacroGoals // 매크로 목표
  );

  const lunchMacroGoals = calculateMealMacroGoals("lunch", dailyMacroGoals, mealCalorieRatios.lunch);
  const lunch = await selectMealComposition(
    "lunch",
    lunchCalories,
    excludedFoods,
    profile.allergies || [],
    recentlyUsed,
    availableRecipes || [],
    isChild,
    profile.dietary_preferences || [],
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType, // 밥 종류 다양화
    profile.premium_features, // 프리미엄 기능
    profile, // 통합 필터링을 위한 건강 프로필
    lunchMacroGoals // 매크로 목표
  );

  const dinnerMacroGoals = calculateMealMacroGoals("dinner", dailyMacroGoals, mealCalorieRatios.dinner);
  const dinner = await selectMealComposition(
    "dinner",
    dinnerCalories,
    excludedFoods,
    profile.allergies || [],
    recentlyUsed,
    availableRecipes || [],
    isChild,
    profile.dietary_preferences || [],
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType, // 밥 종류 다양화
    profile.premium_features, // 프리미엄 기능
    profile, // 통합 필터링을 위한 건강 프로필
    dinnerMacroGoals // 매크로 목표
  );

  // 6. 간식 (제철 과일) - 주간 컨텍스트 고려
  const currentMonth = new Date().getMonth() + 1;
  let fruitSnack = recommendFruitSnack(
    snackCalories,
    currentMonth,
    isChild,
    profile.diseases || []
  );

  // 주간 컨텍스트: 이미 사용된 간식 제외
  if (usedByCategory?.snack && usedByCategory.snack.size > 0) {
    const excludedSnacks = Array.from(usedByCategory.snack);
    let retryCount = 0;
    while (excludedSnacks.includes(fruitSnack.fruit.name) && retryCount < 5) {
      // 다른 과일 추천 시도
      fruitSnack = recommendFruitSnack(
        snackCalories,
        currentMonth,
        isChild,
        profile.diseases || []
      );
      retryCount++;
    }
    if (excludedSnacks.includes(fruitSnack.fruit.name)) {
      console.warn(`⚠️ 주간 제외 간식과 겹침: ${fruitSnack.fruit.name} (그대로 사용)`);
    }
  }

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
 * 주간 컨텍스트를 고려한 개인 식단 생성
 */
export async function generatePersonalDietWithWeeklyContext(
  userId: string,
  date: string,
  usedByCategory: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string
): Promise<import("@/types/health").DailyDietPlan | null> {
  console.group("🍱 주간 컨텍스트 개인 식단 생성");
  console.log("사용자 ID:", userId);
  console.log("대상 날짜:", date);
  console.log("카테고리별 제외 목록:", {
    rice: Array.from(usedByCategory.rice),
    side: Array.from(usedByCategory.side),
    soup: Array.from(usedByCategory.soup),
    snack: Array.from(usedByCategory.snack),
  });
  console.log("선호 밥 종류:", preferredRiceType);

  // 건강 프로필 조회
  const { getUserHealthProfile } = await import("./queries");
  const profile = await getUserHealthProfile(userId);

  if (!profile) {
    console.warn("⚠️ 건강 프로필 없음");
    console.groupEnd();
    return null;
  }

  // 레시피 목록 조회
  const { getRecipesWithNutrition } = await import("./queries");
  const recipes = await getRecipesWithNutrition();

  let availableRecipes = recipes;
  if (recipes.length === 0) {
    console.log("📚 데이터베이스 레시피가 없어 폴백 레시피 시스템 사용");
    availableRecipes = [];
  }

  // 주간 컨텍스트를 고려한 식단 생성
  const dietPlan = await generatePersonalDiet(
    userId,
    profile,
    date,
    availableRecipes.length > 0 ? availableRecipes : undefined,
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType // 밥 종류 다양화
  );

  // DailyDietPlan 형식으로 변환 (queries.ts의 형식과 일치)
  const { generatePersonalDietForAPI } = await import("./queries");
  const apiResult = await generatePersonalDietForAPI(
    userId,
    profile,
    date,
    availableRecipes,
    usedByCategory,
    preferredRiceType
  );

  // DailyDietPlan 형식으로 변환
  const dailyPlan: import("@/types/health").DailyDietPlan = {
    date,
    breakfast: apiResult.breakfast ? {
      id: `temp-${date}-breakfast`,
      user_id: userId,
      plan_date: date,
      meal_type: "breakfast",
      recipe_id: apiResult.breakfast.id,
      calories: apiResult.breakfast.calories,
      carbohydrates: apiResult.breakfast.carbohydrates,
      protein: apiResult.breakfast.protein,
      fat: apiResult.breakfast.fat,
      sodium: apiResult.breakfast.sodium,
      created_at: new Date().toISOString(),
      compositionSummary: apiResult.breakfastCompositionSummary,
      recipe: {
        id: apiResult.breakfast.id,
        title: apiResult.breakfast.title,
        thumbnail_url: apiResult.breakfast.thumbnail_url,
        slug: apiResult.breakfast.slug,
      },
    } as import("@/types/health").DietPlan : null,
    lunch: apiResult.lunch ? {
      id: `temp-${date}-lunch`,
      user_id: userId,
      plan_date: date,
      meal_type: "lunch",
      recipe_id: apiResult.lunch.id,
      calories: apiResult.lunch.calories,
      carbohydrates: apiResult.lunch.carbohydrates,
      protein: apiResult.lunch.protein,
      fat: apiResult.lunch.fat,
      sodium: apiResult.lunch.sodium,
      created_at: new Date().toISOString(),
      compositionSummary: apiResult.lunchCompositionSummary,
      recipe: {
        id: apiResult.lunch.id,
        title: apiResult.lunch.title,
        thumbnail_url: apiResult.lunch.thumbnail_url,
        slug: apiResult.lunch.slug,
      },
    } as import("@/types/health").DietPlan : null,
    dinner: apiResult.dinner ? {
      id: `temp-${date}-dinner`,
      user_id: userId,
      plan_date: date,
      meal_type: "dinner",
      recipe_id: apiResult.dinner.id,
      calories: apiResult.dinner.calories,
      carbohydrates: apiResult.dinner.carbohydrates,
      protein: apiResult.dinner.protein,
      fat: apiResult.dinner.fat,
      sodium: apiResult.dinner.sodium,
      created_at: new Date().toISOString(),
      compositionSummary: apiResult.dinnerCompositionSummary,
      recipe: {
        id: apiResult.dinner.id,
        title: apiResult.dinner.title,
        thumbnail_url: apiResult.dinner.thumbnail_url,
        slug: apiResult.dinner.slug,
      },
    } as import("@/types/health").DietPlan : null,
    snack: apiResult.snack ? {
      id: `temp-${date}-snack`,
      user_id: userId,
      plan_date: date,
      meal_type: "snack",
      recipe_id: apiResult.snack.id,
      calories: apiResult.snack.calories,
      carbohydrates: apiResult.snack.carbohydrates,
      protein: apiResult.snack.protein,
      fat: apiResult.snack.fat,
      sodium: apiResult.snack.sodium,
      created_at: new Date().toISOString(),
      compositionSummary: apiResult.snackCompositionSummary,
      recipe: {
        id: apiResult.snack.id,
        title: apiResult.snack.title,
        thumbnail_url: apiResult.snack.thumbnail_url,
        slug: apiResult.snack.slug,
      },
    } as import("@/types/health").DietPlan : null,
    totalNutrition: apiResult.totalNutrition,
  };

  console.groupEnd();
  return dailyPlan;
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
  isChildDiet: boolean = false,
  dietaryPreferences: string[] = [],
  usedByCategory?: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },

  preferredRiceType?: string,
  premiumFeatures?: string[],
  healthProfile?: UserHealthProfile, // 통합 필터링을 위한 건강 프로필
  mealMacroGoals?: import("@/lib/diet/macro-calculator").MacroGoals // 매크로 목표
): Promise<MealComposition> {
  console.group(`🍽️ ${mealType.toUpperCase()} 식사 구성`);
  console.log(`목표 칼로리: ${Math.round(targetCalories)}kcal`);

  // 칼로리 배분
  const riceCalories = targetCalories * DISH_CALORIE_RATIOS.rice;
  const sidesCalories = targetCalories * DISH_CALORIE_RATIOS.sides;
  const soupCalories = targetCalories * DISH_CALORIE_RATIOS.soup;

  // 카테고리별 제외 목록 생성
  const excludedByCategory = {
    rice: usedByCategory?.rice ? Array.from(usedByCategory.rice) : [],
    side: usedByCategory?.side ? Array.from(usedByCategory.side) : [],
    soup: usedByCategory?.soup ? Array.from(usedByCategory.soup) : [],
  };

  // 1. 밥 선택 (주간 컨텍스트 고려)
  const riceMacroGoals = mealMacroGoals ? {
    protein: { target: mealMacroGoals.protein.target * 0.2 }, // 밥은 단백질 비중 낮음
    carbohydrates: { target: mealMacroGoals.carbohydrates.target * 0.6 }, // 밥은 탄수화물 비중 높음
    fat: { target: mealMacroGoals.fat.target * 0.1 },
  } : undefined;
  const rice = await selectDishForMeal(
    "rice",
    mealType,
    riceCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    availableRecipes,
    isChildDiet,
    dietaryPreferences,
    excludedByCategory.rice, // 카테고리별 제외 목록
    preferredRiceType, // 선호 밥 종류
    premiumFeatures,
    healthProfile, // 통합 필터링을 위한 건강 프로필
    riceMacroGoals // 밥용 매크로 목표
  );

  // 2. 반찬 3개 선택 (각 15%, 주간 컨텍스트 고려)
  const sideCaloriesEach = sidesCalories / 3;
  const sides: RecipeDetailForDiet[] = [];
  const sideMacroGoals = mealMacroGoals ? {
    protein: { target: mealMacroGoals.protein.target * 0.5 / 3 }, // 반찬은 단백질 비중 높음 (각 반찬당)
    carbohydrates: { target: mealMacroGoals.carbohydrates.target * 0.2 / 3 },
    fat: { target: mealMacroGoals.fat.target * 0.4 / 3 },
  } : undefined;

  for (let i = 0; i < 3; i++) {
    const side = await selectDishForMeal(
      "side",
      mealType,
      sideCaloriesEach,
      excludedFoods,
      allergies,
      [...recentlyUsed, ...sides.map(s => s.title), ...excludedByCategory.side], // 이미 선택한 반찬 + 주간 제외 목록
      availableRecipes,
      isChildDiet,
      dietaryPreferences,
      excludedByCategory.side, // 카테고리별 제외 목록
      undefined,
      premiumFeatures,
      healthProfile, // 통합 필터링을 위한 건강 프로필
      sideMacroGoals // 반찬용 매크로 목표
    );
    if (side) sides.push(side);
  }

  // 3. 국/찌개 선택 (주간 컨텍스트 고려)
  const soupMacroGoals = mealMacroGoals ? {
    protein: { target: mealMacroGoals.protein.target * 0.3 }, // 국은 단백질 비중 중간
    carbohydrates: { target: mealMacroGoals.carbohydrates.target * 0.2 },
    fat: { target: mealMacroGoals.fat.target * 0.5 },
  } : undefined;
  const soup = await selectDishForMeal(
    "soup",
    mealType,
    soupCalories,
    excludedFoods,
    allergies,
    [...recentlyUsed, ...excludedByCategory.soup], // 주간 제외 목록 포함
    availableRecipes,
    isChildDiet,
    dietaryPreferences,
    excludedByCategory.soup, // 카테고리별 제외 목록
    undefined,
    premiumFeatures,
    healthProfile, // 통합 필터링을 위한 건강 프로필
    soupMacroGoals // 국용 매크로 목표
  );

  // 총 영양 정보
  const allDishes = [rice, ...sides, soup].filter(Boolean) as RecipeDetailForDiet[];
  const totalNutrition = calculateMealNutrition(allDishes);

  // 매크로 목표 달성도 확인 및 로깅
  if (mealMacroGoals) {
    const macroCheck = isWithinMacroRange(
      {
        protein: totalNutrition.protein,
        carbs: totalNutrition.carbs,
        fat: totalNutrition.fat,
      },
      mealMacroGoals
    );
    console.log(`📊 매크로 목표 달성도:`, {
      단백질: `${totalNutrition.protein}g (목표: ${mealMacroGoals.protein.target}g, 점수: ${Math.round(macroCheck.proteinScore)})`,
      탄수화물: `${totalNutrition.carbs}g (목표: ${mealMacroGoals.carbohydrates.target}g, 점수: ${Math.round(macroCheck.carbScore)})`,
      지방: `${totalNutrition.fat}g (목표: ${mealMacroGoals.fat.target}g, 점수: ${Math.round(macroCheck.fatScore)})`,
      총점: `${Math.round(macroCheck.totalScore)}/100`,
      달성: macroCheck.passed ? "✅" : "⚠️",
    });
  }

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
  isChildDiet: boolean = false,
  dietaryPreferences: string[] = [],
  weeklyExcludedByCategory?: string[], // 주간 카테고리별 제외 목록
  preferredRiceType?: string, // 선호 밥 종류 (흰쌀밥, 현미밥, 잡곡밥)
  premiumFeatures?: string[],
  healthProfile?: UserHealthProfile, // 통합 필터링을 위한 건강 프로필
  dishMacroGoals?: { protein: { target: number }; carbohydrates: { target: number }; fat: { target: number } } // 요리별 매크로 목표
): Promise<RecipeDetailForDiet | undefined> {
  console.log(`  - ${dishType} 선택 중 (목표: ${Math.round(targetCalories)}kcal)`);
  if (weeklyExcludedByCategory && weeklyExcludedByCategory.length > 0) {
    console.log(`    주간 제외 목록: ${weeklyExcludedByCategory.join(', ')}`);
  }
  if (preferredRiceType && dishType === "rice") {
    console.log(`    선호 밥 종류: ${preferredRiceType}`);
  }

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
            // 밥 종류 필터링
            if (preferredRiceType) {
              // 선호 밥 종류가 있으면 해당 종류만 선택
              return title.includes(preferredRiceType.toLowerCase().replace("밥", "")) || title.includes(preferredRiceType.toLowerCase());
            }
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
      .filter(recipe => {
        // 일반 제외 목록 필터링
        if (excludeNames.includes(recipe.title)) return false;
        // 주간 카테고리별 제외 목록 필터링 (2번 이상 겹치지 않게)
        if (weeklyExcludedByCategory && weeklyExcludedByCategory.includes(recipe.title)) {
          console.log(`    ⚠️ 주간 제외: ${recipe.title}`);
          return false;
        }
        return true;
      });
  } else {
    // 폴백 레시피 검색 (기존 방식)
    const { searchFallbackRecipes } = await import("@/lib/recipes/fallback-recipes");
    const excludeAll = [...excludeNames, ...(weeklyExcludedByCategory || [])];
    candidates = searchFallbackRecipes({
      dishType: [dishType],
      mealType,
      excludeNames: excludeAll,
      limit: 10,
    });

    // 밥 종류 다양화: 선호 밥 종류가 있으면 해당 종류만 필터링
    if (preferredRiceType && dishType === "rice") {
      candidates = candidates.filter(recipe =>
        recipe.title.includes(preferredRiceType)
      );
      // 선호 밥 종류가 없으면 폴백 레시피에서 해당 종류 생성
      if (candidates.length === 0) {
        const { searchFallbackRecipes } = await import("@/lib/recipes/fallback-recipes");
        const fallbackResults = searchFallbackRecipes({
          dishType: ["rice"],
          excludeNames: [],
          limit: 10,
        });
        const preferredRice = fallbackResults.find(r => r.title === preferredRiceType);
        if (preferredRice) {
          candidates = [preferredRice];
        }
      }
    }
  }

  // 통합 필터링 파이프라인 적용 (건강 프로필이 있는 경우)
  if (healthProfile) {
    const filteredCandidates = await integratedFilterRecipes(candidates, healthProfile, excludedFoods);
    candidates = filteredCandidates;
  } else {
    // 기존 필터링 방식 (하위 호환성)
    candidates = filterCompatibleRecipes(candidates, [], excludedFoods);
    candidates = candidates.filter(recipe =>
      checkAllergyCompatibility(recipe, allergies)
    );
  }

  // 특수 식단 필터 적용
  if (dietaryPreferences && dietaryPreferences.length > 0) {
    const { filterRecipesBySpecialDiet } = await import("./special-diet-filters");
    candidates = filterRecipesBySpecialDiet(candidates, dietaryPreferences as any);
  }

  // 프리미엄 기능 필터링 (Vegan)
  if (premiumFeatures && premiumFeatures.includes("vegan")) {
    console.log("    🌱 비건 모드: 동물성 재료 포함 레시피 제외");
    const animalIngredients = ["고기", "돼지", "소고기", "닭", "계란", "우유", "치즈", "멸치", "새우", "굴소스", "액젓", "생선", "해물"];
    candidates = candidates.filter(recipe => {
      // 재료 체크
      const hasAnimalIngredient = recipe.ingredients.some(ing =>
        animalIngredients.some(animal => ing.name.includes(animal))
      );
      // 제목 체크
      const hasAnimalTitle = animalIngredients.some(animal => recipe.title.includes(animal));

      return !hasAnimalIngredient && !hasAnimalTitle;
    });
  }

  // 정렬 기준 설정 (칼로리 근접도 + 매크로 목표 충족도 + 영양소 비율)
  candidates.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // 1. 칼로리 근접도 (기본 우선순위)
    const calorieDiffA = Math.abs(a.nutrition.calories - targetCalories);
    const calorieDiffB = Math.abs(b.nutrition.calories - targetCalories);
    scoreA += (1000 - calorieDiffA); // 칼로리 차이가 적을수록 높은 점수
    scoreB += (1000 - calorieDiffB);

    // 2. 매크로 목표 충족도 (매크로 목표가 있는 경우)
    if (dishMacroGoals) {
      // 단백질 목표 충족도 (단백질 최우선)
      const proteinDiffA = Math.abs((a.nutrition.protein || 0) - dishMacroGoals.protein.target);
      const proteinDiffB = Math.abs((b.nutrition.protein || 0) - dishMacroGoals.protein.target);
      scoreA += Math.max(0, 200 - proteinDiffA * 10); // 단백질은 가중치 높게
      scoreB += Math.max(0, 200 - proteinDiffB * 10);

      // 탄수화물 목표 충족도
      const carbDiffA = Math.abs((a.nutrition.carbs || 0) - dishMacroGoals.carbohydrates.target);
      const carbDiffB = Math.abs((b.nutrition.carbs || 0) - dishMacroGoals.carbohydrates.target);
      scoreA += Math.max(0, 100 - carbDiffA * 5);
      scoreB += Math.max(0, 100 - carbDiffB * 5);

      // 지방 목표 충족도
      const fatDiffA = Math.abs((a.nutrition.fat || 0) - dishMacroGoals.fat.target);
      const fatDiffB = Math.abs((b.nutrition.fat || 0) - dishMacroGoals.fat.target);
      scoreA += Math.max(0, 100 - fatDiffA * 5);
      scoreB += Math.max(0, 100 - fatDiffB * 5);
    }

    // 3. 어린이 식단의 경우 영양소 비율 고려
    if (isChildDiet && !dishMacroGoals) {
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

    // 4. 질병별 권장 식품 가산점 (임산부 및 어린이 포함)
    if (healthProfile) {
      const recipeText = a.title.toLowerCase();
      const diseases = healthProfile.diseases || [];
      const isPregnant = (healthProfile as any).pregnancy_trimester !== undefined;

      // 어린이: 성장기 필수 영양소 (단백질, 칼슘, 비타민)
      if (isChildDiet) {
        const growthFoods = ["우유", "치즈", "달걀", "생선", "콩", "두부", "야채"];
        if (growthFoods.some(food => recipeText.includes(food))) {
          scoreA += 10;
        }
        if (a.nutrition.protein && a.nutrition.protein > 15) {
          scoreA += 10;
        }
      }

      // 임산부: 엽산, 철분, 칼슘 함유 식품
      if (isPregnant) {
        const pregnancyFoods = ["시금치", "브로콜리", "콩", "두부", "달걀", "우유", "치즈", "생선"];
        if (pregnancyFoods.some(food => recipeText.includes(food))) {
          scoreA += 15;
        }
      }

      // 당뇨: 저GI 식품, 고섬유 식품
      if (diseases.includes("diabetes")) {
        const lowGIFoods = ["현미", "잡곡", "귀리", "퀴노아", "고구마", "콩", "두부", "야채"];
        if (lowGIFoods.some(food => recipeText.includes(food))) {
          scoreA += 15;
        }
      }

      // CKD: 저칼륨, 저인 식품
      if (diseases.includes("kidney_disease")) {
        const lowPotassiumFoods = ["사과", "배", "양배추", "오이", "당근", "양파"];
        if (lowPotassiumFoods.some(food => recipeText.includes(food))) {
          scoreA += 15;
        }
      }

      // 심혈관 질환: 저나트륨, 저지방 식품
      if (diseases.includes("cardiovascular_disease")) {
        if (a.nutrition.sodium && a.nutrition.sodium < 400) {
          scoreA += 15;
        }
      }
    }

    // b 레시피에도 동일한 가산점 적용
    if (healthProfile) {
      const recipeTextB = b.title.toLowerCase();
      const diseases = healthProfile.diseases || [];
      const isPregnant = (healthProfile as any).pregnancy_trimester !== undefined;

      if (isChildDiet) {
        const growthFoods = ["우유", "치즈", "달걀", "생선", "콩", "두부", "야채"];
        if (growthFoods.some(food => recipeTextB.includes(food))) {
          scoreB += 10;
        }
        if (b.nutrition.protein && b.nutrition.protein > 15) {
          scoreB += 10;
        }
      }

      if (isPregnant) {
        const pregnancyFoods = ["시금치", "브로콜리", "콩", "두부", "달걀", "우유", "치즈", "생선"];
        if (pregnancyFoods.some(food => recipeTextB.includes(food))) {
          scoreB += 15;
        }
      }

      if (diseases.includes("diabetes")) {
        const lowGIFoods = ["현미", "잡곡", "귀리", "퀴노아", "고구마", "콩", "두부", "야채"];
        if (lowGIFoods.some(food => recipeTextB.includes(food))) {
          scoreB += 15;
        }
      }

      if (diseases.includes("kidney_disease")) {
        const lowPotassiumFoods = ["사과", "배", "양배추", "오이", "당근", "양파"];
        if (lowPotassiumFoods.some(food => recipeTextB.includes(food))) {
          scoreB += 15;
        }
      }

      if (diseases.includes("cardiovascular_disease")) {
        if (b.nutrition.sodium && b.nutrition.sodium < 400) {
          scoreB += 15;
        }
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

