/**
 * @file queries.ts
 * @description 식단 추천 관련 Supabase 쿼리 함수들.
 *
 * 주요 기능:
 * 1. 건강 정보 조회
 * 2. 식단 추천 생성 및 저장
 * 3. 프리미엄 구독 확인
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";
import {
  UserHealthProfile,
  DietPlan,
  DailyDietPlan,
  UserSubscription,
  MealType,
  NutritionInfo,
} from "@/types/health";
import { RecipeListItem } from "@/types/recipe";
import { recommendDailyDiet } from "./recommendation";
import { generatePersonalDiet } from "./personal-diet-generator";

// RecipeWithNutrition 타입 재정의 (recommendation.ts에서 사용)
interface RecipeWithNutrition extends RecipeListItem {
  description?: string;
  total_reviews?: number;
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
}

/**
 * 사용자 건강 정보 조회
 */
export async function getUserHealthProfile(
  userId: string
): Promise<UserHealthProfile | null> {
  // 성능 최적화: 프로덕션에서는 로그 최소화
  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed("[DietQueries] 건강 정보 조회");
    console.log("userId", userId);
  }

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 데이터 없음
        if (process.env.NODE_ENV === "development") {
          console.log("no health profile found");
          console.groupEnd();
        }
        return null;
      }
      throw error;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("health profile found", data.id);
      console.groupEnd();
    }
    return data as UserHealthProfile;
  } catch (error) {
    console.error("getUserHealthProfile error", error);
    if (process.env.NODE_ENV === "development") {
      console.groupEnd();
    }
    return null;
  }
}

/**
 * 프리미엄 구독 확인
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as UserSubscription | null;
  } catch (error) {
    console.error("getUserSubscription error", error);
    return null;
  }
}

/**
 * 레시피 목록 조회 (영양소 정보 포함)
 */
export async function getRecipesWithNutrition(): Promise<
  (RecipeListItem & {
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  })[]
> {
  try {
    // 레시피는 공개 데이터이므로 서비스 롤 클라이언트 사용
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        id,
        slug,
        title,
        thumbnail_url,
        difficulty,
        cooking_time_minutes,
        calories,
        carbohydrates,
        protein,
        fat,
        sodium,
        created_at,
        rating_stats:recipe_rating_stats(rating_count, average_rating)
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("데이터베이스 조회 실패, 폴백 시스템 사용:", error);
      // 데이터베이스 오류 시 빈 배열 반환 (폴백 시스템이 처리)
      return [];
    }

    const recipes = (data as any)?.map((item: any) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      thumbnail_url: item.thumbnail_url,
      difficulty: item.difficulty,
      cooking_time_minutes: item.cooking_time_minutes,
      rating_count: (item.rating_stats as any)?.[0]?.rating_count || 0,
      average_rating:
        parseFloat((item.rating_stats as any)?.[0]?.average_rating || "0") || 0,
      user: { name: "익명" }, // 필요시 조인
      calories: item.calories,
      carbohydrates: item.carbohydrates,
      protein: item.protein,
      fat: item.fat,
      sodium: item.sodium,
      created_at: item.created_at,
    })) || [];

    console.log(`데이터베이스에서 ${recipes.length}개 레시피 조회됨`);

    // 데이터베이스에 레시피가 없으면 빈 배열 반환 (폴백 시스템이 처리)
    if (recipes.length === 0) {
      console.log("데이터베이스에 레시피가 없어 폴백 시스템으로 전환");
    }

    return recipes;
  } catch (error) {
    console.error("getRecipesWithNutrition error", error);
    return [];
  }
}

/**
 * 개인 맞춤 식단 생성 (API용)
 */
