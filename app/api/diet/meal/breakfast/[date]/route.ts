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
    const dailyPlan = await getDailyDietPlan(userId, date);
    
    if (!dailyPlan || !dailyPlan.breakfast) {
      console.warn('⚠️ 아침 식단 없음');
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
        fiber: 0, // DietPlan 타입에 fiber 속성이 없음
        sugar: 0, // 데이터베이스에 없으면 0
        sodium: breakfastData.sodium || 0,
        cholesterol: 0, // 데이터베이스에 없으면 0
        potassium: null, // DietPlan 타입에 없음
        phosphorus: null, // DietPlan 타입에 없음
        gi_index: null, // DietPlan 타입에 없음
      },
      ingredients: [], // DietPlan 타입에 ingredients 속성이 없음
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
    };

    console.log('✅ 아침 식단 조회 완료');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      meal: mealData,
      healthProfile: healthProfile ? {
        diseases: healthProfile.diseases || [],
        allergies: healthProfile.allergies || [],
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

