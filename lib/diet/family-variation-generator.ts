/**
 * @file lib/diet/family-variation-generator.ts
 * @description 가족 식단 변형 생성기 - 같은 메인 재료 기반 변형 식단 생성
 *
 * 주요 기능:
 * 1. 가족 구성원별 변형 식단 생성
 * 2. 공통 메인 재료 선택
 * 3. 변형 전략 적용 (Level 1-3)
 * 4. 영양소 최적화
 *
 * 변형 전략:
 * - Level 1: 같은 밥/국, 반찬 1-2개만 다르게
 * - Level 2: 같은 밥, 국/찌개 변형 가능, 반찬 2개 다르게
 * - Level 3: 메인 재료 동일, 조리법/양념 변형, 반찬 모두 다르게
 *
 * @dependencies
 * - lib/diet/recipe-variation-engine.ts: 변형 레시피 탐색
 * - lib/diet/personal-diet-generator.ts: 개인 식단 생성
 * - types/recipe.ts: FamilyDietPlan, VariationPlan, VariationLevel
 */

import type { FamilyMember } from "@/types/family";
import type { UserHealthProfile } from "@/types/health";
import type {
  FamilyDietPlan,
  DailyDietPlan,
  VariationPlan,
  VariationLevel,
} from "@/types/recipe";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";
import {
  groupRecipesByMainIngredient,
  findVariationRecipes,
  calculateNutritionGap,
  selectComplementarySides,
} from "@/lib/diet/recipe-variation-engine";
import { getRecipesByMainIngredient } from "@/lib/diet/recipe-metadata-queries";
import { getRecipesWithNutrition } from "@/lib/diet/queries";
import { calculateAge } from "@/lib/utils/age-calculator";
import { calculateMemberGoalCalories, calculateUserGoalCalories } from "@/lib/diet/calorie-calculator";
import type { MealComposition, RecipeDetailForDiet } from "@/types/recipe";

/**
 * 가족 변형 식단 생성
 * 
 * @param userId 사용자 ID
 * @param userProfile 사용자 건강 프로필
 * @param familyMembers 가족 구성원 목록
 * @param targetDate 대상 날짜
 * @param variationLevel 변형 레벨 (1-3)
 * @returns 가족 변형 식단 계획
 */
export async function generateFamilyVariationDiet(
  userId: string,
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[],
  targetDate: string,
  variationLevel: VariationLevel = 2
): Promise<FamilyDietPlan> {
  console.group("👨‍👩‍👧‍👦 가족 변형 식단 생성");
  console.log(`변형 레벨: Level ${variationLevel}`);
  console.log(`가족 구성원: ${familyMembers.length + 1}명 (본인 포함)`);

  // 1. 가족 영양소 요구사항 분석
  const nutritionNeeds = await analyzeFamilyNutritionNeeds(
    userProfile,
    familyMembers
  );
  console.log("가족 영양소 요구사항 분석 완료");

  // 2. 변형 계획 수립
  const variationPlan = createVariationPlan(
    nutritionNeeds,
    variationLevel
  );
  console.log("변형 계획 수립 완료:", variationPlan.description);

  // 3. 레시피 목록 조회
  const recipes = await getRecipesWithNutrition();
  console.log(`레시피 목록 조회: ${recipes.length}개`);

  // 4. 사용자 본인 식단 생성 (기준 식단)
  const basePlan = await generatePersonalDiet(
    userId,
    userProfile,
    targetDate,
    recipes.map(r => ({
      id: r.id,
      title: r.title,
      calories: r.calories,
      carbohydrates: r.carbohydrates,
      protein: r.protein,
      fat: r.fat,
      sodium: r.sodium,
    }))
  );

  // 개별 식단 계획 저장 객체 초기화
  const individualPlans: { [memberId: string]: DailyDietPlan } = {};
  individualPlans["user"] = basePlan;

  // 5. 공통 메인 재료 선택 (기준 식단의 반찬에서)
  const commonMainIngredient = await selectCommonMainIngredient(basePlan);
  console.log(`공통 메인 재료: ${commonMainIngredient || "없음"}`);

  // 6. 가족 구성원별 변형 식단 생성
  for (const member of familyMembers) {
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
      daily_calorie_goal: 0,
      preferred_ingredients: [],
      disliked_ingredients: [],
      dietary_preferences: (member.dietary_preferences || []) as any[],
      created_at: member.created_at,
      updated_at: member.updated_at,
    };

    // 변형 식단 생성
    const variationPlan = await createVariationPlanForMember(
      basePlan,
      memberProfile,
      variationLevel,
      commonMainIngredient,
      recipes.map(r => ({
        id: r.id,
        title: r.title,
        calories: r.calories,
        carbohydrates: r.carbohydrates,
        protein: r.protein,
        fat: r.fat,
        sodium: r.sodium,
      }))
    );

    individualPlans[member.id] = variationPlan;
  }

  console.log("✅ 가족 변형 식단 생성 완료");
  console.groupEnd();

  return {
    date: targetDate,
    individualPlans,
    unifiedPlan: undefined, // 변형 모드에서는 통합 식단 미생성
  };
}

