/**
 * @file lib/recipes/recipe-fetcher/index.ts
 * @description 레시피 자동 확보 시스템 메인 엔트리
 *
 * 주요 기능:
 * 1. 웹 스크래퍼/API 클라이언트 통합
 * 2. 레시피 파싱 및 표준화
 * 3. 품질 검증 및 중복 제거
 * 4. 데이터베이스 자동 저장
 *
 * @dependencies
 * - lib/recipes/recipe-fetcher/web-scraper.ts
 * - lib/recipes/recipe-fetcher/parser.ts
 * - lib/recipes/recipe-fetcher/normalizer.ts
 * - lib/recipes/recipe-fetcher/quality-validator.ts
 */

import type { Recipe } from "@/types/recipe";

/**
 * 표준화된 레시피 형식
 */
export interface StandardizedRecipe {
  title: string;
  description: string;
  main_ingredients: string[]; // 메인 재료 목록
  category: 'rice' | 'side' | 'soup' | 'snack';
  cooking_method: string; // 조리법 (볶음, 조림, 구이 등)
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbohydrates: number | null;
    fat: number | null;
    sodium: number | null;
    fiber?: number | null;
  };
  steps: Array<{
    step_number: number;
    content: string;
    image_url?: string | null;
  }>;
  ingredients: Array<{
    name: string;
    quantity: number | null;
    unit: string | null;
  }>;
  source: string; // 출처 (예: "naver_blog", "foodsafety", "manual")
  source_url?: string; // 원본 URL
}

/**
 * 레시피 수집 옵션
 */
export interface RecipeFetchOptions {
  source: 'web' | 'api' | 'all'; // 수집 소스
  maxResults?: number; // 최대 결과 수
  keywords?: string[]; // 검색 키워드
  category?: StandardizedRecipe['category']; // 카테고리 필터
}

/**
 * 레시피 수집 결과
 */
export interface RecipeFetchResult {
  success: boolean;
  totalFetched: number;
  totalValidated: number;
  totalSaved: number;
  errors: string[];
  recipes: StandardizedRecipe[];
}

/**
 * 레시피 자동 확보 (메인 함수)
 * 
 * @param options 수집 옵션
 * @returns 수집 결과
 */
export async function fetchRecipes(
  options: RecipeFetchOptions = { source: 'all', maxResults: 50 }
): Promise<RecipeFetchResult> {
  console.group("📥 레시피 자동 확보 시작");
  console.log("수집 옵션:", options);

  const result: RecipeFetchResult = {
    success: false,
    totalFetched: 0,
    totalValidated: 0,
    totalSaved: 0,
    errors: [],
    recipes: [],
  };

  try {
    // 1. 웹 스크래핑 또는 API 호출
    const rawRecipes: any[] = [];
    
    if (options.source === 'web' || options.source === 'all') {
      try {
        const { scrapeRecipes } = await import("./web-scraper");
        const scraped = await scrapeRecipes({
          keywords: options.keywords || [],
          maxResults: options.maxResults || 50,
        });
        rawRecipes.push(...scraped);
        console.log(`✅ 웹 스크래핑: ${scraped.length}개 레시피 수집`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`웹 스크래핑 실패: ${errorMsg}`);
        console.error("❌ 웹 스크래핑 실패:", error);
      }
    }

    if (options.source === 'api' || options.source === 'all') {
      // TODO: 외부 API 클라이언트 구현
      console.log("ℹ️ API 수집은 향후 구현 예정");
    }

    result.totalFetched = rawRecipes.length;

    if (rawRecipes.length === 0) {
      console.warn("⚠️ 수집된 레시피가 없습니다");
      result.success = true; // 에러는 아니지만 결과 없음
      console.groupEnd();
      return result;
    }

    // 2. 파싱 및 표준화
    const { parseRecipe } = await import("./parser");
    const { normalizeRecipe } = await import("./normalizer");
    
    const parsedRecipes: StandardizedRecipe[] = [];
    for (const rawRecipe of rawRecipes) {
      try {
        const parsed = await parseRecipe(rawRecipe);
        const normalized = await normalizeRecipe(parsed);
        parsedRecipes.push(normalized);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`파싱 실패 (${rawRecipe.title || 'unknown'}): ${errorMsg}`);
        console.warn("⚠️ 레시피 파싱 실패:", error);
      }
    }

    console.log(`✅ 파싱 완료: ${parsedRecipes.length}개 레시피`);

    // 3. 품질 검증 및 중복 제거
    const { validateRecipe, removeDuplicates } = await import("./quality-validator");
    
    const validatedRecipes: StandardizedRecipe[] = [];
    for (const recipe of parsedRecipes) {
      const validation = await validateRecipe(recipe);
      if (validation.isValid) {
        validatedRecipes.push(recipe);
      } else {
        result.errors.push(`검증 실패 (${recipe.title}): ${validation.reasons.join(", ")}`);
      }
    }

    console.log(`✅ 검증 완료: ${validatedRecipes.length}개 레시피`);

    // 중복 제거
    const uniqueRecipes = await removeDuplicates(validatedRecipes);
    console.log(`✅ 중복 제거 완료: ${uniqueRecipes.length}개 레시피`);

    result.totalValidated = uniqueRecipes.length;
    result.recipes = uniqueRecipes;

    // 4. 데이터베이스 저장
    const savedCount = await saveRecipesToDatabase(uniqueRecipes);
    result.totalSaved = savedCount;
    console.log(`✅ 데이터베이스 저장 완료: ${savedCount}개 레시피`);

    result.success = true;
    console.log("✅ 레시피 자동 확보 완료");
    console.groupEnd();

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`전체 프로세스 실패: ${errorMsg}`);
    console.error("❌ 레시피 자동 확보 실패:", error);
    console.groupEnd();
    return result;
  }
}

