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
  potassium?: number | null; // 칼륨
  phosphorus?: number | null; // 인
  gi?: number | null; // GI 지수
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
 * DB 레시피와 식약처 API 레시피를 병합하여 반환합니다.
 */
export async function getRecipesWithNutrition(): Promise<
  (RecipeListItem & {
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
    potassium?: number | null;
    phosphorus?: number | null;
    gi?: number | null;
  })[]
> {
  console.group("[DietQueries] 레시피 목록 조회 (병합)");
  
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
        foodsafety_rcp_seq,
        rating_stats:recipe_rating_stats(rating_count, average_rating)
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("데이터베이스 조회 실패:", error);
      console.groupEnd();
      // 데이터베이스 오류 시 식약처 API만 사용
      return await getMfdsRecipesOnly();
    }

    const dbRecipes = (data as any)?.map((item: any) => ({
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
      foodsafety_rcp_seq: item.foodsafety_rcp_seq,
    })) || [];

    console.log(`데이터베이스에서 ${dbRecipes.length}개 레시피 조회됨`);

    // 식약처 API 레시피 가져오기 (병합)
    try {
      const { fetchMfdsRecipesQuick } = await import("./mfds-recipe-fetcher");
      const { mergeRecipes } = await import("./recipe-merger");

      console.log("식약처 API 레시피 조회 중...");
      const mfdsRecipes = await fetchMfdsRecipesQuick(500); // 최대 500개만 가져오기 (성능 고려)
      console.log(`식약처 API에서 ${mfdsRecipes.length}개 레시피 조회됨`);

      // 병합
      const mergedRecipes = mergeRecipes(dbRecipes, mfdsRecipes);
      console.log(`✅ 병합 완료: 총 ${mergedRecipes.length}개 레시피`);
      console.groupEnd();
      return mergedRecipes;
    } catch (mfdsError) {
      console.warn("식약처 API 조회 실패, DB 레시피만 사용:", mfdsError);
      console.groupEnd();
      // 식약처 API 실패 시 DB 레시피만 반환
      return dbRecipes;
    }
  } catch (error) {
    console.error("getRecipesWithNutrition error", error);
    console.groupEnd();
    // 전체 실패 시 식약처 API만 시도
    return await getMfdsRecipesOnly();
  }
}

/**
 * 식약처 API 레시피만 가져옵니다 (폴백용).
 */
async function getMfdsRecipesOnly(): Promise<
  (RecipeListItem & {
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
    potassium?: number | null;
    phosphorus?: number | null;
    gi?: number | null;
  })[]
