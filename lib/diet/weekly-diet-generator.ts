/**
 * @file lib/diet/weekly-diet-generator.ts
 * @description 주간 식단 생성기 (7일치 식단 한 번에 생성)
 * 
 * 핵심 로직:
 * 1. 월요일~일요일 7일치 식단 생성
 * 2. 주간 내 레시피 중복 최소화
 * 3. 주간 영양 밸런스 조정
 * 4. 장보기 리스트 통합 생성
 */

import type {
  WeeklyDiet,
  WeeklyDietGenerationOptions,
  ShoppingListItem,
  WeeklyNutritionStats,
  IngredientInfo,
  IngredientCategory,
  WeeklyDailyPlan,
} from "@/types/weekly-diet";
import type { MealComposition, RecipeDetailForDiet, FamilyDietPlan } from "@/types/recipe";
import type {
  DailyDietPlan as StoredDailyDietPlan,
  DietPlan,
} from "@/types/health";
import type { FamilyMember, UserHealthProfile } from "@/types/family";
import { generateAndSaveDietPlan } from "@/lib/diet/queries";
import { generateFamilyDiet } from "./family-diet-generator";
import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";

/**
 * 주간 식단 생성 (메인 함수)
 */
export async function generateWeeklyDiet(
  options: WeeklyDietGenerationOptions
): Promise<WeeklyDiet> {
  console.group("📅 주간 식단 생성");
  console.log("시작 날짜:", options.weekStartDate);
  console.log("사용자 ID:", options.userId);

  const startTime = Date.now();

  // 1. 주차 정보 계산
  const weekInfo = getWeekInfo(options.weekStartDate);
  console.log(`${weekInfo.year}년 ${weekInfo.weekNumber}주차`);

  // 2. 7일치 날짜 배열 생성
  const dates = generateWeekDates(options.weekStartDate);
  console.log("날짜:", dates);

  // 3. 주간 식단 생성 (7일치를 한 번에 고려하여 레시피 중복 최소화)
  const dailyPlans: { [date: string]: WeeklyDailyPlan } = {};
  let dailyPlansPersisted = false;
  const usedRecipeIds = new Set<string>();
  const usedRecipeTitles = new Set<string>(); // 레시피 제목으로도 추적 (ID가 없는 경우 대비)
  const weeklyRecipeFrequency = new Map<string, number>(); // 주간 내 레시피 사용 빈도
  
  // 카테고리별 사용 추적 (반찬, 국, 간식은 주간 내 2번 이상 겹치지 않게)
  // 기존 식단의 반찬/국/찌개를 제외 목록에 추가 (재생성 시)
  const usedByCategory = {
    rice: options.existingUsedByCategory?.rice 
      ? new Set<string>(options.existingUsedByCategory.rice)  // Set 복사
      : new Set<string>(),      // 밥 종류 추적 (다양화용)
    side: options.existingUsedByCategory?.side 
      ? new Set<string>(options.existingUsedByCategory.side)  // Set 복사
      : new Set<string>(),      // 반찬 추적
    soup: options.existingUsedByCategory?.soup 
      ? new Set<string>(options.existingUsedByCategory.soup)  // Set 복사
      : new Set<string>(),      // 국/찌개 추적
    snack: options.existingUsedByCategory?.snack 
      ? new Set<string>(options.existingUsedByCategory.snack)  // Set 복사
      : new Set<string>(),     // 간식 추적
  };
  
  if (options.existingUsedByCategory) {
    console.log("📋 기존 식단 제외 목록 적용:", {
      rice: Array.from(usedByCategory.rice),
      side: Array.from(usedByCategory.side),
      soup: Array.from(usedByCategory.soup),
      snack: Array.from(usedByCategory.snack),
    });
  }
  
  // 밥 종류 다양화를 위한 인덱스 (흰쌀밥, 현미밥, 잡곡밥 순환)
  let riceTypeIndex = 0;
  const riceTypes = ["흰쌀밥", "현미밥", "잡곡밥"];

  // 주간 식단 생성 전략: 다양성 수준에 따라 중복 허용 범위 설정
  const maxRepeatsPerWeek = options.diversityLevel === "high" ? 1 : options.diversityLevel === "medium" ? 2 : 3;

  for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
    const date = dates[dayIndex];
    console.log(`\n📆 ${date} 식단 생성 중... (${dayIndex + 1}/7)`);

    let dailyPlan: WeeklyDailyPlan | null = null;

    if (options.familyMembers && options.familyMembers.length > 0) {
      // 가족 식단 생성 (주간 중복 방지 로직 포함)
      const familyPlan = await generateFamilyDietWithWeeklyContext(
        options.userId,
        options.profile,
        options.familyMembers,
        date,
        usedRecipeTitles,
        weeklyRecipeFrequency,
        maxRepeatsPerWeek,
        dayIndex === 0, // 첫 날은 최근 사용 레시피 회피
        usedByCategory, // 카테고리별 제외 목록
        riceTypes[riceTypeIndex % riceTypes.length] // 밥 종류 다양화
      );
      dailyPlan = familyPlan.unifiedPlan || familyPlan.individualPlans["user"] || null;
      dailyPlansPersisted = false;
    } else {
      // 개인 식단 생성 (주간 중복 방지 로직 포함)
      const storedPlan = await generateAndSaveDietPlanWithWeeklyContext(
        options.userId,
        date,
        usedRecipeTitles,
        weeklyRecipeFrequency,
        maxRepeatsPerWeek,
        options.avoidRecentRecipes && dayIndex === 0, // 첫 날만 최근 사용 레시피 회피
        usedByCategory, // 카테고리별 제외 목록
        riceTypes[riceTypeIndex % riceTypes.length] // 밥 종류 다양화
      );

      if (!storedPlan) {
        console.warn("⚠️ 개인 식단 생성 실패 - 빈 데이터로 대체:", date);
      } else {
        dailyPlan = storedPlan;
        dailyPlansPersisted = true;
      }
    }

    // 사용된 레시피 추적 (중복 방지용)
    if (dailyPlan) {
      trackUsedRecipes(dailyPlan, usedRecipeIds, usedRecipeTitles, weeklyRecipeFrequency, usedByCategory);
      dailyPlans[date] = dailyPlan;
      // 밥 종류 인덱스 증가 (다음 날 다른 밥 종류 사용)
      riceTypeIndex++;
    }
  }

  console.log(`\n📊 주간 레시피 다양성 통계:`);
  console.log(`- 총 사용 레시피: ${usedRecipeIds.size}개`);
  console.log(`- 중복 없이 사용된 레시피: ${Array.from(weeklyRecipeFrequency.values()).filter(count => count === 1).length}개`);
  console.log(`- 2회 이상 사용된 레시피: ${Array.from(weeklyRecipeFrequency.values()).filter(count => count > 1).length}개`);
  console.log(`\n📊 카테고리별 사용 통계:`);
  console.log(`- 밥 종류: ${usedByCategory.rice.size}개 (${Array.from(usedByCategory.rice).join(', ')})`);
  console.log(`- 반찬: ${usedByCategory.side.size}개`);
  console.log(`- 국/찌개: ${usedByCategory.soup.size}개`);
  console.log(`- 간식: ${usedByCategory.snack.size}개`);

  // 4. 장보기 리스트 생성
  console.log("\n🛒 장보기 리스트 생성 중...");
  const shoppingList = await generateShoppingList(dailyPlans);
  console.log(`재료 ${shoppingList.length}개 집계 완료`);

  // 5. 주간 영양 통계 생성
  console.log("\n📊 주간 영양 통계 생성 중...");
  const nutritionStats = generateNutritionStats(dailyPlans, dates);

  const duration = Date.now() - startTime;
  console.log(`\n⏱️ 생성 완료: ${duration}ms`);
  console.groupEnd();

  return {
    metadata: {
      id: "", // DB 저장 시 생성
      user_id: options.userId,
      week_start_date: options.weekStartDate,
      week_year: weekInfo.year,
      week_number: weekInfo.weekNumber,
      is_family: !!options.familyMembers && options.familyMembers.length > 0,
      total_recipes_count: usedRecipeIds.size,
      generation_duration_ms: duration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dailyPlans,
    dailyPlansPersisted,
    shoppingList,
    nutritionStats,
  };
}

