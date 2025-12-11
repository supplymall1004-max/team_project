/**
 * @file app/api/diet/meal/lunch/[date]/route.ts
 * @description 점심 식단 조회 API
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
    console.group('[Lunch Meal API] 점심 식단 조회 시작');
    
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
    
    if (!dailyPlan || !dailyPlan.lunch) {
      console.warn('⚠️ 점심 식단 없음');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: `${date}의 점심 식단 정보가 없습니다.` },
        { status: 404 }
      );
    }

    const healthProfile = await getUserHealthProfile(userId);
    const lunchData = dailyPlan.lunch;
    
    const mealData = {
      id: lunchData.id || `lunch-${date}`,
      name: lunchData.recipe?.title || lunchData.recipe_title || '점심 식단',
      calories: lunchData.calories || 0,
      nutrition: {
        calories: lunchData.calories || 0,
        protein: lunchData.protein_g || lunchData.protein || 0,
        carbohydrates: lunchData.carbs_g || lunchData.carbohydrates || 0,
        fat: lunchData.fat_g || lunchData.fat || 0,
        fiber: lunchData.fiber_g || 0,
        sugar: 0,
        sodium: lunchData.sodium_mg || lunchData.sodium || 0,
        cholesterol: 0,
        potassium: lunchData.potassium_mg || null,
        phosphorus: lunchData.phosphorus_mg || null,
        gi_index: lunchData.gi_index || null,
      },
      ingredients: Array.isArray(lunchData.ingredients) 
        ? lunchData.ingredients.map((ing: any) => ({
            name: typeof ing === 'string' ? ing : (ing.name || ing),
            quantity: typeof ing === 'object' && ing.quantity ? ing.quantity : null,
          }))
        : [],
      recipe: lunchData.recipe,
      recipe_id: lunchData.recipe_id,
      recipe_title: lunchData.recipe_title,
      recipe_description: lunchData.recipe_description,
      instructions: lunchData.instructions,
      composition_summary: lunchData.compositionSummary || [],
      foodsafety_data: lunchData.recipe ? {
        rcp_seq: lunchData.recipe.id?.startsWith('foodsafety-') 
          ? lunchData.recipe.id.replace('foodsafety-', '') 
          : null,
      } : null,
    };

    console.log('✅ 점심 식단 조회 완료');
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
    console.error('[Lunch Meal API] 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      { success: false, error: '점심 식단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
