/**
 * @file app/diet/[mealType]/[date]/page.tsx
 * @description 식사별 식단 상세 페이지
 *
 * 특정 날짜의 아침/점심/저녁 식단 상세 정보를 표시하는 페이지입니다.
 * 탭으로 다른 식사 타입으로 전환할 수 있습니다.
 */

import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getDailyDietPlan, getUserHealthProfile } from '@/lib/diet/queries';
import { loadRecipeBySeq, loadRecipeByTitle } from '@/lib/mfds/recipe-loader';
import { calculateMealSelectionReason } from '@/lib/diet/meal-selection-reason';
import { MealDetailPageWithTabs } from '@/components/diet/meal-detail-page-with-tabs';
import type { DailyDietPlan, MealType } from '@/types/health';
import { MEAL_TYPE_LABELS } from '@/types/health';
import type { MfdsRecipe } from '@/types/mfds-recipe';
import type { MealSelectionReason } from '@/lib/diet/meal-selection-reason';

/**
 * 질병/알레르기 코드 정규화
 */
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

interface PageProps {
  params: Promise<{ mealType: string; date: string }>;
}

// 동적 라우트 설정
export const dynamicParams = true;
export const revalidate = 0;

export default async function MealDetailPage({ params }: PageProps) {
  try {
    console.group('[MealDetailPage] 서버 컴포넌트 렌더링 시작');
    
    const { mealType, date } = await params;
    
    console.log('🍽️ 식사 타입:', mealType);
    console.log('📅 날짜:', date);

    // 날짜 형식 검증
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('❌ 잘못된 날짜 형식:', date);
      redirect('/diet');
    }

    // mealType 검증
    const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(mealType as MealType)) {
      console.error('❌ 잘못된 식사 타입:', mealType);
      redirect('/diet');
    }

    const currentMealType = mealType as MealType;

    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error('❌ 인증 실패');
      redirect('/sign-in');
    }

    // 사용자 정보 가져오기
    const user = await currentUser();
    const userName = user?.fullName || 
                     [user?.firstName, user?.lastName].filter(Boolean).join(" ") || 
                     user?.username || 
                     '본인';

    console.log('👤 사용자:', clerkUserId);

    // Supabase 사용자 ID 조회
    const supabase = getServiceRoleClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error('❌ 사용자 정보 조회 실패:', userError);
      redirect('/diet');
    }

    const userId = userData.id;
    console.log('👤 Supabase 사용자 ID:', userId);

    // 병렬로 필수 데이터 로드
    console.log('[MealDetailPage] 필수 데이터 병렬 로드 시작');
    const [dailyPlan, healthProfile] = await Promise.all([
      getDailyDietPlan(userId, date),
      getUserHealthProfile(userId),
    ]);

    console.log('[MealDetailPage] 필수 데이터 로드 완료:', {
      hasDailyPlan: !!dailyPlan,
      hasBreakfast: !!dailyPlan?.breakfast,
      hasLunch: !!dailyPlan?.lunch,
      hasDinner: !!dailyPlan?.dinner,
      hasHealthProfile: !!healthProfile,
    });

    // 건강 프로필 변환
    const clientHealthProfile = healthProfile ? {
      age: healthProfile.age || 30,
      gender: healthProfile.gender || 'male',
      height_cm: healthProfile.height_cm || 170,
      weight_kg: healthProfile.weight_kg || 70,
      activity_level: healthProfile.activity_level || 'moderate',
      daily_calorie_goal: healthProfile.daily_calorie_goal || 2000,
      diseases: normalizeConditionCodes(healthProfile.diseases),
      allergies: normalizeConditionCodes(healthProfile.allergies),
      dietary_preferences: Array.isArray(healthProfile.dietary_preferences) 
        ? healthProfile.dietary_preferences 
        : [],
    } : null;

    // 각 식사별로 상세 데이터 준비
    const mealDetails: Record<MealType, {
      mfdsRecipe: MfdsRecipe | null;
      relatedRecipes: Array<{ rcpSeq: string; title: string; category: string }>;
      selectionReason: MealSelectionReason | null;
    }> = {
      breakfast: { mfdsRecipe: null, relatedRecipes: [], selectionReason: null },
      lunch: { mfdsRecipe: null, relatedRecipes: [], selectionReason: null },
      dinner: { mfdsRecipe: null, relatedRecipes: [], selectionReason: null },
      snack: { mfdsRecipe: null, relatedRecipes: [], selectionReason: null },
    };

    // 각 식사별로 데이터 로드
    for (const mealTypeKey of ['breakfast', 'lunch', 'dinner'] as MealType[]) {
      const mealData = dailyPlan?.[mealTypeKey];
      if (!mealData) {
        console.log(`⚠️ ${mealTypeKey} 식단 데이터 없음`);
        continue;
      }

      console.log(`📋 ${mealTypeKey} 식단 처리 시작:`, {
        hasRecipe: !!mealData.recipe,
        recipeId: mealData.recipe?.id,
        recipeTitle: mealData.recipe?.title,
        hasCompositionSummary: !!mealData.compositionSummary,
      });

      // 메인 레시피가 식약처 레시피인 경우
      const recipeId = mealData.recipe?.id ?? '';
      const rcpSeq = recipeId.startsWith('foodsafety-') 
        ? recipeId.replace('foodsafety-', '') 
        : (/^\d+$/.test(recipeId) ? recipeId : null);

      if (rcpSeq) {
        try {
          const mfdsRecipe = loadRecipeBySeq(rcpSeq);
          if (mfdsRecipe) {
            mealDetails[mealTypeKey].mfdsRecipe = mfdsRecipe;
            console.log(`✅ ${mealTypeKey} 메인 레시피 로드: ${mfdsRecipe.title}`);
          }
        } catch (error) {
          console.warn(`[MealDetailPage] ${mealTypeKey} 메인 레시피 로드 실패:`, error);
        }
      }

      // composition_summary에서 관련 레시피 로드
      const compositionSummary = mealData.compositionSummary || [];
      if (Array.isArray(compositionSummary) && compositionSummary.length > 0) {
        const processedTitles = new Set<string>();
        
        for (const title of compositionSummary) {
          if (!title || typeof title !== 'string' || processedTitles.has(title)) continue;
          processedTitles.add(title);
          
          try {
            const recipe = loadRecipeByTitle(title);
            if (recipe) {
              mealDetails[mealTypeKey].relatedRecipes.push({
                rcpSeq: recipe.frontmatter.rcp_seq,
                title: recipe.title,
                category: recipe.frontmatter.rcp_pat2 || '기타',
              });
            }
          } catch (error) {
            console.warn(`[MealDetailPage] ${mealTypeKey} 관련 레시피 "${title}" 로드 실패:`, error);
          }
        }
        
        console.log(`✅ ${mealTypeKey} 관련 레시피 ${mealDetails[mealTypeKey].relatedRecipes.length}개 로드 완료`);
      }

      // 식단 선택 이유 계산
      if (healthProfile) {
        try {
          const mfdsRecipe = mealDetails[mealTypeKey].mfdsRecipe;
          const nutrition = mfdsRecipe?.nutrition || {
            calories: mealData?.calories || null,
            protein: mealData?.protein || null,
            carbohydrates: mealData?.carbohydrates || null,
            fat: mealData?.fat || null,
            sodium: mealData?.sodium || null,
            fiber: null,
          };
          
          const mealTitle = mfdsRecipe?.title || mealData?.recipe?.title || `${MEAL_TYPE_LABELS[mealTypeKey]} 식단`;
          
          mealDetails[mealTypeKey].selectionReason = calculateMealSelectionReason(
            nutrition,
            healthProfile,
            mealTitle
          );
          
          console.log(`✅ ${mealTypeKey} 식단 선택 이유 계산 완료`);
        } catch (error) {
          console.error(`[MealDetailPage] ${mealTypeKey} 식단 선택 이유 계산 실패:`, error);
        }
      }
    }

    console.log('[MealDetailPage] 데이터 준비 완료:', {
      hasDailyPlan: !!dailyPlan,
      hasHealthProfile: !!clientHealthProfile,
      mealDetails: {
        breakfast: { 
          hasMfds: !!mealDetails.breakfast.mfdsRecipe, 
          relatedCount: mealDetails.breakfast.relatedRecipes.length,
          hasSelectionReason: !!mealDetails.breakfast.selectionReason,
        },
        lunch: { 
          hasMfds: !!mealDetails.lunch.mfdsRecipe, 
          relatedCount: mealDetails.lunch.relatedRecipes.length,
          hasSelectionReason: !!mealDetails.lunch.selectionReason,
        },
        dinner: { 
          hasMfds: !!mealDetails.dinner.mfdsRecipe, 
          relatedCount: mealDetails.dinner.relatedRecipes.length,
          hasSelectionReason: !!mealDetails.dinner.selectionReason,
        },
      },
    });

    console.groupEnd();

    return (
      <MealDetailPageWithTabs
        date={date}
        dailyPlan={dailyPlan}
        healthProfile={clientHealthProfile}
        userName={userName}
        currentMealType={currentMealType}
        mealDetails={mealDetails}
      />
    );
  } catch (error) {
    console.error('[MealDetailPage] 치명적 에러 발생:', error);
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
    }
    console.groupEnd();
    redirect('/diet');
  }
}

