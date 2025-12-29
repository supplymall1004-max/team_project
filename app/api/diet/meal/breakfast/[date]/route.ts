/**
 * @file app/api/diet/meal/breakfast/[date]/route.ts
 * @description 아침 식단 조회 API
 * 
 * 실제 데이터베이스에서 식단 데이터를 조회하여 반환합니다.
 * 정적 파일 데이터와 건강 프로필 정보를 포함합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getDailyDietPlan } from '@/lib/diet/queries';
import { getUserHealthProfile } from '@/lib/diet/queries';
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
        fiber: 0, // 정적 파일에서 채워짐
        sugar: 0, // 정적 파일에 필드 없음
        sodium: breakfastData.sodium || 0,
        cholesterol: 0, // 정적 파일에 필드 없음
        potassium: null, // DietPlan 타입에 없음
        phosphorus: null, // DietPlan 타입에 없음
        gi_index: null, // DietPlan 타입에 없음
      },
      ingredients: [], // 정적 파일에서 채워짐
      recipe: breakfastData.recipe,
      recipe_id: breakfastData.recipe_id,
      recipe_title: breakfastData.recipe?.title,
      recipe_description: null, // DietPlan 타입의 recipe에 description 없음
      instructions: null, // DietPlan 타입에 없음
      composition_summary: breakfastData.compositionSummary || [], // DietPlan 타입에 있음
      // 정적 파일 데이터 (레시피에 있는 경우)
      foodsafety_data: breakfastData.recipe ? {
        rcp_seq: breakfastData.recipe.id?.startsWith('foodsafety-') 
          ? breakfastData.recipe.id.replace('foodsafety-', '') 
          : null,
      } : null,
      // 상세 페이지에서 "레시피 바로가기 카드"로 사용할 후보들
      relatedRecipes: [] as RecipeDetailForDiet[],
    };

    // composition_summary에서 식약처 레시피 정보 가져오기
    console.log('[Breakfast Meal API] composition_summary 파싱 시작...');
    const compositionSummary = breakfastData.compositionSummary || [];
    
    if (Array.isArray(compositionSummary) && compositionSummary.length > 0) {
      console.log('[Breakfast Meal API] 구성품 목록:', compositionSummary);
      
      try {
        const { loadAllRecipes, searchRecipes } = await import("@/lib/mfds/recipe-loader");
        const allMfdsRecipes = loadAllRecipes();
        
        // 각 구성품 제목으로 식약처 레시피 찾기
        const foundRecipes: RecipeDetailForDiet[] = [];
        const processedTitles = new Set<string>(); // 중복 제거
        
        for (const title of compositionSummary) {
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
        console.warn('[Breakfast Meal API] 식약처 레시피 조회 실패(무시):', mfdsError);
      }
    } else {
      console.log('[Breakfast Meal API] composition_summary가 비어있거나 배열이 아님');
    }

    // 필수 데이터 반환 (정적 파일 데이터 포함)
    console.log('✅ 아침 식단 조회 완료 (필수 데이터)');
    console.groupEnd();

    // 식약처 레시피 데이터는 정적 파일에서만 가져오기 (RCP_SEQ가 있는 경우)
    try {
      const recipeAny = mealData.recipe as unknown as { id?: unknown; foodsafety_rcp_seq?: unknown };
      const directSeq = mealData.foodsafety_data?.rcp_seq;
      const embeddedSeq = typeof recipeAny?.foodsafety_rcp_seq === 'string' ? recipeAny.foodsafety_rcp_seq : null;
      const rcpSeq: string | null = directSeq || embeddedSeq;

      if (rcpSeq) {
        console.log('[Breakfast Meal API] 식약처 레시피 조회 시도 (정적 파일):', rcpSeq);
        const { loadRecipeBySeq } = await import("@/lib/mfds/recipe-loader");
        const mfdsRecipe = loadRecipeBySeq(rcpSeq);

        if (mfdsRecipe) {
          // 정적 파일에서 찾은 레시피 정보로 영양소 업데이트
          mealData.nutrition.calories = mfdsRecipe.nutrition.calories || mealData.nutrition.calories;
          mealData.nutrition.carbohydrates = mfdsRecipe.nutrition.carbohydrates || mealData.nutrition.carbohydrates;
          mealData.nutrition.protein = mfdsRecipe.nutrition.protein || mealData.nutrition.protein;
          mealData.nutrition.fat = mfdsRecipe.nutrition.fat || mealData.nutrition.fat;
          mealData.nutrition.sodium = mfdsRecipe.nutrition.sodium || mealData.nutrition.sodium;
          mealData.nutrition.fiber = mfdsRecipe.nutrition.fiber || mealData.nutrition.fiber;
          mealData.calories = mealData.nutrition.calories;
          mealData.ingredients = mfdsRecipe.ingredients.map(ing => ({ name: ing.name, quantity: 0 }));

          // relatedRecipes에 추가
          mealData.relatedRecipes.push({
            id: `foodsafety-${mfdsRecipe.frontmatter.rcp_seq}`,
            source: 'foodsafety',
            title: mfdsRecipe.title,
            description: mfdsRecipe.description || '',
            ingredients: mfdsRecipe.ingredients.map(ing => ({ name: ing.name, amount: '', unit: '' })),
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
          });

          console.log('[Breakfast Meal API] 정적 파일에서 식약처 레시피 로드 완료');
        } else {
          console.log('[Breakfast Meal API] 정적 파일에서 레시피를 찾을 수 없음:', rcpSeq);
        }
      }
    } catch (mfdsError) {
      console.warn('[Breakfast Meal API] 식약처 레시피 조회 실패(무시):', mfdsError);
    }

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

