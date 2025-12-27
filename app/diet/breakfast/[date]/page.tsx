'use client';

/**
 * @file app/diet/breakfast/[date]/page.tsx
 * @description 아침 식단 상세 페이지
 *
 * 기능:
 * 1. 아침 식단 정보 표시
 * 2. 현재 건강 상태 시각화
 * 3. 아침 식사 효과 예측
 * 4. 건강 인사이트 제공
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DirectionalEntrance } from '@/components/motion/directional-entrance';
import { ArrowLeft, Clock, Calendar, ChefHat, User, Users } from 'lucide-react';
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
import { DiseaseFeedbackCard } from '@/components/diet/disease-feedback-card';
import { DietGenerationLogicCard } from '@/components/diet/diet-generation-logic-card';
import { NutritionCharts } from '@/components/charts/nutrition-charts';
import { MealRecipeCard } from '@/components/diet/meal-recipe-card';
import { useUser } from '@clerk/nextjs';
import type { HealthMetrics } from '@/types/health-visualization';
import type { RecipeDetailForDiet, RecipeNutrition } from '@/types/recipe';
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
  relatedRecipes?: RecipeDetailForDiet[];
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
  healthProfile?: {
    diseases?: string[];
    allergies?: string[];
    daily_calorie_goal?: number;
  } | null;
  error?: string;
}

export default function BreakfastDetailPage() {
  console.log('[BreakfastDetailPage] 컴포넌트 렌더링 시작');
  
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const date = params.date as string;

  console.log('[BreakfastDetailPage] 초기 상태:', {
    date,
    isLoaded,
    hasUser: !!user,
    userId: user?.id,
  });

  // 상태 관리
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [apiHealthProfile, setApiHealthProfile] = useState<DietMealApiResponse['healthProfile']>(null);
  const [currentHealth, setCurrentHealth] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 가족 구성원 관련 상태
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyDietData, setFamilyDietData] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('self');

  // 데이터 로드 함수 - 필수 데이터 우선, 선택적 데이터는 백그라운드 로드
  const loadPageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.group('[BreakfastDetailPage] 데이터 로드 시작 (최적화)');
      console.log('📅 날짜:', date);
      console.log('👤 사용자:', user?.id, '로드됨:', isLoaded);

      // 1단계: 필수 데이터만 먼저 로드 (식단 + 건강 프로필)
      console.log('[BreakfastDetailPage] 1단계: 필수 데이터 로드');
      const [mealRes, healthRes] = await Promise.all([
        fetch(`/api/diet/meal/breakfast/${date}`),
        fetch('/api/health/profile'),
      ]);

      console.log('[BreakfastDetailPage] 필수 API 응답 상태:', {
        meal: mealRes.status,
        health: healthRes.status,
      });

      // 필수 데이터 파싱
      const [mealResult, healthResult] = await Promise.all([
        mealRes.json().then(data => ({ ok: mealRes.ok, data: data as DietMealApiResponse })).catch(err => {
          console.error('[BreakfastDetailPage] 식단 API JSON 파싱 실패:', err);
          return { ok: false, data: { success: false, error: '식단 데이터 파싱 실패' } };
        }),
        healthRes.json().then(data => ({ ok: healthRes.ok, data: data as HealthProfileApiResponse })).catch(err => {
          console.error('[BreakfastDetailPage] 건강 프로필 API JSON 파싱 실패:', err);
          return { ok: false, data: { profile: null, error: '건강 프로필 파싱 실패' } };
        }),
      ]);

      // 필수 데이터 오류 처리
      if (!mealResult.ok || !mealResult.data.success || !('meal' in mealResult.data) || !mealResult.data.meal) {
        const errorMessage = ('error' in mealResult.data ? mealResult.data.error : undefined) || '식단 데이터를 불러올 수 없습니다.';
        console.error('[BreakfastDetailPage] 식단 데이터 오류:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!healthResult.ok) {
        const errorMsg = ('error' in healthResult.data ? healthResult.data.error : undefined) || 
                        ('message' in healthResult.data ? healthResult.data.message : undefined) || 
                        '건강 정보를 불러올 수 없습니다.';
        throw new Error(errorMsg);
      }

      // 필수 데이터 상태 업데이트 (즉시 표시)
      if ('meal' in mealResult.data && mealResult.data.meal) {
        setMealData(mealResult.data.meal);
      }
      if ('profile' in healthResult.data) {
        setHealthProfile(healthResult.data.profile ?? null);
      }
      if ('healthProfile' in mealResult.data) {
        setApiHealthProfile(mealResult.data.healthProfile);
      }

      // 로딩 완료 (필수 데이터만으로도 페이지 표시 가능)
      setIsLoading(false);
      console.log('[BreakfastDetailPage] 필수 데이터 로드 완료 - 페이지 표시');

      // 2단계: 선택적 데이터 백그라운드 로드 (건강 메트릭스, 가족 데이터)
      console.log('[BreakfastDetailPage] 2단계: 선택적 데이터 백그라운드 로드');
      Promise.all([
        // 건강 메트릭스 (선택적)
        fetch('/api/health/metrics')
          .then(res => res.json())
          .then(data => {
            const metrics = ('metrics' in data) && data.metrics ? data.metrics : null;
            if (metrics) {
              console.log('[BreakfastDetailPage] 건강 메트릭스 로드 완료');
              setCurrentHealth(metrics);
            }
          })
          .catch(err => {
            console.warn('[BreakfastDetailPage] 건강 메트릭스 로드 실패 (무시):', err);
          }),
        
        // 가족 구성원 데이터 (선택적)
        fetch('/api/family/members')
          .then(res => res.ok ? res.json() : { members: [] })
          .then(data => {
            const members = Array.isArray(data.members) ? data.members : [];
            if (members.length > 0) {
              console.log(`[BreakfastDetailPage] 가족 구성원 ${members.length}명 로드 완료`);
              setFamilyMembers(members);
              
              // 가족 구성원이 있으면 가족 식단도 로드
              fetch(`/api/family/diet/${date}`)
                .then(res => res.ok ? res.json() : null)
                .then(dietData => {
                  const plans = dietData?.plans || null;
                  if (plans) {
                    console.log('[BreakfastDetailPage] 가족 식단 데이터 로드 완료:', Object.keys(plans));
                    setFamilyDietData(plans);
                  }
                })
                .catch(err => {
                  console.warn('[BreakfastDetailPage] 가족 식단 로드 실패 (무시):', err);
                });
            }
          })
          .catch(err => {
            console.warn('[BreakfastDetailPage] 가족 구성원 로드 실패 (무시):', err);
            setFamilyMembers([]);
          }),
      ]).then(() => {
        console.log('[BreakfastDetailPage] 선택적 데이터 로드 완료');
      });

      console.groupEnd();

    } catch (err) {
      console.error('[BreakfastDetailPage] 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [date, user?.id, isLoaded]);

  // 데이터 로드 실행
  useEffect(() => {
    console.log('[BreakfastDetailPage] useEffect 실행:', { isLoaded, hasUser: !!user, date });
    if (!isLoaded) {
      console.log('[BreakfastDetailPage] Clerk 로딩 대기 중...');
      return;
    }
    if (!user) {
      console.log('[BreakfastDetailPage] 사용자 없음 - 로그인 필요');
      return;
    }
    console.log('[BreakfastDetailPage] 데이터 로드 시작');
    loadPageData();
  }, [isLoaded, user, loadPageData, date]);

  // 탭에 표시할 구성원 목록 생성 (식단 on 상태인 구성원 모두 포함) - useMemo로 최적화
  // Hook은 조건부 return 이전에 호출되어야 함
  const tabMembers = useMemo(() => {
    // 사용자 이름: fullName 우선, 없으면 firstName + lastName 조합, 그래도 없으면 username
    const userName = user?.fullName || 
                     [user?.firstName, user?.lastName].filter(Boolean).join(" ") || 
                     user?.username || 
                     '본인';
    return getTabMembers(
      familyMembers,
      familyDietData,
      'breakfast',
      date,
      userName
    );
  }, [familyMembers, familyDietData, date, user?.fullName, user?.firstName, user?.lastName, user?.username]);

  // 현재 선택된 구성원의 식단 데이터 - useMemo로 최적화
  const currentMealData = useMemo(() => {
    return activeTab === 'self' 
      ? mealData 
      : getMemberMealData(familyDietData, activeTab, 'breakfast', date);
  }, [activeTab, mealData, familyDietData, date]);

  // 현재 선택된 구성원 정보 - useMemo로 최적화
  const currentMember = useMemo(() => {
    return activeTab === 'self'
      ? null
      : familyMembers.find(m => m.id === activeTab);
  }, [activeTab, familyMembers]);

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">인증 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
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
              {date}의 아침 식단 정보가 없습니다.
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

  // 디버깅 로그
  console.log('[BreakfastDetailPage] 렌더링 상태:', {
    mealData: !!mealData,
    currentMealData: !!currentMealData,
    activeTab,
    isLoading,
    error,
    isLoaded,
    user: !!user,
  });

  // DirectionalEntrance는 데이터가 있을 때만 사용 (애니메이션 지연 방지)
  const content = (
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
                아침 식단 상세
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {date}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  아침 식사
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
                가족 구성원들의 아침 식단을 확인할 수 있습니다.
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

              {/* 식단 메뉴별 레시피 바로가기 (개인 식단만) */}
              {activeTab === 'self' && Array.isArray(mealData.relatedRecipes) && mealData.relatedRecipes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>식단 메뉴 레시피 바로가기</CardTitle>
                    <CardDescription>
                      아래 카드를 눌러 각 메뉴의 레시피 상세로 이동할 수 있어요.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mealData.relatedRecipes.map((recipe, idx) => {
                        const nutrition = recipe.nutrition as RecipeNutrition;
                        return (
                          <MealRecipeCard
                            key={`${recipe.id ?? recipe.title}-${idx}`}
                            recipe={recipe}
                            category="메뉴"
                            nutrition={nutrition}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 식약처 API 데이터 시각화 (개인 식단만) */}
              {activeTab === 'self' && mealData && (
                <Card>
                  <CardHeader>
                    <CardTitle>영양소 시각화</CardTitle>
                    <CardDescription>
                      식약처 API 데이터 기반 영양 성분 분석
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NutritionCharts
                      nutrition={{
                        calories: mealData.nutrition.calories,
                        carbohydrate: mealData.nutrition.carbohydrates,
                        protein: mealData.nutrition.protein,
                        fat: mealData.nutrition.fat,
                        sodium: mealData.nutrition.sodium,
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 질병별 피드백 (개인 식단만) */}
              {activeTab === 'self' && mealData && apiHealthProfile && (
                <DiseaseFeedbackCard
                  diseases={apiHealthProfile.diseases || []}
                  mealNutrition={mealData.nutrition}
                  mealName={mealData.name}
                />
              )}

              {/* 식단 생성 로직 설명 (개인 식단만) */}
              {activeTab === 'self' && mealData && apiHealthProfile && (
                <DietGenerationLogicCard
                  healthProfile={apiHealthProfile}
                  mealNutrition={mealData.nutrition}
                  mealType="breakfast"
                />
              )}

              {/* 건강 인사이트 (개인 식단만) */}
              {activeTab === 'self' && (
                <HealthInsightsCard
                  insights={[
                    {
                      type: 'positive',
                      title: '균형 잡힌 아침 식사',
                      description: '단백질과 탄수화물이 적절히 균형을 이루고 있습니다.',
                      actionable: false,
                      priority: 'medium'
                    },
                    {
                      type: 'info',
                      title: '식이섬유 섭취',
                      description: '하루 목표 섬유질의 25%를 아침 식사로 섭취했습니다.',
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
                        아침 식사 전 건강 메트릭스
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentHealth ? (
                        <HealthMetricsCard metrics={currentHealth} />
                      ) : (
                        <p className="text-sm text-gray-500">건강 메트릭스 데이터를 불러올 수 없습니다.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 아침 식사 효과 예측 */}
                  {currentHealth && (
                    <>
                      <MealImpactPredictor
                        mealType="breakfast"
                        mealData={mealData}
                        currentHealth={currentHealth}
                      />

                      {/* 영양 균형 차트 */}
                      <NutritionBalanceChart balance={currentHealth.nutritionBalance} />
                    </>
                  )}
                </HealthVisualizationErrorBoundary>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>식단 정보 없음</CardTitle>
              <CardDescription>
                {activeTab === 'self' 
                  ? `${date}의 아침 식단 정보가 없습니다.`
                  : `선택한 구성원의 아침 식단 정보가 없습니다.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    {activeTab === 'self' 
                      ? '아침 식단이 생성되지 않았습니다. 식단 추천을 받아보세요.'
                      : '해당 구성원의 아침 식단이 없습니다.'}
                  </AlertDescription>
                </Alert>
                <div className="flex gap-4">
                  <Button onClick={() => router.push('/diet')} variant="default">
                    식단 추천 받기
                  </Button>
                  <Button onClick={() => router.back()} variant="outline">
                    뒤로 가기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 질병 위험도 게이지 (풀폭, 개인 식단만) */}
        {activeTab === 'self' && currentHealth && (
          <DiseaseRiskGauge 
            risks={currentHealth.diseaseRiskScores}
            userDiseases={
              apiHealthProfile?.diseases 
                ? Array.isArray(apiHealthProfile.diseases)
                  ? apiHealthProfile.diseases.map(d => typeof d === 'string' ? d : (d && typeof d === 'object' && 'code' in d ? String((d as { code?: unknown }).code || '') : String(d))).filter(Boolean)
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

  // 데이터가 있을 때만 애니메이션 적용
  return currentMealData ? (
    <DirectionalEntrance direction="up" delay={0.1}>
      {content}
    </DirectionalEntrance>
  ) : (
    content
  );
}
