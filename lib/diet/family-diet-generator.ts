/**
 * @file lib/diet/family-diet-generator.ts
 * @description 가족 통합 식단 생성기
 * 
 * 핵심 로직:
 * 1. 가족 구성원 각각의 개인 식단 생성
 * 2. 가족 통합 식단 생성 (모든 구성원의 질병/알레르기 통합)
 * 3. 평균 칼로리 기준 레시피 선택
 */

import type { FamilyMember } from "@/types/family";
import type { UserHealthProfile, SpecialDietType } from "@/types/health";
import type { FamilyDietPlan, DailyDietPlan, MealComposition, RecipeDetailForDiet } from "@/types/recipe";
import { calculateAge } from "@/lib/utils/age-calculator";
import { calculateMemberGoalCalories, calculateUserGoalCalories } from "@/lib/diet/calorie-calculator";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";
import { getExcludedFoods, filterCompatibleRecipes, checkAllergyCompatibility } from "@/lib/diet/food-filtering";
import { filterRecipes as integratedFilterRecipes } from "@/lib/diet/integrated-filter";
import { searchFallbackRecipes } from "@/lib/recipes/fallback-recipes";
import { getRecentlyUsedRecipes } from "@/lib/diet/recipe-history";
import { recommendFruitSnack } from "@/lib/diet/seasonal-fruits";
import { DailyNutritionTracker } from "@/lib/diet/daily-nutrition-tracker";

/**
 * 주간 컨텍스트를 고려한 가족 식단 생성
 */
export async function generateFamilyDietWithWeeklyContext(
  userId: string,
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[],
  targetDate: string,
  usedByCategory: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string
): Promise<FamilyDietPlan> {
  console.group("👨‍👩‍👧‍👦 주간 컨텍스트 가족 식단 생성");
  console.log("가족 구성원:", familyMembers.length + 1, "명 (본인 포함)");
  console.log("카테고리별 제외 목록:", {
    rice: Array.from(usedByCategory.rice),
    side: Array.from(usedByCategory.side),
    soup: Array.from(usedByCategory.soup),
    snack: Array.from(usedByCategory.snack),
  });
  console.log("선호 밥 종류:", preferredRiceType);

  const individualPlans: { [memberId: string]: DailyDietPlan } = {};

  // 레시피 목록 조회 (가족 식단 생성 전에 한 번만 조회)
  console.log("📚 가족 식단용 레시피 목록 조회 시작...");
  const { getRecipesWithNutrition } = await import("./queries");
  const recipes = await getRecipesWithNutrition();
  console.log(`✅ 가족 식단용 레시피 목록 조회 완료: ${recipes.length}개`);
  
  const availableRecipes = recipes.length > 0 ? recipes : undefined;

  // 1. 사용자 본인 식단 (주간 컨텍스트 적용)
  console.log("\n📋 사용자 본인 식단 생성...");
  const userPlan = await generatePersonalDiet(
    userId,
    userProfile,
    targetDate,
    availableRecipes, // 레시피 목록 전달
    usedByCategory, // 주간 컨텍스트
    preferredRiceType // 밥 종류 다양화
  );
  individualPlans["user"] = userPlan;

  // 2. 가족 구성원별 식단 (주간 컨텍스트 적용)
  for (const member of familyMembers) {
    console.log(`\n📋 ${member.name} 식단 생성...`);
    
    const { years: age } = calculateAge(member.birth_date);
    
    // 가족 구성원을 UserHealthProfile 형식으로 변환
    const memberProfile: UserHealthProfile = {
      id: member.id,
      user_id: member.user_id,
      diseases: (member.diseases || []).map(code => ({ code, custom_name: null })),
      allergies: (member.allergies || []).map(code => ({ code, custom_name: null })),
      height_cm: member.height_cm || null,
      weight_kg: member.weight_kg || null,
      age: age || null,
      gender: member.gender || null,
      activity_level: member.activity_level || null,
      daily_calorie_goal: 0, // 나중에 계산됨
      preferred_ingredients: [],
      disliked_ingredients: [],
      dietary_preferences: (member.dietary_preferences || []) as SpecialDietType[],
      created_at: member.created_at,
      updated_at: member.updated_at,
    };

    const memberPlan = await generatePersonalDiet(
      userId,  // 사용자 ID (레시피 이력용)
      memberProfile,
      targetDate,
      availableRecipes, // 레시피 목록 전달
      usedByCategory, // 주간 컨텍스트
      preferredRiceType // 밥 종류 다양화
    );
    
    individualPlans[member.id] = memberPlan;
  }

  // 3. 통합 식단 생성 (주간 컨텍스트 적용)
  console.log("\n🍽️ 가족 통합 식단 생성...");
  const unifiedPlan = await generateUnifiedDietWithWeeklyContext(
    userId,
    userProfile,
    familyMembers,
    targetDate,
    usedByCategory,
    preferredRiceType
  );

  console.log("\n✅ 가족 식단 생성 완료");
  console.groupEnd();

  return {
    date: targetDate,
    individualPlans,
    unifiedPlan,
  };
}

