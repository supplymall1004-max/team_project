/**
 * @file actions/recipe-create.ts
 * @description 레시피 생성 Server Action
 *
 * 레시피 생성 시 자동 이미지 할당 기능을 포함합니다.
 * 1. 레시피 제목으로 Pixabay 검색
 * 2. 검색 실패 시 카테고리별 기본 이미지 사용
 * 3. 이미지 품질 검증 후 최적 이미지 선택
 *
 * @dependencies
 * - lib/food-image-service.ts: 이미지 검색 및 캐싱 서비스
 * - lib/food-image-fallback.ts: 폴백 이미지 처리
 * - lib/supabase/server.ts: 서버 사이드 Supabase 클라이언트
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { foodImageService } from '@/lib/food-image-service';
import { getFallbackImageForFood } from '@/lib/food-image-fallback';
import type { RecipeIngredient, RecipeStep } from '@/types/recipe';

// 레시피 생성 입력 타입 (데이터베이스 필드 제외)
export interface CreateRecipeInput {
  title: string;
  description?: string;
  difficulty: number;
  cookingTimeMinutes: number;
  servings: number;
  ingredients: Array<{
    ingredient_name: string;
    quantity?: string | number | null;
    unit?: string | null;
    category?: "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타";
    is_optional?: boolean;
    preparation_note?: string | null;
    display_order?: number;
  }>;
  steps: Array<{
    content: string;
    image_url?: string | null;
    video_url?: string | null;
    timer_minutes?: string | number | null;
  }>;
  userId: string;
}

export interface CreateRecipeResult {
  success: boolean;
  recipeId?: string;
  slug?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * 레시피 생성 및 자동 이미지 할당
 */
export async function createRecipe(input: CreateRecipeInput): Promise<CreateRecipeResult> {
  console.groupCollapsed('[RecipeCreate] 레시피 생성 시작');
  console.log('input:', { ...input, userId: '[REDACTED]' });

  try {
    // 1. 입력 검증
    const validation = validateRecipeInput(input);
    if (!validation.valid) {
      console.error('입력 검증 실패:', validation.error);
      console.groupEnd();
      return { success: false, error: validation.error };
    }

    // 2. 썸네일 이미지 자동 할당
    const thumbnailUrl = await getThumbnailForRecipe(input.title);
    console.log('할당된 썸네일 URL:', thumbnailUrl);

    // 3. 레시피 데이터 생성
    const slug = generateSlug(input.title);
    const supabase = await createClerkSupabaseClient();

    // 4. 레시피 기본 정보 저장
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: input.userId,
        slug,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        thumbnail_url: thumbnailUrl,
        difficulty: input.difficulty,
        cooking_time_minutes: input.cookingTimeMinutes,
        servings: input.servings,
      })
      .select()
      .single();

    if (recipeError) {
      console.error('레시피 생성 실패:', recipeError);
      console.groupEnd();
      return { success: false, error: '레시피 생성에 실패했습니다.' };
    }

    console.log('레시피 생성 성공:', recipe.id);

    // 5. 재료 저장
    if (input.ingredients.length > 0) {
      const ingredientsToInsert = input.ingredients.map((ing, index) => ({
        recipe_id: recipe.id,
        ingredient_name: ing.ingredient_name.trim(),
        quantity: ing.quantity ? parseFloat(ing.quantity.toString()) : null,
        unit: ing.unit?.trim() || null,
        category: (ing.category || "기타") as "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타",
        is_optional: ing.is_optional ?? false,
        preparation_note: ing.preparation_note?.trim() || null,
        display_order: ing.display_order ?? index,
      }));

      console.log("[RecipeCreate] 재료 저장:", ingredientsToInsert.length, "개");

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error('재료 저장 실패:', ingredientsError);
        console.groupEnd();
        return { success: false, error: '레시피 재료 저장에 실패했습니다.' };
      }

      console.log("[RecipeCreate] 재료 저장 성공");
    }

    // 6. 조리 단계 저장
    if (input.steps.length > 0) {
      const stepsToInsert = input.steps.map((step, index) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        content: step.content.trim(),
        image_url: step.image_url?.trim() || null,
        video_url: step.video_url?.trim() || null,
        timer_minutes: step.timer_minutes ? parseInt(step.timer_minutes.toString()) : null,
      }));

      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert);

      if (stepsError) {
        console.error('단계 저장 실패:', stepsError);
        console.groupEnd();
        return { success: false, error: '레시피 단계 저장에 실패했습니다.' };
      }
    }

    // 7. 캐시 무효화
    revalidatePath('/recipes');
    revalidatePath(`/recipes/${slug}`);

    console.log('레시피 생성 완료:', { id: recipe.id, slug, thumbnailUrl });
    console.groupEnd();

    return {
      success: true,
      recipeId: recipe.id,
      slug,
      thumbnailUrl,
    };

  } catch (error) {
    console.error('레시피 생성 중 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 레시피 제목으로 썸네일 이미지 자동 할당
 *
 * 우선순위:
 * 1. Pixabay API 검색
 * 2. 검색 실패 시 카테고리별 기본 이미지 (SVG)
 */
async function getThumbnailForRecipe(recipeTitle: string): Promise<string> {
  console.log(`[RecipeCreate] 썸네일 이미지 검색 시작: ${recipeTitle}`);

  try {
    // 1. Pixabay 검색 시도
    const imageResult = await foodImageService.getFoodImage(recipeTitle);

    if (imageResult && imageResult.image_url) {
      console.log(`[RecipeCreate] Pixabay 이미지 검색 성공: ${recipeTitle}`);
      return imageResult.image_url;
    }

    // 2. 검색 실패 시 카테고리별 기본 이미지 사용
    console.log(`[RecipeCreate] Pixabay 검색 실패, 폴백 이미지 사용: ${recipeTitle}`);
    return getFallbackImageForFood(recipeTitle);

  } catch (error) {
    console.error(`[RecipeCreate] 이미지 검색 중 오류 (${recipeTitle}):`, error);

    // 3. 오류 발생 시에도 기본 이미지 반환
    return getFallbackImageForFood(recipeTitle);
  }
}

/**
 * 입력 데이터 검증
 */
function validateRecipeInput(input: CreateRecipeInput): { valid: boolean; error?: string } {
  if (!input.title?.trim()) {
    return { valid: false, error: '제목을 입력해주세요.' };
  }

  if (input.title.length > 100) {
    return { valid: false, error: '제목은 100자를 초과할 수 없습니다.' };
  }

  if (!input.difficulty || input.difficulty < 1 || input.difficulty > 5) {
    return { valid: false, error: '난이도는 1-5 사이의 값이어야 합니다.' };
  }

  if (!input.cookingTimeMinutes || input.cookingTimeMinutes < 1) {
    return { valid: false, error: '조리 시간을 입력해주세요.' };
  }

  if (!input.ingredients || input.ingredients.length === 0) {
    return { valid: false, error: '최소 1개 이상의 재료를 입력해주세요.' };
  }

  if (!input.steps || input.steps.length === 0) {
    return { valid: false, error: '최소 1개 이상의 조리 단계를 입력해주세요.' };
  }

  // 재료 검증
  for (const ingredient of input.ingredients) {
    if (!ingredient.ingredient_name?.trim()) {
      return { valid: false, error: '모든 재료의 이름을 입력해주세요.' };
    }
  }

  // 단계 검증
  for (const step of input.steps) {
    if (!step.content?.trim()) {
      return { valid: false, error: '모든 조리 단계의 내용을 입력해주세요.' };
    }
  }

  return { valid: true };
}

/**
 * 제목으로부터 URL 친화적인 슬러그 생성
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}