/**
 * 레시피를 데이터베이스에 저장
 */
async function saveRecipesToDatabase(
  recipes: StandardizedRecipe[]
): Promise<number> {
  console.group("💾 레시피 데이터베이스 저장");

  try {
    const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
    const supabase = getServiceRoleClient();

    let savedCount = 0;

    for (const recipe of recipes) {
      try {
        // 1. 레시피 기본 정보 저장
        const { data: recipeData, error: recipeError } = await supabase
          .from("recipes")
          .insert({
            title: recipe.title,
            description: recipe.description,
            main_ingredients: recipe.main_ingredients,
            cooking_method: recipe.cooking_method,
            nutrition_focus: extractNutritionFocus(recipe.nutrition),
            age_group_suitable: [], // TODO: 연령대 분석 로직 추가
            calories: recipe.nutrition.calories,
            carbohydrates: recipe.nutrition.carbohydrates,
            protein: recipe.nutrition.protein,
            fat: recipe.nutrition.fat,
            sodium: recipe.nutrition.sodium,
          })
          .select("id")
          .single();

        if (recipeError) {
          // 중복 레시피는 무시 (제목 기반)
          if (recipeError.code === "23505") {
            console.log(`ℹ️ 중복 레시피 무시: ${recipe.title}`);
            continue;
          }
          throw recipeError;
        }

        if (!recipeData) {
          console.warn(`⚠️ 레시피 저장 실패: ${recipe.title}`);
          continue;
        }

        const recipeId = recipeData.id;

        // 2. 재료 정보 저장
        if (recipe.ingredients.length > 0) {
          const ingredients = recipe.ingredients.map((ing, index) => ({
            recipe_id: recipeId,
            ingredient_name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit || "개",
            category: "기타" as const,
            display_order: index,
          }));

          const { error: ingredientsError } = await supabase
            .from("recipe_ingredients")
            .insert(ingredients);

          if (ingredientsError) {
            console.warn(`⚠️ 재료 저장 실패: ${recipe.title}`, ingredientsError);
          }
        }

        // 3. 조리 단계 저장
        if (recipe.steps.length > 0) {
          const steps = recipe.steps.map((step) => ({
            recipe_id: recipeId,
            step_number: step.step_number,
            content: step.content,
            image_url: step.image_url || null,
          }));

          const { error: stepsError } = await supabase
            .from("recipe_steps")
            .insert(steps);

          if (stepsError) {
            console.warn(`⚠️ 조리 단계 저장 실패: ${recipe.title}`, stepsError);
          }
        }

        savedCount++;
        console.log(`✅ 레시피 저장 완료: ${recipe.title}`);
      } catch (error) {
        console.error(`❌ 레시피 저장 중 오류 (${recipe.title}):`, error);
      }
    }

    console.log(`✅ 총 ${savedCount}개 레시피 저장 완료`);
    console.groupEnd();

    return savedCount;
  } catch (error) {
    console.error("❌ 데이터베이스 저장 실패:", error);
    console.groupEnd();
    return 0;
  }
}

/**
 * 영양소 기반 영양소 강점 추출
 */
function extractNutritionFocus(nutrition: StandardizedRecipe['nutrition']): string[] {
  const focus: string[] = [];

  // 단백질이 높으면 (20g 이상)
  if (nutrition.protein && nutrition.protein >= 20) {
    focus.push("단백질");
  }

  // 칼슘 추정 (일반적으로 우유, 치즈, 브로콜리 등)
  // TODO: 실제 칼슘 데이터가 있으면 사용

  // 철분 추정 (일반적으로 적색육, 시금치 등)
  // TODO: 실제 철분 데이터가 있으면 사용

  return focus;
}