/**
 * 가족 식단 생성 (개인별 + 통합)
 */
export async function generateFamilyDiet(
  userId: string,
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[],
  targetDate: string,
  includeUnified: boolean = true
): Promise<FamilyDietPlan> {
  console.group("👨‍👩‍👧‍👦 가족 식단 생성");
  console.log("가족 구성원:", familyMembers.length + 1, "명 (본인 포함)");
  console.log("통합 식단 포함:", includeUnified);

  const individualPlans: { [memberId: string]: DailyDietPlan } = {};

  // 1. 사용자 본인 식단
  console.log("\n📋 사용자 본인 식단 생성...");
  const userPlan = await generatePersonalDiet(userId, userProfile, targetDate);
  individualPlans["user"] = userPlan;

  // 2. 가족 구성원별 식단
  for (const member of familyMembers) {
    console.log(`\n📋 ${member.name} 식단 생성...`);
    
    const { years: age } = calculateAge(member.birth_date);
    
    // 가족 구성원을 UserHealthProfile 형식으로 변환
    const memberProfile: UserHealthProfile = {
      id: member.id,
      user_id: member.user_id,
      diseases: (member.diseases || []).map(code => ({ code, custom_name: null })),
      allergies: (member.allergies || []).map(code => ({ code, custom_name: null })),
      height_cm: member.height_cm || null,
      weight_kg: member.weight_kg || null,
      age: age || null,
      gender: member.gender || null,
      activity_level: member.activity_level || null,
      daily_calorie_goal: 0, // 나중에 계산됨
      preferred_ingredients: [],
      disliked_ingredients: [],
      dietary_preferences: (member.dietary_preferences || []) as SpecialDietType[],
      created_at: member.created_at,
      updated_at: member.updated_at,
    };

    const memberPlan = await generatePersonalDiet(
      userId,  // 사용자 ID (레시피 이력용)
      memberProfile,
      targetDate
    );
    
    individualPlans[member.id] = memberPlan;
  }

  // 3. 통합 식단 생성
  let unifiedPlan: DailyDietPlan | undefined;
  
  if (includeUnified) {
    console.log("\n🍽️ 가족 통합 식단 생성...");
    unifiedPlan = await generateUnifiedDiet(
      userId,
      userProfile,
      familyMembers,
      targetDate
    );
  }

  console.log("\n✅ 가족 식단 생성 완료");
  console.groupEnd();

  return {
    date: targetDate,
    individualPlans,
    unifiedPlan,
  };
}

/**
 * 가족 통합 식단 생성 (모든 구성원이 함께 먹을 수 있는 식단)
 */
