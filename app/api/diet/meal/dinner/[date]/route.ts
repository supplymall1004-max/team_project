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
        fiber: 0, // 정적 파일에서 채워짐
        sugar: 0, // 정적 파일에 필드 없음
        sodium: dinnerData.sodium || 0,
        cholesterol: 0, // 정적 파일에 필드 없음
        potassium: null, // DietPlan 타입에 없음
        phosphorus: null, // DietPlan 타입에 없음
        gi_index: null, // DietPlan 타입에 없음
      },
      ingredients: [], // 정적 파일에서 채워짐
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
      // 상세 페이지에서 "레시피 바로가기 카드"로 사용할 후보들
      relatedRecipes: [] as RecipeDetailForDiet[],
    };

    // composition_summary에서 식약처 레시피 정보 가져오기 (정적 파일 우선)
    console.log('[Dinner Meal API] composition_summary 파싱 시작...');
    const compositionSummary = dinnerData.compositionSummary || [];
    
    if (Array.isArray(compositionSummary) && compositionSummary.length > 0) {
      console.log('[Dinner Meal API] 구성품 목록:', compositionSummary);
      
      try {
        const { loadAllRecipes, searchRecipes } = await import("@/lib/mfds/recipe-loader");
        const allMfdsRecipes = loadAllRecipes();
        
        // 각 구성품 제목으로 식약처 레시피 찾기
        const foundRecipes: RecipeDetailForDiet[] = [];
        const processedTitles = new Set<string>(); // 중복 제거
        
        // compositionSummary 타입 처리 (string[] 또는 { id, title }[])
        const titles = compositionSummary.map(item => 
          typeof item === 'string' ? item : item.title
        );
        
        for (const title of titles) {
          if (!title || processedTitles.has(title)) continue;
          processedTitles.add(title);
          
          // 정확한 제목 매칭 시도
          let mfdsRecipe = allMfdsRecipes.find(r => r.title === title);
          
          // 정확한 매칭이 없으면 부분 매칭 시도
          if (!mfdsRecipe) {
            const searchResults = searchRecipes(title);
            if (searchResults.length > 0) {
              // 가장 관련성 높은 레시피 선택 (제목이 정확히 일치하는 것 우선)
              mfdsRecipe = searchResults.find(r => r.title === title) || searchResults[0];
            }
          }
          
          if (mfdsRecipe) {
            console.log(`✅ 식약처 레시피 찾음: ${title} → ${mfdsRecipe.title}`);
            
            // MfdsRecipe를 RecipeDetailForDiet 형식으로 변환
            const recipeDetail: RecipeDetailForDiet = {
              id: `foodsafety-${mfdsRecipe.frontmatter.rcp_seq}`,
              title: mfdsRecipe.title,
              description: mfdsRecipe.description || '',
              source: 'foodsafety',
              ingredients: mfdsRecipe.ingredients.map(ing => ({
                name: ing.name,
                amount: '',
                unit: '',
              })),
              instructions: mfdsRecipe.steps.map(step => step.description).join('\n'),
              nutrition: {
                calories: mfdsRecipe.nutrition.calories || 0,
                protein: mfdsRecipe.nutrition.protein || 0,
                carbs: mfdsRecipe.nutrition.carbohydrates || 0,
                fat: mfdsRecipe.nutrition.fat || 0,
                fiber: mfdsRecipe.nutrition.fiber || 0,
                sodium: mfdsRecipe.nutrition.sodium || 0,
              },
              imageUrl: mfdsRecipe.images.mainImageUrl || null,
              emoji: null,
            };
            
            foundRecipes.push(recipeDetail);
          } else {
            console.log(`⚠️ 식약처 레시피를 찾을 수 없음: ${title}`);
          }
        }
        
        mealData.relatedRecipes = foundRecipes;
        console.log(`✅ 식약처 레시피 ${foundRecipes.length}개 찾음`);
      } catch (mfdsError) {
        console.warn('[Dinner Meal API] 식약처 레시피 조회 실패(무시):', mfdsError);
      }
    } else {
      console.log('[Dinner Meal API] composition_summary가 비어있거나 배열이 아님');
    }

    // 필수 데이터 반환 (정적 파일 데이터 포함)
    console.log('✅ 저녁 식단 조회 완료 (필수 데이터)');
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
