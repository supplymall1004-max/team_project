'use client';

/**
 * @file app/diet/dinner/[date]/page.tsx
 * @description 저녁 식단 상세 페이지
 *
 * 기능:
 * 1. 저녁 식단 정보 표시
 * 2. 하루 전체 식단 효과 시각화
 * 3. 저녁 식사 효과 예측
 * 4. 일일 건강 요약 제공
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChefHat, Sunrise, Sun, Moon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HealthMetricsCard } from '@/components/health/visualization/HealthMetricsCard';
import { MealImpactPredictor } from '@/components/health/visualization/MealImpactPredictor';
import { HealthInsightsCard } from '@/components/health/visualization/HealthInsightsCard';
import { NutritionBalanceChart } from '@/components/health/visualization/NutritionBalanceChart';
import { DiseaseRiskGauge } from '@/components/health/visualization/DiseaseRiskGauge';
import { HealthVisualizationErrorBoundary } from '@/components/health/error-boundary';
import { useUser } from '@clerk/nextjs';

// 타입 정의
interface MealData {
  id: string;
  name: string;
  calories: number;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
  };
  ingredients: Array<{
    name: string;
    quantity: number;
  }>;
}

interface DayMeals {
  breakfast: MealData | null;
  lunch: MealData | null;
  dinner: MealData | null;
}

interface HealthProfile {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  daily_calorie_goal: number;
  diseases: string[];
  allergies: string[];
  dietary_preferences: string[];
}

export default function DinnerDetailPage({
  params
}: {
  params: { date: string }
}) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // 상태 관리
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [dayMeals, setDayMeals] = useState<DayMeals>({
    breakfast: null,
    lunch: null,
    dinner: null
  });
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [currentHealth, setCurrentHealth] = useState<any>(null);
  const [dayHealthSummary, setDayHealthSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (!isLoaded || !user) return;

    loadPageData();
  }, [isLoaded, user, params.date]);

  const loadPageData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 병렬로 데이터 로드
      const [dinnerResult, breakfastResult, lunchResult, healthResult, currentHealthResult] = await Promise.all([
        fetch(`/api/diet/meal/dinner/${params.date}`).then(res => res.json()),
        fetch(`/api/diet/meal/breakfast/${params.date}`).then(res => res.json()).catch(() => ({ success: false })),
        fetch(`/api/diet/meal/lunch/${params.date}`).then(res => res.json()).catch(() => ({ success: false })),
        fetch('/api/health/profile').then(res => res.json()),
        fetch('/api/health/metrics').then(res => res.json())
      ]);

      // 오류 처리
      if (!dinnerResult.success) {
        throw new Error(dinnerResult.error || '저녁 식단 데이터를 불러올 수 없습니다.');
      }

      if (!healthResult.success) {
        throw new Error(healthResult.error || '건강 정보를 불러올 수 없습니다.');
      }

      if (!currentHealthResult.success) {
        throw new Error(currentHealthResult.error || '건강 메트릭스를 불러올 수 없습니다.');
      }

      setMealData(dinnerResult.meal);

      // 하루 식단 데이터 설정
      setDayMeals({
        breakfast: breakfastResult.success ? breakfastResult.meal : null,
        lunch: lunchResult.success ? lunchResult.meal : null,
        dinner: dinnerResult.meal
      });

      setHealthProfile(healthResult.profile);
      setCurrentHealth(currentHealthResult.metrics);

      // 하루 건강 요약 계산
      await calculateDayHealthSummary(
        currentHealthResult.metrics,
        {
          breakfast: breakfastResult.success ? breakfastResult.meal : null,
          lunch: lunchResult.success ? lunchResult.meal : null,
          dinner: dinnerResult.meal
        },
        healthResult.profile
      );

    } catch (err) {
      console.error('[DinnerDetailPage] 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 하루 건강 요약 계산
  const calculateDayHealthSummary = async (baseHealth: any, meals: DayMeals, profile: HealthProfile) => {
    try {
      // 하루 총 식단 효과 예측
      const response = await fetch('/api/health/day-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseHealth,
          meals,
          profile,
          date: params.date
        })
      });

      if (response.ok) {
        const result = await response.json();
        setDayHealthSummary(result.summary);
      } else {
        // API가 없으면 간단한 계산
        const totalCalories = Object.values(meals).reduce((sum, meal) =>
          sum + (meal?.calories || 0), 0
        );
        const totalProtein = Object.values(meals).reduce((sum, meal) =>
          sum + (meal?.nutrition?.protein || 0), 0
        );

        setDayHealthSummary({
          totalCalories,
          totalProtein,
          calorieGoal: profile.daily_calorie_goal,
          completionRate: Math.min(100, (totalCalories / profile.daily_calorie_goal) * 100),
          mealsCompleted: Object.values(meals).filter(meal => meal !== null).length
        });
      }
    } catch (err) {
      console.error('하루 건강 요약 계산 실패:', err);
      // 기본값 설정
      const totalCalories = Object.values(meals).reduce((sum, meal) =>
        sum + (meal?.calories || 0), 0
      );

      setDayHealthSummary({
        totalCalories,
        calorieGoal: profile.daily_calorie_goal,
        completionRate: Math.min(100, (totalCalories / profile.daily_calorie_goal) * 100),
        mealsCompleted: Object.values(meals).filter(meal => meal !== null).length
      });
    }
  };

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 스켈레톤 */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* 그리드 레이아웃 스켈레톤 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 필요
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert>
            <AlertDescription>
              로그인이 필요합니다. 로그인 후 다시 시도해주세요.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-4">
            <Button onClick={loadPageData} variant="outline">
              다시 시도
            </Button>
            <Button onClick={() => router.back()}>
              뒤로 가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!mealData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert>
            <AlertDescription>
              {params.date}의 저녁 식단 정보가 없습니다.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push('/diet')}>
              식단 추천 받기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로 가기
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ChefHat className="h-6 w-6" />
                저녁 식단 상세
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {params.date}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  저녁 식사
                </div>
                <div className="flex items-center gap-2">
                  {dayMeals.breakfast && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Sunrise className="h-3 w-3" />
                      아침
                    </Badge>
                  )}
                  {dayMeals.lunch && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Sun className="h-3 w-3" />
                      점심
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Moon className="h-3 w-3" />
                    저녁
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하루 건강 요약 (특별 섹션) */}
        {dayHealthSummary && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                하루 건강 요약
              </CardTitle>
              <CardDescription>
                오늘 하루 식단의 종합 건강 효과
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dayHealthSummary.totalCalories.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">총 칼로리</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(dayHealthSummary.completionRate)}%
                  </div>
                  <div className="text-sm text-gray-600">목표 달성률</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {dayHealthSummary.mealsCompleted}
                  </div>
                  <div className="text-sm text-gray-600">식사 완료</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {dayHealthSummary.totalProtein}g
                  </div>
                  <div className="text-sm text-gray-600">총 단백질</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽 컬럼: 식단 정보 */}
          <div className="space-y-6">
            {/* 식단 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {mealData.name}
                  <Badge variant="secondary">
                    {mealData.calories}kcal
                  </Badge>
                </CardTitle>
                <CardDescription>
                  영양 정보 및 상세 구성
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 영양 정보 요약 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-700">
                      {mealData.nutrition.protein}g
                    </div>
                    <div className="text-xs text-blue-600">단백질</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-700">
                      {mealData.nutrition.carbohydrates}g
                    </div>
                    <div className="text-xs text-green-600">탄수화물</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-700">
                      {mealData.nutrition.fat}g
                    </div>
                    <div className="text-xs text-yellow-600">지방</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-semibold text-purple-700">
                      {mealData.nutrition.fiber}g
                    </div>
                    <div className="text-xs text-purple-600">식이섬유</div>
                  </div>
                </div>

                {/* 재료 목록 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">주요 재료</h4>
                  <div className="flex flex-wrap gap-2">
                    {mealData.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline">
                        {ingredient.name} {ingredient.quantity}g
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 건강 인사이트 */}
            <HealthInsightsCard
              insights={[
                {
                  type: 'positive',
                  title: '균형 잡힌 저녁 식사',
                  description: '적정 칼로리로 하루 식단을 마무리했습니다.',
                  actionable: false,
                  priority: 'medium'
                },
                {
                  type: dayHealthSummary?.completionRate >= 90 ? 'positive' : 'info',
                  title: dayHealthSummary?.completionRate >= 90 ? '칼로리 목표 달성' : '칼로리 목표 진행 중',
                  description: `오늘 칼로리 목표의 ${Math.round(dayHealthSummary?.completionRate || 0)}%를 달성했습니다.`,
                  actionable: false,
                  priority: 'high'
                },
                {
                  type: 'info',
                  title: '하루 식단 완성',
                  description: '오늘 하루 균형 잡힌 식단을 구성했습니다. 내일도 건강한 하루 되세요!',
                  actionable: false,
                  priority: 'low'
                }
              ]}
              title="저녁 식단 건강 인사이트"
            />
          </div>

          {/* 오른쪽 컬럼: 건강 시각화 */}
          <div className="space-y-6">
            {/* 건강 시각화 컴포넌트들을 에러 바운더리로 보호 */}
            <HealthVisualizationErrorBoundary>
              {/* 현재 건강 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle>현재 건강 상태</CardTitle>
                  <CardDescription>
                    하루 식단 누적 효과 반영된 건강 메트릭스
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HealthMetricsCard metrics={currentHealth} />
                </CardContent>
              </Card>

              {/* 저녁 식사 효과 예측 */}
              <MealImpactPredictor
                mealType="dinner"
                mealData={mealData}
                currentHealth={currentHealth}
              />

              {/* 영양 균형 차트 */}
              <NutritionBalanceChart balance={currentHealth.nutritionBalance} />
            </HealthVisualizationErrorBoundary>
          </div>
        </div>

        {/* 질병 위험도 게이지 (풀폭) */}
        <DiseaseRiskGauge risks={currentHealth.diseaseRiskScores} />

        {/* 푸터 안내 */}
        <div className="text-center py-8 border-t">
          <p className="text-sm text-gray-500 mb-2">
            💡 이 정보는 참고용이며 의료 진단을 대체하지 않습니다.
          </p>
          <p className="text-xs text-gray-400">
            건강 문제가 있다면 전문의와 상담해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
