/**
 * @file queries.ts
 * @description 레시피 데이터 조회를 위한 Supabase 쿼리 함수들.
 *
 * 주요 기능:
 * 1. 레시피 목록 조회 (필터링, 정렬 포함)
 * 2. 레시피 상세 조회
 * 3. 평가 조회 및 생성/업데이트
 */

import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";
import { RecipeListItem, RecipeDetail, RecipeFilterState } from "@/types/recipe";

/**
 * 레시피 목록 조회 (필터링 및 정렬 지원)
 */
export async function getRecipes(
  filters: RecipeFilterState = {
    searchTerm: "",
    difficulty: [],
    maxCookingTime: null,
    sortBy: "newest",
  },
  options?: { limit?: number }
): Promise<RecipeListItem[]> {
  // 성능 최적화: 프로덕션에서는 로그 최소화
  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed("[RecipeQueries] 레시피 목록 조회");
    console.log("filters", filters);
    console.log("options", options);
  }

  try {
    const supabase = createPublicSupabaseServerClient();

    // 기본 쿼리: recipes + users + rating_stats 조인
    let query = supabase
      .from("recipes")
      .select(
        `
        id,
        slug,
        title,
        thumbnail_url,
        difficulty,
        cooking_time_minutes,
        created_at,
        user:users!recipes_user_id_fkey(id, name),
        rating_stats:recipe_rating_stats(rating_count, average_rating)
        `
      )
      .order("created_at", { ascending: false });

    // 검색어 필터
    if (filters.searchTerm) {
      query = query.or(
        `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
      );
    }

    // 난이도 필터
    if (filters.difficulty.length > 0) {
      query = query.in("difficulty", filters.difficulty);
    }

    // 최대 조리 시간 필터
    if (filters.maxCookingTime) {
      query = query.lte("cooking_time_minutes", filters.maxCookingTime);
    }

    // 정렬
    switch (filters.sortBy) {
      case "popular":
        // 인기순은 별점 개수 기준 (추후 개선 가능)
        query = query.order("created_at", { ascending: false });
        break;
      case "rating":
        // 별점순은 별도 쿼리 필요 (추후 개선)
        query = query.order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // limit 적용 (성능 최적화)
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("query error", error);
      throw error;
    }

    // 데이터 변환
    const recipes: RecipeListItem[] =
      (data as any)?.map((item: any) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        thumbnail_url: item.thumbnail_url,
        difficulty: item.difficulty,
        cooking_time_minutes: item.cooking_time_minutes,
        created_at: item.created_at,
        rating_count:
          (item.rating_stats as any)?.[0]?.rating_count || 0,
        average_rating:
          parseFloat((item.rating_stats as any)?.[0]?.average_rating || "0") || 0,
        user: {
          name: (item.user as any)?.name || "익명",
        },
      })) || [];

    if (process.env.NODE_ENV === "development") {
      console.log("result count", recipes.length);
      console.groupEnd();
    }
    return recipes;
  } catch (error) {
    console.error("getRecipes error", error);
    if (process.env.NODE_ENV === "development") {
      console.groupEnd();
    }
    // 에러 발생 시 빈 배열 반환 (페이지가 계속 로드되도록)
    return [];
  }
}

/**
 * 레시피 상세 조회 (slug 기반)
 */
export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  console.groupCollapsed("[RecipeQueries] 레시피 상세 조회");
  console.log("slug", slug);

  try {
    const supabase = createPublicSupabaseServerClient();

    // 레시피 기본 정보 조회
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select(
        `
        *,
        user:users!recipes_user_id_fkey(id, name),
        rating_stats:recipe_rating_stats(rating_count, average_rating)
        `
      )
      .eq("slug", slug)
      .single();

    if (recipeError || !recipe) {
      console.error("recipe not found", recipeError);
      console.groupEnd();
      return null;
    }

    const recipeTyped = recipe as any;

    // 재료 조회
    const { data: ingredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeTyped.id)
      .order("display_order", { ascending: true });

    if (ingredientsError) {
      console.error("ingredients error", ingredientsError);
    }

    // 재료 데이터를 타입에 맞게 변환 (하위 호환성 포함)
    const ingredientsTyped = (ingredients || []).map((ing: any) => ({
      ...ing,
      // 하위 호환성을 위한 별칭
      name: ing.ingredient_name,
      notes: ing.preparation_note,
      order_index: ing.display_order,
    }));

    // 단계 조회
    const { data: steps, error: stepsError } = await supabase
      .from("recipe_steps")
      .select("*")
      .eq("recipe_id", recipeTyped.id)
      .order("step_number", { ascending: true });

    if (stepsError) {
      console.error("steps error", stepsError);
    }

    // 현재 사용자의 평가 조회 (인증된 경우)
    let userRating: number | undefined;
    try {
      const { data: rating } = await supabase
        .from("recipe_ratings")
        .select("rating")
        .eq("recipe_id", recipeTyped.id)
        .single();

      if (rating) {
        userRating = parseFloat((rating as any).rating);
      }
    } catch (e) {
      // 인증되지 않은 경우 무시
    }

    const result: RecipeDetail = {
      ...recipeTyped,
      ingredients: ingredientsTyped || [],
      steps: steps || [],
      user_rating: userRating,
      user: (recipeTyped.user as any) || { id: recipeTyped.user_id, name: "익명" },
      rating_stats: {
        rating_count:
          (recipeTyped.rating_stats as any)?.[0]?.rating_count || 0,
        average_rating:
          parseFloat((recipeTyped.rating_stats as any)?.[0]?.average_rating || "0") || 0,
      },
    };

    console.log("recipe found", result.id);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error("getRecipeBySlug error", error);
    console.groupEnd();
    return null;
  }
}

