/**
 * @file app/api/diet/meal/dinner/[date]/route.ts
 * @description 저녁 식단 조회 API
 * 
 * 실제 데이터베이스에서 식단 데이터를 조회하여 반환합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getDailyDietPlan, getUserHealthProfile } from '@/lib/diet/queries';
import { fetchFoodSafetyRecipeBySeq } from '@/lib/recipes/foodsafety-api';
import { searchFoodSafetyRecipesByName } from '@/lib/recipes/foodsafety-api';
import { parseIngredients as parseMfdsIngredients } from '@/lib/services/mfds-recipe-api';

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
    console.group('[Dinner Meal API] 저녁 식단 조회 시작');
    
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
    const dailyPlan = await getDailyDietPlan(userId, date);
    
    if (!dailyPlan || !dailyPlan.dinner) {
      console.warn('⚠️ 저녁 식단 없음');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: `${date}의 저녁 식단 정보가 없습니다.` },
        { status: 404 }
      );
    }

    const healthProfile = await getUserHealthProfile(userId);
    const dinnerData = dailyPlan.dinner;
    
    const mealData = {
      id: dinnerData.id || `dinner-${date}`,
      name: dinnerData.recipe?.title || '저녁 식단',
      calories: dinnerData.calories || 0,
      nutrition: {
        calories: dinnerData.calories || 0,
        protein: dinnerData.protein || 0,
        carbohydrates: dinnerData.carbohydrates || 0,
        fat: dinnerData.fat || 0,
        fiber: 0, // foodsafety API 연동 시 채워짐
        sugar: 0, // foodsafety API에 필드 없음(현재)
        sodium: dinnerData.sodium || 0,
        cholesterol: 0, // foodsafety API에 필드 없음(현재)
        potassium: null, // DietPlan 타입에 없음
        phosphorus: null, // DietPlan 타입에 없음
        gi_index: null, // DietPlan 타입에 없음
      },
      ingredients: [], // foodsafety API 연동 시 채워짐
      recipe: dinnerData.recipe,
      recipe_id: dinnerData.recipe_id,
      recipe_title: dinnerData.recipe?.title,
      recipe_description: null, // DietPlan 타입의 recipe에 description 없음
      instructions: null, // DietPlan 타입에 없음
      composition_summary: dinnerData.compositionSummary || [],
      foodsafety_data: dinnerData.recipe ? {
        rcp_seq: dinnerData.recipe.id?.startsWith('foodsafety-') 
          ? dinnerData.recipe.id.replace('foodsafety-', '') 
          : null,
      } : null,
    };

    // 식약처 API에서 영양소/재료를 실제로 가져와서 시각화에 사용
    try {
      const recipeAny = mealData.recipe as unknown as { id?: unknown; title?: unknown; foodsafety_rcp_seq?: unknown };
      const directSeq = mealData.foodsafety_data?.rcp_seq;
      const embeddedSeq = typeof recipeAny?.foodsafety_rcp_seq === 'string' ? recipeAny.foodsafety_rcp_seq : null;
      const title = typeof recipeAny?.title === 'string' ? recipeAny.title : null;

      let rcpSeq: string | null = directSeq || embeddedSeq;

      if (!rcpSeq && title) {
        console.log('[Dinner Meal API] 식약처 레시피명 검색 시도:', title);
        const searchResult = await searchFoodSafetyRecipesByName(title, { startIdx: 1, endIdx: 1000 });
        if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
          const exact = searchResult.data.find((r) => r.RCP_NM === title) ?? searchResult.data[0];
          rcpSeq = exact.RCP_SEQ;
        }
      }

      if (rcpSeq) {
        console.log('[Dinner Meal API] 식약처 레시피 조회 시도:', rcpSeq);
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
          console.log('[Dinner Meal API] 식약처 영양소 반영 완료');
        } else {
          console.warn('[Dinner Meal API] 식약처 레시피 조회 실패(무시):', mfdsResult.error);
        }
      }
    } catch (mfdsError) {
      console.warn('[Dinner Meal API] 식약처 API 연동 실패(무시):', mfdsError);
    }

    console.log('✅ 저녁 식단 조회 완료');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      meal: mealData,
      healthProfile: healthProfile ? {
        diseases: normalizeConditionCodes(healthProfile.diseases),
        allergies: normalizeConditionCodes(healthProfile.allergies),
        daily_calorie_goal: healthProfile.daily_calorie_goal || 2000,
      } : null,
    });

  } catch (error) {
    console.error('[Dinner Meal API] 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      { success: false, error: '저녁 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