async function generateUnifiedDiet(
  userId: string,
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[],
  targetDate: string
): Promise<DailyDietPlan> {
  console.group("🍽️ 통합 식단 생성");

  // 1. 통합 식단에 포함된 구성원만 필터링
  const includedMembers = familyMembers.filter(
    member => member.include_in_unified_diet !== false // null/undefined도 true로 처리
  );

  console.log(`통합 식단 포함 구성원: ${includedMembers.length}명 (전체: ${familyMembers.length}명)`);

  // 2. 모든 포함된 구성원의 질병/알레르기 통합
  const allDiseases = new Set([...(userProfile.diseases || [])]);
  const allAllergies = new Set([...(userProfile.allergies || [])]);

  let totalCalories = await calculateUserGoalCalories(userProfile);
  let childCount = (userProfile.age || 30) < 18 ? 1 : 0;

  for (const member of includedMembers) {
    if (member.diseases) member.diseases.forEach(d => allDiseases.add({ code: d, custom_name: null }));
    if (member.allergies) member.allergies.forEach(a => allAllergies.add({ code: a, custom_name: null }));

    const { years: age } = calculateAge(member.birth_date);
    const memberCalories = await calculateMemberGoalCalories(member, age);
    totalCalories += memberCalories;

    if (age < 18) childCount++;
  }

  const averageCalories = totalCalories / (familyMembers.length + 1);
  const diseases = Array.from(allDiseases);
  const allergies = Array.from(allAllergies).map(a => a.code);

  console.log(`통합 질병: ${diseases.join(", ") || "없음"}`);
  console.log(`통합 알레르기: ${allergies.join(", ") || "없음"}`);
  console.log(`평균 칼로리: ${Math.round(averageCalories)}kcal`);
  console.log(`어린이: ${childCount}명`);

  // 2. 제외 음식 조회
  const excludedFoods = await getExcludedFoods(diseases.map(d => d.code));
  
  // 3. 최근 사용 레시피 조회
  const recentlyUsed = await getRecentlyUsedRecipes(userId);

  // 4. 식사별 칼로리 배분 (어린이가 있는 경우 성장기 비율 적용)
  let breakfastCalories: number;
  let lunchCalories: number;
  let dinnerCalories: number;
  let snackCalories: number;

  if (childCount > 0) {
    // 어린이 성장기 식단 비율: 아침 25%, 점심 35%, 저녁 30%, 간식 10%
    console.log("👶 어린이가 포함되어 성장기 식단 비율 적용");
    breakfastCalories = averageCalories * 0.25;
    lunchCalories = averageCalories * 0.35;
    dinnerCalories = averageCalories * 0.30;
    snackCalories = averageCalories * 0.10;
  } else {
    // 일반 성인 식단 비율
    breakfastCalories = averageCalories * 0.30;
    lunchCalories = averageCalories * 0.35;
    dinnerCalories = averageCalories * 0.30;
    snackCalories = averageCalories * 0.05;
  }

  // 5. 식사 구성
  const breakfast = await selectUnifiedMealComposition(
    "breakfast",
    breakfastCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    childCount > 0 // 어린이 식단 여부 전달
  );

  const lunch = await selectUnifiedMealComposition(
    "lunch",
    lunchCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    childCount > 0
  );

  const dinner = await selectUnifiedMealComposition(
    "dinner",
    dinnerCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    childCount > 0
  );

  // 6. 간식 (어린이가 있으면 어린이 우선, 없으면 일반)
  const currentMonth = new Date().getMonth() + 1;
  const hasChild = childCount > 0;
  
  const fruitSnack = recommendFruitSnack(
    snackCalories,
    currentMonth,
    hasChild,
    diseases.map(d => d.code)
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
  const totalNutrition = {
    calories:
      breakfast.totalNutrition.calories +
      lunch.totalNutrition.calories +
      dinner.totalNutrition.calories +
      snack.nutrition.calories,
    protein:
      breakfast.totalNutrition.protein +
      lunch.totalNutrition.protein +
      dinner.totalNutrition.protein +
      snack.nutrition.protein,
    carbs:
      breakfast.totalNutrition.carbs +
      lunch.totalNutrition.carbs +
      dinner.totalNutrition.carbs +
      snack.nutrition.carbs,
    fat:
      breakfast.totalNutrition.fat +
      lunch.totalNutrition.fat +
      dinner.totalNutrition.fat +
      snack.nutrition.fat,
    sodium:
      (breakfast.totalNutrition.sodium || 0) +
      (lunch.totalNutrition.sodium || 0) +
      (dinner.totalNutrition.sodium || 0) +
      (snack.nutrition.sodium || 0),
    fiber:
      (breakfast.totalNutrition.fiber || 0) +
      (lunch.totalNutrition.fiber || 0) +
      (dinner.totalNutrition.fiber || 0) +
      (snack.nutrition.fiber || 0),
  };

  console.log("✅ 통합 식단 생성 완료");
  console.log(`총 칼로리: ${totalNutrition.calories}kcal`);
  console.groupEnd();

  return {
    date: targetDate,
    breakfast,
    lunch,
    dinner,
    snack,
    totalNutrition,
  };
}

/**
 * 주간 컨텍스트를 고려한 통합 식단 생성
 */
async function generateUnifiedDietWithWeeklyContext(
  userId: string,
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[],
  targetDate: string,
  usedByCategory: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string
): Promise<DailyDietPlan> {
  // 통합 식단 생성 로직 (주간 컨텍스트 적용)
  console.group("🍽️ 가족 통합 식단 생성 (주간 컨텍스트)");
  
  // 모든 구성원의 제외 음식 통합
  const allExcludedFoods: any[] = [];
  const allAllergies: string[] = [];
  const allDiseases: string[] = [];
  let totalCalories = 0;
  let memberCount = 0;

  // 사용자 본인
  const userExcluded = await getExcludedFoods(userProfile.diseases?.map(d => d.code) || []);
  allExcludedFoods.push(...userExcluded);
  allAllergies.push(...(userProfile.allergies?.map(a => a.code) || []));
  allDiseases.push(...(userProfile.diseases?.map(d => d.code) || []));
  totalCalories += await calculateUserGoalCalories(userProfile);
  memberCount++;

  // 가족 구성원
  for (const member of familyMembers) {
    const memberExcluded = await getExcludedFoods(member.diseases || []);
    allExcludedFoods.push(...memberExcluded);
    allAllergies.push(...(member.allergies || []));
    allDiseases.push(...(member.diseases || []));
    const { years: age } = calculateAge(member.birth_date);
    totalCalories += await calculateMemberGoalCalories(member, age);
    memberCount++;
  }

  // 중복 제거 (질병, 알레르기)
  const uniqueDiseases = Array.from(new Set(allDiseases));
  const uniqueAllergies = Array.from(new Set(allAllergies));

  // 통합 건강 프로필 생성 (통합 필터링용)
  const unifiedHealthProfile: UserHealthProfile = {
    id: `unified-${userId}`,
    user_id: userId,
    age: null, // 통합 프로필에서는 나이를 평균으로 계산하지 않음
    gender: null, // 통합 프로필에서는 성별을 지정하지 않음
    height_cm: null,
    weight_kg: null,
    activity_level: null,
    daily_calorie_goal: Math.round(totalCalories / memberCount),
    diseases: uniqueDiseases.map(code => ({ code, custom_name: null })),
    allergies: uniqueAllergies.map(code => ({ code, custom_name: null })),
    preferred_ingredients: [],
    disliked_ingredients: [],
    dietary_preferences: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 일일 영양소 추적기 생성 (통합 건강 프로필 기반)
  const dailyNutrition = (uniqueDiseases.length > 0)
    ? new DailyNutritionTracker(unifiedHealthProfile)
    : undefined;
  if (dailyNutrition) {
    console.log("📊 일일 영양소 추적기 생성 완료 (통합 프로필 기반)");
  }

  // 평균 칼로리 계산
  const avgCalories = Math.round(totalCalories / memberCount);
  console.log(`평균 칼로리: ${avgCalories}kcal (${memberCount}명 기준)`);
  console.log(`통합 질병: ${uniqueDiseases.join(', ') || '없음'}`);
  console.log(`통합 알레르기: ${uniqueAllergies.join(', ') || '없음'}`);

  // 최근 사용 레시피 조회
  const recentlyUsed = await getRecentlyUsedRecipes(userId);

  // 식사별 칼로리 배분
  const breakfastCalories = avgCalories * 0.30;
  const lunchCalories = avgCalories * 0.35;
  const dinnerCalories = avgCalories * 0.30;
  const snackCalories = avgCalories * 0.05;

  // 통합 식사 구성 생성 (주간 컨텍스트 전달)
  const breakfast = await selectUnifiedMealComposition(
    "breakfast",
    breakfastCalories,
    allExcludedFoods,
    allAllergies,
    recentlyUsed,
    false, // isChildDiet
    usedByCategory, // 주간 컨텍스트
    preferredRiceType, // 밥 종류 다양화
    unifiedHealthProfile, // 통합 건강 프로필 (통합 필터링용)
    dailyNutrition // 일일 영양소 추적기
  );

  // 아침 식사 레시피를 일일 추적기에 추가
  if (dailyNutrition && breakfast) {
    if (breakfast.rice) dailyNutrition.addRecipe(breakfast.rice);
    breakfast.sides.forEach(side => dailyNutrition.addRecipe(side));
    if (breakfast.soup) dailyNutrition.addRecipe(breakfast.soup);
    console.log("📊 아침 식사 영양소 추가 완료 (통합 식단)");
  }

  const lunch = await selectUnifiedMealComposition(
    "lunch",
    lunchCalories,
    allExcludedFoods,
    allAllergies,
    recentlyUsed,
    false, // isChildDiet
    usedByCategory, // 주간 컨텍스트
    preferredRiceType, // 밥 종류 다양화
    unifiedHealthProfile, // 통합 건강 프로필 (통합 필터링용)
    dailyNutrition // 일일 영양소 추적기
  );

  // 점심 식사 레시피를 일일 추적기에 추가
  if (dailyNutrition && lunch) {
    if (lunch.rice) dailyNutrition.addRecipe(lunch.rice);
    lunch.sides.forEach(side => dailyNutrition.addRecipe(side));
    if (lunch.soup) dailyNutrition.addRecipe(lunch.soup);
    console.log("📊 점심 식사 영양소 추가 완료 (통합 식단)");
  }

  const dinner = await selectUnifiedMealComposition(
    "dinner",
    dinnerCalories,
    allExcludedFoods,
    allAllergies,
    recentlyUsed,
    false, // isChildDiet
    usedByCategory, // 주간 컨텍스트
    preferredRiceType, // 밥 종류 다양화
    unifiedHealthProfile, // 통합 건강 프로필 (통합 필터링용)
    dailyNutrition // 일일 영양소 추적기
  );

  // 저녁 식사 레시피를 일일 추적기에 추가
  if (dailyNutrition && dinner) {
    if (dinner.rice) dailyNutrition.addRecipe(dinner.rice);
    dinner.sides.forEach(side => dailyNutrition.addRecipe(side));
    if (dinner.soup) dailyNutrition.addRecipe(dinner.soup);
    console.log("📊 저녁 식사 영양소 추가 완료 (통합 식단)");
    
    // 일일 영양소 상태 로깅
    const currentNutrition = dailyNutrition.getCurrentNutrition();
    const remaining = dailyNutrition.getRemaining();
    console.log("📊 일일 영양소 상태 (통합 식단):", {
      현재: currentNutrition,
      잔여량: remaining
    });
  }

  // 간식 (제철 과일) - 주간 컨텍스트 고려
  const currentMonth = new Date().getMonth() + 1;
  let fruitSnack = recommendFruitSnack(
    snackCalories,
    currentMonth,
    false,
    []
  );
  
  // 주간 컨텍스트: 이미 사용된 간식 제외
  if (usedByCategory?.snack && usedByCategory.snack.size > 0) {
    const excludedSnacks = Array.from(usedByCategory.snack);
    let retryCount = 0;
    while (excludedSnacks.includes(fruitSnack.fruit.name) && retryCount < 5) {
      fruitSnack = recommendFruitSnack(snackCalories, currentMonth, false, []);
      retryCount++;
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
    instructions: fruitSnack.fruit.benefits.join(", "),
    nutrition: {
      calories: fruitSnack.totalCalories,
      protein: fruitSnack.fruit.nutrition.protein * fruitSnack.servings,
      carbs: fruitSnack.fruit.nutrition.carbs * fruitSnack.servings,
      fat: fruitSnack.fruit.nutrition.fat * fruitSnack.servings,
      fiber: fruitSnack.fruit.nutrition.fiber * fruitSnack.servings,
    },
    emoji: fruitSnack.fruit.emoji,
    imageUrl: fruitSnack.fruit.imageUrl,
  };

  // 총 영양 정보 계산
  const totalNutrition = {
    calories: breakfast.totalNutrition.calories + lunch.totalNutrition.calories + dinner.totalNutrition.calories + snack.nutrition.calories,
    protein: breakfast.totalNutrition.protein + lunch.totalNutrition.protein + dinner.totalNutrition.protein + snack.nutrition.protein,
    carbs: breakfast.totalNutrition.carbs + lunch.totalNutrition.carbs + dinner.totalNutrition.carbs + snack.nutrition.carbs,
    fat: breakfast.totalNutrition.fat + lunch.totalNutrition.fat + dinner.totalNutrition.fat + snack.nutrition.fat,
    sodium: (breakfast.totalNutrition.sodium || 0) + (lunch.totalNutrition.sodium || 0) + (dinner.totalNutrition.sodium || 0) + (snack.nutrition.sodium || 0),
    fiber: (breakfast.totalNutrition.fiber || 0) + (lunch.totalNutrition.fiber || 0) + (dinner.totalNutrition.fiber || 0) + (snack.nutrition.fiber || 0),
  };

  console.log("✅ 통합 식단 생성 완료");
  console.groupEnd();

  return {
    date: targetDate,
    breakfast,
    lunch,
    dinner,
    snack,
    totalNutrition,
  };
}

/**
 * 통합 식사 구성 선택
 */
async function selectUnifiedMealComposition(
  mealType: "breakfast" | "lunch" | "dinner",
  targetCalories: number,
  excludedFoods: any[],
  allergies: string[],
  recentlyUsed: string[],
  isChildDiet: boolean = false,
  usedByCategory?: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string,
  unifiedHealthProfile?: UserHealthProfile, // 통합 건강 프로필 (통합 필터링용)
  dailyNutrition?: DailyNutritionTracker // 일일 영양소 추적기
): Promise<MealComposition> {
  console.group(`🍽️ ${mealType.toUpperCase()} 통합 식사 구성`);
  console.log(`목표 칼로리: ${Math.round(targetCalories)}kcal`);

  // 칼로리 배분
  const riceCalories = targetCalories * 0.35;
  const sidesCalories = targetCalories * 0.45;
  const soupCalories = targetCalories * 0.20;

  // 카테고리별 제외 목록 생성
  const excludedByCategory = {
    rice: usedByCategory?.rice ? Array.from(usedByCategory.rice) : [],
    side: usedByCategory?.side ? Array.from(usedByCategory.side) : [],
    soup: usedByCategory?.soup ? Array.from(usedByCategory.soup) : [],
  };

  // 1. 밥 선택 (주간 컨텍스트 고려)
  const rice = await selectUnifiedDish(
    "rice",
    mealType,
    riceCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    isChildDiet,
    excludedByCategory.rice, // 카테고리별 제외 목록
    preferredRiceType, // 선호 밥 종류
    unifiedHealthProfile, // 통합 건강 프로필 (통합 필터링용)
    dailyNutrition // 일일 영양소 추적기
  );

  // 2. 반찬 3개 선택 (주간 컨텍스트 고려)
  const sideCaloriesEach = sidesCalories / 3;
  const sides: RecipeDetailForDiet[] = [];

  for (let i = 0; i < 3; i++) {
    const side = await selectUnifiedDish(
      "side",
      mealType,
      sideCaloriesEach,
      excludedFoods,
      allergies,
      [...recentlyUsed, ...sides.map(s => s.title), ...excludedByCategory.side], // 주간 제외 목록 포함
      isChildDiet,
      excludedByCategory.side, // 카테고리별 제외 목록
      undefined, // preferredRiceType (반찬에는 해당 없음)
      unifiedHealthProfile, // 통합 건강 프로필 (통합 필터링용)
      dailyNutrition // 일일 영양소 추적기
    );
    if (side) sides.push(side);
  }

  // 3. 국/찌개 선택 (주간 컨텍스트 고려)
  const soup = await selectUnifiedDish(
    "soup",
    mealType,
    soupCalories,
    excludedFoods,
    allergies,
    [...recentlyUsed, ...excludedByCategory.soup], // 주간 제외 목록 포함
    isChildDiet,
    excludedByCategory.soup, // 카테고리별 제외 목록
    undefined, // preferredRiceType (국에는 해당 없음)
    unifiedHealthProfile, // 통합 건강 프로필 (통합 필터링용)
    dailyNutrition // 일일 영양소 추적기
  );

  // 총 영양 정보
  const allDishes = [rice, ...sides, soup].filter(Boolean) as RecipeDetailForDiet[];
  const totalNutrition = allDishes.reduce(
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

  console.log(`✅ 구성 완료: 밥 + 반찬${sides.length}개 + 국/찌개`);
  console.log(`실제 칼로리: ${totalNutrition.calories}kcal`);
  console.groupEnd();

  return {
    rice,
    sides,
    soup,
    totalNutrition,
  };
}

/**
 * 통합 요리 선택
 */
async function selectUnifiedDish(
  dishType: "rice" | "side" | "soup",
  mealType: "breakfast" | "lunch" | "dinner",
  targetCalories: number,
  excludedFoods: any[],
  allergies: string[],
  excludeNames: string[],
  isChildDiet: boolean = false,
  weeklyExcludedByCategory?: string[], // 주간 카테고리별 제외 목록
  preferredRiceType?: string, // 선호 밥 종류
  unifiedHealthProfile?: UserHealthProfile, // 통합 건강 프로필 (통합 필터링용)
  dailyNutrition?: DailyNutritionTracker // 일일 영양소 추적기
): Promise<RecipeDetailForDiet | undefined> {
  console.log(`  - ${dishType} 선택 중 (목표: ${Math.round(targetCalories)}kcal)`);
  if (weeklyExcludedByCategory && weeklyExcludedByCategory.length > 0) {
    console.log(`    주간 제외 목록: ${weeklyExcludedByCategory.join(', ')}`);
  }
  if (preferredRiceType && dishType === "rice") {
    console.log(`    선호 밥 종류: ${preferredRiceType}`);
  }

  // 레시피 목록 조회 (데이터베이스 + 식약처 API)
  console.log(`    📚 레시피 목록 조회 중...`);
  const { getRecipesWithNutrition } = await import("./queries");
  const recipes = await getRecipesWithNutrition();
  console.log(`    ✅ 레시피 목록 조회 완료: ${recipes.length}개`);
  
  const excludeAll = [...excludeNames, ...(weeklyExcludedByCategory || [])];
  let candidates: RecipeDetailForDiet[] = [];
  
  if (recipes && recipes.length > 0) {
    // 데이터베이스/식약처 레시피 사용
    const title = (recipe: any) => recipe.title.toLowerCase();
    candidates = recipes
      .filter(recipe => {
        const recipeTitle = title(recipe);
        switch (dishType) {
          case "rice":
            if (preferredRiceType) {
              return recipeTitle.includes(preferredRiceType.toLowerCase().replace("밥", "")) || 
                     recipeTitle.includes(preferredRiceType.toLowerCase());
            }
            return recipeTitle.includes("밥") || recipeTitle.includes("rice");
          case "side":
            return !recipeTitle.includes("국") && !recipeTitle.includes("찌개") && !recipeTitle.includes("밥");
          case "soup":
            return recipeTitle.includes("국") || recipeTitle.includes("찌개") || recipeTitle.includes("탕");
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
        if (excludeAll.includes(recipe.title)) return false;
        return true;
      });
  }
  
  // 레시피가 없거나 부족하면 폴백 레시피 사용
  if (candidates.length === 0) {
    console.log(`    📚 폴백 레시피 시스템 사용`);
    const { searchFallbackRecipes } = await import("@/lib/recipes/fallback-recipes");
    candidates = searchFallbackRecipes({
      dishType: [dishType],
      mealType,
      excludeNames: excludeAll,
      limit: 10,
    });
  }
  
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

  // 주간 컨텍스트 필터링: 이미 사용된 레시피 제외 (2번 이상 겹치지 않게)
  if (weeklyExcludedByCategory && weeklyExcludedByCategory.length > 0) {
    candidates = candidates.filter(recipe => {
      const isExcluded = weeklyExcludedByCategory.includes(recipe.title);
      if (isExcluded) {
        console.log(`    ⚠️ 주간 제외: ${recipe.title}`);
      }
      return !isExcluded;
    });
  }

  // 통합 필터링 파이프라인 적용 (통합 건강 프로필이 있는 경우)
  if (unifiedHealthProfile) {
    console.log(`    🔍 통합 필터링 적용 중...`);
    const filteredCandidates = await integratedFilterRecipes(candidates, unifiedHealthProfile, excludedFoods, dailyNutrition);
    candidates = filteredCandidates;
  } else {
    // 기존 필터링 로직 (하위 호환성)
    // 질병 필터링
    candidates = filterCompatibleRecipes(candidates, [], excludedFoods);

    // 알레르기 필터링
    candidates = candidates.filter(recipe => 
      checkAllergyCompatibility(recipe, allergies)
    );
  }

  // 정렬 기준 설정
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

  if (selected && isChildDiet) {
    console.log(`👶 어린이 식단용 ${dishType} 선택:`, {
      title: selected.title,
      calories: selected.nutrition.calories,
      nutritionRatio: {
        carbs: selected.nutrition.carbs,
        protein: selected.nutrition.protein,
        fat: selected.nutrition.fat,
      }
    });
  }
  
  if (selected) {
    console.log(`    ✅ 선택: ${selected.title} (${selected.nutrition.calories}kcal)`);
  } else {
    console.warn(`    ⚠️ 선택 실패 (후보 없음)`);
  }

  return selected;
}