/**
 * 가족 영양소 요구사항 분석
 * 
 * @param userProfile 사용자 건강 프로필
 * @param familyMembers 가족 구성원 목록
 * @returns 영양소 요구사항 분석 결과
 */
export async function analyzeFamilyNutritionNeeds(
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[]
): Promise<{
  totalCalories: number;
  averageCalories: number;
  hasAdolescent: boolean;
  hasChild: boolean;
  priorityNutrients: string[]; // 우선 영양소 (단백질, 칼슘 등)
}> {
  console.group("🔍 가족 영양소 요구사항 분석");

  // 실제 칼로리 계산
  let totalCalories = await calculateUserGoalCalories(userProfile);
  const memberCount = familyMembers.length + 1;

  // 가족 구성원 칼로리 합산
  for (const member of familyMembers) {
    const { years: age } = calculateAge(member.birth_date);
    const memberCalories = await calculateMemberGoalCalories(member, age);
    totalCalories += memberCalories;
  }

  const averageCalories = totalCalories / memberCount;

  // 청소년/어린이 감지
  const hasAdolescent = familyMembers.some(m => {
    const { years: age } = calculateAge(m.birth_date);
    return age >= 13 && age < 18;
  });
  const hasChild = familyMembers.some(m => {
    const { years: age } = calculateAge(m.birth_date);
    return age < 18;
  });

  // 우선 영양소 결정
  const priorityNutrients: string[] = [];
  if (hasAdolescent) {
    priorityNutrients.push("단백질", "칼슘", "철분", "비타민D");
  } else if (hasChild) {
    priorityNutrients.push("단백질", "칼슘");
  }

  console.log(`총 칼로리: ${totalCalories}kcal`);
  console.log(`평균 칼로리: ${averageCalories}kcal`);
  console.log(`청소년 포함: ${hasAdolescent}`);
  console.log(`어린이 포함: ${hasChild}`);
  console.log(`우선 영양소: ${priorityNutrients.join(", ")}`);
  console.groupEnd();

  return {
    totalCalories,
    averageCalories,
    hasAdolescent,
    hasChild,
    priorityNutrients,
  };
}

/**
 * 변형 계획 수립
 * 
 * @param nutritionNeeds 영양소 요구사항
 * @param level 변형 레벨
 * @returns 변형 계획
 */
