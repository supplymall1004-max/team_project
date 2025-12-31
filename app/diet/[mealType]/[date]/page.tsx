/**
 * @file app/diet/[mealType]/[date]/page.tsx
 * @description 건강 맞춤 식단 상세 페이지 (통합 서버 컴포넌트)
 *
 * 아침/점심/저녁 식단 상세 페이지를 동적 라우팅으로 통합했습니다.
 * 식약처 레시피 데이터를 활용하여 건강 맞춤 식단의 선택 이유와 효과를 보여줍니다.
 */

import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getDailyDietPlan, getUserHealthProfile } from '@/lib/diet/queries';
import { loadRecipeBySeq, loadRecipeByTitle } from '@/lib/mfds/recipe-loader';
import { calculateMealSelectionReason } from '@/lib/diet/meal-selection-reason';
import { MealDetailPageClient } from '@/components/diet/meal-detail-page';
import type { MealType } from '@/types/health';
import { MEAL_TYPE_LABELS } from '@/types/health';
import type { MfdsRecipe } from '@/types/mfds-recipe';

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

export default async function MealDetailPage({ params }: PageProps) {
  console.group('[MealDetailPage] 서버 컴포넌트 렌더링 시작');
  
  const { mealType, date } = await params;
  console.log('📅 날짜:', date);
  console.log('🍽️ 식사 유형:', mealType);

  // mealType 검증
  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  if (!validMealTypes.includes(mealType as MealType)) {
    console.error('❌ 잘못된 식사 유형:', mealType);
    redirect('/diet');
  }

  // 날짜 형식 검증
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('❌ 잘못된 날짜 형식:', date);
    redirect('/diet');
  }

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
    hasMeal: !!dailyPlan?.[mealType as MealType],
    hasHealthProfile: !!healthProfile,
  });

  // 식단 데이터 가져오기
  const mealData = dailyPlan?.[mealType as MealType];
  if (!mealData) {
    console.warn('⚠️ 식단 데이터 없음');
    // 클라이언트에서 처리하도록 null 전달
  }

  // 식약처 레시피 데이터 로드
  let mfdsRecipe: MfdsRecipe | null = null;
  let relatedRecipes: Array<{ rcpSeq: string; title: string; category: string }> = [];

  if (mealData) {
    // 메인 레시피가 식약처 레시피인 경우
    const recipeId = mealData.recipe?.id ?? '';
    const rcpSeq = recipeId.startsWith('foodsafety-') ? recipeId.replace('foodsafety-', '') : null;

    if (rcpSeq) {
      try {
        mfdsRecipe = loadRecipeBySeq(rcpSeq);
        if (mfdsRecipe) {
          console.log(`✅ 메인 레시피 로드: ${mfdsRecipe.title}`);
        }
      } catch (error) {
        console.warn('[MealDetailPage] 메인 레시피 로드 실패:', error);
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
            relatedRecipes.push({
              rcpSeq: recipe.frontmatter.rcp_seq,
              title: recipe.title,
              category: recipe.frontmatter.rcp_pat2 || '기타',
            });
          }
        } catch (error) {
          console.warn(`[MealDetailPage] 관련 레시피 "${title}" 로드 실패:`, error);
        }
      }
      
      console.log(`✅ 관련 레시피 ${relatedRecipes.length}개 로드 완료`);
    }
  }

  // 식단 선택 이유 계산
  let selectionReason = null;
  if (healthProfile && (mfdsRecipe || mealData)) {
    try {
      // mfdsRecipe가 있으면 사용, 없으면 mealData의 영양소 정보 사용
      const nutrition = mfdsRecipe?.nutrition || {
        calories: mealData?.calories || null,
        protein: mealData?.protein || null,
        carbohydrates: mealData?.carbohydrates || null,
        fat: mealData?.fat || null,
        sodium: mealData?.sodium || null,
        fiber: null,
      };
      
      const mealTitle = mfdsRecipe?.title || mealData?.recipe?.title || `${MEAL_TYPE_LABELS[mealType as MealType]} 식단`;
      
      selectionReason = calculateMealSelectionReason(
        nutrition,
        healthProfile,
        mealTitle
      );
      console.log('✅ 식단 선택 이유 계산 완료');
    } catch (error) {
      console.error('[MealDetailPage] 식단 선택 이유 계산 실패:', error);
    }
  }

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

  console.log('[MealDetailPage] 데이터 준비 완료:', {
    hasMealData: !!mealData,
    hasMfdsRecipe: !!mfdsRecipe,
    relatedRecipesCount: relatedRecipes.length,
    hasSelectionReason: !!selectionReason,
    hasHealthProfile: !!clientHealthProfile,
  });

  console.groupEnd();

  return (
    <MealDetailPageClient
      mealType={mealType as MealType}
      date={date}
      mealData={mealData}
      mfdsRecipe={mfdsRecipe}
      relatedRecipes={relatedRecipes}
      selectionReason={selectionReason}
      healthProfile={clientHealthProfile}
      userName={userName}
    />
  );
}

