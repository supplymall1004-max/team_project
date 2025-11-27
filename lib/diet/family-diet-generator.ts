/**
 * @file lib/diet/family-diet-generator.ts
 * @description 가족 통합 식단 생성기
 * 
 * 핵심 로직:
 * 1. 가족 구성원 각각의 개인 식단 생성
 * 2. 가족 통합 식단 생성 (모든 구성원의 질병/알레르기 통합)
 * 3. 평균 칼로리 기준 레시피 선택
 */

import type { FamilyMember, UserHealthProfile } from "@/types/family";
import type { FamilyDietPlan, DailyDietPlan, MealComposition, RecipeDetailForDiet } from "@/types/recipe";
import { calculateAge } from "@/lib/utils/age-calculator";
import { calculateMemberGoalCalories, calculateUserGoalCalories } from "@/lib/diet/calorie-calculator";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";
import { getExcludedFoods, filterCompatibleRecipes, checkAllergyCompatibility } from "@/lib/diet/food-filtering";
import { searchFallbackRecipes } from "@/lib/recipes/fallback-recipes";
import { getRecentlyUsedRecipes } from "@/lib/diet/recipe-history";
import { recommendFruitSnack } from "@/lib/diet/seasonal-fruits";

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
      diseases: member.diseases,
      allergies: member.allergies,
      height_cm: member.height_cm,
      weight_kg: member.weight_kg,
      age,
      gender: member.gender,
      activity_level: member.activity_level,
      dietary_preferences: member.dietary_preferences,
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

  let totalCalories = calculateUserGoalCalories(userProfile);
  let childCount = (userProfile.age || 30) < 18 ? 1 : 0;

  for (const member of includedMembers) {
    if (member.diseases) member.diseases.forEach(d => allDiseases.add(d));
    if (member.allergies) member.allergies.forEach(a => allAllergies.add(a));

    const { years: age } = calculateAge(member.birth_date);
    const memberCalories = calculateMemberGoalCalories(member, age);
    totalCalories += memberCalories;

    if (age < 18) childCount++;
  }

  const averageCalories = totalCalories / (familyMembers.length + 1);
  const diseases = Array.from(allDiseases);
  const allergies = Array.from(allAllergies);

  console.log(`통합 질병: ${diseases.join(", ") || "없음"}`);
  console.log(`통합 알레르기: ${allergies.join(", ") || "없음"}`);
  console.log(`평균 칼로리: ${Math.round(averageCalories)}kcal`);
  console.log(`어린이: ${childCount}명`);

  // 2. 제외 음식 조회
  const excludedFoods = await getExcludedFoods(diseases);
  
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
    diseases
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
 * 통합 식사 구성 선택
 */
async function selectUnifiedMealComposition(
  mealType: "breakfast" | "lunch" | "dinner",
  targetCalories: number,
  excludedFoods: any[],
  allergies: string[],
  recentlyUsed: string[],
  isChildDiet: boolean = false
): Promise<MealComposition> {
  console.group(`🍽️ ${mealType.toUpperCase()} 통합 식사 구성`);
  console.log(`목표 칼로리: ${Math.round(targetCalories)}kcal`);

  // 칼로리 배분
  const riceCalories = targetCalories * 0.35;
  const sidesCalories = targetCalories * 0.45;
  const soupCalories = targetCalories * 0.20;

  // 1. 밥 선택
  const rice = await selectUnifiedDish(
    "rice",
    mealType,
    riceCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    isChildDiet
  );

  // 2. 반찬 3개 선택
  const sideCaloriesEach = sidesCalories / 3;
  const sides: RecipeDetailForDiet[] = [];

  for (let i = 0; i < 3; i++) {
    const side = await selectUnifiedDish(
      "side",
      mealType,
      sideCaloriesEach,
      excludedFoods,
      allergies,
      [...recentlyUsed, ...sides.map(s => s.title)],
      isChildDiet
    );
    if (side) sides.push(side);
  }

  // 3. 국/찌개 선택
  const soup = await selectUnifiedDish(
    "soup",
    mealType,
    soupCalories,
    excludedFoods,
    allergies,
    recentlyUsed,
    isChildDiet
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
  isChildDiet: boolean = false
): Promise<RecipeDetailForDiet | undefined> {
  console.log(`  - ${dishType} 선택 중 (목표: ${Math.round(targetCalories)}kcal)`);

  // 폴백 레시피 검색
  let candidates = searchFallbackRecipes({
    dishType: [dishType],
    mealType,
    excludeNames,
    limit: 10,
  });

  // 질병 필터링
  candidates = filterCompatibleRecipes(candidates, [], excludedFoods);

  // 알레르기 필터링
  candidates = candidates.filter(recipe => 
    checkAllergyCompatibility(recipe, allergies)
  );

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