export function createVariationPlan(
  nutritionNeeds: ReturnType<typeof analyzeFamilyNutritionNeeds> extends Promise<infer T> ? T : never,
  level: VariationLevel
): VariationPlan {
  console.group("📋 변형 계획 수립");

  let plan: VariationPlan;

  switch (level) {
    case 1:
      plan = {
        level: 1,
        commonMainIngredient: "공통 메인 재료", // TODO: 실제 메인 재료 선택
        sharedItems: {
          rice: true, // 밥 공유
          soup: true, // 국/찌개 공유
        },
        variationItems: {
          sides: 1, // 반찬 1-2개만 다르게
        },
        description: "Level 1: 같은 밥과 국/찌개를 공유하고, 반찬 1-2개만 구성원별로 다르게 제공합니다.",
      };
      break;

    case 2:
      plan = {
        level: 2,
        commonMainIngredient: "공통 메인 재료", // TODO: 실제 메인 재료 선택
        sharedItems: {
          rice: true, // 밥 공유
          soup: false, // 국/찌개 변형 가능
        },
        variationItems: {
          sides: 2, // 반찬 2개 다르게
          soup: true, // 국/찌개 변형
        },
        description: "Level 2: 같은 밥을 공유하고, 국/찌개와 반찬 2개를 구성원별로 다르게 제공합니다.",
      };
      break;

    case 3:
      plan = {
        level: 3,
        commonMainIngredient: "공통 메인 재료", // TODO: 실제 메인 재료 선택
        sharedItems: {
          rice: false, // 밥도 변형 가능
          soup: false, // 국/찌개 변형
        },
        variationItems: {
          sides: 3, // 반찬 모두 다르게
          soup: true, // 국/찌개 변형
        },
        description: "Level 3: 메인 재료는 동일하지만, 조리법과 양념을 다르게 하여 모든 반찬과 국/찌개를 구성원별로 다르게 제공합니다.",
      };
      break;

    default:
      plan = {
        level: 2,
        commonMainIngredient: "공통 메인 재료",
        sharedItems: {
          rice: true,
          soup: false,
        },
        variationItems: {
          sides: 2,
          soup: true,
        },
        description: "Level 2: 기본 변형 전략",
      };
  }

  console.log(`변형 레벨: Level ${plan.level}`);
  console.log(`공통 메인 재료: ${plan.commonMainIngredient}`);
  console.log(`공유 항목: 밥 ${plan.sharedItems.rice ? "공유" : "변형"}, 국 ${plan.sharedItems.soup ? "공유" : "변형"}`);
  console.log(`변형 항목: 반찬 ${plan.variationItems.sides}개, 국 ${plan.variationItems.soup ? "변형" : "공유"}`);
  console.groupEnd();

  return plan;
}

/**
 * 공통 메인 재료 선택 (기준 식단에서)
 */
async function selectCommonMainIngredient(basePlan: DailyDietPlan): Promise<string | null> {
  // 기준 식단의 반찬에서 메인 재료 추출
  const allSides: RecipeDetailForDiet[] = [];
  
  if (basePlan.breakfast && 'sides' in basePlan.breakfast) {
    allSides.push(...basePlan.breakfast.sides);
  }
  if (basePlan.lunch && 'sides' in basePlan.lunch) {
    allSides.push(...basePlan.lunch.sides);
  }
  if (basePlan.dinner && 'sides' in basePlan.dinner) {
    allSides.push(...basePlan.dinner.sides);
  }

  // 재료 빈도 계산 (메타데이터 우선)
  const ingredientCount = new Map<string, number>();
  
  for (const side of allSides) {
    if (!side.id) continue;
    
    try {
      // 메타데이터에서 메인 재료 추출
      const { getRecipeMetadata } = await import("@/lib/diet/recipe-metadata-queries");
      const metadata = await getRecipeMetadata(side.id);
      
      if (metadata && metadata.main_ingredients && metadata.main_ingredients.length > 0) {
        for (const ingredient of metadata.main_ingredients) {
          ingredientCount.set(ingredient, (ingredientCount.get(ingredient) || 0) + 1);
        }
      } else if (side.ingredients && side.ingredients.length > 0) {
        // 메타데이터가 없으면 재료 목록에서 추출
        const firstIngredient = side.ingredients[0].name.split(/\s+/)[0];
        ingredientCount.set(firstIngredient, (ingredientCount.get(firstIngredient) || 0) + 1);
      }
    } catch (error) {
      // 메타데이터 조회 실패 시 재료 목록에서 추출
      if (side.ingredients && side.ingredients.length > 0) {
        const firstIngredient = side.ingredients[0].name.split(/\s+/)[0];
        ingredientCount.set(firstIngredient, (ingredientCount.get(firstIngredient) || 0) + 1);
      }
    }
  }

  // 가장 많이 사용된 재료 반환
  let maxCount = 0;
  let commonIngredient: string | null = null;
  for (const [ingredient, count] of ingredientCount.entries()) {
    if (count > maxCount) {
      maxCount = count;
      commonIngredient = ingredient;
    }
  }

  return commonIngredient;
}