async function generatePersonalDietForAPI(
  userId: string,
  healthProfile: UserHealthProfile,
  date: string,
  availableRecipes: Array<{
    id: string;
    title: string;
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  }>
): Promise<{
  breakfast: RecipeWithNutrition | null;
  lunch: RecipeWithNutrition | null;
  dinner: RecipeWithNutrition | null;
  snack: RecipeWithNutrition | null;
  totalNutrition: NutritionInfo;
  breakfastCompositionSummary?: string[];
  lunchCompositionSummary?: string[];
  dinnerCompositionSummary?: string[];
  snackCompositionSummary?: string[];
}> {
  console.log("🔄 개인 맞춤 식단 생성 시작...");

  try {
    // generatePersonalDiet 호출
    const personalDiet = await generatePersonalDiet(userId, healthProfile, date, availableRecipes);

    // 결과를 API 형식으로 변환
    const convertMealToRecipe = (meal: any): RecipeWithNutrition | null => {
      if (!meal) return null;

      // MealComposition인 경우 (밥+반찬+국 구조) - 대표 레시피 선택
      if (meal.rice || meal.sides || meal.soup) {
        const composition = meal as any;

        // 밥이 있으면 밥을 대표로, 없으면 첫 번째 반찬, 없으면 국
        let mainRecipe = composition.rice;
        if (!mainRecipe && composition.sides && composition.sides.length > 0) {
          mainRecipe = composition.sides[0];
        }
        if (!mainRecipe && composition.soup) {
          mainRecipe = composition.soup;
        }

        if (mainRecipe) {
          return {
            id: mainRecipe.id || `meal-${Date.now()}`,
            slug: mainRecipe.slug || "",
            title: `${mainRecipe.title}${composition.sides && composition.sides.length > 0 ? ` 외 ${composition.sides.length}가지 반찬` : ''}`,
            thumbnail_url: mainRecipe.thumbnail_url || "",
            difficulty: mainRecipe.difficulty || 2,
            cooking_time_minutes: mainRecipe.cooking_time_minutes || 20,
            rating_count: mainRecipe.rating_count || 0,
            average_rating: mainRecipe.average_rating || 0,
            created_at: new Date().toISOString(),
            user: { name: "시스템" },
            description: mainRecipe.description || "",
            total_reviews: mainRecipe.total_reviews || 0,
            calories: mainRecipe.nutrition?.calories || null,
            carbohydrates: mainRecipe.nutrition?.carbohydrates || mainRecipe.nutrition?.carbs || null,
            protein: mainRecipe.nutrition?.protein || null,
            fat: mainRecipe.nutrition?.fat || null,
            sodium: mainRecipe.nutrition?.sodium || null,
          };
        }
      }

      // RecipeDetailForDiet인 경우 (간식 등)
      if (meal.title && meal.nutrition) {
        return {
          id: meal.id || `snack-${Date.now()}`,
          slug: meal.slug || "",
          title: meal.title,
          thumbnail_url: meal.thumbnail_url || "",
          difficulty: meal.difficulty || 1,
          cooking_time_minutes: meal.cooking_time_minutes || 10,
          rating_count: meal.rating_count || 0,
          average_rating: meal.average_rating || 0,
          created_at: new Date().toISOString(),
          user: { name: "시스템" },
          description: meal.description || "",
          total_reviews: meal.total_reviews || 0,
          calories: meal.nutrition.calories || null,
          carbohydrates: meal.nutrition.carbohydrates || meal.nutrition.carbs || null,
          protein: meal.nutrition.protein || null,
          fat: meal.nutrition.fat || null,
          sodium: meal.nutrition.sodium || null,
        };
      }

      return null;
    };

    // totalNutrition 변환 (carbs -> carbohydrates)
    const convertTotalNutrition = (nutrition: any): NutritionInfo => {
      return {
        calories: nutrition.calories || 0,
        carbohydrates: nutrition.carbs || nutrition.carbohydrates || 0,
        protein: nutrition.protein || 0,
        fat: nutrition.fat || 0,
        sodium: nutrition.sodium || 0,
      };
    };

    // compositionSummary 추출 헬퍼 함수
    const extractCompositionSummary = (meal: any): string[] | undefined => {
      if (!meal) return undefined;
      // MealComposition인 경우 compositionSummary 사용
      if (meal.compositionSummary) return meal.compositionSummary;
      // RecipeDetailForDiet인 경우 제목만 사용
      if (meal.title) return [meal.title];
      return undefined;
    };

    const result = {
      breakfast: convertMealToRecipe(personalDiet.breakfast),
      lunch: convertMealToRecipe(personalDiet.lunch),
      dinner: convertMealToRecipe(personalDiet.dinner),
      snack: convertMealToRecipe(personalDiet.snack),
      totalNutrition: convertTotalNutrition(personalDiet.totalNutrition),
      breakfastCompositionSummary: extractCompositionSummary(personalDiet.breakfast),
      lunchCompositionSummary: extractCompositionSummary(personalDiet.lunch),
      dinnerCompositionSummary: extractCompositionSummary(personalDiet.dinner),
      snackCompositionSummary: extractCompositionSummary(personalDiet.snack),
    };

    console.log("✅ 개인 맞춤 식단 생성 완료:", {
      breakfast: result.breakfast?.title,
      lunch: result.lunch?.title,
      dinner: result.dinner?.title,
      snack: result.snack?.title,
    });

    return result;
  } catch (error) {
    console.error("❌ 개인 맞춤 식단 생성 실패:", error);
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
}

/**
 * 일일 식단 추천 생성 및 저장
 */
export async function generateAndSaveDietPlan(
  userId: string,
  date: string
): Promise<DailyDietPlan | null> {
  console.groupCollapsed("[DietQueries] 식단 추천 생성");
  console.log("👤 userId:", userId);
  console.log("📅 date:", date);

  try {
    console.log("🔑 Service Role 클라이언트 생성");
    const supabase = getServiceRoleClient();

    // 건강 정보 조회
    console.log("🏥 건강 정보 조회 중...");
    const healthProfile = await getUserHealthProfile(userId);
    console.log("🏥 건강 정보 조회 결과:", healthProfile);

    if (!healthProfile) {
      console.warn("❌ 건강 정보가 없습니다 - userId:", userId);
      console.groupEnd();
      return null;
    }

    // 건강 정보 검증 및 기본값 설정
    if (!healthProfile.daily_calorie_goal || healthProfile.daily_calorie_goal <= 0) {
      console.warn("⚠️ 일일 칼로리 목표가 설정되지 않았거나 유효하지 않아 기본값(2000kcal)으로 설정합니다");
      healthProfile.daily_calorie_goal = 2000;
    }

    console.log("✅ 건강 정보 검증 통과:", {
      age: healthProfile.age,
      gender: healthProfile.gender,
      height: healthProfile.height_cm,
      weight: healthProfile.weight_kg,
      daily_calorie_goal: healthProfile.daily_calorie_goal,
      diseases: healthProfile.diseases?.length || 0,
      allergies: healthProfile.allergies?.length || 0,
      preferred_ingredients: healthProfile.preferred_ingredients?.length || 0,
      disliked_ingredients: healthProfile.disliked_ingredients?.length || 0,
    });

    // 레시피 목록 조회 (데이터베이스 + 폴백)
    console.log("🍽️ 레시피 목록 조회 중...");
    const recipes = await getRecipesWithNutrition();
    console.log("🍽️ 데이터베이스 레시피 개수:", recipes.length);

    // 데이터베이스 레시피가 없으면 폴백 레시피 사용
    let availableRecipes = recipes;
    if (recipes.length === 0) {
      console.log("📚 데이터베이스 레시피가 없어 폴백 레시피 시스템 사용");
      // 폴백 레시피를 RecipeListItem 형식으로 변환
      const { searchFallbackRecipes } = await import("@/lib/recipes/fallback-recipes");
      const fallbackRecipes = searchFallbackRecipes({ limit: 50 }); // 충분한 개수로 조회

      // 이미지 유틸리티 함수 import
      const { getRecipeImageUrlEnhanced } = await import("@/lib/utils/recipe-image");

      availableRecipes = fallbackRecipes.map(recipe => ({
        id: recipe.title, // 폴백 레시피는 title을 ID로 사용
        slug: recipe.title.toLowerCase().replace(/\s+/g, '-'),
        title: recipe.title,
        thumbnail_url: getRecipeImageUrlEnhanced(recipe.title, null), // 레시피 이름 기반 이미지 생성
        difficulty: 2, // 중간 난이도로 가정
        cooking_time_minutes: 20, // 기본 조리 시간
        rating_count: 0,
        average_rating: 0,
        user: { name: "시스템" },
        calories: recipe.nutrition.calories,
        carbohydrates: recipe.nutrition.carbs,
        protein: recipe.nutrition.protein,
        fat: recipe.nutrition.fat,
        sodium: recipe.nutrition.sodium || 0,
        created_at: new Date().toISOString(),
      }));
      console.log("🍽️ 폴백 레시피 개수:", availableRecipes.length);
    }

    if (availableRecipes.length === 0) {
      console.warn("❌ 사용할 수 있는 레시피가 없습니다");
      console.groupEnd();
      return null;
    }

    // 식단 추천 (개인 맞춤 식단 생성)
    console.log("🤖 AI 식단 추천 생성 중...");
    console.log("📋 사용 가능한 레시피:", availableRecipes.length, "개");
    
    let recommendations;
    try {
      recommendations = await generatePersonalDietForAPI(
        userId,
        healthProfile,
        date,
        availableRecipes
      );
    } catch (error) {
      console.error("❌ 식단 생성 중 오류 발생:", error);
      console.error("❌ 오류 상세:", error instanceof Error ? error.message : String(error));
      console.error("❌ 오류 스택:", error instanceof Error ? error.stack : undefined);
      console.groupEnd();
      return null;
    }

    if (!recommendations) {
      console.error("❌ 식단 추천 결과가 null입니다");
      console.groupEnd();
      return null;
    }

    console.log("🤖 추천 결과:", {
      breakfast: recommendations.breakfast?.title || null,
      lunch: recommendations.lunch?.title || null,
      dinner: recommendations.dinner?.title || null,
      snack: recommendations.snack?.title || null,
      totalNutrition: recommendations.totalNutrition,
    });

    // 최소한 하나의 식사가 있어야 함
    const hasAnyMeal = recommendations.breakfast || recommendations.lunch || recommendations.dinner || recommendations.snack;
    if (!hasAnyMeal) {
      console.error("❌ 생성된 식단에 식사가 하나도 없습니다");
      console.groupEnd();
      return null;
    }

    // 데이터베이스에 저장
    const mealTypes: Array<"breakfast" | "lunch" | "dinner" | "snack"> = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ];

    const plansToInsert = mealTypes
      .map((mealType) => {
        const recipe = recommendations[mealType];
        if (!recipe) {
          console.log(`  - ${mealType}: 레시피 없음 (건너뜀)`);
          return null;
        }

        console.log(`  - ${mealType}: ${recipe.title} (ID: ${recipe.id})`);

        // recipe_id가 UUID 형식이 아닌 경우 처리 (폴백 레시피)
        const recipeId = recipe.id;
        if (!recipeId || !recipeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.warn(`    ⚠️ ${mealType}의 recipe_id가 유효한 UUID가 아닙니다: ${recipeId}`);
          // 폴백 레시피는 데이터베이스에 저장하지 않음 (recipe_id가 없으므로)
          return null;
        }

        // compositionSummary 추출
        const compositionSummary = (() => {
          switch (mealType) {
            case "breakfast":
              return recommendations.breakfastCompositionSummary;
            case "lunch":
              return recommendations.lunchCompositionSummary;
            case "dinner":
              return recommendations.dinnerCompositionSummary;
            case "snack":
              return recommendations.snackCompositionSummary;
            default:
              return undefined;
          }
        })();

        console.log(`    📋 ${mealType} 구성품 요약:`, compositionSummary);

        return {
          user_id: userId,
          plan_date: date,
          meal_type: mealType,
          recipe_id: recipeId,
          calories: recipe.calories || 0,
          carbohydrates: recipe.carbohydrates || 0,
          protein: recipe.protein || 0,
          fat: recipe.fat || 0,
          sodium: recipe.sodium || 0,
          composition_summary: compositionSummary ? JSON.stringify(compositionSummary) : null,
        };
      })
      .filter(Boolean);

    console.log("💾 데이터베이스 저장 준비:", plansToInsert.length, "개 식단");
    if (plansToInsert.length > 0) {
      console.log("💾 식단 저장 중...");
      const { error: insertError } = await supabase
        .from("diet_plans")
        .upsert(plansToInsert, {
          onConflict: "user_id,plan_date,meal_type",
        });

      console.log("💾 저장 결과:", insertError ? "실패" : "성공");
      if (insertError) {
        console.error("❌ 저장 오류:", insertError);
        throw insertError;
      }
    } else {
      console.warn("⚠️ 저장할 식단이 없습니다 (모든 레시피가 폴백 레시피이거나 recipe_id가 유효하지 않음)");
      console.log("ℹ️ 폴백 레시피는 데이터베이스에 저장하지 않고 메모리에서만 사용합니다");
    }

    // 저장된 식단 조회 또는 recommendations 직접 사용
    let dailyPlan: DailyDietPlan;
    
    if (plansToInsert.length > 0) {
      // 데이터베이스에 저장된 경우 조회
      console.log("🔍 저장된 식단 조회 중...");
      const { data: savedPlans, error: fetchError } = await supabase
        .from("diet_plans")
        .select(
          `
          *,
          recipe:recipes(id, title, thumbnail_url, slug)
          `
        )
        .eq("user_id", userId)
        .eq("plan_date", date)
        .order("meal_type", { ascending: true });

      console.log("🔍 조회 결과:", savedPlans?.length || 0, "개 식단");
      if (fetchError) {
        console.error("❌ 조회 오류:", fetchError);
        throw fetchError;
      }

      // DailyDietPlan 형식으로 변환
      dailyPlan = {
        date,
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
        totalNutrition: recommendations.totalNutrition,
      };

      savedPlans?.forEach((plan) => {
        const mealType = plan.meal_type as MealType;
        if (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner" || mealType === "snack") {
          dailyPlan[mealType] = {
            ...plan,
            recipe: plan.recipe as any,
          } as DietPlan;
        }
      });
    } else {
      // 폴백 레시피만 사용한 경우 recommendations를 직접 사용
      console.log("📚 폴백 레시피를 사용하므로 recommendations를 직접 사용합니다");
      dailyPlan = {
        date,
        breakfast: recommendations.breakfast ? {
          id: `temp-${date}-breakfast`,
          user_id: userId,
          plan_date: date,
          meal_type: "breakfast",
          recipe_id: recommendations.breakfast.id,
          calories: recommendations.breakfast.calories,
          carbohydrates: recommendations.breakfast.carbohydrates,
          protein: recommendations.breakfast.protein,
          fat: recommendations.breakfast.fat,
          sodium: recommendations.breakfast.sodium,
          created_at: new Date().toISOString(),
          compositionSummary: recommendations.breakfastCompositionSummary,
          recipe: {
            id: recommendations.breakfast.id,
            title: recommendations.breakfast.title,
            thumbnail_url: recommendations.breakfast.thumbnail_url,
            slug: recommendations.breakfast.slug,
          },
        } as DietPlan : null,
        lunch: recommendations.lunch ? {
          id: `temp-${date}-lunch`,
          user_id: userId,
          plan_date: date,
          meal_type: "lunch",
          recipe_id: recommendations.lunch.id,
          calories: recommendations.lunch.calories,
          carbohydrates: recommendations.lunch.carbohydrates,
          protein: recommendations.lunch.protein,
          fat: recommendations.lunch.fat,
          sodium: recommendations.lunch.sodium,
          created_at: new Date().toISOString(),
          compositionSummary: recommendations.lunchCompositionSummary,
          recipe: {
            id: recommendations.lunch.id,
            title: recommendations.lunch.title,
            thumbnail_url: recommendations.lunch.thumbnail_url,
            slug: recommendations.lunch.slug,
          },
        } as DietPlan : null,
        dinner: recommendations.dinner ? {
          id: `temp-${date}-dinner`,
          user_id: userId,
          plan_date: date,
          meal_type: "dinner",
          recipe_id: recommendations.dinner.id,
          calories: recommendations.dinner.calories,
          carbohydrates: recommendations.dinner.carbohydrates,
          protein: recommendations.dinner.protein,
          fat: recommendations.dinner.fat,
          sodium: recommendations.dinner.sodium,
          created_at: new Date().toISOString(),
          compositionSummary: recommendations.dinnerCompositionSummary,
          recipe: {
            id: recommendations.dinner.id,
            title: recommendations.dinner.title,
            thumbnail_url: recommendations.dinner.thumbnail_url,
            slug: recommendations.dinner.slug,
          },
        } as DietPlan : null,
        snack: recommendations.snack ? {
          id: `temp-${date}-snack`,
          user_id: userId,
          plan_date: date,
          meal_type: "snack",
          recipe_id: recommendations.snack.id,
          calories: recommendations.snack.calories,
          carbohydrates: recommendations.snack.carbohydrates,
          protein: recommendations.snack.protein,
          fat: recommendations.snack.fat,
          sodium: recommendations.snack.sodium,
          created_at: new Date().toISOString(),
          compositionSummary: recommendations.snackCompositionSummary,
          recipe: {
            id: recommendations.snack.id,
            title: recommendations.snack.title,
            thumbnail_url: recommendations.snack.thumbnail_url,
            slug: recommendations.snack.slug,
          },
        } as DietPlan : null,
        totalNutrition: recommendations.totalNutrition,
      };
    }

    console.log("✅ 식단 생성 완료:", {
      breakfast: dailyPlan.breakfast?.recipe?.title,
      lunch: dailyPlan.lunch?.recipe?.title,
      dinner: dailyPlan.dinner?.recipe?.title,
      snack: dailyPlan.snack?.recipe?.title,
    });
    console.groupEnd();
    return dailyPlan;
  } catch (error) {
    console.error("❌ generateAndSaveDietPlan 오류:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * 저장된 일일 식단 조회
 */
export async function getDailyDietPlan(
  userId: string,
  date: string
): Promise<DailyDietPlan | null> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("diet_plans")
      .select(
        `
        *,
        composition_summary,
        recipe:recipes(id, title, thumbnail_url, slug)
        `
      )
      .eq("user_id", userId)
      .eq("plan_date", date)
      .order("meal_type", { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // 영양소 합산
    const totalNutrition = {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      sodium: 0,
    };

    data.forEach((plan) => {
      totalNutrition.calories += plan.calories || 0;
      totalNutrition.carbohydrates += plan.carbohydrates || 0;
      totalNutrition.protein += plan.protein || 0;
      totalNutrition.fat += plan.fat || 0;
      totalNutrition.sodium += plan.sodium || 0;
    });

    const dailyPlan: DailyDietPlan = {
      date,
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
      totalNutrition,
    };

    data.forEach((plan) => {
      const mealType = plan.meal_type as MealType;
      if (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner" || mealType === "snack") {
        // composition_summary 파싱
        let compositionSummary: string[] | undefined;
        if (plan.composition_summary) {
          try {
            compositionSummary = JSON.parse(plan.composition_summary);
            console.log(`📋 ${mealType} 구성품 조회됨:`, compositionSummary);
          } catch (e) {
            console.warn(`❌ Failed to parse composition_summary for ${mealType}:`, e);
          }
        } else {
          console.log(`📋 ${mealType} 구성품 없음 (레거시 데이터)`);
        }

        dailyPlan[mealType] = {
          ...plan,
          compositionSummary,
          recipe: plan.recipe as any,
        } as DietPlan;
      }
    });

    return dailyPlan;
  } catch (error) {
    console.error("getDailyDietPlan error", error);
    return null;
  }
}

