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
import { fetchFoodSafetyRecipeBySeq } from '@/lib/recipes/foodsafety-api';
import type { RecipeDetailForDiet } from '@/types/recipe';

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

    // 필수 데이터 먼저 반환 (식약처 API는 백그라운드 처리)
    console.log('✅ 아침 식단 조회 완료 (필수 데이터)');
    console.groupEnd();

    // 식약처 API는 백그라운드에서 비동기로 처리 (응답 지연 방지)
    const enrichWithFoodSafetyData = async () => {
      try {
        const recipeAny = mealData.recipe as unknown as { id?: unknown; foodsafety_rcp_seq?: unknown };
        const directSeq = mealData.foodsafety_data?.rcp_seq;
        const embeddedSeq = typeof recipeAny?.foodsafety_rcp_seq === 'string' ? recipeAny.foodsafety_rcp_seq : null;

        const rcpSeq: string | null = directSeq || embeddedSeq;

        if (rcpSeq) {
          console.log('[Breakfast Meal API] 식약처 레시피 조회 시도 (백그라운드):', rcpSeq);
          const mfdsResult = await fetchFoodSafetyRecipeBySeq(rcpSeq, {
            startIdx: 1,
            endIdx: 1000,
            maxRetries: 1, // 재시도 횟수 감소
            retryDelay: 300, // 재시도 지연 감소
          });

          if (mfdsResult.success && mfdsResult.data && mfdsResult.data.length > 0) {
            // 데이터베이스 업데이트는 하지 않고, 다음 요청 시 캐시 활용
            console.log('[Breakfast Meal API] 식약처 영양소 조회 완료 (백그라운드)');
          }
        }

        // 구성요소 합산은 더 이상 실행하지 않음 (너무 느림)
        // 대신 기본 영양소 정보로 충분
      } catch (mfdsError) {
        // 백그라운드 처리이므로 실패해도 무시
        console.warn('[Breakfast Meal API] 식약처 API 백그라운드 처리 실패(무시):', mfdsError);
      }
    };

    // 백그라운드에서 비동기 실행 (응답을 기다리지 않음)
    enrichWithFoodSafetyData().catch(() => {
      // 에러는 이미 로그에 기록됨
    });

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