/**
 * 구성원별 변형 식단 생성
 */
async function createVariationPlanForMember(
  basePlan: DailyDietPlan,
  memberProfile: UserHealthProfile,
  variationLevel: VariationLevel,
  commonMainIngredient: string | null,
  availableRecipes: Array<{
    id: string;
    title: string;
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  }>
): Promise<DailyDietPlan> {
  console.group(`🔀 변형 식단 생성: ${memberProfile.age}세`);

  // 변형 계획에 따라 식단 생성
  const variationPlan = createVariationPlan(
    await analyzeFamilyNutritionNeeds(memberProfile as any, []),
    variationLevel
  );

  // 기본 식단을 복사하고 변형 적용
  const variationPlanResult: DailyDietPlan = {
    date: basePlan.date,
    breakfast: await applyVariationToMeal(
      basePlan.breakfast,
      "breakfast",
      variationPlan,
      memberProfile,
      availableRecipes
    ),
    lunch: await applyVariationToMeal(
      basePlan.lunch,
      "lunch",
      variationPlan,
      memberProfile,
      availableRecipes
    ),
    dinner: await applyVariationToMeal(
      basePlan.dinner,
      "dinner",
      variationPlan,
      memberProfile,
      availableRecipes
    ),
    snack: basePlan.snack, // 간식은 공유
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
    },
  };

  // 총 영양소 계산
  const meals = [
    variationPlanResult.breakfast,
    variationPlanResult.lunch,
    variationPlanResult.dinner,
    variationPlanResult.snack,
  ].filter(Boolean);

  for (const meal of meals) {
    if (meal && 'totalNutrition' in meal) {
      const mealComp = meal as MealComposition;
      variationPlanResult.totalNutrition.calories += mealComp.totalNutrition.calories;
      variationPlanResult.totalNutrition.protein += mealComp.totalNutrition.protein;
      variationPlanResult.totalNutrition.carbs += mealComp.totalNutrition.carbs;
      variationPlanResult.totalNutrition.fat += mealComp.totalNutrition.fat;
      variationPlanResult.totalNutrition.sodium += (mealComp.totalNutrition.sodium || 0);
    } else if (meal && 'nutrition' in meal) {
      const recipe = meal as RecipeDetailForDiet;
      variationPlanResult.totalNutrition.calories += recipe.nutrition.calories;
      variationPlanResult.totalNutrition.protein += recipe.nutrition.protein;
      variationPlanResult.totalNutrition.carbs += recipe.nutrition.carbs;
      variationPlanResult.totalNutrition.fat += recipe.nutrition.fat;
      variationPlanResult.totalNutrition.sodium += (recipe.nutrition.sodium || 0);
    }
  }

  console.log("✅ 변형 식단 생성 완료");
  console.groupEnd();

  return variationPlanResult;
}

/**
 * 식사에 변형 적용
 */
