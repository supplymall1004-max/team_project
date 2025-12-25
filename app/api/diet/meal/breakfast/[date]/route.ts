/**
 * @file app/api/diet/meal/breakfast/[date]/route.ts
 * @description 아침 식단 조회 API
 * 
 * 실제 데이터베이스에서 식단 데이터를 조회하여 반환합니다.
 * 식약처 API 데이터와 건강 프로필 정보를 포함합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getDailyDietPlan } from '@/lib/diet/queries';
import { getUserHealthProfile } from '@/lib/diet/queries';
import { fetchFoodSafetyRecipes, fetchFoodSafetyRecipeBySeq } from '@/lib/recipes/foodsafety-api';
import { parseIngredients as parseMfdsIngredients } from '@/lib/services/mfds-recipe-api';
import type { RecipeDetailForDiet, RecipeNutrition } from '@/types/recipe';

function normalizeConditionCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'code' in item) {
        const maybeCode = (item as { code?: unknown }).code;
        return typeof maybeCode === 'string' ? maybeCode : null;
      }
      return null;
    })
    .filter((code): code is string => typeof code === 'string' && code.length > 0);
}

function parseMfdsNumber(value: string | null | undefined): number {
  if (!value || value.trim() === '') return 0;
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    console.group('[Breakfast Meal API] 아침 식단 조회 시작');
    
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error('❌ 인증 실패');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { date } = await params;
    console.log('📅 조회 날짜:', date);
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('❌ 잘못된 날짜 형식:', date);
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '올바른 날짜 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // Supabase 사용자 ID 조회
    const supabase = getServiceRoleClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error('❌ 사용자 정보 조회 실패:', userError);
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = userData.id;
    console.log('👤 사용자 ID:', userId);

    // 일일 식단 조회
    console.log('[Breakfast Meal API] 일일 식단 조회 시작...');
    const dailyPlan = await getDailyDietPlan(userId, date);
    
    console.log('[Breakfast Meal API] 일일 식단 조회 결과:', {
      hasDailyPlan: !!dailyPlan,
      hasBreakfast: !!dailyPlan?.breakfast,
      breakfastData: dailyPlan?.breakfast ? {
        id: dailyPlan.breakfast.id,
        recipe_title: dailyPlan.breakfast.recipe?.title,
        calories: dailyPlan.breakfast.calories,
      } : null,
    });
    
    if (!dailyPlan || !dailyPlan.breakfast) {
      console.warn('⚠️ 아침 식단 없음');
      console.warn('⚠️ dailyPlan:', dailyPlan);
      console.warn('⚠️ dailyPlan.breakfast:', dailyPlan?.breakfast);
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: `${date}의 아침 식단 정보가 없습니다.` },
        { status: 404 }
      );
    }

    // 건강 프로필 조회 (질병 정보 포함)
    const healthProfile = await getUserHealthProfile(userId);

    // 식단 데이터 변환
    const breakfastData = dailyPlan.breakfast;
    const mealData = {
      id: breakfastData.id || `breakfast-${date}`,
      name: breakfastData.recipe?.title || '아침 식단',
      calories: breakfastData.calories || 0,
      nutrition: {
        calories: breakfastData.calories || 0,
        protein: breakfastData.protein || 0,
        carbohydrates: breakfastData.carbohydrates || 0,
        fat: breakfastData.fat || 0,
        fiber: 0, // foodsafety API 연동 시 채워짐
        sugar: 0, // foodsafety API에 필드 없음(현재)
        sodium: breakfastData.sodium || 0,
        cholesterol: 0, // foodsafety API에 필드 없음(현재)
        potassium: null, // DietPlan 타입에 없음
        phosphorus: null, // DietPlan 타입에 없음
        gi_index: null, // DietPlan 타입에 없음
      },
      ingredients: [], // foodsafety API 연동 시 채워짐
      recipe: breakfastData.recipe,
      recipe_id: breakfastData.recipe_id,
      recipe_title: breakfastData.recipe?.title,
      recipe_description: null, // DietPlan 타입의 recipe에 description 없음
      instructions: null, // DietPlan 타입에 없음
      composition_summary: breakfastData.compositionSummary || [], // DietPlan 타입에 있음
      // 식약처 API 데이터 (레시피에 있는 경우)
      foodsafety_data: breakfastData.recipe ? {
        rcp_seq: breakfastData.recipe.id?.startsWith('foodsafety-') 
          ? breakfastData.recipe.id.replace('foodsafety-', '') 
          : null,
      } : null,
      // 상세 페이지에서 "레시피 바로가기 카드"로 사용할 후보들
      relatedRecipes: [] as RecipeDetailForDiet[],
    };

    // 식약처 API에서 영양소/재료를 실제로 가져와서 시각화에 사용
    try {
      const recipeAny = mealData.recipe as unknown as { id?: unknown; title?: unknown; foodsafety_rcp_seq?: unknown };
      const directSeq = mealData.foodsafety_data?.rcp_seq;
      const embeddedSeq = typeof recipeAny?.foodsafety_rcp_seq === 'string' ? recipeAny.foodsafety_rcp_seq : null;
      const title = typeof recipeAny?.title === 'string' ? recipeAny.title : null;

      let rcpSeq: string | null = directSeq || embeddedSeq;

      if (rcpSeq) {
        console.log('[Breakfast Meal API] 식약처 레시피 조회 시도:', rcpSeq);
        const mfdsResult = await fetchFoodSafetyRecipeBySeq(rcpSeq, {
          startIdx: 1,
          endIdx: 1000,
          maxRetries: 2,
          retryDelay: 500,
        });

        if (mfdsResult.success && mfdsResult.data && mfdsResult.data.length > 0) {
          const row = mfdsResult.data[0];
          mealData.nutrition.calories = parseMfdsNumber(row.INFO_ENG);
          mealData.nutrition.carbohydrates = parseMfdsNumber(row.INFO_CAR);
          mealData.nutrition.protein = parseMfdsNumber(row.INFO_PRO);
          mealData.nutrition.fat = parseMfdsNumber(row.INFO_FAT);
          mealData.nutrition.sodium = parseMfdsNumber(row.INFO_NA);
          mealData.nutrition.fiber = parseMfdsNumber(row.INFO_FIBER);

          const parsed = parseMfdsIngredients(row as any);
          mealData.ingredients = parsed.map((name) => ({ name, quantity: 0 }));
          mealData.calories = mealData.nutrition.calories;

          const nutrition: RecipeNutrition = {
            calories: parseMfdsNumber(row.INFO_ENG),
            carbs: parseMfdsNumber(row.INFO_CAR),
            protein: parseMfdsNumber(row.INFO_PRO),
            fat: parseMfdsNumber(row.INFO_FAT),
            sodium: parseMfdsNumber(row.INFO_NA),
            fiber: parseMfdsNumber(row.INFO_FIBER),
          };

          mealData.relatedRecipes = [
            {
              id: `foodsafety-${row.RCP_SEQ}`,
              source: 'foodsafety',
              title: row.RCP_NM,
              image: row.ATT_FILE_NO_MAIN ?? undefined,
              ingredients: [],
              nutrition,
            },
          ];

          console.log('[Breakfast Meal API] 식약처 영양소 반영 완료');
        } else {
          console.warn('[Breakfast Meal API] 식약처 레시피 조회 실패(무시):', mfdsResult.error);
        }
        // direct seq를 썼다면, 아래 '구성요소 합산'은 생략(중복 호출 방지)
        rcpSeq = 'handled';
      }

      // 1) foodsafety seq가 없으면, "구성요소" 기준으로 식약처 영양소를 합산해서 시각화에 사용
      const compositionCandidates =
        Array.isArray(mealData.composition_summary) && mealData.composition_summary.length > 0
          ? mealData.composition_summary
          : title
            ? title.split(/[·,]/g).map((part) => part.trim()).filter(Boolean)
            : [];

      if (rcpSeq !== 'handled' && compositionCandidates.length > 0) {
        console.log('[Breakfast Meal API] 식약처 구성요소 합산 시도:', compositionCandidates);
        const listResult = await fetchFoodSafetyRecipes({ startIdx: 1, endIdx: 1000 });
        if (listResult.success && listResult.data && listResult.data.length > 0) {
          const rows = listResult.data;
          const ingredientSet = new Set<string>();
          const matchedRecipes: RecipeDetailForDiet[] = [];

          const summed = {
            calories: 0,
            carbohydrates: 0,
            protein: 0,
            fat: 0,
            sodium: 0,
            fiber: 0,
          };
          let matchedCount = 0;

          for (const dishName of compositionCandidates) {
            const exact = rows.find((r) => r.RCP_NM === dishName);
            const partial = exact ?? rows.find((r) => r.RCP_NM.includes(dishName) || dishName.includes(r.RCP_NM));
            if (!partial) continue;

            matchedCount += 1;
            summed.calories += parseMfdsNumber(partial.INFO_ENG);
            summed.carbohydrates += parseMfdsNumber(partial.INFO_CAR);
            summed.protein += parseMfdsNumber(partial.INFO_PRO);
            summed.fat += parseMfdsNumber(partial.INFO_FAT);
            summed.sodium += parseMfdsNumber(partial.INFO_NA);
            summed.fiber += parseMfdsNumber(partial.INFO_FIBER);

            const parsed = parseMfdsIngredients(partial as any);
            for (const ing of parsed) ingredientSet.add(ing);

            // 레시피 바로가기 카드 후보 추가
            const nutrition: RecipeNutrition = {
              calories: parseMfdsNumber(partial.INFO_ENG),
              carbs: parseMfdsNumber(partial.INFO_CAR),
              protein: parseMfdsNumber(partial.INFO_PRO),
              fat: parseMfdsNumber(partial.INFO_FAT),
              sodium: parseMfdsNumber(partial.INFO_NA),
              fiber: parseMfdsNumber(partial.INFO_FIBER),
            };
            matchedRecipes.push({
              id: `foodsafety-${partial.RCP_SEQ}`,
              source: 'foodsafety',
              title: partial.RCP_NM,
              image: partial.ATT_FILE_NO_MAIN ?? undefined,
              ingredients: [],
              nutrition,
            });
          }

          if (matchedCount > 0) {
            mealData.nutrition.calories = Math.round(summed.calories);
            mealData.nutrition.carbohydrates = Math.round(summed.carbohydrates * 10) / 10;
            mealData.nutrition.protein = Math.round(summed.protein * 10) / 10;
            mealData.nutrition.fat = Math.round(summed.fat * 10) / 10;
            mealData.nutrition.sodium = Math.round(summed.sodium);
            mealData.nutrition.fiber = Math.round(summed.fiber * 10) / 10;
            mealData.calories = mealData.nutrition.calories;
            mealData.ingredients = Array.from(ingredientSet).map((name) => ({ name, quantity: 0 }));
            mealData.relatedRecipes = matchedRecipes;
            console.log('[Breakfast Meal API] 식약처 구성요소 합산 완료:', { matchedCount });
          } else {
            console.warn('[Breakfast Meal API] 식약처 구성요소 매칭 실패(무시)');
          }
        } else {
          console.warn('[Breakfast Meal API] 식약처 레시피 목록 조회 실패(무시):', listResult.error);
        }
      }
    } catch (mfdsError) {
      // 시각화 보강용이므로 실패해도 식단 조회 전체는 실패시키지 않음
      console.warn('[Breakfast Meal API] 식약처 API 연동 실패(무시):', mfdsError);
    }

    console.log('✅ 아침 식단 조회 완료');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      meal: mealData,
      healthProfile: healthProfile ? {
        // user_health_profiles의 JSONB(객체 배열)도 UI에서 쓰기 쉬운 string[] 코드로 정규화
        diseases: normalizeConditionCodes(healthProfile.diseases),
        allergies: normalizeConditionCodes(healthProfile.allergies),
        daily_calorie_goal: healthProfile.daily_calorie_goal || 2000,
      } : null,
    });

  } catch (error) {
    console.error('[Breakfast Meal API] 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      { success: false, error: '아침 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