/**
 * ISO 8601 주차 정보 계산
 */
function getWeekInfo(dateString: string): { year: number; weekNumber: number } {
  const date = new Date(dateString);
  
  // ISO 8601 주차 계산
  const dayOfWeek = date.getDay() || 7; // 일요일=7로 변환
  const nearestThursday = new Date(date);
  nearestThursday.setDate(date.getDate() + 4 - dayOfWeek);
  
  const year = nearestThursday.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const weekNumber = Math.ceil(
    ((nearestThursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  return { year, weekNumber };
}

/**
 * 주간 날짜 배열 생성 (월~일)
 */
function generateWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * 사용된 레시피 추적 (주간 중복 방지용)
 * 카테고리별로도 추적하여 반찬/국/간식이 2번 이상 겹치지 않도록 함
 */
function trackUsedRecipes(
  dailyPlan: WeeklyDailyPlan,
  usedRecipeIds: Set<string>,
  usedRecipeTitles: Set<string>,
  weeklyRecipeFrequency: Map<string, number>,
  usedByCategory: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  }
): void {
  const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

  if (isStoredDailyPlan(dailyPlan)) {
    for (const mealType of meals) {
      const meal = dailyPlan[mealType] as DietPlan | null;
      const recipeId = meal?.recipe_id;
      const recipeTitle = meal?.recipe?.title;
      
      if (recipeId) {
        usedRecipeIds.add(recipeId);
      }
      
      if (recipeTitle) {
        usedRecipeTitles.add(recipeTitle);
        const currentCount = weeklyRecipeFrequency.get(recipeTitle) || 0;
        weeklyRecipeFrequency.set(recipeTitle, currentCount + 1);
        
        // 카테고리별 추적 (간식은 snack 카테고리로)
        if (mealType === "snack") {
          usedByCategory.snack.add(recipeTitle);
        }
        // 밥/반찬/국은 compositionSummary에서 추출해야 하므로 여기서는 처리하지 않음
      }
    }
    return;
  }

  for (const mealType of meals) {
    const meal = dailyPlan[mealType];
    
    // 간식은 별도 처리
    if (mealType === "snack") {
      const snackRecipe = meal as RecipeDetailForDiet | undefined;
      if (snackRecipe?.title) {
        usedRecipeIds.add(snackRecipe.id || snackRecipe.title);
        usedRecipeTitles.add(snackRecipe.title);
        const currentCount = weeklyRecipeFrequency.get(snackRecipe.title) || 0;
        weeklyRecipeFrequency.set(snackRecipe.title, currentCount + 1);
        usedByCategory.snack.add(snackRecipe.title);
      }
      continue;
    }
    
    // 아침/점심/저녁은 MealComposition 구조
    const mealComposition = meal as MealComposition | undefined;
    if (!mealComposition || !isMealComposition(mealComposition)) {
      continue;
    }
    
    // 밥 추적
    if (mealComposition.rice?.title) {
      const riceTitle = mealComposition.rice.title;
      usedRecipeIds.add(mealComposition.rice.id || riceTitle);
      usedRecipeTitles.add(riceTitle);
      const currentCount = weeklyRecipeFrequency.get(riceTitle) || 0;
      weeklyRecipeFrequency.set(riceTitle, currentCount + 1);
      usedByCategory.rice.add(riceTitle);
    }
    
    // 반찬 추적
    if (mealComposition.sides?.length) {
      for (const side of mealComposition.sides) {
        if (side?.title) {
          usedRecipeIds.add(side.id || side.title);
          usedRecipeTitles.add(side.title);
          const currentCount = weeklyRecipeFrequency.get(side.title) || 0;
          weeklyRecipeFrequency.set(side.title, currentCount + 1);
          usedByCategory.side.add(side.title);
        }
      }
    }
    
    // 국/찌개 추적
    if (mealComposition.soup?.title) {
      const soupTitle = mealComposition.soup.title;
      usedRecipeIds.add(mealComposition.soup.id || soupTitle);
      usedRecipeTitles.add(soupTitle);
      const currentCount = weeklyRecipeFrequency.get(soupTitle) || 0;
      weeklyRecipeFrequency.set(soupTitle, currentCount + 1);
      usedByCategory.soup.add(soupTitle);
    }
  }
}

/**
 * 가족 식단 생성 (주간 컨텍스트 포함)
 */
async function generateFamilyDietWithWeeklyContext(
  userId: string,
  userProfile: UserHealthProfile,
  familyMembers: FamilyMember[],
  targetDate: string,
  usedRecipeTitles: Set<string>,
  weeklyRecipeFrequency: Map<string, number>,
  maxRepeatsPerWeek: number,
  avoidRecentRecipes: boolean,
  usedByCategory: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string
): Promise<FamilyDietPlan> {
  // 주간 컨텍스트를 고려한 가족 식단 생성
  // 카테고리별 제외 목록과 밥 종류를 전달
  const { generateFamilyDietWithWeeklyContext: generateFamilyDietWithContext } = await import("./family-diet-generator");
  return generateFamilyDietWithContext(
    userId,
    userProfile,
    familyMembers,
    targetDate,
    usedByCategory,
    preferredRiceType
  );
}

/**
 * 개인 식단 생성 (주간 컨텍스트 포함)
 */
async function generateAndSaveDietPlanWithWeeklyContext(
  userId: string,
  date: string,
  usedRecipeTitles: Set<string>,
  weeklyRecipeFrequency: Map<string, number>,
  maxRepeatsPerWeek: number,
  avoidRecentRecipes: boolean,
  usedByCategory: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string
): Promise<StoredDailyDietPlan | null> {
  // 주간 컨텍스트를 고려하여 식단 생성
  // 카테고리별 제외 목록과 밥 종류를 전달
  const { generatePersonalDietWithWeeklyContext } = await import("./personal-diet-generator");
  return generatePersonalDietWithWeeklyContext(
    userId,
    date,
    usedByCategory,
    preferredRiceType
  );
}

/**
 * 장보기 리스트 생성 (재료 통합)
 */
async function generateShoppingList(dailyPlans: {
  [date: string]: WeeklyDailyPlan;
}): Promise<ShoppingListItem[]> {
  const ingredientMap = new Map<
    string,
    {
      quantity: number;
      unit: string;
      category: IngredientCategory;
      recipes: Set<string>;
    }
  >();

  // 모든 식단의 재료 수집
  for (const dailyPlan of Object.values(dailyPlans)) {
    const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

    if (isStoredDailyPlan(dailyPlan)) {
      for (const mealType of meals) {
        const plan = dailyPlan[mealType] as DietPlan | null;
        if (!plan?.recipe_id) continue;

        await aggregateIngredients({
          recipeId: plan.recipe_id,
          ingredientMap,
        });
      }
      continue;
    }

    for (const mealType of meals) {
      const meal = dailyPlan[mealType];
      const recipes = extractRecipesFromMeal(meal);

      for (const recipe of recipes) {
        if (!recipe?.id) continue;

        await aggregateIngredients({
          recipeId: recipe.id,
          ingredientMap,
        });
      }
    }
  }

  // Map을 배열로 변환
  const shoppingList: ShoppingListItem[] = [];
  for (const [key, data] of ingredientMap.entries()) {
    const name = key.split("|")[0];
    
    shoppingList.push({
      ingredient_name: name,
      total_quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      recipes_using: Array.from(data.recipes),
      is_purchased: false,
    });
  }

  // 카테고리별로 정렬
  shoppingList.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.ingredient_name.localeCompare(b.ingredient_name);
  });

  return shoppingList;
}

