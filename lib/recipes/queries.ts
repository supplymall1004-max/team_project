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
// 식약처 레시피는 정적 파일 기반 시스템 사용 (로컬 파일에서 직접 로드)
// API 호출 및 DB 저장 로직은 제거됨

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
        foodsafety_rcp_pat2,
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
        foodsafety_rcp_pat2: item.foodsafety_rcp_pat2 || null,
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
 * 하이브리드 방식: DB 우선 조회, 없으면 식약처 API 호출 후 저장
 */
export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  console.groupCollapsed("[RecipeQueries] 레시피 상세 조회");
  console.log("slug", slug);

  try {
    const supabase = createPublicSupabaseServerClient();

    // 1. DB에서 레시피 조회
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

    // 2. DB에 레시피가 있으면 반환
    if (recipe && !recipeError) {
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

      console.log("recipe found in DB", result.id);
      console.groupEnd();
      return result;
    }

    // 3. DB에 없으면 정적 파일에서 로드 시도
    // 숫자 slug는 app/recipes/[slug]/page.tsx에서 정적 파일로 로드됨
    // slug가 foodsafety-{RCP_SEQ} 형식인 경우도 정적 파일 시스템 사용
    // API 호출 및 DB 저장 로직은 제거됨

    // 레시피를 찾지 못한 경우 (정상적인 상황일 수 있음 - 예: 경로 slug)
    // 에러 대신 조용한 로깅
    if (recipeError) {
      console.warn("[RecipeQueries] 레시피 조회 실패:", recipeError.message || recipeError);
    } else {
      console.log("[RecipeQueries] 레시피를 찾을 수 없음 (slug:", slug, ")");
    }
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("getRecipeBySlug error", error);
    console.groupEnd();
    return null;
  }
}

/**
 * 레시피 상세 조회 (ID 기반)
 * UUID 형식의 레시피 ID로 조회
 */
export async function getRecipeById(recipeId: string): Promise<RecipeDetail | null> {
  console.groupCollapsed("[RecipeQueries] 레시피 상세 조회 (ID)");
  console.log("recipeId", recipeId);

  try {
    const supabase = createPublicSupabaseServerClient();

    // UUID 형식 확인
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipeId)) {
      console.warn("⚠️ recipeId가 UUID 형식이 아님:", recipeId);
      console.groupEnd();
      return null;
    }

    // DB에서 레시피 조회
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select(
        `
        *,
        user:users!recipes_user_id_fkey(id, name),
        rating_stats:recipe_rating_stats(rating_count, average_rating)
        `
      )
      .eq("id", recipeId)
      .single();

    if (recipe && !recipeError) {
      const recipeTyped = recipe as any;

      // 재료 조회
      const { data: ingredients } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipeTyped.id)
        .order("display_order", { ascending: true });

      // 재료 데이터를 타입에 맞게 변환
      const ingredientsTyped = (ingredients || []).map((ing: any) => ({
        ...ing,
        name: ing.ingredient_name,
        notes: ing.preparation_note,
        order_index: ing.display_order,
      }));

      // 단계 조회
      const { data: steps } = await supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", recipeTyped.id)
        .order("step_number", { ascending: true });

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

      console.log("✅ 레시피 조회 성공:", result.id);
      console.groupEnd();
      return result;
    }

    console.error("❌ 레시피를 찾을 수 없음:", recipeError);
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("❌ getRecipeById 오류:", error);
    console.groupEnd();
    return null;
  }
}