> {
  try {
    const { fetchMfdsRecipesQuick } = await import("./mfds-recipe-fetcher");
    const mfdsRecipes = await fetchMfdsRecipesQuick(200);

    return mfdsRecipes.map((recipe) => ({
      id: `foodsafety-${recipe.RCP_SEQ}`,
      slug: `foodsafety-${recipe.RCP_SEQ}`,
      title: recipe.RCP_NM,
      thumbnail_url: recipe.ATT_FILE_NO_MAIN || null,
      difficulty: 2,
      cooking_time_minutes: 30,
      rating_count: 0,
      average_rating: 0,
      user: { name: "식약처" },
      calories: recipe.nutrition.calories || null,
      carbohydrates: recipe.nutrition.carbohydrate || null,
      protein: recipe.nutrition.protein || null,
      fat: recipe.nutrition.fat || null,
      sodium: recipe.nutrition.sodium || null,
      potassium: recipe.nutrition.potassium || null,
      phosphorus: recipe.nutrition.phosphorus || null,
      gi: recipe.nutrition.gi || null,
      created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("식약처 API 조회도 실패:", error);
    return [];
  }
}

/**
 * 개인 맞춤 식단 생성 (API용)
 */
export async function generatePersonalDietForAPI(
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
  }>,
  usedByCategory?: {
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string,
  includeFavorites?: boolean // 찜한 식단 포함 여부
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
    // generatePersonalDiet 호출 (주간 컨텍스트 전달)
    const personalDiet = await generatePersonalDiet(
      userId,
      healthProfile,
      date,
      availableRecipes,
      usedByCategory,
      preferredRiceType,
      undefined, // premiumFeatures
      includeFavorites // 찜한 식단 포함 여부
    );

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
            carbohydrates: mainRecipe.nutrition?.carbs || null,
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
          carbohydrates: meal.nutrition.carbs || null,
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
        carbohydrates: nutrition.carbs || 0,
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
  date: string,
  includeFavorites?: boolean // 찜한 식단 포함 여부
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
        availableRecipes,
        undefined, // usedByCategory
        undefined, // preferredRiceType
        includeFavorites // 찜한 식단 포함 여부
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

    // recommendations 검증: 모든 식사에 title이 있는지 확인
    const mealsToCheck = [
      { type: "breakfast", meal: recommendations.breakfast },
      { type: "lunch", meal: recommendations.lunch },
      { type: "dinner", meal: recommendations.dinner },
      { type: "snack", meal: recommendations.snack },
    ];

    const invalidMeals = mealsToCheck.filter(({ type, meal }) => meal && (!meal.title || meal.title.trim() === ""));
    if (invalidMeals.length > 0) {
      console.error("❌ 일부 식사에 title이 없습니다:", invalidMeals.map(m => m.type));
      console.error("❌ 상세:", invalidMeals);
      // title이 없는 식사는 건너뛰고 계속 진행
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

        // recipe_id 처리 (UUID가 아니어도 저장 가능하도록 수정)
        const recipeId = recipe.id;
        const isFallbackRecipe = !recipeId || !recipeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (isFallbackRecipe) {
          console.log(`    ℹ️ ${mealType}는 폴백 레시피입니다. recipe_title로 저장합니다.`);
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

        // 레시피 정보 추출 (RecipeDetailForDiet 또는 MealComposition)
        // recipe_title은 필수 필드이므로 항상 값이 있어야 함
        let recipeTitle = recipe.title || recipe.id || `레시피-${mealType}`;
        
        // 빈 문자열이거나 공백만 있으면 기본값 사용
        if (!recipeTitle || recipeTitle.trim() === "") {
          console.warn(`⚠️ ${mealType}의 recipe_title이 비어있습니다. 기본값 사용: 레시피-${mealType}`);
          recipeTitle = `레시피-${mealType}`;
        }
        
        // 최종 검증: 여전히 비어있으면 저장하지 않음
        if (!recipeTitle || recipeTitle.trim() === "") {
          console.error(`❌ ${mealType}의 recipe_title을 생성할 수 없습니다. 건너뜀`);
          return null;
        }
        
        const recipeDescription = (recipe as any).description || (recipe as any).summary || "";
        const ingredients = (recipe as any).ingredients || [];
        const instructions = (recipe as any).instructions || (recipe as any).steps?.join("\n") || "";

        return {
          user_id: userId,
          plan_date: date,
          meal_type: mealType,
          recipe_id: isFallbackRecipe ? null : recipeId, // 폴백 레시피는 null로 저장
          recipe_title: recipeTitle, // 필수 필드 (NOT NULL)
          recipe_description: recipeDescription || null,
          ingredients: ingredients.length > 0 ? ingredients : null,
          instructions: instructions || null,
          calories: recipe.calories || 0,
          carbs_g: recipe.carbohydrates || 0,
          protein_g: recipe.protein || 0,
          fat_g: recipe.fat || 0,
          sodium_mg: recipe.sodium || 0,
          potassium_mg: recipe.potassium ?? null,
          phosphorus_mg: recipe.phosphorus ?? null,
          gi_index: recipe.gi ?? null,
          composition_summary: compositionSummary ? JSON.stringify(compositionSummary) : null,
          is_unified: false,
        };
      })
      .filter(Boolean);

    console.log("💾 데이터베이스 저장 준비:", plansToInsert.length, "개 식단");
    let saveSuccess = false;
    
    if (plansToInsert.length > 0) {
      console.log("💾 식단 저장 중...");
      console.log("💾 저장할 데이터 샘플:", JSON.stringify(plansToInsert[0], null, 2));
      
      try {
        const { error: insertError } = await supabase
          .from("diet_plans")
          .upsert(plansToInsert, {
            onConflict: "user_id,plan_date,meal_type",
          });

        console.log("💾 저장 결과:", insertError ? "실패" : "성공");
        if (insertError) {
          console.error("❌ 저장 오류:", insertError);
          console.error("❌ 저장 오류 상세:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          });
          console.error("❌ 저장하려던 데이터:", JSON.stringify(plansToInsert, null, 2));
          // 저장 실패해도 recommendations가 있으면 계속 진행
          console.warn("⚠️ 저장 실패했지만 recommendations가 있으면 dailyPlan을 반환합니다");
        } else {
          saveSuccess = true;
          console.log("✅ 식단 저장 완료:", plansToInsert.length, "개");
        }
      } catch (saveError) {
        console.error("❌ 저장 중 예외 발생:", saveError);
        // 저장 실패해도 recommendations가 있으면 계속 진행
        console.warn("⚠️ 저장 중 예외가 발생했지만 recommendations가 있으면 dailyPlan을 반환합니다");
      }
    } else {
      console.warn("⚠️ 저장할 식단이 없습니다 (모든 식사가 비어있거나 recipe_title이 없음)");
      console.warn("⚠️ recommendations:", {
        breakfast: recommendations.breakfast?.title || null,
        lunch: recommendations.lunch?.title || null,
        dinner: recommendations.dinner?.title || null,
        snack: recommendations.snack?.title || null,
      });
    }

    // 저장된 식단 조회 또는 recommendations 직접 사용
    let dailyPlan: DailyDietPlan;
    
    if (saveSuccess && plansToInsert.length > 0) {
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
        // 조회 실패해도 recommendations가 있으면 계속 진행
        console.warn("⚠️ 조회 실패했지만 recommendations를 사용하여 dailyPlan을 생성합니다");
        saveSuccess = false; // recommendations 사용하도록 플래그 변경
      } else if (savedPlans && savedPlans.length > 0) {
        // DailyDietPlan 형식으로 변환
        dailyPlan = {
          date,
          breakfast: null,
          lunch: null,
          dinner: null,
          snack: null,
          totalNutrition: recommendations.totalNutrition,
        };

        savedPlans.forEach((plan) => {
          const mealType = plan.meal_type as MealType;
          if (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner" || mealType === "snack") {
            // recipe_id가 없는 경우 (폴백 레시피) recipe 객체 생성
            const recipeData = plan.recipe || (plan.recipe_title ? {
              id: plan.recipe_id || `fallback-${plan.recipe_title}`,
              title: plan.recipe_title,
              thumbnail_url: null,
              slug: plan.recipe_title.toLowerCase().replace(/\s+/g, '-'),
            } : null);

            dailyPlan[mealType] = {
              ...plan,
              recipe: recipeData as any,
            } as DietPlan;
          }
        });
        
        // 저장된 식단이 있으면 반환
        const hasAnySavedMeal = dailyPlan.breakfast || dailyPlan.lunch || dailyPlan.dinner || dailyPlan.snack;
        if (hasAnySavedMeal) {
          console.log("✅ 저장된 식단으로 dailyPlan 생성 완료");
          console.log("✅ 식단 생성 완료:", {
            breakfast: dailyPlan.breakfast?.recipe?.title,
            lunch: dailyPlan.lunch?.recipe?.title,
            dinner: dailyPlan.dinner?.recipe?.title,
            snack: dailyPlan.snack?.recipe?.title,
          });
          console.groupEnd();
          return dailyPlan;
        } else {
          console.warn("⚠️ 저장된 식단이 비어있습니다. recommendations를 사용합니다");
          saveSuccess = false; // recommendations 사용하도록 플래그 변경
        }
      } else {
        console.warn("⚠️ 저장된 식단이 없습니다. recommendations를 사용합니다");
        saveSuccess = false; // recommendations 사용하도록 플래그 변경
      }
    }
    
    // 저장 실패했거나 저장할 식단이 없는 경우 recommendations 사용
    if (!saveSuccess || plansToInsert.length === 0) {
      // 저장할 식단이 없지만 recommendations가 있으면 사용
      console.log("📚 저장할 식단이 없지만 recommendations를 사용하여 dailyPlan 생성");
      
      // recommendations에 최소한 하나의 식사가 있는지 확인
      const hasAnyRecommendation = recommendations.breakfast || recommendations.lunch || recommendations.dinner || recommendations.snack;
      if (!hasAnyRecommendation) {
        console.error("❌ recommendations도 비어있습니다. 식단을 생성할 수 없습니다.");
        console.error("❌ recommendations 상태:", {
          breakfast: recommendations.breakfast,
          lunch: recommendations.lunch,
          dinner: recommendations.dinner,
          snack: recommendations.snack,
          totalNutrition: recommendations.totalNutrition,
        });
        console.groupEnd();
        return null;
      }
      
      console.log("✅ recommendations 사용하여 dailyPlan 생성:", {
        breakfast: recommendations.breakfast?.title || null,
        lunch: recommendations.lunch?.title || null,
        dinner: recommendations.dinner?.title || null,
        snack: recommendations.snack?.title || null,
      });
      
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
      totalNutrition.carbohydrates += plan.carbs_g || plan.carbohydrates || 0;
      totalNutrition.protein += plan.protein_g || plan.protein || 0;
      totalNutrition.fat += plan.fat_g || plan.fat || 0;
      totalNutrition.sodium += plan.sodium_mg || plan.sodium || 0;
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
        }

        // recipe_id가 없는 경우 (폴백 레시피) recipe 객체 생성
        const recipeData = plan.recipe || (plan.recipe_title ? {
          id: plan.recipe_id || `fallback-${plan.recipe_title}`,
          title: plan.recipe_title,
          thumbnail_url: null,
          slug: plan.recipe_title.toLowerCase().replace(/\s+/g, '-'),
        } : null);

        if (!recipeData) {
          console.warn(`⚠️ ${mealType}에 레시피 정보가 없습니다`);
          return;
        }

        dailyPlan[mealType] = {
          ...plan,
          compositionSummary,
          recipe: recipeData as any,
        } as DietPlan;
      }
    });

    return dailyPlan;
  } catch (error) {
    console.error("getDailyDietPlan error", error);
    return null;
  }
}

