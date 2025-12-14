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
        fiber: 0, // DietPlan 타입에 fiber 속성이 없음
        sugar: 0,
        sodium: dinnerData.sodium || 0,
        cholesterol: 0,
        potassium: null, // DietPlan 타입에 없음
        phosphorus: null, // DietPlan 타입에 없음
        gi_index: null, // DietPlan 타입에 없음
      },
      ingredients: [], // DietPlan 타입에 ingredients 속성이 없음
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

    console.log('✅ 저녁 식단 조회 완료');
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
    console.error('[Dinner Meal API] 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      { success: false, error: '저녁 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