async function applyVariationToMeal(
  baseMeal: MealComposition | RecipeDetailForDiet | undefined,
  mealType: "breakfast" | "lunch" | "dinner",
  variationPlan: VariationPlan,
  memberProfile: UserHealthProfile,
  availableRecipes: Array<{
    id: string;
    title: string;
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  }>
): Promise<MealComposition | RecipeDetailForDiet | undefined> {
  if (!baseMeal || !('sides' in baseMeal)) {
    return baseMeal;
  }

  const baseComposition = baseMeal as MealComposition;
  const variationComposition: MealComposition = {
    rice: variationPlan.sharedItems.rice ? baseComposition.rice : undefined,
    sides: [],
    soup: variationPlan.sharedItems.soup ? baseComposition.soup : undefined,
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
    },
  };

  // 반찬 변형 적용
  const sidesToVary = variationPlan.variationItems.sides;
  const baseSides = baseComposition.sides || [];

  // 공유할 반찬과 변형할 반찬 결정
  const sharedSidesCount = Math.max(0, baseSides.length - sidesToVary);
  for (let i = 0; i < sharedSidesCount; i++) {
    if (baseSides[i]) {
      variationComposition.sides.push(baseSides[i]);
    }
  }

  // 변형할 반찬 선택 (영양소 보완 고려)
  if (variationPlan.commonMainIngredient && sidesToVary > 0) {
    try {
      // 메인 재료 기반 변형 레시피 탐색
      const { getRecipesWithNutrition } = await import("@/lib/diet/queries");
      const allRecipes = await getRecipesWithNutrition();
      
      // 기준 반찬에서 메인 재료 추출
      const baseSide = baseSides[sharedSidesCount];
      if (baseSide) {
        // 변형 레시피 탐색
        const candidateRecipes = allRecipes
          .filter(r => {
            // 이미 사용된 반찬 제외
            const isUsed = baseSides.some(s => s.id === r.id);
            if (isUsed) return false;
            
            // 메인 재료가 같은 레시피만
            // TODO: 메타데이터에서 main_ingredients 확인
            return true;
          })
          .map(r => ({
            id: r.id,
            title: r.title,
            description: "",
            source: "database",
            ingredients: [],
            instructions: "",
            nutrition: {
              calories: r.calories || 0,
              protein: r.protein || 0,
              carbs: r.carbohydrates || 0,
              fat: r.fat || 0,
              sodium: r.sodium || 0,
            },
          }));

        // 변형 레시피 찾기
        const variations = await findVariationRecipes(
          baseSide,
          candidateRecipes,
          sidesToVary
        );

        // 변형 레시피 추가
        for (const variation of variations.slice(0, sidesToVary)) {
          variationComposition.sides.push(variation.recipe);
        }
      }
    } catch (error) {
      console.warn("⚠️ 변형 레시피 탐색 실패, 기본 반찬 사용:", error);
      // 실패 시 기본 반찬 사용
      for (let i = sharedSidesCount; i < baseSides.length && variationComposition.sides.length < 3; i++) {
        if (baseSides[i]) {
          variationComposition.sides.push(baseSides[i]);
        }
      }
    }
  } else {
    // 변형 없이 기본 반찬 사용
    for (let i = sharedSidesCount; i < baseSides.length && variationComposition.sides.length < 3; i++) {
      if (baseSides[i]) {
        variationComposition.sides.push(baseSides[i]);
      }
    }
  }

  // 총 영양소 계산
  const allDishes = [
    variationComposition.rice,
    ...variationComposition.sides,
    variationComposition.soup,
  ].filter(Boolean) as RecipeDetailForDiet[];

  variationComposition.totalNutrition = allDishes.reduce(
    (total, dish) => ({
      calories: total.calories + dish.nutrition.calories,
      protein: total.protein + dish.nutrition.protein,
      carbs: total.carbs + dish.nutrition.carbs,
      fat: total.fat + dish.nutrition.fat,
      sodium: (total.sodium || 0) + (dish.nutrition.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 }
  );

  return variationComposition;
}