function isStoredDailyPlan(
  plan: WeeklyDailyPlan
): plan is StoredDailyDietPlan {
  if (!plan) return false;
  const meal = plan.breakfast ?? plan.lunch ?? plan.dinner ?? plan.snack;
  return Boolean(meal && typeof meal === "object" && "meal_type" in meal);
}

function extractRecipesFromMeal(
  meal: MealComposition | RecipeDetailForDiet | undefined
): RecipeDetailForDiet[] {
  if (!meal) {
    return [];
  }

  if (isMealComposition(meal)) {
    const recipes: RecipeDetailForDiet[] = [];

    if (meal.rice) {
      recipes.push(meal.rice);
    }

    if (meal.sides?.length) {
      recipes.push(...meal.sides);
    }

    if (meal.soup) {
      recipes.push(meal.soup);
    }

    return recipes;
  }

  return [meal];
}

function isMealComposition(
  meal: MealComposition | RecipeDetailForDiet | undefined
): meal is MealComposition {
  return Boolean(
    meal &&
      typeof meal === "object" &&
      "totalNutrition" in meal &&
      "sides" in meal
  );
}

async function aggregateIngredients({
  recipeId,
  ingredientMap,
}: {
  recipeId: string;
  ingredientMap: Map<
    string,
    {
      quantity: number;
      unit: string;
      category: IngredientCategory;
      recipes: Set<string>;
    }
  >;
}) {
  const ingredients = await fetchRecipeIngredients(recipeId);

  for (const ingredient of ingredients) {
    const key = `${ingredient.name}|${ingredient.unit}`;

    const existing = ingredientMap.get(key);

    if (existing) {
      existing.quantity += ingredient.quantity;
      existing.recipes.add(ingredient.recipe_id);
    } else {
      ingredientMap.set(key, {
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        recipes: new Set([ingredient.recipe_id]),
      });
    }
  }
}

