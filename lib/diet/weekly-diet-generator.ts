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
import type {
  MealComposition,
  RecipeDetailForDiet,
  FamilyDietPlan,
} from "@/types/recipe";
import type {
  DailyDietPlan as StoredDailyDietPlan,
  DietPlan,
} from "@/types/health";
import type { FamilyMember } from "@/types/family";
import type { UserHealthProfile } from "@/types/health";
import { getRecipesWithNutrition } from "@/lib/diet/queries";
import { generateFamilyDiet } from "./family-diet-generator";
import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";
import { generatePersonalDiet } from "@/lib/diet/personal-diet-generator";

/**
 * 주간 식단 생성 (메인 함수)
 */
export async function generateWeeklyDiet(
  options: WeeklyDietGenerationOptions,
): Promise<WeeklyDiet> {
  console.group("📅 주간 식단 생성");
  console.log("시작 날짜:", options.weekStartDate);
  console.log("사용자 ID:", options.userId);

  const startTime = Date.now();

  // ✅ 성능 + 품질:
  // - 주간 식단은 하루 식단을 7번 생성하므로, 레시피 후보는 주간 1회만 로딩해서 공유합니다.
  // - 간식은 끼니(아침/점심/저녁)과 별개지만, 사용자 요구사항상 "제철 과일 간식"이 중요하므로
  //   주간 식단에서도 snack을 함께 생성/저장합니다. (중복은 주간 컨텍스트로 방지)
  const weeklyAvailableRecipes = await getRecipesWithNutrition(50);
  console.log("📚 주간 레시피 후보 로드:", weeklyAvailableRecipes.length);

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
      ? new Set<string>(options.existingUsedByCategory.rice) // Set 복사
      : new Set<string>(), // 밥 종류 추적 (다양화용)
    side: options.existingUsedByCategory?.side
      ? new Set<string>(options.existingUsedByCategory.side) // Set 복사
      : new Set<string>(), // 반찬 추적
    soup: options.existingUsedByCategory?.soup
      ? new Set<string>(options.existingUsedByCategory.soup) // Set 복사
      : new Set<string>(), // 국/찌개 추적
    snack: options.existingUsedByCategory?.snack
      ? new Set<string>(options.existingUsedByCategory.snack) // Set 복사
      : new Set<string>(), // 간식 추적
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
  const maxRepeatsPerWeek =
    options.diversityLevel === "high"
      ? 1
      : options.diversityLevel === "medium"
        ? 2
        : 3;

  for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
    const date = dates[dayIndex];
    const dayOfWeek = ["월", "화", "수", "목", "금", "토", "일"][dayIndex];
    console.log(`\n📆 ${date} (${dayOfWeek}요일) 식단 생성 중... (${dayIndex + 1}/7)`);

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
        riceTypes[riceTypeIndex % riceTypes.length], // 밥 종류 다양화
      );
      dailyPlan =
        familyPlan.unifiedPlan || familyPlan.individualPlans["user"] || null;
      dailyPlansPersisted = false;
    } else {
      // ✅ 개인 주간 식단 생성(중요):
      // - 기존에는 generateAndSaveDietPlan → generatePersonalDietForAPI 경로로 가며
      //   "밥+국/찌개+반찬3종" 구조(MealComposition)가 대표 레시피 1개로 축약되어
      //   아침/점심/저녁이 쉽게 겹치거나, 반찬 3종이 깨지는 문제가 있었습니다.
      // - 주간 식단은 generatePersonalDiet(원본 로직)를 직접 호출하여 구조를 보존합니다.
      // - 저녁이 생성되지 않는 경우가 있으므로, 조건을 완화하며 최대 3회 재시도합니다.

      const preferredRice = riceTypes[riceTypeIndex % riceTypes.length];
      const attempts = [
        { usedByCategory }, // 1) 정상(주간 제외 목록 적용)
        {
          // 2) 반찬/국 제외를 완화(저녁 누락 방지)
          usedByCategory: {
            rice: usedByCategory.rice,
            side: new Set<string>(),
            soup: new Set<string>(),
            snack: new Set<string>(),
          },
        },
        {
          // 3) 전부 완화(무조건 생성 우선)
          usedByCategory: {
            rice: new Set<string>(),
            side: new Set<string>(),
            soup: new Set<string>(),
            snack: new Set<string>(),
          },
        },
      ] as const;

      let lastResult: any = null;
      let lastError: any = null;
      
      for (let i = 0; i < attempts.length; i++) {
        console.log(`🧪 개인 식단 생성 시도 ${i + 1}/${attempts.length}`, {
          date,
          preferredRice,
        });

        try {
          const result = await generatePersonalDiet(
            options.userId,
            options.profile,
            date,
            weeklyAvailableRecipes,
            attempts[i].usedByCategory,
            preferredRice,
            undefined, // premiumFeatures
            false, // includeFavorites
          );

          lastResult = result; // 마지막 결과 저장 (실패 시에도 사용)
          lastError = null; // 성공 시 에러 초기화

          const breakfast = result.breakfast ?? null;
          const lunch = result.lunch ?? null;
          const dinner = result.dinner ?? null;

          // ✅ 검증 조건 대폭 완화: 하나의 식사라도 있으면 무조건 사용
          const hasAnyMeal = breakfast || lunch || dinner;
          
          // 완전한 식사인지 확인 (선택적)
          const isValidMeal = (meal: MealComposition | null) => {
            if (!meal) return false;
            const riceOk = Boolean(meal.rice?.title);
            const soupOk = Boolean(meal.soup?.title);
            const sidesOk = Array.isArray(meal.sides) && meal.sides.length >= 1;
            return riceOk && soupOk && sidesOk;
          };

          const hasAtLeastOneValidMeal =
            isValidMeal(breakfast as any) ||
            isValidMeal(lunch as any) ||
            isValidMeal(dinner as any);

          // ✅ 조건 완화: 하나의 식사라도 있으면 무조건 사용
          if (hasAnyMeal) {
            console.log(`✅ ${date} 식단 생성 성공 (시도 ${i + 1})`, {
              breakfast: breakfast ? "있음" : "없음",
              lunch: lunch ? "있음" : "없음",
              dinner: dinner ? "있음" : "없음",
              완전한식사: hasAtLeastOneValidMeal ? "있음" : "없음",
            });
            dailyPlan = {
              date,
              breakfast: breakfast as any,
              lunch: lunch as any,
              dinner: dinner as any,
              snack: result.snack ?? null,
              totalNutrition: result.totalNutrition,
            } as any;
            dailyPlansPersisted = false;
            break;
          } else {
            console.warn(`⚠️ ${date} 구성 규칙 미충족(재시도 ${i + 1}):`, {
              breakfast: breakfast ? "있음" : "없음",
              lunch: lunch ? "있음" : "없음",
              dinner: dinner ? "있음" : "없음",
            });
            // 마지막 시도가 아니면 계속 시도
            if (i < attempts.length - 1) {
              continue;
            }
          }
        } catch (error) {
          console.error(`❌ ${date} 식단 생성 시도 ${i + 1} 실패:`, error);
          lastError = error;
          // 마지막 시도가 아니면 계속 시도
          if (i < attempts.length - 1) {
            continue;
          }
        }
      }

      // ✅ 모든 시도가 실패했지만 마지막 결과가 있으면 무조건 사용 (부분 식단이라도)
      if (!dailyPlan && lastResult) {
        console.warn(`⚠️ ${date} 완전한 식단 생성 실패, 부분 식단 사용`);
        const breakfast = lastResult.breakfast ?? null;
        const lunch = lastResult.lunch ?? null;
        const dinner = lastResult.dinner ?? null;
        
        // 하나라도 있으면 사용
        if (breakfast || lunch || dinner) {
          dailyPlan = {
            date,
            breakfast: breakfast as any,
            lunch: lunch as any,
            dinner: dinner as any,
            snack: lastResult.snack ?? null,
            totalNutrition: lastResult.totalNutrition,
          } as any;
          dailyPlansPersisted = false;
        }
      }

      // ✅ 모든 시도가 실패했고 결과도 없으면 빈 식단이라도 생성 (날짜 누락 방지)
      if (!dailyPlan) {
        console.error(`❌ ${date} 개인 식단 생성 실패(모든 재시도 실패)`);
        console.error("에러:", lastError);
        console.warn(`⚠️ ${date} 빈 식단으로 생성 (날짜 누락 방지)`);
        
        // 빈 식단이라도 생성하여 날짜 누락 방지
        dailyPlan = {
          date,
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
        } as any;
        dailyPlansPersisted = false;
      }
    }

    // 사용된 레시피 추적 (중복 방지용)
    if (dailyPlan) {
      trackUsedRecipes(
        dailyPlan,
        usedRecipeIds,
        usedRecipeTitles,
        weeklyRecipeFrequency,
        usedByCategory,
      );
      dailyPlans[date] = dailyPlan;
      // 밥 종류 인덱스 증가 (다음 날 다른 밥 종류 사용)
      riceTypeIndex++;
    }
  }

  // ✅ 생성된 날짜 확인
  const generatedDates = Object.keys(dailyPlans);
  const missingDates = dates.filter((date) => !generatedDates.includes(date));
  console.log(`\n📅 주간 식단 생성 결과:`);
  console.log(`- 요청된 날짜: ${dates.length}일 (${dates.join(", ")})`);
  console.log(`- 생성된 날짜: ${generatedDates.length}일 (${generatedDates.join(", ")})`);
  if (missingDates.length > 0) {
    console.error(`- ❌ 누락된 날짜: ${missingDates.length}일 (${missingDates.join(", ")})`);
  } else {
    console.log(`- ✅ 모든 날짜 생성 완료`);
  }

  console.log(`\n📊 주간 레시피 다양성 통계:`);
  console.log(`- 총 사용 레시피: ${usedRecipeIds.size}개`);
  console.log(
    `- 중복 없이 사용된 레시피: ${Array.from(weeklyRecipeFrequency.values()).filter((count) => count === 1).length}개`,
  );
  console.log(
    `- 2회 이상 사용된 레시피: ${Array.from(weeklyRecipeFrequency.values()).filter((count) => count > 1).length}개`,
  );
  console.log(`\n📊 카테고리별 사용 통계:`);
  console.log(
    `- 밥 종류: ${usedByCategory.rice.size}개 (${Array.from(usedByCategory.rice).join(", ")})`,
  );
  console.log(`- 반찬: ${usedByCategory.side.size}개`);
  console.log(`- 국/찌개: ${usedByCategory.soup.size}개`);
  console.log(`- 간식(주간 끼니 제외): ${usedByCategory.snack.size}개`);

  // 4. 장보기 리스트 생성
  console.log("\n🛒 장보기 리스트 생성 중...");
  const shoppingList = await generateShoppingList(dailyPlans);
  console.log(`재료 ${shoppingList.length}개 집계 완료`);

  // 5. 주간 영양 통계 생성
  console.log("\n📊 주간 영양 통계 생성 중...");
  console.log("📊 dailyPlans 키:", Object.keys(dailyPlans));
  console.log("📊 dates:", dates);
  const nutritionStats = generateNutritionStats(dailyPlans, dates);
  console.log("📊 생성된 영양 통계:", nutritionStats.length, "일");
  if (nutritionStats.length > 0) {
    const totalCalories = nutritionStats.reduce(
      (sum, stat) => sum + (stat.total_calories || 0),
      0,
    );
    console.log("📊 총 칼로리:", totalCalories, "kcal");
    console.log(
      "📊 일별 칼로리 상세:",
      nutritionStats.map((stat) => ({
        날짜: stat.date,
        요일: stat.day_of_week,
        칼로리: stat.total_calories,
        식사수: stat.meal_count,
      })),
    );
  }

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
export function getWeekInfo(dateString: string): {
  year: number;
  weekNumber: number;
} {
  const date = new Date(dateString);

  // ISO 8601 주차 계산
  const dayOfWeek = date.getDay() || 7; // 일요일=7로 변환
  const nearestThursday = new Date(date);
  nearestThursday.setDate(date.getDate() + 4 - dayOfWeek);

  const year = nearestThursday.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const weekNumber = Math.ceil(
    ((nearestThursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return { year, weekNumber };
}

/**
 * 주간 날짜 배열 생성 (월~일)
 */
export function generateWeekDates(startDate: string): string[] {
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
  },
): void {
  // ✅ 요구사항: 간식(제철 과일)도 주간에서 중복을 피하도록 추적합니다.
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

    // 아침/점심/저녁은 MealComposition 구조
    if (mealType === "snack") {
      const snack = meal as RecipeDetailForDiet | null | undefined;
      if (snack?.title) {
        usedRecipeIds.add(snack.id || snack.title);
        usedRecipeTitles.add(snack.title);
        const currentCount = weeklyRecipeFrequency.get(snack.title) || 0;
        weeklyRecipeFrequency.set(snack.title, currentCount + 1);
        usedByCategory.snack.add(snack.title);
      }
      continue;
    }

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
  preferredRiceType?: string,
): Promise<FamilyDietPlan> {
  // 주간 컨텍스트를 고려한 가족 식단 생성
  // 카테고리별 제외 목록과 밥 종류를 전달
  console.log("📋 가족 식단 생성 (주간 컨텍스트)");
  console.log("카테고리별 제외 목록:", {
    rice: Array.from(usedByCategory.rice),
    side: Array.from(usedByCategory.side),
    soup: Array.from(usedByCategory.soup),
    snack: Array.from(usedByCategory.snack),
  });
  console.log("선호 밥 종류:", preferredRiceType);

  const { generateFamilyDietWithWeeklyContext: generateFamilyDietWithContext } =
    await import("./family-diet-generator");
  try {
    return await generateFamilyDietWithContext(
      userId,
      userProfile,
      familyMembers,
      targetDate,
      usedByCategory,
      preferredRiceType,
    );
  } catch (error) {
    console.error("❌ 가족 식단 생성 실패:", error);
    throw error;
  }
}

// generateAndSaveDietPlanWithWeeklyContext 함수는 제거됨
// 이제 generateAndSaveDietPlan을 직접 사용하여 건강 맞춤 식단과 동일한 로직 적용

/**
 * 장보기 리스트 생성 (재료 통합)
 */
async function generateShoppingList(dailyPlans: {
  [date: string]: WeeklyDailyPlan;
}): Promise<ShoppingListItem[]> {
  // ✅ 성능 개선:
  // 기존 로직은 recipeId마다 DB를 1번씩 조회해서 (최대 7일×4끼니×구성요소) 매우 느려질 수 있습니다.
  // 여기서는 1) 주간에 사용된 recipe_id를 모두 수집한 뒤,
  // 2) recipe_ingredients를 .in(...)으로 한 번에 조회하여
  // 3) 메모리에서 집계합니다.

  const ingredientMap = new Map<
    string,
    {
      quantity: number;
      unit: string;
      category: IngredientCategory;
      recipes: Set<string>;
    }
  >();

  const recipeIds = new Set<string>();
  const meals = ["breakfast", "lunch", "dinner"] as const;

  for (const dailyPlan of Object.values(dailyPlans)) {
    if (isStoredDailyPlan(dailyPlan)) {
      for (const mealType of meals) {
        const plan = dailyPlan[mealType] as DietPlan | null;
        if (plan?.recipe_id) {
          recipeIds.add(plan.recipe_id);
        }
      }
      continue;
    }

    for (const mealType of meals) {
      const meal = dailyPlan[mealType];
      const recipes = extractRecipesFromMeal(meal);
      for (const recipe of recipes) {
        if (recipe?.id) {
          recipeIds.add(recipe.id);
        }
      }
    }
  }

  if (recipeIds.size === 0) {
    return [];
  }

  const recipeIdList = Array.from(recipeIds);
  console.log(`🛒 재료 조회 대상 레시피: ${recipeIdList.length}개 (batch)`);

  const ingredients = await fetchIngredientsForRecipes(recipeIdList);
  for (const ing of ingredients) {
    const key = `${ing.name}|${ing.unit}`;
    const existing = ingredientMap.get(key);
    if (existing) {
      existing.quantity += ing.quantity;
      existing.recipes.add(ing.recipe_id);
    } else {
      ingredientMap.set(key, {
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
        recipes: new Set([ing.recipe_id]),
      });
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

function isStoredDailyPlan(plan: WeeklyDailyPlan): plan is StoredDailyDietPlan {
  if (!plan) return false;
  const meal = plan.breakfast ?? plan.lunch ?? plan.dinner ?? plan.snack;
  return Boolean(meal && typeof meal === "object" && "meal_type" in meal);
}

function extractRecipesFromMeal(
  meal: MealComposition | RecipeDetailForDiet | undefined,
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
  meal: MealComposition | RecipeDetailForDiet | undefined,
): meal is MealComposition {
  return Boolean(
    meal &&
    typeof meal === "object" &&
    "totalNutrition" in meal &&
    "sides" in meal,
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
  // NOTE: 성능 개선으로 인해 generateShoppingList에서 batch 집계를 사용합니다.
  // 이 함수는 기존 구현 호환을 위해 남겨두되, 더 이상 사용하지 않습니다.
  void recipeId;
  void ingredientMap;
}

/**
 * 레시피 재료 가져오기 (DB에서 조회)
 */
async function fetchRecipeIngredients(
  recipeId: string,
): Promise<IngredientInfo[]> {
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

async function fetchIngredientsForRecipes(
  recipeIds: string[],
): Promise<IngredientInfo[]> {
  try {
    const supabase = createPublicSupabaseServerClient();

    // Supabase IN 필터가 너무 길어지는 것을 막기 위해 청크 단위로 조회
    const chunkSize = 100;
    const all: IngredientInfo[] = [];

    for (let i = 0; i < recipeIds.length; i += chunkSize) {
      const chunk = recipeIds.slice(i, i + chunkSize);
      const { data: rows, error } = await supabase
        .from("recipe_ingredients")
        .select("recipe_id, ingredient_name, quantity, unit, category")
        .in("recipe_id", chunk);

      if (error || !rows) {
        console.warn("⚠️ 레시피 재료 batch 조회 실패:", error);
        continue;
      }

      all.push(
        ...(rows as any[]).map((ing) => ({
          name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category as IngredientCategory,
          recipe_id: ing.recipe_id,
          recipe_title: "",
        })),
      );
    }

    return all;
  } catch (error) {
    console.error("❌ 재료 batch 조회 오류:", error);
    return [];
  }
}

/**
 * 주간 영양 통계 생성
 * 모든 날짜(일요일 포함)에 대해 통계를 생성하며, 식단이 없는 날짜는 0으로 처리
 */
function generateNutritionStats(
  dailyPlans: { [date: string]: WeeklyDailyPlan },
  dates: string[],
): WeeklyNutritionStats[] {
  const stats: WeeklyNutritionStats[] = [];

  dates.forEach((date, index) => {
    const dailyPlan = dailyPlans[date];
    const dayOfWeek = index + 1; // 1=월요일, 7=일요일
    // ✅ 요구사항: 주간 통계에도 간식을 포함합니다.
    const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalSodium = 0;
    let mealCount = 0;

    // 식단이 있는 경우에만 계산
    if (dailyPlan) {
      const isStored = isStoredDailyPlan(dailyPlan);
      console.log(
        `📊 ${date} 식단 타입: ${isStored ? "StoredDailyPlan" : "MealComposition/RecipeDetailForDiet"}`,
      );

      if (isStored) {
        for (const mealType of meals) {
          const meal = dailyPlan[mealType] as DietPlan | null;
          if (!meal) continue;

          // 칼로리 계산: null이나 undefined가 아닌 경우에만 합산
          const calories =
            typeof meal.calories === "number"
              ? meal.calories
              : Number(meal.calories) || 0;
          const carbs =
            typeof meal.carbohydrates === "number"
              ? meal.carbohydrates
              : Number(meal.carbohydrates) || 0;
          const protein =
            typeof meal.protein === "number"
              ? meal.protein
              : Number(meal.protein) || 0;
          const fat =
            typeof meal.fat === "number" ? meal.fat : Number(meal.fat) || 0;
          const sodium =
            typeof meal.sodium === "number"
              ? meal.sodium
              : Number(meal.sodium) || 0;

          console.log(
            `  ${mealType}: ${calories}kcal (칼로리: ${meal.calories}, 탄수화물: ${meal.carbohydrates}, 단백질: ${meal.protein})`,
          );

          totalCalories += calories;
          totalCarbs += carbs;
          totalProtein += protein;
          totalFat += fat;
          totalSodium += sodium;
          mealCount++;
        }
      } else {
        // MealComposition 또는 RecipeDetailForDiet 타입인 경우
        for (const mealType of meals) {
          const meal = dailyPlan[mealType] as
            | MealComposition
            | RecipeDetailForDiet
            | DietPlan
            | undefined;
          if (!meal) continue;

          // DietPlan 타입인 경우 (직접 필드 접근)
          if ("calories" in meal && "meal_type" in meal) {
            const dietPlan = meal as DietPlan;
            const calories =
              typeof dietPlan.calories === "number"
                ? dietPlan.calories
                : Number(dietPlan.calories) || 0;
            const carbs =
              typeof dietPlan.carbohydrates === "number"
                ? dietPlan.carbohydrates
                : Number(dietPlan.carbohydrates) || 0;
            const protein =
              typeof dietPlan.protein === "number"
                ? dietPlan.protein
                : Number(dietPlan.protein) || 0;
            const fat =
              typeof dietPlan.fat === "number"
                ? dietPlan.fat
                : Number(dietPlan.fat) || 0;
            const sodium =
              typeof dietPlan.sodium === "number"
                ? dietPlan.sodium
                : Number(dietPlan.sodium) || 0;

            console.log(`  ${mealType} (DietPlan): ${calories}kcal`);

            totalCalories += calories;
            totalCarbs += carbs;
            totalProtein += protein;
            totalFat += fat;
            totalSodium += sodium;
            mealCount++;
            continue;
          }

          // MealComposition 타입인 경우 (totalNutrition 사용)
          if ("totalNutrition" in meal && meal.totalNutrition) {
            const nutrition = meal.totalNutrition;
            const calories =
              typeof nutrition.calories === "number"
                ? nutrition.calories
                : Number(nutrition.calories) || 0;
            const carbs =
              typeof nutrition.carbs === "number"
                ? nutrition.carbs
                : Number(nutrition.carbs) || 0;
            const protein =
              typeof nutrition.protein === "number"
                ? nutrition.protein
                : Number(nutrition.protein) || 0;
            const fat =
              typeof nutrition.fat === "number"
                ? nutrition.fat
                : Number(nutrition.fat) || 0;
            const sodium =
              typeof nutrition.sodium === "number"
                ? nutrition.sodium
                : Number(nutrition.sodium) || 0;

            totalCalories += calories;
            totalCarbs += carbs;
            totalProtein += protein;
            totalFat += fat;
            totalSodium += sodium;
            mealCount++;
            continue;
          }

          // RecipeDetailForDiet 타입인 경우 (nutrition 객체 사용)
          const nutrition = (meal as any)?.nutrition;
          if (nutrition) {
            const calories =
              typeof nutrition.calories === "number"
                ? nutrition.calories
                : Number(nutrition.calories) || 0;
            const carbs =
              typeof nutrition.carbs === "number"
                ? nutrition.carbs
                : Number(nutrition.carbs) || 0;
            const protein =
              typeof nutrition.protein === "number"
                ? nutrition.protein
                : Number(nutrition.protein) || 0;
            const fat =
              typeof nutrition.fat === "number"
                ? nutrition.fat
                : Number(nutrition.fat) || 0;
            const sodium =
              typeof nutrition.sodium === "number"
                ? nutrition.sodium
                : Number(nutrition.sodium) || 0;

            totalCalories += calories;
            totalCarbs += carbs;
            totalProtein += protein;
            totalFat += fat;
            totalSodium += sodium;
            mealCount++;
          }
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
