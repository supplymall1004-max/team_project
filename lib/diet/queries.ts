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
import { toInt, toIntOrNull } from "@/lib/diet/nutrition-normalizer";

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
  userId: string,
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
  userId: string,
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
 * DB 레시피와 식약처 정적 파일 레시피를 병합하여 반환합니다.
 */
/**
 * 영양소 정보가 포함된 레시피 목록 조회 (개선됨)
 *
 * 개선 사항:
 * - 기본 limitPerCategory를 50으로 감소 (메모리 효율성 개선)
 * - 식약처 정적 파일에서 필요한 만큼만 가져오기 (최대 150개)
 * - DB 레시피 우선 사용 정책 강화
 * - 정적 파일 우선 사용 (API 호출 제거)
 */
export async function getRecipesWithNutrition(
  limitPerCategory: number = 50,
): Promise<
  (RecipeListItem & {
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
    fiber?: number | null;
    potassium?: number | null;
    phosphorus?: number | null;
    gi?: number | null;
  })[]
> {
  console.group("[DietQueries] 레시피 목록 조회 (최적화됨)");
  console.log(`최대 ${limitPerCategory * 7}개 레시피 로드 (DB 우선)`);

  try {
    // 레시피는 공개 데이터이므로 서비스 롤 클라이언트 사용
    const supabase = getServiceRoleClient();

    // 최적화: 단일 쿼리로 모든 레시피 조회 (카테고리별 여러 쿼리 대신)
    // 인덱스를 활용하여 성능 향상
    const totalLimit = limitPerCategory * 7; // 카테고리당 limit * 카테고리 수
    
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
      `,
      )
      .limit(totalLimit)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("레시피 조회 실패:", error);
      throw error;
    }

    // 데이터 변환
    const dbRecipes = (data as any)?.map((item: any) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      thumbnail_url: item.thumbnail_url,
      difficulty: item.difficulty,
      cooking_time_minutes: item.cooking_time_minutes,
      rating_count: (item.rating_stats as any)?.[0]?.rating_count || 0,
      average_rating:
        parseFloat(
          (item.rating_stats as any)?.[0]?.average_rating || "0",
        ) || 0,
      user: { name: "익명" },
      calories: item.calories,
      carbohydrates: item.carbohydrates,
      protein: item.protein,
      fat: item.fat,
      sodium: item.sodium,
      created_at: item.created_at,
      foodsafety_rcp_seq: item.foodsafety_rcp_seq,
    })) || [];

    console.log(`데이터베이스에서 ${dbRecipes.length}개 레시피 조회됨`);

    // 식약처 정적 파일 레시피는 필요한 경우에만 로드 (DB 레시피 우선 정책)
    const minRequiredRecipes = limitPerCategory * 2; // 최소 요구량
    if (dbRecipes.length >= minRequiredRecipes) {
      console.log(
        `✅ DB 레시피가 충분 (${dbRecipes.length} >= ${minRequiredRecipes}), 식약처 정적 파일 생략`,
      );
      console.groupEnd();
      return dbRecipes;
    }

    // 식약처 레시피 가져오기 (정적 파일만 사용, 캐시 활용)
    try {
      const { loadAllRecipes } = await import("@/lib/mfds/recipe-loader");

      // 필요한 개수만 계산
      const neededRecipes = Math.min(
        minRequiredRecipes - dbRecipes.length,
        150, // 최대 150개로 제한
      );

      console.log(`📥 식약처 레시피 ${neededRecipes}개 조회 중 (정적 파일, 캐시 사용)...`);
      
      // 정적 파일에서 레시피 로드 (캐시에서 빠르게 조회)
      const allStaticRecipes = loadAllRecipes();
      const staticRecipes = allStaticRecipes.slice(0, neededRecipes);
      
      if (staticRecipes.length > 0) {
        console.log(`✅ 정적 파일에서 ${staticRecipes.length}개 레시피 로드 성공 (캐시)`);
        
        // 최적화: Map 기반 병합으로 중복 제거 및 O(1) 조회
        // foodsafety_rcp_seq를 키로 사용하여 DB 레시피와 중복 제거
        const dbRecipeMap = new Map<string, typeof dbRecipes[0]>();
        dbRecipes.forEach(recipe => {
          if (recipe.foodsafety_rcp_seq) {
            dbRecipeMap.set(recipe.foodsafety_rcp_seq, recipe);
          }
        });

        const mfdsRecipes = staticRecipes
          .filter(mfdsRecipe => {
            // DB에 이미 있는 레시피는 제외 (중복 방지)
            const rcpSeq = mfdsRecipe.frontmatter.rcp_seq;
            return !dbRecipeMap.has(rcpSeq);
          })
          .slice(0, neededRecipes)
          .map(convertMfdsRecipeToRecipeListItem);

        // DB 레시피와 병합 (중복 제거됨)
        const allRecipes = [...dbRecipes, ...mfdsRecipes];
        console.log(`✅ 병합 완료: 총 ${allRecipes.length}개 레시피 (DB ${dbRecipes.length}개 + 식약처 ${mfdsRecipes.length}개, 중복 제거됨)`);
        console.groupEnd();
        return allRecipes;
      } else {
        console.warn("⚠️ 정적 파일 레시피 없음, DB 레시피만 사용");
        console.groupEnd();
        return dbRecipes;
      }
    } catch (mfdsError) {
      console.warn("식약처 레시피 조회 실패, DB 레시피만 사용:", mfdsError);
      console.groupEnd();
      return dbRecipes;
    }
  } catch (error) {
    console.error("getRecipesWithNutrition error", error);
    console.groupEnd();
    // 전체 실패 시 정적 파일만 시도
    try {
      const { loadAllRecipes } = await import("@/lib/mfds/recipe-loader");
      const staticRecipes = loadAllRecipes();
      if (staticRecipes.length > 0) {
        console.log(`✅ 정적 파일에서 ${staticRecipes.length}개 레시피 로드 성공 (폴백)`);
        return staticRecipes.map(convertMfdsRecipeToRecipeListItem);
      }
    } catch (fallbackError) {
      console.error("정적 파일 로드도 실패:", fallbackError);
    }
    return [];
  }
}

/**
 * 식약처 레시피만 가져옵니다 (정적 파일만 사용)
 */
async function getMfdsRecipesOnly(): Promise<
  (RecipeListItem & {
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
    fiber?: number | null;
    potassium?: number | null;
    phosphorus?: number | null;
    gi?: number | null;
  })[]
> {
  try {
    // 정적 파일에서 레시피 로드 (모든 레시피)
    const { loadAllRecipes } = await import("@/lib/mfds/recipe-loader");
    const staticRecipes = loadAllRecipes();

    if (staticRecipes.length > 0) {
      console.log(`✅ 정적 파일에서 ${staticRecipes.length}개 레시피 로드 성공`);
      return staticRecipes.map(convertMfdsRecipeToRecipeListItem);
    }

    console.warn("⚠️ 정적 파일 레시피 없음");
    return [];
  } catch (error) {
    console.error("식약처 레시피 조회 실패:", error);
    return [];
  }
}

/**
 * MfdsRecipe를 RecipeListItem 형식으로 변환하는 헬퍼 함수
 */
function convertMfdsRecipeToRecipeListItem(mfdsRecipe: any): RecipeListItem & {
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
  fiber?: number | null;
  potassium?: number | null;
  phosphorus?: number | null;
  gi?: number | null;
} {
  const parseNumber = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    return Number.isFinite(value) ? value : null;
  };

  return {
    id: `foodsafety-${mfdsRecipe.frontmatter.rcp_seq}`,
    slug: `foodsafety-${mfdsRecipe.frontmatter.rcp_seq}`,
    title: mfdsRecipe.title,
    thumbnail_url: mfdsRecipe.images.mainImageUrl || null,
    difficulty: 2, // Default difficulty
    cooking_time_minutes: 30, // Default cooking time
    rating_count: 0,
    average_rating: 0,
    user: { name: "식약처" },
    calories: parseNumber(mfdsRecipe.nutrition.calories),
    carbohydrates: parseNumber(mfdsRecipe.nutrition.carbohydrates),
    protein: parseNumber(mfdsRecipe.nutrition.protein),
    fat: parseNumber(mfdsRecipe.nutrition.fat),
    sodium: parseNumber(mfdsRecipe.nutrition.sodium),
    fiber: parseNumber(mfdsRecipe.nutrition.fiber),
    potassium: null, // Not available in MfdsRecipe type
    phosphorus: null, // Not available in MfdsRecipe type
    gi: null, // Not available in MfdsRecipe type
    created_at: new Date().toISOString(),
  };
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
  includeFavorites?: boolean, // 찜한 식단 포함 여부
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
      includeFavorites, // 찜한 식단 포함 여부
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
            title: `${mainRecipe.title}${composition.sides && composition.sides.length > 0 ? ` 외 ${composition.sides.length}가지 반찬` : ""}`,
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
      breakfastCompositionSummary: extractCompositionSummary(
        personalDiet.breakfast,
      ),
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
  includeFavorites?: boolean, // 찜한 식단 포함 여부
  usedByCategory?: {
    // 주간 컨텍스트: 카테고리별 제외 목록
    rice: Set<string>;
    side: Set<string>;
    soup: Set<string>;
    snack: Set<string>;
  },
  preferredRiceType?: string, // 주간 컨텍스트: 선호 밥 종류
): Promise<DailyDietPlan | null> {
  console.groupCollapsed("[DietQueries] 식단 추천 생성");
  console.log("👤 userId:", userId);
  console.log("📅 date:", date);

  try {
    console.log("🔑 Service Role 클라이언트 생성");
    const supabase = getServiceRoleClient();

    // 건강 정보 조회
    console.log("🏥 건강 정보 조회 중...");
    let healthProfile = await getUserHealthProfile(userId);
    console.log("🏥 건강 정보 조회 결과:", healthProfile);

    // 건강 정보가 없으면 기본 프로필을 생성해 저장/생성을 계속 진행
    if (!healthProfile) {
      console.warn(
        "⚠️ 건강 정보가 없습니다. 기본 건강 프로필을 자동 생성합니다.",
        {
          userId,
        },
      );

      try {
        const { data: createdProfile, error: createError } = await supabase
          .from("user_health_profiles")
          .insert({
            user_id: userId,
            // 필수 JSONB 컬럼은 DB default로 채워짐
            daily_calorie_goal: 2000,
            calorie_calculation_method: "auto",
            show_calculation_formula: false,
          })
          .select("*")
          .single();

        if (createError) {
          console.error("❌ 기본 건강 프로필 생성 실패:", createError);
          throw new Error(createError.message);
        }

        healthProfile = createdProfile as UserHealthProfile;
        console.log("✅ 기본 건강 프로필 생성 완료:", {
          id: healthProfile.id,
          daily_calorie_goal: healthProfile.daily_calorie_goal,
        });
      } catch (e) {
        console.error("❌ 기본 건강 프로필 자동 생성 중 오류:", e);
        console.groupEnd();
        return null;
      }
    }

    // 건강 정보 검증 및 기본값 설정
    if (
      !healthProfile.daily_calorie_goal ||
      healthProfile.daily_calorie_goal <= 0
    ) {
      console.warn(
        "⚠️ 일일 칼로리 목표가 설정되지 않았거나 유효하지 않아 기본값(2000kcal)으로 설정합니다",
      );
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

    // 레시피 목록 조회 (최적화: 카테고리별 제한)
    console.log("🍽️ 레시피 목록 조회 중...");
    const recipes = await getRecipesWithNutrition(50); // 카테고리당 50개로 제한
    console.log("🍽️ 데이터베이스 레시피 개수:", recipes.length);

    // 데이터베이스 레시피가 없으면 폴백 레시피 사용
    let availableRecipes = recipes;
    if (recipes.length === 0) {
      console.log("📚 데이터베이스 레시피가 없어 폴백 레시피 시스템 사용");
      // 폴백 레시피를 RecipeListItem 형식으로 변환
      const { searchFallbackRecipes } =
        await import("@/lib/recipes/fallback-recipes");
      const fallbackRecipes = searchFallbackRecipes({ limit: 50 }); // 충분한 개수로 조회

      // 이미지 유틸리티 함수 import
      const { getRecipeImageUrlEnhanced } =
        await import("@/lib/utils/recipe-image");

      availableRecipes = fallbackRecipes.map((recipe) => ({
        id: recipe.title, // 폴백 레시피는 title을 ID로 사용
        slug: recipe.title.toLowerCase().replace(/\s+/g, "-"),
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
    console.log("🤖 건강 맞춤 식단 추천 생성 중...");
    console.log("📋 사용 가능한 레시피:", availableRecipes.length, "개");

    let recommendations;
    try {
      recommendations = await generatePersonalDietForAPI(
        userId,
        healthProfile,
        date,
        availableRecipes,
        usedByCategory, // 주간 컨텍스트 전달
        preferredRiceType, // 주간 컨텍스트 전달
        includeFavorites, // 찜한 식단 포함 여부
      );
    } catch (error) {
      console.error("❌ 식단 생성 중 오류 발생:", error);
      console.error(
        "❌ 오류 상세:",
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        "❌ 오류 스택:",
        error instanceof Error ? error.stack : undefined,
      );
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
    const hasAnyMeal =
      recommendations.breakfast ||
      recommendations.lunch ||
      recommendations.dinner ||
      recommendations.snack;
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

    const invalidMeals = mealsToCheck.filter(
      ({ type, meal }) => meal && (!meal.title || meal.title.trim() === ""),
    );
    if (invalidMeals.length > 0) {
      console.error(
        "❌ 일부 식사에 title이 없습니다:",
        invalidMeals.map((m) => m.type),
      );
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
        const isFallbackRecipe =
          !recipeId ||
          !recipeId.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          );

        if (isFallbackRecipe) {
          console.log(
            `    ℹ️ ${mealType}는 폴백 레시피입니다. recipe_title로 저장합니다.`,
          );
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
          console.warn(
            `⚠️ ${mealType}의 recipe_title이 비어있습니다. 기본값 사용: 레시피-${mealType}`,
          );
          recipeTitle = `레시피-${mealType}`;
        }

        // 최종 검증: 여전히 비어있으면 저장하지 않음
        if (!recipeTitle || recipeTitle.trim() === "") {
          console.error(
            `❌ ${mealType}의 recipe_title을 생성할 수 없습니다. 건너뜀`,
          );
          return null;
        }

        const recipeDescription =
          (recipe as any).description || (recipe as any).summary || "";
        const ingredients = (recipe as any).ingredients || [];
        const instructions =
          (recipe as any).instructions ||
          (recipe as any).steps?.join("\n") ||
          "";

        // ingredients를 JSONB 형식으로 변환 (배열이면 그대로, 아니면 null)
        const ingredientsJsonb =
          Array.isArray(ingredients) && ingredients.length > 0
            ? ingredients
            : null;

        // instructions를 문자열로 변환 (배열인 경우 join)
        const instructionsText = Array.isArray(instructions)
          ? instructions.join("\n")
          : instructions || null;

        return {
          user_id: userId,
          family_member_id: null, // 개인 식단이므로 항상 null
          plan_date: date,
          meal_type: mealType,
          recipe_id: isFallbackRecipe ? null : recipeId, // 폴백 레시피는 null로 저장
          recipe_title: recipeTitle, // 필수 필드 (NOT NULL)
          recipe_description: recipeDescription || null,
          ingredients: ingredientsJsonb || [], // JSONB 형식으로 저장 (null 대신 빈 배열)
          instructions: instructionsText,
          calories: toInt(recipe.calories, 0),
          carbs_g: recipe.carbohydrates || 0,
          protein_g: recipe.protein || 0,
          fat_g: recipe.fat || 0,
          sodium_mg: toInt(recipe.sodium, 0),
          fiber_g: toIntOrNull((recipe as any).fiber),
          potassium_mg: toIntOrNull(recipe.potassium),
          phosphorus_mg: toIntOrNull(recipe.phosphorus),
          gi_index: recipe.gi ?? null,
          composition_summary: compositionSummary || [], // JSONB 타입이므로 객체/배열을 직접 저장
          is_unified: false,
        };
      })
      .filter(Boolean);

    console.log("💾 데이터베이스 저장 준비:", plansToInsert.length, "개 식단");
    let saveSuccess = false;

    if (plansToInsert.length > 0) {
      console.log("💾 식단 저장 중...");
      console.log(
        "💾 저장할 데이터 샘플:",
        JSON.stringify(plansToInsert[0], null, 2),
      );

      try {
        // 기존 식단 삭제 (개인 식단만 - family_member_id가 null인 것만)
        console.log("🗑️ 기존 개인 식단 삭제 중...");
        const { error: deleteError } = await supabase
          .from("diet_plans")
          .delete()
          .eq("user_id", userId)
          .eq("plan_date", date)
          .is("family_member_id", null)
          .eq("is_unified", false);

        if (deleteError) {
          console.warn(
            "⚠️ 기존 식단 삭제 중 오류 (무시하고 계속 진행):",
            deleteError,
          );
        } else {
          console.log("✅ 기존 개인 식단 삭제 완료");
        }

        // 새 식단 저장
        console.log(
          "💾 저장할 레코드 상세:",
          plansToInsert.map((p) => ({
            plan_date: p.plan_date,
            meal_type: p.meal_type,
            recipe_title: p.recipe_title,
            calories: p.calories,
            is_unified: p.is_unified,
            family_member_id: p.family_member_id,
          })),
        );

        const { error: insertError, data: insertedData } = await supabase
          .from("diet_plans")
          .insert(plansToInsert)
          .select();

        console.log("💾 저장 결과:", insertError ? "실패" : "성공");
        if (insertError) {
          console.error("❌ 저장 오류:", insertError);
          console.error("❌ 저장 오류 상세:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          });
          console.error(
            "❌ 저장하려던 데이터:",
            JSON.stringify(plansToInsert, null, 2),
          );
          // 저장 실패 시에는 "성공처럼 보이지만 실제 DB에는 없음" 상태가 되어 UX가 망가집니다.
          // 따라서 여기서 예외를 던져 API가 5xx로 응답하도록 합니다.
          throw new Error(
            `diet_plans 저장 실패: ${insertError.code ?? "unknown"} - ${insertError.message}`,
          );
        } else {
          saveSuccess = true;
          const insertedCount = insertedData?.length || plansToInsert.length;
          console.log(
            "✅ 식단 저장 완료:",
            insertedCount,
            "개",
          );
          if (insertedData && insertedData.length > 0) {
            console.log(
              "✅ 저장된 레코드 상세:",
              insertedData.map((r) => ({
                id: r.id,
                plan_date: r.plan_date,
                meal_type: r.meal_type,
                recipe_title: r.recipe_title,
                calories: r.calories,
                is_unified: r.is_unified,
                family_member_id: r.family_member_id,
              })),
            );
            
            // 저장 후 즉시 검증: 저장된 데이터가 실제로 조회 가능한지 확인
            console.log("🔍 저장 후 검증: 저장된 데이터 조회 테스트");
            const { data: verifyData, error: verifyError } = await supabase
              .from("diet_plans")
              .select("id, plan_date, meal_type, recipe_title")
              .eq("user_id", userId)
              .eq("plan_date", date)
              .is("family_member_id", null)
              .eq("is_unified", false)
              .in("id", insertedData.map(r => r.id));
            
            if (verifyError) {
              console.error("⚠️ 저장 후 검증 실패:", verifyError);
            } else {
              console.log("✅ 저장 후 검증 성공:", verifyData?.length || 0, "개 레코드 확인됨");
              if (verifyData && verifyData.length !== insertedCount) {
                console.warn("⚠️ 저장된 레코드 수와 검증된 레코드 수가 일치하지 않습니다:", {
                  inserted: insertedCount,
                  verified: verifyData.length,
                });
              }
            }
          } else {
            console.warn("⚠️ 저장은 성공했지만 insertedData가 비어있습니다. 저장된 데이터 확인 필요.");
          }
        }
      } catch (saveError) {
        console.error("❌ 저장 중 예외 발생:", saveError);
        // 저장 예외도 상위로 올려서 API가 실패로 응답하도록 함
        throw saveError;
      }
    } else {
      console.warn(
        "⚠️ 저장할 식단이 없습니다 (모든 식사가 비어있거나 recipe_title이 없음)",
      );
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
      // 데이터베이스에 저장된 경우 조회 (개인 식단만 - family_member_id가 null인 것만)
      console.log("🔍 저장된 개인 식단 조회 중...");
      console.log("🔍 조회 조건:", {
        user_id: userId,
        plan_date: date,
        family_member_id: "null",
        is_unified: false,
      });

      const { data: savedPlans, error: fetchError } = await supabase
        .from("diet_plans")
        .select(
          `
          *,
          recipe:recipes(id, title, thumbnail_url, slug)
          `,
        )
        .eq("user_id", userId)
        .eq("plan_date", date)
        .is("family_member_id", null) // 개인 식단만 조회
        .eq("is_unified", false) // 통합 식단 제외
        .order("meal_type", { ascending: true });

      console.log("🔍 조회 결과:", savedPlans?.length || 0, "개 식단");
      if (savedPlans && savedPlans.length > 0) {
        console.log(
          "🔍 조회된 식단 상세:",
          savedPlans.map((p) => ({
            id: p.id,
            plan_date: p.plan_date,
            meal_type: p.meal_type,
            recipe_title: p.recipe_title,
            calories: p.calories,
            is_unified: p.is_unified,
            family_member_id: p.family_member_id,
          })),
        );
      } else {
        console.warn(
          "⚠️ 저장은 성공했지만 조회 결과가 비어있습니다. 저장된 데이터 확인 필요.",
        );
      }
      if (fetchError) {
        console.error("❌ 조회 오류:", fetchError);
        // 조회 실패해도 recommendations가 있으면 계속 진행
        console.warn(
          "⚠️ 조회 실패했지만 recommendations를 사용하여 dailyPlan을 생성합니다",
        );
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
          if (
            mealType === "breakfast" ||
            mealType === "lunch" ||
            mealType === "dinner" ||
            mealType === "snack"
          ) {
            // recipe_id가 없는 경우 (폴백 레시피) recipe 객체 생성
            const recipeData =
              plan.recipe ||
              (plan.recipe_title
                ? {
                    id: plan.recipe_id || `fallback-${plan.recipe_title}`,
                    title: plan.recipe_title,
                    thumbnail_url: null,
                    slug: plan.recipe_title.toLowerCase().replace(/\s+/g, "-"),
                  }
                : null);

            dailyPlan[mealType] = {
              ...plan,
              recipe: recipeData as any,
            } as DietPlan;
          }
        });

        // 저장된 식단이 있으면 반환
        const hasAnySavedMeal =
          dailyPlan.breakfast ||
          dailyPlan.lunch ||
          dailyPlan.dinner ||
          dailyPlan.snack;
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
          console.warn(
            "⚠️ 저장된 식단이 비어있습니다. recommendations를 사용합니다",
          );
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
      console.log(
        "📚 저장할 식단이 없지만 recommendations를 사용하여 dailyPlan 생성",
      );

      // recommendations에 최소한 하나의 식사가 있는지 확인
      const hasAnyRecommendation =
        recommendations.breakfast ||
        recommendations.lunch ||
        recommendations.dinner ||
        recommendations.snack;
      if (!hasAnyRecommendation) {
        console.error(
          "❌ recommendations도 비어있습니다. 식단을 생성할 수 없습니다.",
        );
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
        breakfast: recommendations.breakfast
          ? ({
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
            } as DietPlan)
          : null,
        lunch: recommendations.lunch
          ? ({
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
            } as DietPlan)
          : null,
        dinner: recommendations.dinner
          ? ({
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
            } as DietPlan)
          : null,
        snack: recommendations.snack
          ? ({
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
            } as DietPlan)
          : null,
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
  date: string,
): Promise<DailyDietPlan | null> {
  console.group("[getDailyDietPlan] 식단 조회");
  console.log("👤 userId:", userId);
  console.log("📅 date:", date);

  try {
    const supabase = getServiceRoleClient();

    // 먼저 모든 데이터 조회 (디버깅용)
    const { data: allData, error: allError } = await supabase
      .from("diet_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_date", date);
    
    console.log("🔍 [getDailyDietPlan] 전체 조회 결과:", {
      count: allData?.length || 0,
      data: allData?.map(p => ({
        id: p.id,
        meal_type: p.meal_type,
        is_unified: p.is_unified,
        family_member_id: p.family_member_id,
        recipe_title: p.recipe_title,
      })),
    });

    // 필터링된 쿼리
    // 주의: is_unified가 false인 개인 식단만 조회
    // family_member_id가 null인 경우만 조회 (개인 식단)
    const { data, error } = await supabase
      .from("diet_plans")
      .select(
        `
        *,
        composition_summary,
        recipe:recipes!left(id, title, thumbnail_url, slug)
        `,
      )
      .eq("user_id", userId)
      .eq("plan_date", date)
      .is("family_member_id", null) // 개인 식단만 조회
      .eq("is_unified", false) // 통합 식단 제외 (개인 식단만)
      .order("meal_type", { ascending: true });
    
    console.log("🔍 [getDailyDietPlan] 필터링된 쿼리 결과:", {
      count: data?.length || 0,
      filters: {
        user_id: userId,
        plan_date: date,
        family_member_id: "null",
        is_unified: false,
      },
      data: data?.map(p => ({
        id: p.id,
        meal_type: p.meal_type,
        is_unified: p.is_unified,
        family_member_id: p.family_member_id,
        recipe_title: p.recipe_title,
      })),
    });

    if (error) {
      console.error("❌ 데이터베이스 조회 오류:", error);
      console.groupEnd();
      throw error;
    }

    console.log("📊 조회된 식단 데이터 개수:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("📊 식단 데이터 상세:", JSON.stringify(data, null, 2));
      data.forEach((plan, index) => {
        console.log(`📋 [${index}] 식단 항목:`, {
          id: plan.id,
          meal_type: plan.meal_type,
          meal_type_type: typeof plan.meal_type,
          recipe_id: plan.recipe_id,
          recipe_title: plan.recipe_title,
          hasRecipe: !!plan.recipe,
          calories: plan.calories,
          composition_summary: plan.composition_summary,
        });
      });
    } else {
      console.warn("⚠️ 식단 데이터가 없습니다");
      console.groupEnd();
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
      // meal_type을 소문자로 정규화하여 비교 (대소문자 차이 방지)
      const rawMealType = String(plan.meal_type || '').trim().toLowerCase();
      const mealType = rawMealType as MealType;
      console.log(`🍽️ 처리 중인 식사 타입: ${mealType}`);
      console.log(`📋 원본 meal_type 값: "${plan.meal_type}" (타입: ${typeof plan.meal_type})`);
      console.log(`📋 정규화된 meal_type: "${rawMealType}"`);
      console.log(`📋 recipe_id: ${plan.recipe_id}, recipe_title: ${plan.recipe_title}`);
      console.log(`📋 전체 plan 객체:`, {
        id: plan.id,
        user_id: plan.user_id,
        plan_date: plan.plan_date,
        meal_type: plan.meal_type,
        recipe_id: plan.recipe_id,
        recipe_title: plan.recipe_title,
        calories: plan.calories,
        protein_g: plan.protein_g,
        carbs_g: plan.carbs_g,
        fat_g: plan.fat_g,
        sodium_mg: plan.sodium_mg,
        composition_summary: plan.composition_summary,
        recipe: plan.recipe,
      });

      if (
        rawMealType === "breakfast" ||
        rawMealType === "lunch" ||
        rawMealType === "dinner" ||
        rawMealType === "snack"
      ) {
        // composition_summary는 JSONB 타입이므로 이미 파싱되어 있음
        let compositionSummary: string[] | undefined;
        if (plan.composition_summary) {
          // JSONB는 이미 객체/배열로 파싱되어 있음
          if (Array.isArray(plan.composition_summary)) {
            compositionSummary = plan.composition_summary;
          } else if (
            plan.composition_summary &&
            typeof plan.composition_summary === "object" &&
            "items" in plan.composition_summary &&
            Array.isArray((plan.composition_summary as { items?: unknown }).items)
          ) {
            // 레거시/주간 식단 저장 형식: { items: string[], rice: string[], sides: string[], soup: string[] }
            compositionSummary = (plan.composition_summary as { items: string[] }).items;
          } else if (typeof plan.composition_summary === "string") {
            // 문자열인 경우에만 JSON.parse 시도 (레거시 데이터 대응)
            try {
              const parsed = JSON.parse(plan.composition_summary);
              if (Array.isArray(parsed)) {
                compositionSummary = parsed;
              } else if (
                parsed &&
                typeof parsed === "object" &&
                "items" in parsed &&
                Array.isArray((parsed as { items?: unknown }).items)
              ) {
                compositionSummary = (parsed as { items: string[] }).items;
              }
            } catch (e) {
              console.warn(
                `❌ Failed to parse composition_summary for ${mealType}:`,
                e,
              );
            }
          }
          console.log(`📋 ${mealType} 구성품 조회됨:`, compositionSummary);
        }

        // recipe_id가 없는 경우 (폴백 레시피) recipe 객체 생성
        let recipeData = plan.recipe;
        
        // recipe가 없고 recipe_title이 있으면 폴백 레시피 생성
        if (!recipeData && plan.recipe_title) {
          recipeData = {
            id: plan.recipe_id || `fallback-${plan.recipe_title}`,
            title: plan.recipe_title,
            thumbnail_url: null,
            slug: plan.recipe_title.toLowerCase().replace(/\s+/g, "-"),
          };
        }

        console.log(`📝 ${mealType} 레시피 데이터:`, recipeData);
        console.log(`📝 ${mealType} recipe_title:`, plan.recipe_title);
        console.log(`📝 ${mealType} recipe_id:`, plan.recipe_id);

        // recipeData가 없어도 recipe_title이 있으면 계속 진행
        if (!recipeData && !plan.recipe_title) {
          console.warn(`⚠️ ${mealType}에 레시피 정보가 없습니다 (recipe_title도 없음)`);
          console.warn(`⚠️ ${mealType} 식단 건너뜀 - recipeData: ${!!recipeData}, recipe_title: ${plan.recipe_title}`);
          // recipe_title이 없어도 다른 정보(칼로리, 영양소 등)가 있으면 계속 진행
          // 하지만 최소한 recipe_title이나 recipe_id가 있어야 함
          if (!plan.recipe_id && !plan.recipe_title) {
            console.warn(`⚠️ ${mealType} 식단을 건너뜁니다 - recipe_id와 recipe_title 모두 없음`);
            return;
          }
        }

        // recipeData가 없으면 recipe_title 또는 recipe_id로 생성
        if (!recipeData) {
          const fallbackTitle = plan.recipe_title || `식단-${mealType}`;
          recipeData = {
            id: plan.recipe_id || `fallback-${fallbackTitle}`,
            title: fallbackTitle,
            thumbnail_url: null,
            slug: fallbackTitle.toLowerCase().replace(/\s+/g, "-"),
          };
        }

        // 데이터베이스 컬럼명을 TypeScript 타입으로 변환
        // mealType을 정규화된 값으로 사용하되, dailyPlan의 키는 원본 meal_type 값 사용
        const planKey = rawMealType as MealType;
        dailyPlan[planKey] = {
          id: plan.id,
          user_id: plan.user_id,
          plan_date: plan.plan_date,
          meal_type: planKey,
          recipe_id: plan.recipe_id,
          calories: plan.calories,
          carbohydrates: plan.carbs_g ?? plan.carbohydrates ?? null,
          protein: plan.protein_g ?? plan.protein ?? null,
          fat: plan.fat_g ?? plan.fat ?? null,
          sodium: plan.sodium_mg ?? plan.sodium ?? null,
          created_at: plan.created_at,
          compositionSummary,
          recipe: recipeData as any,
        } as DietPlan;

        console.log(`✅ ${planKey} 식단 설정 완료 (원본: "${plan.meal_type}")`);
      }
    });

    console.log("✅ 최종 식단 객체:", dailyPlan);
    console.log("✅ 반환할 식단:", {
      date: dailyPlan.date,
      hasBreakfast: !!dailyPlan.breakfast,
      hasLunch: !!dailyPlan.lunch,
      hasDinner: !!dailyPlan.dinner,
      hasSnack: !!dailyPlan.snack,
      totalNutrition: dailyPlan.totalNutrition,
    });
    console.groupEnd();
    return dailyPlan;
  } catch (error) {
    console.error("❌ getDailyDietPlan error", error);
    console.groupEnd();
    return null;
  }
}