/**
 * 레시피 재료 가져오기 (DB에서 조회)
 */
async function fetchRecipeIngredients(recipeId: string): Promise<IngredientInfo[]> {
  try {
    const supabase = createPublicSupabaseServerClient();

    const { data: ingredients, error } = await supabase
      .from("recipe_ingredients")
      .select("ingredient_name, quantity, unit, category")
      .eq("recipe_id", recipeId)
      .order("display_order", { ascending: true });

    if (error || !ingredients) {
      console.warn(`⚠️ 레시피 ${recipeId} 재료 조회 실패:`, error);
      return [];
    }

    return ingredients.map((ing: any) => ({
      name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category as IngredientCategory,
      recipe_id: recipeId,
      recipe_title: "", // 여기서는 필요 없음
    }));
  } catch (error) {
    console.error("❌ 재료 조회 오류:", error);
    return [];
  }
}

/**
 * 주간 영양 통계 생성
 * 모든 날짜(일요일 포함)에 대해 통계를 생성하며, 식단이 없는 날짜는 0으로 처리
 */
function generateNutritionStats(
  dailyPlans: { [date: string]: WeeklyDailyPlan },
  dates: string[]
): WeeklyNutritionStats[] {
  const stats: WeeklyNutritionStats[] = [];

  dates.forEach((date, index) => {
    const dailyPlan = dailyPlans[date];
    const dayOfWeek = index + 1; // 1=월요일, 7=일요일
    const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalSodium = 0;
    let mealCount = 0;

    // 식단이 있는 경우에만 계산
    if (dailyPlan) {
      if (isStoredDailyPlan(dailyPlan)) {
        for (const mealType of meals) {
          const meal = dailyPlan[mealType] as DietPlan | null;
          if (!meal) continue;
          
          // 칼로리 계산: null이나 undefined가 아닌 경우에만 합산
          const calories = typeof meal.calories === 'number' ? meal.calories : Number(meal.calories) || 0;
          const carbs = typeof meal.carbohydrates === 'number' ? meal.carbohydrates : Number(meal.carbohydrates) || 0;
          const protein = typeof meal.protein === 'number' ? meal.protein : Number(meal.protein) || 0;
          const fat = typeof meal.fat === 'number' ? meal.fat : Number(meal.fat) || 0;
          const sodium = typeof meal.sodium === 'number' ? meal.sodium : Number(meal.sodium) || 0;
          
          totalCalories += calories;
          totalCarbs += carbs;
          totalProtein += protein;
          totalFat += fat;
          totalSodium += sodium;
          mealCount++;
        }
      } else {
        for (const mealType of meals) {
          const meal = dailyPlan[mealType] as MealComposition | RecipeDetailForDiet | undefined;
          if (!meal) continue;
          
          // nutrition 객체가 있는 경우
          const nutrition = (meal as any)?.nutrition;
          if (!nutrition) continue;
          
          const calories = typeof nutrition.calories === 'number' ? nutrition.calories : Number(nutrition.calories) || 0;
          const carbs = typeof nutrition.carbohydrates === 'number' ? nutrition.carbohydrates : Number(nutrition.carbohydrates) || 0;
          const protein = typeof nutrition.protein === 'number' ? nutrition.protein : Number(nutrition.protein) || 0;
          const fat = typeof nutrition.fat === 'number' ? nutrition.fat : Number(nutrition.fat) || 0;
          const sodium = typeof nutrition.sodium === 'number' ? nutrition.sodium : Number(nutrition.sodium) || 0;
          
          totalCalories += calories;
          totalCarbs += carbs;
          totalProtein += protein;
          totalFat += fat;
          totalSodium += sodium;
          mealCount++;
        }
      }
    }

    // 모든 날짜에 대해 통계 생성 (식단이 없어도 0으로 생성)
    stats.push({
      day_of_week: dayOfWeek,
      date,
      total_calories: totalCalories,
      total_carbohydrates: totalCarbs,
      total_protein: totalProtein,
      total_fat: totalFat,
      total_sodium: totalSodium,
      meal_count: mealCount,
    });
  });

  return stats;
}

/**
 * 다음 월요일 날짜 계산
 */
export function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  
  return nextMonday.toISOString().split("T")[0];
}

/**
 * 이번 주 월요일 날짜 계산
 */
export function getThisMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday);
  
  return thisMonday.toISOString().split("T")[0];
}

