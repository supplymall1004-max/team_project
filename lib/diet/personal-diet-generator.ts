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
import { DailyNutritionTracker } from "@/lib/diet/daily-nutrition-tracker";
import { checkDietConflicts } from "@/lib/health/diet-conflict-manager";
import { validateCalorieGoal, validateCalories, type CalorieValidationResult } from "@/lib/diet/calorie-validator";
import {
  calculateAdolescentMacros,
  prioritizeGrowthNutrients,
  recommendAdolescentSides,
} from "@/lib/diet/adolescent-diet-optimizer";

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
  premiumFeatures?: string[],
  includeFavorites?: boolean // 찜한 식단 포함 여부
): Promise<DailyDietPlan> {
  console.group("🍱 개인 맞춤 식단 생성");
  console.log("사용자 ID:", userId);
  console.log("대상 날짜:", targetDate);
  console.log("건강 프로필 ID:", profile.id);
  console.log("건강 프로필 칼로리 목표:", profile.daily_calorie_goal);
  
  try {
  // 0. 충돌 검사 (질병과 특수 식단 간)
  const conflictResult = checkDietConflicts(profile);
  if (conflictResult.blockedOptions.length > 0) {
    const blockedDetails = conflictResult.conflicts
      .filter((c) => c.severity === "absolute")
      .map((c) => `${c.diseaseCode} + ${c.dietType}: ${c.reason}`)
      .join("; ");
    console.error("❌ 식단 생성 실패: 절대 금지 조합 발견", {
      blockedOptions: conflictResult.blockedOptions,
      details: blockedDetails,
    });
    throw new Error(
      `선택하신 질병과 식단 조합은 의학적으로 권장되지 않습니다. ${blockedDetails}`
    );
  }
  if (conflictResult.warnings.length > 0) {
    console.warn("⚠️ 경고: 식단 생성은 진행되지만 주의가 필요합니다", {
      warnings: conflictResult.warnings.map((w) => `${w.diseaseCode} + ${w.dietType}: ${w.reason}`),
    });
  }

  // 1. 연령대 감지 및 식단 비율 설정
  const age = profile.age || 30;
  const isChild = age < 18;
  const isAdolescent = age >= 13 && age < 18; // 청소년 (13-18세)
  const isYoungChild = age < 13; // 어린이 (13세 미만)
  
  const mealCalorieRatios = isChild ? {
    breakfast: 0.25,  // 어린이/청소년: 아침 25%
    lunch: 0.35,      // 어린이/청소년: 점심 35%
    dinner: 0.30,     // 어린이/청소년: 저녁 30%
    snack: 0.10,      // 어린이/청소년: 간식 10%
  } : MEAL_CALORIE_RATIOS;

  if (isAdolescent) {
    console.log(`🧑‍🎓 청소년 감지됨 (${age}세) - 성장기 특별 영양소 처리 적용`);
  } else if (isYoungChild) {
    console.log(`👶 어린이 감지됨 (${age}세) - 성장기 식단 비율 적용`);
  }
  
  // 청소년 영양소 목표 계산
  let adolescentMacros: ReturnType<typeof calculateAdolescentMacros> | null = null;
  if (isAdolescent) {
    adolescentMacros = calculateAdolescentMacros(profile);
    console.log("🧑‍🎓 청소년 영양소 목표:", {
      단백질: `${adolescentMacros.protein.target}g`,
      칼슘: `${adolescentMacros.calcium.target}mg`,
      철분: `${adolescentMacros.iron.target}mg`,
      비타민D: `${adolescentMacros.vitaminD.target}IU`,
    });
  }

  // 1. 목표 칼로리 계산
  const dailyCalories = await calculateUserGoalCalories(profile);
  console.log(`목표 칼로리: ${dailyCalories}kcal/일`);

  // 1-0. [최우선] 칼로리 검증 및 경고
  const calorieValidation = validateCalorieGoal(profile, dailyCalories);
  console.group("🔍 칼로리 검증 결과");
  console.log(`검증 상태: ${calorieValidation.isValid ? "✅ 통과" : "❌ 실패"}`);
  console.log(`심각도: ${calorieValidation.severity}`);
  console.log(`현재 칼로리: ${calorieValidation.currentCalories}kcal`);
  console.log(`최소 필요량: ${calorieValidation.minRequiredCalories}kcal`);
  console.log(`권장 칼로리: ${calorieValidation.recommendedCalories}kcal`);
  console.log(`경고 메시지: ${calorieValidation.message}`);
  console.log(`상세 정보:`, calorieValidation.details.join(", "));
  console.groupEnd();

  // 치명적 경고인 경우 경고 메시지를 포함하되 식단 생성은 계속 진행
  if (calorieValidation.severity === "critical") {
    console.error("🚨 [치명적 경고] 칼로리가 최소 필요량보다 낮습니다!");
    console.error(`최소 필요량: ${calorieValidation.minRequiredCalories}kcal`);
    console.error(`현재 칼로리: ${calorieValidation.currentCalories}kcal`);
    console.error(`권장 칼로리: ${calorieValidation.recommendedCalories}kcal`);
  }

  // 1-1. 매크로 목표 계산
  const dailyMacroGoals = calculateMacroGoals(dailyCalories, profile);
  console.log(`매크로 목표:`, {
    단백질: `${dailyMacroGoals.protein.target}g (${dailyMacroGoals.protein.min}-${dailyMacroGoals.protein.max}g)`,
    탄수화물: `${dailyMacroGoals.carbohydrates.target}g (${dailyMacroGoals.carbohydrates.min}-${dailyMacroGoals.carbohydrates.max}g)`,
    지방: `${dailyMacroGoals.fat.target}g (${dailyMacroGoals.fat.min}-${dailyMacroGoals.fat.max}g)`,
    나트륨: `${dailyMacroGoals.sodium.max}mg 이하`,
  });

  // 2. 질병별 제외 음식 조회
  const excludedFoods = await getExcludedFoods(profile.diseases?.map(d => d.code) || []);
  console.log(`제외 음식: ${excludedFoods.length}개`);

  // 2-1. 일일 영양소 추적기 생성 (질병이 있는 경우)
  const dailyNutrition = (profile.diseases && profile.diseases.length > 0)
    ? new DailyNutritionTracker(profile)
    : undefined;
  if (dailyNutrition) {
    console.log("📊 일일 영양소 추적기 생성 완료");
  }

  // 3. 최근 사용 레시피 조회 (중복 방지)
  const recentlyUsed = await getRecentlyUsedRecipes(userId);
  console.log(`최근 사용 레시피: ${recentlyUsed.length}개`);

  // 4. 레시피 목록이 없으면 조회 (availableRecipes가 없는 경우)
  let finalAvailableRecipes = availableRecipes;
  if (!finalAvailableRecipes || finalAvailableRecipes.length === 0) {
    console.log("📚 레시피 목록이 없어 조회 시작...");
    const { getRecipesWithNutrition } = await import("./queries");
    const recipes = await getRecipesWithNutrition();
    console.log(`✅ 레시피 목록 조회 완료: ${recipes.length}개`);
    finalAvailableRecipes = recipes.length > 0 ? recipes : undefined;
  }

  // 5-1. 찜한 식단 포함 처리 (includeFavorites가 true인 경우)
  if (includeFavorites) {
    console.log("⭐ 찜한 식단 포함 옵션 활성화");
    try {
      const { getFilterableFavoriteMeals, filterFavoriteMeals } = await import("./favorite-meals");
      
      // 찜한 식단 조회
      const favoritesResult = await getFilterableFavoriteMeals();
      if (favoritesResult.success && favoritesResult.favorites && favoritesResult.favorites.length > 0) {
        console.log(`📌 찜한 식단 조회 완료: ${favoritesResult.favorites.length}개`);
        
        // 찜한 식단 필터링 (건강 프로필에 맞게)
        const filterResult = await filterFavoriteMeals(favoritesResult.favorites, profile);
        
        if (filterResult.success && filterResult.filteredFavorites && filterResult.filteredFavorites.length > 0) {
          console.log(`✅ 필터링 통과한 찜한 식단: ${filterResult.filteredFavorites.length}개`);
          if (filterResult.excludedCount && filterResult.excludedCount > 0) {
            console.log(`⚠️ 필터링 제외된 찜한 식단: ${filterResult.excludedCount}개`);
          }
          
          // 찜한 식단의 레시피를 레시피 후보 배열의 앞부분에 추가 (우선순위)
          const favoriteRecipes = filterResult.filteredFavorites
            .map((fav) => fav.recipe!)
            .filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== undefined);
          
          // 레시피를 availableRecipes 형식으로 변환
          const favoriteRecipesAsAvailable = favoriteRecipes.map((recipe) => ({
            id: recipe.id || `favorite-${Date.now()}`,
            title: recipe.title,
            calories: recipe.nutrition.calories,
            carbohydrates: recipe.nutrition.carbs,
            protein: recipe.nutrition.protein,
            fat: recipe.nutrition.fat,
            sodium: recipe.nutrition.sodium,
          }));
          
          // 찜한 식단을 앞부분에 추가 (우선순위)
          finalAvailableRecipes = [
            ...favoriteRecipesAsAvailable,
            ...(finalAvailableRecipes || []),
          ];
          
          console.log(`⭐ 찜한 식단 ${favoriteRecipesAsAvailable.length}개를 레시피 후보에 추가 (우선순위)`);
        } else {
          console.log("⚠️ 필터링을 통과한 찜한 식단이 없습니다.");
        }
      } else {
        console.log("📌 찜한 식단이 없거나 조회에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 찜한 식단 처리 중 오류:", error);
      // 오류가 발생해도 식단 생성은 계속 진행
    }
  }

  // 6. 식사별 칼로리 배분 (어린이의 경우 성장기 비율 적용)
  const breakfastCalories = dailyCalories * mealCalorieRatios.breakfast;
  const lunchCalories = dailyCalories * mealCalorieRatios.lunch;
  const dinnerCalories = dailyCalories * mealCalorieRatios.dinner;
  const snackCalories = dailyCalories * mealCalorieRatios.snack;

  // 하루 식단 내 중복 방지를 위한 추적 (반찬/국/찌개)
  const dailyUsedByCategory = {
    side: new Set<string>(), // 하루 내 사용된 반찬
    soup: new Set<string>(), // 하루 내 사용된 국/찌개
  };

  // 주간 컨텍스트 전달 (있는 경우)
  const breakfastMacroGoals = calculateMealMacroGoals("breakfast", dailyMacroGoals, mealCalorieRatios.breakfast);
  const breakfast = await selectMealComposition(
    "breakfast",
    breakfastCalories,
    excludedFoods,
    profile.allergies?.map(a => a.code) || [],
    recentlyUsed,
    finalAvailableRecipes || [],
    isChild,
    profile.dietary_preferences || [],
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType, // 밥 종류 다양화
    profile.premium_features, // 프리미엄 기능
    profile, // 통합 필터링을 위한 건강 프로필
    breakfastMacroGoals, // 매크로 목표
    dailyNutrition, // 일일 영양소 추적기
    dailyUsedByCategory // 하루 내 중복 방지
  );
  
  // 아침 식사에서 사용된 반찬/국/찌개를 하루 추적에 추가
  if (breakfast) {
    breakfast.sides.forEach(side => dailyUsedByCategory.side.add(side.title));
    if (breakfast.soup) dailyUsedByCategory.soup.add(breakfast.soup.title);
  }

  // 아침 식사 레시피를 일일 추적기에 추가
  if (dailyNutrition && breakfast) {
    if (breakfast.rice) dailyNutrition.addRecipe(breakfast.rice);
    breakfast.sides.forEach(side => dailyNutrition.addRecipe(side));
    if (breakfast.soup) dailyNutrition.addRecipe(breakfast.soup);
    console.log("📊 아침 식사 영양소 추가 완료");
  }

  const lunchMacroGoals = calculateMealMacroGoals("lunch", dailyMacroGoals, mealCalorieRatios.lunch);
  const lunch = await selectMealComposition(
    "lunch",
    lunchCalories,
    excludedFoods,
    profile.allergies?.map(a => a.code) || [],
    recentlyUsed,
    finalAvailableRecipes || [],
    isChild,
    profile.dietary_preferences || [],
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType, // 밥 종류 다양화
    profile.premium_features, // 프리미엄 기능
    profile, // 통합 필터링을 위한 건강 프로필
    lunchMacroGoals, // 매크로 목표
    dailyNutrition, // 일일 영양소 추적기
    dailyUsedByCategory // 하루 내 중복 방지
  );
  
  // 점심 식사에서 사용된 반찬/국/찌개를 하루 추적에 추가
  if (lunch) {
    lunch.sides.forEach(side => dailyUsedByCategory.side.add(side.title));
    if (lunch.soup) dailyUsedByCategory.soup.add(lunch.soup.title);
  }

  // 점심 식사 레시피를 일일 추적기에 추가
  if (dailyNutrition && lunch) {
    if (lunch.rice) dailyNutrition.addRecipe(lunch.rice);
    lunch.sides.forEach(side => dailyNutrition.addRecipe(side));
    if (lunch.soup) dailyNutrition.addRecipe(lunch.soup);
    console.log("📊 점심 식사 영양소 추가 완료");
  }

  const dinnerMacroGoals = calculateMealMacroGoals("dinner", dailyMacroGoals, mealCalorieRatios.dinner);
  const dinner = await selectMealComposition(
    "dinner",
    dinnerCalories,
    excludedFoods,
    profile.allergies?.map(a => a.code) || [],
    recentlyUsed,
    finalAvailableRecipes || [],
    isChild,
    profile.dietary_preferences || [],
    usedByCategory, // 주간 컨텍스트 전달
    preferredRiceType, // 밥 종류 다양화
    profile.premium_features, // 프리미엄 기능
    profile, // 통합 필터링을 위한 건강 프로필
    dinnerMacroGoals, // 매크로 목표
    dailyNutrition, // 일일 영양소 추적기
    dailyUsedByCategory // 하루 내 중복 방지
  );
  
  // 저녁 식사에서 사용된 반찬/국/찌개를 하루 추적에 추가
  if (dinner) {
    dinner.sides.forEach(side => dailyUsedByCategory.side.add(side.title));
    if (dinner.soup) dailyUsedByCategory.soup.add(dinner.soup.title);
  }

  // 저녁 식사 레시피를 일일 추적기에 추가
  if (dailyNutrition && dinner) {
    if (dinner.rice) dailyNutrition.addRecipe(dinner.rice);
    dinner.sides.forEach(side => dailyNutrition.addRecipe(side));
    if (dinner.soup) dailyNutrition.addRecipe(dinner.soup);
    console.log("📊 저녁 식사 영양소 추가 완료");
    
    // 일일 영양소 상태 로깅
    const currentNutrition = dailyNutrition.getCurrentNutrition();
    const remaining = dailyNutrition.getRemaining();
    console.log("📊 일일 영양소 상태:", {
      현재: currentNutrition,
      잔여량: remaining
    });
  }

  // 6. 간식 (제철 과일) - 주간 컨텍스트 고려
  const currentMonth = new Date().getMonth() + 1;
  let fruitSnack = recommendFruitSnack(
    snackCalories,
    currentMonth,
    isChild,
    profile.diseases?.map(d => d.code) || []
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
        profile.diseases?.map(d => d.code) || []
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
      sodium: 0, // 과일은 나트륨 함량이 매우 낮음
      fiber: fruitSnack.fruit.nutrition.fiber * fruitSnack.servings,
    },
    emoji: fruitSnack.fruit.emoji,
    imageUrl: fruitSnack.fruit.imageUrl,
    featureDescription: fruitSnack.fruit.goodForKids ? fruitSnack.fruit.kidsBenefits : undefined,
  };

  // 7. 총 영양 정보 계산 (간식 제외)
  const totalNutrition = calculateTotalNutrition([
    breakfast.totalNutrition,
    lunch.totalNutrition,
    dinner.totalNutrition,
    // ✅ 요구사항: 간식도 일일 섭취량에 포함 (대략 맞추되, 과도한 정밀 매칭은 지양)
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

  // 최종 칼로리 검증 (실제 생성된 식단 기준)
  const finalCalorieValidation = validateCalories(profile, dailyCalories, totalNutrition.calories);
  
  // 검증 결과를 식단에 포함
  const result = {
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
    // 칼로리 검증 결과 포함
    calorieValidation: finalCalorieValidation,
  };

  // 치명적 경고 로깅
  if (finalCalorieValidation.severity === "critical") {
    console.error("🚨 [최종 검증] 생성된 식단의 칼로리가 최소 필요량보다 낮습니다!");
    console.error(`생성된 칼로리: ${totalNutrition.calories}kcal`);
    console.error(`최소 필요량: ${finalCalorieValidation.minRequiredCalories}kcal`);
    console.error(`권장 칼로리: ${finalCalorieValidation.recommendedCalories}kcal`);
  }

  return result;
  } catch (error) {
    console.error("❌ generatePersonalDiet 함수에서 에러 발생:", error);
    console.error("❌ 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("❌ 에러 스택:", error instanceof Error ? error.stack : undefined);
    console.groupEnd();
    throw error; // 에러를 다시 던져서 상위에서 처리할 수 있도록 함
  }
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
  console.log("📚 레시피 목록 조회 시작...");
  const { getRecipesWithNutrition } = await import("./queries");
  const recipes = await getRecipesWithNutrition();
  console.log(`✅ 레시피 목록 조회 완료: ${recipes.length}개`);

  let availableRecipes = recipes;
  if (recipes.length === 0) {
    console.warn("⚠️ 데이터베이스 레시피가 없어 폴백 레시피 시스템 사용");
    availableRecipes = [];
  } else {
    console.log(`📋 사용 가능한 레시피: ${availableRecipes.length}개`);
    console.log(`📝 샘플 레시피 (처음 5개):`, availableRecipes.slice(0, 5).map(r => ({ title: r.title, calories: r.calories })));
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
  let apiResult;
  try {
    const { generatePersonalDietForAPI } = await import("./queries");
    apiResult = await generatePersonalDietForAPI(
      userId,
      profile,
      date,
      availableRecipes,
      usedByCategory,
      preferredRiceType
    );
  } catch (apiError) {
    console.error("❌ generatePersonalDietForAPI 실패:", apiError);
    console.error("에러 상세:", {
      message: apiError instanceof Error ? apiError.message : String(apiError),
      stack: apiError instanceof Error ? apiError.stack : undefined,
    });
    // 에러 발생 시 null 반환
    console.groupEnd();
    return null;
  }

  if (!apiResult) {
    console.warn("⚠️ generatePersonalDietForAPI 결과가 null입니다");
    console.groupEnd();
    return null;
  }

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
  mealMacroGoals?: import("@/lib/diet/macro-calculator").MacroGoals, // 매크로 목표
  dailyNutrition?: import("@/lib/diet/daily-nutrition-tracker").DailyNutritionTracker, // 일일 영양소 추적기
  dailyUsedByCategory?: { // 하루 내 중복 방지 (반찬/국/찌개)
    side: Set<string>;
    soup: Set<string>;
  }
): Promise<MealComposition> {
  console.group(`🍽️ ${mealType.toUpperCase()} 식사 구성`);
  console.log(`목표 칼로리: ${Math.round(targetCalories)}kcal`);

  // 칼로리 배분
  const riceCalories = targetCalories * DISH_CALORIE_RATIOS.rice;
  const sidesCalories = targetCalories * DISH_CALORIE_RATIOS.sides;
  const soupCalories = targetCalories * DISH_CALORIE_RATIOS.soup;

  // 카테고리별 제외 목록 생성 (주간 + 하루 내 중복)
  // ✅ 주간 제외 목록을 제한하여 후반 날짜에서 레시피 부족 방지
  const MAX_WEEKLY_EXCLUSIONS = 15; // 주간 제외 목록 최대 개수 (카테고리별)
  const weeklySideExclusions = usedByCategory?.side 
    ? Array.from(usedByCategory.side).slice(-MAX_WEEKLY_EXCLUSIONS) // 최근 15개만 제외
    : [];
  const weeklySoupExclusions = usedByCategory?.soup 
    ? Array.from(usedByCategory.soup).slice(-MAX_WEEKLY_EXCLUSIONS) // 최근 15개만 제외
    : [];
  const weeklyRiceExclusions = usedByCategory?.rice 
    ? Array.from(usedByCategory.rice).slice(-3) // 밥은 최근 3개만 제외 (밥 종류가 적음)
    : [];
  
  const excludedByCategory = {
    rice: weeklyRiceExclusions,
    side: [
      ...weeklySideExclusions,
      ...(dailyUsedByCategory?.side ? Array.from(dailyUsedByCategory.side) : []), // 하루 내 중복 제외
    ],
    soup: [
      ...weeklySoupExclusions,
      ...(dailyUsedByCategory?.soup ? Array.from(dailyUsedByCategory.soup) : []), // 하루 내 중복 제외
    ],
  };
  
  console.log(`📋 제외 목록: 밥 ${excludedByCategory.rice.length}개, 반찬 ${excludedByCategory.side.length}개 (주간 ${weeklySideExclusions.length}개 + 하루 ${dailyUsedByCategory?.side?.size || 0}개), 국/찌개 ${excludedByCategory.soup.length}개 (주간 ${weeklySoupExclusions.length}개 + 하루 ${dailyUsedByCategory?.soup?.size || 0}개)`);

  // 저탄수 식단 여부 확인
  const isLowCarbDiet = dietaryPreferences?.includes("low_carb") || false;
  
  // 1. 밥 선택 (저탄수 식단이 아닌 경우만)
  let rice: RecipeDetailForDiet | undefined = undefined;
  let adjustedSidesCalories = sidesCalories;
  let adjustedSoupCalories = soupCalories;
  
  if (!isLowCarbDiet) {
    // 일반 식단: 밥 선택
    const riceMacroGoals = mealMacroGoals ? {
      protein: { target: mealMacroGoals.protein.target * 0.2 }, // 밥은 단백질 비중 낮음
      carbohydrates: { target: mealMacroGoals.carbohydrates.target * 0.6 }, // 밥은 탄수화물 비중 높음
      fat: { target: mealMacroGoals.fat.target * 0.1 },
    } : undefined;
    rice = await selectDishForMeal(
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
      riceMacroGoals, // 밥용 매크로 목표
      dailyNutrition // 일일 영양소 추적기
    );
  } else {
    // 저탄수 식단: 밥을 선택하지 않고, 밥 칼로리를 반찬(60%)과 국(40%)에 재분배
    console.log("🥗 저탄수 식단 감지: 밥 제외, 칼로리를 반찬과 국에 재분배");
    adjustedSidesCalories = sidesCalories + (riceCalories * 0.6); // 반찬에 60% 추가
    adjustedSoupCalories = soupCalories + (riceCalories * 0.4); // 국에 40% 추가
    console.log(`칼로리 재분배: 반찬 ${Math.round(adjustedSidesCalories)}kcal, 국 ${Math.round(adjustedSoupCalories)}kcal`);
  }

  // 2. 반찬 3개 선택 (저탄수 식단인 경우 재분배된 칼로리 사용)
  const sideCaloriesEach = adjustedSidesCalories / 3;
  const sides: RecipeDetailForDiet[] = [];
  const sideMacroGoals = mealMacroGoals ? {
    protein: { target: mealMacroGoals.protein.target * 0.5 / 3 }, // 반찬은 단백질 비중 높음 (각 반찬당)
    carbohydrates: { target: mealMacroGoals.carbohydrates.target * 0.2 / 3 },
    fat: { target: mealMacroGoals.fat.target * 0.4 / 3 },
  } : undefined;

  // ✅ 반드시 3개를 채운다. (후보가 없으면 조건을 점진적으로 완화)
  let sideAttempts = 0;
  let currentExcludedSide = [...excludedByCategory.side]; // 제외 목록 복사 (점진적 완화용)
  
  while (sides.length < 3 && sideAttempts < 12) {
    const side = await selectDishForMeal(
      "side",
      mealType,
      sideCaloriesEach,
      excludedFoods,
      allergies,
      [
        ...recentlyUsed,
        ...sides.map((s) => s.title),
        ...currentExcludedSide,
      ], // 이미 선택한 반찬 + 주간/하루 제외 목록
      availableRecipes,
      isChildDiet,
      dietaryPreferences,
      currentExcludedSide, // 카테고리별 제외 목록 (점진적 완화)
      undefined,
      premiumFeatures,
      healthProfile, // 통합 필터링을 위한 건강 프로필
      sideMacroGoals, // 반찬용 매크로 목표
      dailyNutrition // 일일 영양소 추적기
    );
    if (side) {
      sides.push(side);
      console.log(`✅ 반찬 ${sides.length}/3 선택: ${side.title}`);
    } else {
      // 후보가 너무 적은 경우: 점진적으로 제외 목록 완화
      if (sideAttempts === 3 && currentExcludedSide.length > 10) {
        // 3번 시도 후 주간 제외 목록을 절반으로 줄임
        currentExcludedSide = currentExcludedSide.slice(-Math.floor(currentExcludedSide.length / 2));
        console.warn(`⚠️ 반찬 후보 부족: 주간 제외 목록을 ${currentExcludedSide.length}개로 완화합니다.`);
      } else if (sideAttempts === 6 && currentExcludedSide.length > 5) {
        // 6번 시도 후 주간 제외 목록을 더 줄임
        currentExcludedSide = currentExcludedSide.slice(-5);
        console.warn(`⚠️ 반찬 후보 부족: 주간 제외 목록을 ${currentExcludedSide.length}개로 더 완화합니다.`);
      } else if (sideAttempts === 9) {
        // 9번 시도 후 주간 제외 목록을 모두 제거 (하루 내 중복만 유지)
        currentExcludedSide = dailyUsedByCategory?.side ? Array.from(dailyUsedByCategory.side) : [];
        console.warn(`⚠️ 반찬 후보 부족: 주간 제외 목록을 모두 제거하고 하루 내 중복만 유지합니다.`);
      }
    }
    sideAttempts++;
  }

  // 최종 폴백: 그래도 반찬이 부족하면 폴백 레시피에서 채움
  if (sides.length < 3) {
    console.warn(`⚠️ 반찬이 ${sides.length}개만 선택됨 → 폴백 레시피로 보완합니다.`);
    const needed = 3 - sides.length;
    const fallbackSidesRaw = searchFallbackRecipes({
      dishType: ["side"],
      mealType,
      excludeNames: [
        ...recentlyUsed,
        ...sides.map((s) => s.title),
      ],
      limit: 20,
    });
    const fallbackSides = healthProfile
      ? await integratedFilterRecipes(
          fallbackSidesRaw,
          healthProfile,
          excludedFoods,
          dailyNutrition,
        )
      : fallbackSidesRaw;
    sides.push(...fallbackSides.slice(0, needed));
  }

  // 3. 국/찌개 선택 (저탄수 식단인 경우 재분배된 칼로리 사용)
  const soupMacroGoals = mealMacroGoals ? {
    protein: { target: mealMacroGoals.protein.target * 0.3 }, // 국은 단백질 비중 중간
    carbohydrates: { target: mealMacroGoals.carbohydrates.target * 0.2 },
    fat: { target: mealMacroGoals.fat.target * 0.5 },
  } : undefined;
  
  // 국/찌개도 점진적 완화 적용
  let currentExcludedSoup = [...excludedByCategory.soup];
  let soupAttempts = 0;
  let soup: RecipeDetailForDiet | undefined = undefined;
  
  while (!soup && soupAttempts < 6) {
    soup = await selectDishForMeal(
      "soup",
      mealType,
      adjustedSoupCalories,
      excludedFoods,
      allergies,
      [...recentlyUsed, ...currentExcludedSoup], // 주간/하루 제외 목록 포함
      availableRecipes,
      isChildDiet,
      dietaryPreferences,
      currentExcludedSoup, // 카테고리별 제외 목록 (점진적 완화)
      undefined,
      premiumFeatures,
      healthProfile, // 통합 필터링을 위한 건강 프로필
      soupMacroGoals, // 국용 매크로 목표
      dailyNutrition // 일일 영양소 추적기
    );
    
    if (!soup) {
      // 후보가 너무 적은 경우: 점진적으로 제외 목록 완화
      if (soupAttempts === 2 && currentExcludedSoup.length > 5) {
        currentExcludedSoup = currentExcludedSoup.slice(-Math.floor(currentExcludedSoup.length / 2));
        console.warn(`⚠️ 국/찌개 후보 부족: 주간 제외 목록을 ${currentExcludedSoup.length}개로 완화합니다.`);
      } else if (soupAttempts === 4) {
        currentExcludedSoup = dailyUsedByCategory?.soup ? Array.from(dailyUsedByCategory.soup) : [];
        console.warn(`⚠️ 국/찌개 후보 부족: 주간 제외 목록을 모두 제거하고 하루 내 중복만 유지합니다.`);
      }
    }
    soupAttempts++;
  }

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
  dishMacroGoals?: { protein: { target: number }; carbohydrates: { target: number }; fat: { target: number } }, // 요리별 매크로 목표
  dailyNutrition?: import("@/lib/diet/daily-nutrition-tracker").DailyNutritionTracker // 일일 영양소 추적기
): Promise<RecipeDetailForDiet | undefined> {
  console.log(`  - ${dishType} 선택 중 (목표: ${Math.round(targetCalories)}kcal)`);
  if (weeklyExcludedByCategory && weeklyExcludedByCategory.length > 0) {
    console.log(`    주간 제외 목록 (${weeklyExcludedByCategory.length}개): ${weeklyExcludedByCategory.slice(0, 5).join(', ')}${weeklyExcludedByCategory.length > 5 ? '...' : ''}`);
    console.log(`    📋 주간 중복 방지: ${dishType} 카테고리에서 ${weeklyExcludedByCategory.length}개 제외됨`);
  } else {
    console.log(`    📋 주간 제외 목록 없음`);
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
        // 주간 카테고리별 제외 목록 필터링 (주간에 1번만 사용되도록)
        if (weeklyExcludedByCategory && weeklyExcludedByCategory.includes(recipe.title)) {
          console.log(`    ⚠️ 주간 제외 (이미 사용됨): ${recipe.title}`);
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

  console.log(`    📊 필터링 전 후보: ${candidates.length}개`);
  
  // 통합 필터링 파이프라인 적용 (건강 프로필이 있는 경우)
  if (healthProfile) {
    const filteredCandidates = await integratedFilterRecipes(candidates, healthProfile, excludedFoods, dailyNutrition);
    console.log(`    📊 통합 필터링 후: ${filteredCandidates.length}개 (${candidates.length - filteredCandidates.length}개 제외)`);
    candidates = filteredCandidates;
  } else {
    // 기존 필터링 방식 (하위 호환성)
    const beforeFilter = candidates.length;
    candidates = filterCompatibleRecipes(candidates, [], excludedFoods);
    candidates = candidates.filter(recipe =>
      checkAllergyCompatibility(recipe, allergies)
    );
    console.log(`    📊 질병/알레르기 필터링 후: ${candidates.length}개 (${beforeFilter - candidates.length}개 제외)`);
  }

  // ✅ 후보가 없으면 폴백을 더 공격적으로 시도 (구성 규칙을 깨지 않기 위해)
  if (candidates.length === 0) {
    console.warn(`    ⚠️ ${dishType} 후보가 없습니다. 폴백 후보를 확장합니다.`);
    console.warn(`    ⚠️ 제외 목록: ${excludeNames.length}개, 주간 제외: ${weeklyExcludedByCategory?.length || 0}개`);
    
    // 주간 제외 목록을 제외하고 폴백 시도
    const excludeWithoutWeekly = excludeNames.filter(name => 
      !weeklyExcludedByCategory || !weeklyExcludedByCategory.includes(name)
    );
    
    const fallbackExpanded = searchFallbackRecipes({
      dishType: [dishType],
      mealType,
      excludeNames: excludeWithoutWeekly, // 주간 제외 목록 제외
      limit: 100, // 더 많은 후보 확보
    });
    console.log(`    📊 폴백 후보: ${fallbackExpanded.length}개`);
    
    let fallbackFiltered = fallbackExpanded;
    if (healthProfile) {
      fallbackFiltered = await integratedFilterRecipes(
        fallbackExpanded,
        healthProfile,
        excludedFoods,
        dailyNutrition,
      );
      console.log(`    📊 폴백 통합 필터링 후: ${fallbackFiltered.length}개`);
    } else {
      fallbackFiltered = fallbackFiltered.filter((recipe) =>
        checkAllergyCompatibility(recipe, allergies),
      );
      console.log(`    📊 폴백 알레르기 필터링 후: ${fallbackFiltered.length}개`);
    }
    candidates = fallbackFiltered;
  }
  
  console.log(`    📊 최종 후보: ${candidates.length}개`);

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
      const diseases = healthProfile.diseases?.map(d => d.code) || [];
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
      const diseases = healthProfile.diseases?.map(d => d.code) || [];
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

