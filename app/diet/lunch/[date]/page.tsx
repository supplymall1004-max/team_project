'use client';

/**
 * @file app/diet/lunch/[date]/page.tsx
 * @description 점심 식단 상세 페이지
 *
 * 기능:
 * 1. 점심 식단 정보 표시
 * 2. 아침 식사 반영된 현재 건강 상태 시각화
 * 3. 점심 식사 효과 예측
 * 4. 건강 인사이트 제공
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChefHat, Sunrise } from 'lucide-react';
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
import type { HealthMetrics } from '@/types/health-visualization';

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

interface HealthProfileApiResponse {
  profile: HealthProfile | null;
  error?: string;
  message?: string;
  details?: string;
}

interface HealthMetricsApiResponse {
  success?: boolean;
  metrics?: HealthMetrics;
  error?: string;
  message?: string;
  details?: string;
}

interface DietMealApiResponse {
  success: boolean;
  meal?: MealData;
  error?: string;
}

export default function LunchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const date = params.date as string;

  // 상태 관리
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [morningMealData, setMorningMealData] = useState<MealData | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [currentHealth, setCurrentHealth] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (!isLoaded || !user) return;

    loadPageData();
  }, [isLoaded, user, date]);

  const loadPageData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 병렬로 데이터 로드
      const [lunchRes, morningRes, healthRes, metricsRes] = await Promise.all([
        fetch(`/api/diet/meal/lunch/${date}`),
        fetch(`/api/diet/meal/breakfast/${date}`),
        fetch('/api/health/profile'),
        fetch('/api/health/metrics'),
      ]);

      const lunchResult = (await lunchRes.json()) as DietMealApiResponse;
      const morningResult = (await morningRes.json()) as DietMealApiResponse;
      const healthResult = (await healthRes.json()) as HealthProfileApiResponse;
      const currentHealthResult = (await metricsRes.json()) as HealthMetricsApiResponse;

      // 오류 처리 (점심)
      if (!lunchRes.ok || !lunchResult.success || !lunchResult.meal) {
        throw new Error(lunchResult.error || '점심 식단 데이터를 불러올 수 없습니다.');
      }

      // 오류 처리 (건강 프로필) - { profile } 형태, null도 정상
      if (!healthRes.ok) {
        throw new Error(healthResult.error || healthResult.message || '건강 정보를 불러올 수 없습니다.');
      }

      // 오류 처리 (건강 메트릭스)
      if (!metricsRes.ok || !currentHealthResult.metrics) {
        throw new Error(currentHealthResult.error || currentHealthResult.message || '건강 메트릭스를 불러올 수 없습니다.');
      }

      setMealData(lunchResult.meal);

      // 아침 식단 데이터는 선택적 (404는 정상)
      if (morningRes.ok && morningResult.success && morningResult.meal) {
        setMorningMealData(morningResult.meal);
      }

      setHealthProfile(healthResult.profile ?? null);
      setCurrentHealth(currentHealthResult.metrics);

    } catch (err) {
      console.error('[LunchDetailPage] 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
              {date}의 점심 식단 정보가 없습니다.
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
                점심 식단 상세
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {date}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  점심 식사
                </div>
                {morningMealData && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sunrise className="h-3 w-3" />
                    아침 식사 반영
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  title: '균형 잡힌 점심 식사',
                  description: '주요 영양소를 골고루 포함하고 있습니다.',
                  actionable: false,
                  priority: 'medium'
                },
                {
                  type: morningMealData ? 'positive' : 'warning',
                  title: morningMealData ? '하루 식사 균형' : '아침 식사 정보 없음',
                  description: morningMealData
                    ? '아침 식사와 함께 균형 잡힌 하루 식단을 구성하고 있습니다.'
                    : '아침 식사 정보를 확인하여 전체적인 영양 균형을 파악하세요.',
                  actionable: !morningMealData,
                  priority: morningMealData ? 'low' : 'medium'
                }
              ]}
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
                    {morningMealData ? '아침 식사 반영된' : '기본'} 건강 메트릭스
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HealthMetricsCard metrics={currentHealth} />
                </CardContent>
              </Card>

              {/* 점심 식사 효과 예측 */}
              <MealImpactPredictor
                mealType="lunch"
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
