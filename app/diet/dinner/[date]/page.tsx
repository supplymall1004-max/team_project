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
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChefHat, Sunrise, Sun, Moon, TrendingUp, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthMetricsCard } from '@/components/health/visualization/HealthMetricsCard';
import { MealImpactPredictor } from '@/components/health/visualization/MealImpactPredictor';
import { HealthInsightsCard } from '@/components/health/visualization/HealthInsightsCard';
import { NutritionBalanceChart } from '@/components/health/visualization/NutritionBalanceChart';
import { DiseaseRiskGauge } from '@/components/health/visualization/DiseaseRiskGauge';
import { HealthVisualizationErrorBoundary } from '@/components/health/error-boundary';
import { useUser } from '@clerk/nextjs';
import type { HealthMetrics } from '@/types/health-visualization';
import type { FamilyMember } from '@/types/family';
import { getMemberMealData, getTabMembers } from '@/lib/diet/family-meal-utils';

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

export default function DinnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const date = params.date as string;

  // 상태 관리
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [dayMeals, setDayMeals] = useState<DayMeals>({
    breakfast: null,
    lunch: null,
    dinner: null
  });
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [currentHealth, setCurrentHealth] = useState<HealthMetrics | null>(null);
  const [dayHealthSummary, setDayHealthSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 가족 구성원 관련 상태
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyDietData, setFamilyDietData] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('self');

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
      const [dinnerRes, breakfastRes, lunchRes, healthRes, metricsRes, membersRes, familyDietRes] = await Promise.all([
        fetch(`/api/diet/meal/dinner/${date}`),
        fetch(`/api/diet/meal/breakfast/${date}`),
        fetch(`/api/diet/meal/lunch/${date}`),
        fetch('/api/health/profile'),
        fetch('/api/health/metrics'),
        fetch('/api/family/members').catch(() => ({ ok: false, json: () => Promise.resolve({ members: [] }) })),
        fetch(`/api/family/diet/${date}`).catch(() => ({ ok: false, status: 404, json: () => Promise.resolve(null) })),
      ]);

      const dinnerResult = (await dinnerRes.json()) as DietMealApiResponse;
      const breakfastResult = (await breakfastRes.json()) as DietMealApiResponse;
      const lunchResult = (await lunchRes.json()) as DietMealApiResponse;
      const healthResult = (await healthRes.json()) as HealthProfileApiResponse;
      const currentHealthResult = (await metricsRes.json()) as HealthMetricsApiResponse;

      // 오류 처리 (저녁)
      if (!dinnerRes.ok || !dinnerResult.success || !dinnerResult.meal) {
        throw new Error(dinnerResult.error || '저녁 식단 데이터를 불러올 수 없습니다.');
      }

      // 오류 처리 (건강 프로필) - { profile } 형태, null도 정상
      if (!healthRes.ok) {
        throw new Error(healthResult.error || healthResult.message || '건강 정보를 불러올 수 없습니다.');
      }

      // 오류 처리 (건강 메트릭스)
      if (!metricsRes.ok || !currentHealthResult.metrics) {
        throw new Error(currentHealthResult.error || currentHealthResult.message || '건강 메트릭스를 불러올 수 없습니다.');
      }

      setMealData(dinnerResult.meal);

      // 하루 식단 데이터 설정
      setDayMeals({
        breakfast: breakfastRes.ok && breakfastResult.success ? breakfastResult.meal ?? null : null,
        lunch: lunchRes.ok && lunchResult.success ? lunchResult.meal ?? null : null,
        dinner: dinnerResult.meal
      });

      setHealthProfile(healthResult.profile ?? null);
      setCurrentHealth(currentHealthResult.metrics);

      // 가족 구성원 데이터 처리
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const members = membersData.members || [];
        console.log(`👥 가족 구성원 ${members.length}명 조회됨`);
        setFamilyMembers(members);
      } else {
        console.log('⚠️ 가족 구성원 조회 실패 (무시)');
        setFamilyMembers([]);
      }

      // 가족 식단 데이터 처리
      if (familyDietRes.ok) {
        const dietData = await familyDietRes.json();
        console.log('📋 가족 식단 데이터 조회됨:', Object.keys(dietData.plans || {}));
        setFamilyDietData(dietData.plans || null);
      } else {
        console.log('⚠️ 가족 식단 데이터 없음 (무시)');
        setFamilyDietData(null);
      }

      // 하루 건강 요약 계산
      await calculateDayHealthSummary(
        currentHealthResult.metrics,
        {
          breakfast: breakfastResult.success ? breakfastResult.meal : null,
          lunch: lunchResult.success ? lunchResult.meal : null,
          dinner: dinnerResult.meal
        },
        // 프로필이 없으면 기본 목표 칼로리로 계산
        (healthResult.profile ?? {
          age: 0,
          gender: '',
          height_cm: 0,
          weight_kg: 0,
          activity_level: '',
          daily_calorie_goal: 2000,
          diseases: [],
          allergies: [],
          dietary_preferences: [],
        })
      );

    } catch (err) {
      console.error('[DinnerDetailPage] 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 하루 건강 요약 계산
  const calculateDayHealthSummary = async (baseHealth: HealthMetrics, meals: DayMeals, profile: HealthProfile) => {
    try {
      // 하루 총 식단 효과 예측
      const response = await fetch('/api/health/day-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseHealth,
          meals,
          profile,
          date: date
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
              {date}의 저녁 식단 정보가 없습니다.
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

  // 탭에 표시할 구성원 목록 생성 (식단이 있는 구성원만)
  const tabMembers = getTabMembers(
    familyMembers,
    familyDietData,
    'dinner',
    date,
    user?.firstName || user?.username || '본인'
  );

  // 현재 선택된 구성원의 식단 데이터
  const currentMealData = activeTab === 'self' 
    ? mealData 
    : getMemberMealData(familyDietData, activeTab, 'dinner', date);

  // 현재 선택된 구성원 정보
  const currentMember = activeTab === 'self'
    ? null
    : familyMembers.find(m => m.id === activeTab);

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
                  {date}
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

        {/* 가족 구성원 탭 (식단이 있는 구성원이 2명 이상일 때만 표시) */}
        {tabMembers.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                구성원별 식단
              </CardTitle>
              <CardDescription>
                가족 구성원들의 저녁 식단을 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabMembers.length}, 1fr)` }}>
                  {tabMembers.map((member) => (
                    <TabsTrigger
                      key={member.id}
                      value={member.id}
                      className="flex items-center gap-2"
                    >
                      {member.isUser ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span className="truncate">{member.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        )}

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
        {currentMealData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽 컬럼: 식단 정보 */}
            <div className="space-y-6">
              {/* 구성원 정보 (가족 구성원인 경우) */}
              {currentMember && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      {currentMember.name}님의 식단
                    </CardTitle>
                    <CardDescription>
                      {currentMember.relationship && `관계: ${currentMember.relationship}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* 식단 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {currentMealData.name}
                    <Badge variant="secondary">
                      {currentMealData.calories}kcal
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
                        {currentMealData.nutrition.protein}g
                      </div>
                      <div className="text-xs text-blue-600">단백질</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-700">
                        {currentMealData.nutrition.carbohydrates}g
                      </div>
                      <div className="text-xs text-green-600">탄수화물</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-700">
                        {currentMealData.nutrition.fat}g
                      </div>
                      <div className="text-xs text-yellow-600">지방</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-700">
                        {currentMealData.nutrition.fiber}g
                      </div>
                      <div className="text-xs text-purple-600">식이섬유</div>
                    </div>
                  </div>

                  {/* 재료 목록 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">주요 재료</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentMealData.ingredients.length > 0 ? (
                        currentMealData.ingredients.map((ingredient, index) => (
                          <Badge key={index} variant="outline">
                            {ingredient.name}
                            {ingredient.quantity > 0 ? ` ${ingredient.quantity}g` : ''}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">재료 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 건강 인사이트 (개인 식단만) */}
              {activeTab === 'self' && (
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
                />
              )}
            </div>

            {/* 오른쪽 컬럼: 건강 시각화 (개인 식단만) */}
            {activeTab === 'self' && (
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
            )}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              선택한 구성원의 저녁 식단 정보가 없습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 질병 위험도 게이지 (풀폭, 개인 식단만) */}
        {activeTab === 'self' && currentHealth && (
          <DiseaseRiskGauge 
            risks={currentHealth.diseaseRiskScores}
            userDiseases={
              healthProfile?.diseases 
                ? Array.isArray(healthProfile.diseases)
                  ? healthProfile.diseases.map(d => typeof d === 'string' ? d : (d && typeof d === 'object' && 'code' in d ? String((d as { code?: unknown }).code || '') : String(d))).filter(Boolean)
                  : []
                : []
            }
          />
        )}

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
