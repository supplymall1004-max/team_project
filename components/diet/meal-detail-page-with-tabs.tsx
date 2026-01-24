/**
 * @file components/diet/meal-detail-page-with-tabs.tsx
 * @description 식단 상세 페이지 (탭 네비게이션 포함)
 *
 * 아침/점심/저녁 식단을 탭으로 전환하여 볼 수 있는 통합 페이지입니다.
 * URL의 mealType에 따라 활성 탭이 결정되며, 탭 클릭 시 URL이 변경됩니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ChefHat, Sun, Moon, Utensils, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MealDetailPageClient } from './meal-detail-page';
import type { DailyDietPlan, MealType } from '@/types/health';
import { MEAL_TYPE_LABELS } from '@/types/health';
import type { MfdsRecipe } from '@/types/mfds-recipe';
import type { MealSelectionReason } from '@/lib/diet/meal-selection-reason';

const MEAL_TYPE_ICONS: Record<MealType, typeof Sun> = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Sun,
};

interface MealDetails {
  mfdsRecipe: MfdsRecipe | null;
  relatedRecipes: Array<{ rcpSeq: string; title: string; category: string }>;
  selectionReason: MealSelectionReason | null;
}

interface MealDetailPageWithTabsProps {
  date: string;
  dailyPlan: DailyDietPlan | null;
  healthProfile: {
    age: number;
    gender: string;
    height_cm: number;
    weight_kg: number;
    activity_level: string;
    daily_calorie_goal: number;
    diseases: string[];
    allergies: string[];
    dietary_preferences: string[];
  } | null;
  userName: string;
  currentMealType: MealType;
  mealDetails: Record<MealType, MealDetails>;
}

export function MealDetailPageWithTabs({
  date,
  dailyPlan,
  healthProfile,
  userName,
  currentMealType,
  mealDetails,
}: MealDetailPageWithTabsProps) {
  const router = useRouter();
  const [activeMealType, setActiveMealType] = useState<MealType>(currentMealType);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // currentMealType이 변경되면 활성 탭 업데이트
  useEffect(() => {
    setActiveMealType(currentMealType);
  }, [currentMealType]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (value: string) => {
    const mealType = value as MealType;
    setActiveMealType(mealType);
    
    // URL 변경 (페이지 리로드 없이)
    router.push(`/diet/${mealType}/${date}`, { scroll: false });
  };

  // 날짜 포맷팅
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 뒤로가기 처리
  const handleBack = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shouldRefreshHome', 'true');
        window.location.href = '/';
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[MealDetailPageWithTabs] sessionStorage 접근 실패:', error);
      }
      // sessionStorage 접근 실패 시에도 홈으로 이동
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // 식단 재생성 처리
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/diet/plan?date=${date}&force=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '식단 재생성에 실패했습니다');
      }

      // 재생성 성공 시 페이지 새로고침
      router.refresh();
    } catch (error) {
      console.error('식단 재생성 실패:', error);
      alert(error instanceof Error ? error.message : '식단 재생성에 실패했습니다');
    } finally {
      setIsRegenerating(false);
    }
  };

  // 사용 가능한 식사 타입 확인
  const availableMeals: MealType[] = [];
  if (dailyPlan?.breakfast !== null && dailyPlan?.breakfast !== undefined) {
    availableMeals.push('breakfast');
  }
  if (dailyPlan?.lunch !== null && dailyPlan?.lunch !== undefined) {
    availableMeals.push('lunch');
  }
  if (dailyPlan?.dinner !== null && dailyPlan?.dinner !== undefined) {
    availableMeals.push('dinner');
  }

  // 활성 탭이 사용 불가능하면 첫 번째 사용 가능한 탭으로 변경
  useEffect(() => {
    if (availableMeals.length > 0 && !availableMeals.includes(activeMealType)) {
      const firstAvailable = availableMeals[0];
      setActiveMealType(firstAvailable);
      router.push(`/diet/${firstAvailable}/${date}`, { scroll: false });
    }
  }, [availableMeals, activeMealType, date, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
          <div className="flex items-start gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 hover:bg-slate-100 h-9 w-9 sm:h-10 sm:w-10"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2 sm:mb-3">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 shrink-0">
                  <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <span className="truncate font-sans">오늘의 식단</span>
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <p className="text-xs sm:text-sm text-slate-600">
                  {userName}님을 위한 건강 맞춤 식단
                </p>
                {dailyPlan && (
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 text-xs sm:text-sm"
                  >
                    {isRegenerating ? (
                      <>
                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 animate-spin" />
                        재생성 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                        식단 재생성
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {availableMeals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 shadow-md bg-white p-8 text-center">
            <p className="text-sm sm:text-base text-slate-600 mb-4">
              {formattedDate}의 식단 정보가 아직 없습니다.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              식단을 생성하면 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          <Tabs value={activeMealType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 gap-1">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
                const Icon = MEAL_TYPE_ICONS[mealType];
                const isAvailable = availableMeals.includes(mealType);
                const mealData = dailyPlan?.[mealType];
                
                return (
                  <TabsTrigger
                    key={mealType}
                    value={mealType}
                    disabled={!isAvailable}
                    className="flex items-center gap-1.5 text-xs sm:text-sm data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] sm:text-xs">{MEAL_TYPE_LABELS[mealType]}</span>
                    {mealData && (
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                        ({mealData.calories?.toFixed(0) || 0}kcal)
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* 아침 식단 탭 */}
            <TabsContent value="breakfast" className="mt-0">
              <MealDetailPageClient
                mealType="breakfast"
                date={date}
                mealData={dailyPlan?.breakfast ?? null}
                mfdsRecipe={mealDetails.breakfast.mfdsRecipe}
                relatedRecipes={mealDetails.breakfast.relatedRecipes}
                selectionReason={mealDetails.breakfast.selectionReason}
                healthProfile={healthProfile}
                userName={userName}
              />
            </TabsContent>

            {/* 점심 식단 탭 */}
            <TabsContent value="lunch" className="mt-0">
              <MealDetailPageClient
                mealType="lunch"
                date={date}
                mealData={dailyPlan?.lunch ?? null}
                mfdsRecipe={mealDetails.lunch.mfdsRecipe}
                relatedRecipes={mealDetails.lunch.relatedRecipes}
                selectionReason={mealDetails.lunch.selectionReason}
                healthProfile={healthProfile}
                userName={userName}
              />
            </TabsContent>

            {/* 저녁 식단 탭 */}
            <TabsContent value="dinner" className="mt-0">
              <MealDetailPageClient
                mealType="dinner"
                date={date}
                mealData={dailyPlan?.dinner ?? null}
                mfdsRecipe={mealDetails.dinner.mfdsRecipe}
                relatedRecipes={mealDetails.dinner.relatedRecipes}
                selectionReason={mealDetails.dinner.selectionReason}
                healthProfile={healthProfile}
                userName={userName}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

