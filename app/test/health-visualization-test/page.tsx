/**
 * @file app/test/health-visualization-test/page.tsx
 * @description 건강 시각화 컴포넌트 통합 테스트 페이지
 * 
 * 이 페이지는 건강 시각화 컴포넌트들을 테스트하기 위한 데모 페이지입니다.
 * 실제 API 대신 목(mock) 데이터를 사용하여 컴포넌트를 검증합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  HealthMetrics,
  MealImpactPrediction,
  HealthInsight,
  NutritionBalance,
  DiseaseRiskScores
} from '@/types/health-visualization';
import { HealthMetricsCard } from '@/components/health/visualization/HealthMetricsCard';
import { NutritionBalanceChart } from '@/components/health/visualization/NutritionBalanceChart';
import { DiseaseRiskGauge } from '@/components/health/visualization/DiseaseRiskGauge';
import { HealthInsightsCard } from '@/components/health/visualization/HealthInsightsCard';
import { MealImpactPredictor } from '@/components/health/visualization/MealImpactPredictor';
import { CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';

// 상태 관리
interface TestData {
  metrics: HealthMetrics;
  prediction: MealImpactPrediction;
}

export default function HealthVisualizationTestPage() {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 실제 API에서 데이터를 불러오는 함수들
  const loadTestData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 병렬로 실제 API 호출
      const [metricsResponse, mealImpactResponse] = await Promise.all([
        fetch('/api/health/metrics'),
        fetch('/api/health/meal-impact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealType: 'breakfast',
            mealData: {
              id: 'test-breakfast',
              name: '현미밥과 채소 계란찜',
              calories: 485,
              nutrition: {
                calories: 485,
                protein: 22.5,
                carbohydrates: 58.2,
                fat: 18.3,
                fiber: 8.4,
                sugar: 12.1,
                sodium: 892,
                cholesterol: 245
              },
              ingredients: [
                { name: '현미밥', quantity: 210 },
                { name: '계란', quantity: 100 },
                { name: '시금치', quantity: 50 }
              ]
            },
            currentHealth: mockHealthMetrics
          })
        })
      ]);

      const metricsData = await metricsResponse.json();
      const mealImpactData = await mealImpactResponse.json();

      console.log('API 응답:', { metricsData, mealImpactData });

      if (metricsResponse.ok && metricsData.success) {
        setTestData(prev => ({
          metrics: metricsData.metrics,
          prediction: prev?.prediction || mockMealPrediction
        }));
      }

      if (mealImpactResponse.ok && mealImpactData.success) {
        setTestData(prev => ({
          metrics: prev?.metrics || mockHealthMetrics,
          prediction: mealImpactData.prediction
        }));
      }

      // 둘 다 실패한 경우 fallback 데이터 사용
      if (!metricsResponse.ok && !mealImpactResponse.ok) {
        setTestData({
          metrics: mockHealthMetrics,
          prediction: mockMealPrediction
        });
      }

    } catch (err) {
      console.error('테스트 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터 로드 실패');

      // 에러 시에도 fallback 데이터 표시
      setTestData({
        metrics: mockHealthMetrics,
        prediction: mockMealPrediction
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 로드 시 실제 데이터 로드
  useEffect(() => {
    loadTestData();
  }, []);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              건강 시각화 테스트 로딩 중...
            </h1>
            <p className="text-gray-600">
              실제 API에서 데이터를 불러오고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 표시
  if (error && !testData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              데이터 로드 실패
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTestData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 목(Mock) 데이터 생성 (fallback용)
const mockHealthMetrics: HealthMetrics = {
  bmi: 23.5,
  bodyFatPercentage: 18,
  muscleMass: 32,
  basalMetabolicRate: 1650,
  nutritionBalance: {
    carbohydrates: 250,
    protein: 80,
    fat: 70,
    fiber: 25,
    sugar: 45,
    sodium: 2800,
    cholesterol: 250
  },
  vitaminLevels: {
    vitaminA: 85,
    vitaminB: 78,
    vitaminC: 92,
    vitaminD: 45,
    vitaminE: 67
  },
  mineralLevels: {
    calcium: 78,
    iron: 82,
    magnesium: 65,
    potassium: 88,
    zinc: 71
  },
  diseaseRiskScores: {
    cardiovascular: 25,
    diabetes: 18,
    kidney: 12,
    obesity: 20,
    hypertension: 22
  },
  dailyActivity: {
    steps: 8000,
    activeMinutes: 45,
    caloriesBurned: 320,
    exerciseIntensity: 'moderate' as const
  },
  overallHealthScore: 78,
  healthStatus: 'good' as const
};

const mockInsights: HealthInsight[] = [
  {
    type: 'positive',
    title: '건강한 체중 범위',
    description: '현재 BMI가 정상 범위에 있어 건강 상태가 좋습니다.',
    actionable: false,
    priority: 'low'
  },
  {
    type: 'warning',
    title: '나트륨 섭취량 주의',
    description: '하루 나트륨 섭취량이 권장량을 초과했습니다. 가공식품 섭취를 줄여보세요.',
    actionable: true,
    priority: 'high'
  },
  {
    type: 'info',
    title: '비타민 D 보충 권장',
    description: '비타민 D 수치가 낮습니다. 햇빛을 쬐거나 보충제 섭취를 고려하세요.',
    actionable: true,
    priority: 'medium'
  },
  {
    type: 'positive',
    title: '단백질 섭취량 적정',
    description: '단백질 섭취가 목표치를 달성했습니다.',
    actionable: false,
    priority: 'low'
  }
];

const mockMealData = {
  id: 'meal-1',
  name: '아침 식단',
  calories: 500,
  nutrition: {
    calories: 500,
    protein: 25,
    carbohydrates: 60,
    fat: 15,
    fiber: 8,
    sugar: 10,
    sodium: 650,
    cholesterol: 80
  },
  ingredients: [
    { name: '현미밥', quantity: 150 },
    { name: '계란후라이', quantity: 2 },
    { name: '시금치나물', quantity: 100 },
    { name: '김치', quantity: 50 }
  ]
};

const mockMealPrediction: MealImpactPrediction = {

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 페이지 헤더 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            건강 시각화 기능 테스트
          </h1>
          <p className="text-lg text-gray-600">
            실제 API 연동으로 건강 시각화 컴포넌트들을 테스트합니다
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Button onClick={loadTestData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              데이터 새로고침
            </Button>
          </div>
        </div>

        {/* 테스트 결과 요약 */}
        {testResults.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>테스트 결과</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : result.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{result.message}</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 테스트 탭 */}
        <Tabs value={activeTest} onValueChange={setActiveTest}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="metrics">건강 지표</TabsTrigger>
            <TabsTrigger value="nutrition">영양 분석</TabsTrigger>
            <TabsTrigger value="risks">위험도</TabsTrigger>
            <TabsTrigger value="prediction">효과 예측</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>테스트 시작</CardTitle>
                <CardDescription>
                  각 컴포넌트를 개별적으로 테스트하거나 전체 테스트를 실행하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button onClick={() => runComponentTest('HealthMetricsCard')}>
                    건강 지표 테스트
                  </Button>
                  <Button onClick={() => runComponentTest('NutritionBalanceChart')}>
                    영양 차트 테스트
                  </Button>
                  <Button onClick={() => runComponentTest('DiseaseRiskGauge')}>
                    위험도 게이지 테스트
                  </Button>
                  <Button onClick={() => runComponentTest('HealthInsightsCard')}>
                    인사이트 테스트
                  </Button>
                  <Button onClick={() => runComponentTest('MealImpactPredictor')}>
                    효과 예측 테스트
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      runComponentTest('All Components');
                      setActiveTest('metrics');
                    }}
                  >
                    전체 테스트 실행
                  </Button>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-2">테스트 환경 정보</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Next.js 버전:</span>
                      <span className="ml-2 font-mono">15.5.6</span>
                    </div>
                    <div>
                      <span className="text-gray-600">React 버전:</span>
                      <span className="ml-2 font-mono">19</span>
                    </div>
                    <div>
                      <span className="text-gray-600">TypeScript:</span>
                      <span className="ml-2 font-mono">✅</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tailwind CSS:</span>
                      <span className="ml-2 font-mono">v4</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 건강 지표 탭 */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>HealthMetricsCard 컴포넌트 테스트</CardTitle>
                <CardDescription>
                  BMI, 체지방률, 근육량, 기초대사율 표시
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthMetricsCard metrics={testData?.metrics || mockHealthMetrics} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 영양 분석 탭 */}
          <TabsContent value="nutrition" className="space-y-6">
            <NutritionBalanceChart balance={testData?.metrics.nutritionBalance || mockHealthMetrics.nutritionBalance} />
            <HealthInsightsCard insights={mockInsights} />
          </TabsContent>

          {/* 위험도 탭 */}
          <TabsContent value="risks" className="space-y-6">
            <DiseaseRiskGauge risks={testData?.metrics.diseaseRiskScores || mockHealthMetrics.diseaseRiskScores} />
          </TabsContent>

          {/* 효과 예측 탭 */}
          <TabsContent value="prediction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>MealImpactPredictor 테스트</CardTitle>
                <CardDescription>
                  식사 섭취 후 건강 변화 예측 (목 데이터 사용)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    이 컴포넌트는 API 연동이 필요합니다. 
                    실제 환경에서는 /api/health/meal-impact 엔드포인트를 호출합니다.
                  </AlertDescription>
                </Alert>
                
                {/* 목 데이터 표시 */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">테스트 식단 데이터</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(mockMealData, null, 2)}
                    </pre>
                  </div>

                  <MealImpactPredictor
                    mealType="breakfast"
                    mealData={{
                      id: 'test-breakfast',
                      name: '현미밥과 채소 계란찜',
                      calories: 485,
                      nutrition: {
                        calories: 485,
                        protein: 22.5,
                        carbohydrates: 58.2,
                        fat: 18.3,
                        fiber: 8.4,
                        sugar: 12.1,
                        sodium: 892,
                        cholesterol: 245
                      },
                      ingredients: [
                        { name: '현미밥', quantity: 210 },
                        { name: '계란', quantity: 100 },
                        { name: '시금치', quantity: 50 }
                      ]
                    }}
                    currentHealth={testData?.metrics || mockHealthMetrics}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* API 엔드포인트 테스트 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>API 엔드포인트 테스트</CardTitle>
            <CardDescription>
              실제 API 엔드포인트가 정상 작동하는지 확인
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/health/metrics');
                    if (response.ok) {
                      setTestResults(prev => [
                        ...prev,
                        {
                          component: 'API: /api/health/metrics',
                          status: 'success',
                          message: '건강 메트릭스 API 정상 작동'
                        }
                      ]);
                    } else {
                      throw new Error(`HTTP ${response.status}`);
                    }
                  } catch (error) {
                    setTestResults(prev => [
                      ...prev,
                      {
                        component: 'API: /api/health/metrics',
                        status: 'error',
                        message: `API 호출 실패: ${error}`
                      }
                    ]);
                  }
                }}
              >
                /api/health/metrics 테스트
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/health/meal-impact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        mealType: 'breakfast',
                        mealData: mockMealData,
                        currentHealth: mockHealthMetrics
                      })
                    });
                    if (response.ok) {
                      setTestResults(prev => [
                        ...prev,
                        {
                          component: 'API: /api/health/meal-impact',
                          status: 'success',
                          message: '식단 효과 예측 API 정상 작동'
                        }
                      ]);
                    } else {
                      throw new Error(`HTTP ${response.status}`);
                    }
                  } catch (error) {
                    setTestResults(prev => [
                      ...prev,
                      {
                        component: 'API: /api/health/meal-impact',
                        status: 'error',
                        message: `API 호출 실패: ${error}`
                      }
                    ]);
                  }
                }}
              >
                /api/health/meal-impact 테스트
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>참고:</strong> API 테스트는 로그인이 필요할 수 있습니다. 
                401 에러가 발생하면 먼저 로그인 후 테스트하세요.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t">
          <p>
            건강 시각화 기능 v1.0.0 | 
            <a href="/docs/health-visualization-integration-checklist.md" className="underline ml-1">
              통합 가이드 보기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
