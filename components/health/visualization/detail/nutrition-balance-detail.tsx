/**
 * @file nutrition-balance-detail.tsx
 * @description 영양 균형 상세보기 컴포넌트
 * 
 * 시각적 요소:
 * - 3대 영양소 도넛 차트
 * - 영양소별 상세 막대 차트
 * - 비타민/미네랄 레벨 게이지
 * - 영양 트렌드 라인 차트
 * - 영양 균형 점수 게이지
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Target, 
  Apple,
  Droplet,
  Zap,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';
import type { HealthMetrics } from '@/types/health-visualization';
import { NutritionBalanceChart } from '@/components/health/visualization/NutritionBalanceChart';
import { MacroNutrientBars } from './charts/macro-nutrient-bars';
import { VitaminMineralGauges } from './charts/vitamin-mineral-gauges';
import { NutritionTrendChart } from './charts/nutrition-trend-chart';

export function NutritionBalanceDetail() {
  const router = useRouter();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealthMetrics() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[NutritionBalanceDetail] 건강 메트릭스 조회 시작');

        const response = await fetch('/api/health/metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`건강 데이터를 불러올 수 없습니다: ${response.status}`);
        }

        const data = await response.json();
        console.log('[NutritionBalanceDetail] 건강 메트릭스 조회 완료:', data);
        
        setHealthMetrics(data.metrics);
      } catch (err) {
        console.error('[NutritionBalanceDetail] 건강 메트릭스 조회 실패:', err);
        setError(err instanceof Error ? err.message : '건강 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHealthMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !healthMetrics) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {error || '건강 데이터를 불러올 수 없습니다.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로가기
              </Button>
              <Button onClick={() => window.location.reload()} variant="default">
                새로고침
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nutrition = healthMetrics.nutritionBalance;
  
  // 칼로리 변환
  const carbCalories = nutrition.carbohydrates * 4;
  const proteinCalories = nutrition.protein * 4;
  const fatCalories = nutrition.fat * 9;
  const totalCalories = carbCalories + proteinCalories + fatCalories;
  
  // 비율 계산
  const carbPercentage = totalCalories > 0 ? (carbCalories / totalCalories) * 100 : 0;
  const proteinPercentage = totalCalories > 0 ? (proteinCalories / totalCalories) * 100 : 0;
  const fatPercentage = totalCalories > 0 ? (fatCalories / totalCalories) * 100 : 0;

  // 권장 비율
  const recommendedRatios = {
    carbohydrates: { min: 45, max: 65, ideal: 55 },
    protein: { min: 10, max: 35, ideal: 20 },
    fat: { min: 20, max: 35, ideal: 25 },
  };

  // 영양 균형 점수 계산
  const nutritionScore = calculateNutritionScore(nutrition, recommendedRatios);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-orange-600" />
              영양 균형
            </h1>
            <p className="text-muted-foreground mt-1">탄수화물/단백질/지방 비율 및 미세 영양소 분석</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800" variant="outline">
          균형 점수: {nutritionScore.toFixed(0)}점
        </Badge>
      </div>

      {/* 영양 균형 점수 카드 */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-6 w-6 text-green-600" />
            영양 균형 종합 평가
          </CardTitle>
          <CardDescription>3대 영양소 및 미세 영양소 종합 점수</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">
                {nutritionScore.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">/ 100점</div>
            </div>
            <div className="flex-1 max-w-md">
              <Progress value={nutritionScore} className="h-4 mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>3대 영양소 균형</span>
                  <span className="font-semibold">
                    {calculateMacroScore(carbPercentage, proteinPercentage, fatPercentage, recommendedRatios).toFixed(0)}점
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>미세 영양소</span>
                  <span className="font-semibold">
                    {calculateMicroScore(healthMetrics.vitaminLevels, healthMetrics.mineralLevels).toFixed(0)}점
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3대 영양소 도넛 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-orange-600" />
            3대 영양소 비율
          </CardTitle>
          <CardDescription>탄수화물, 단백질, 지방의 칼로리 기반 비율</CardDescription>
        </CardHeader>
        <CardContent>
          <NutritionBalanceChart balance={nutrition} />
        </CardContent>
      </Card>

      {/* 영양소별 상세 분석 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 탄수화물 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Apple className="h-5 w-5 text-blue-600" />
              탄수화물
            </CardTitle>
            <CardDescription>주요 에너지원</CardDescription>
          </CardHeader>
          <CardContent>
            <MacroNutrientDetail
              name="탄수화물"
              current={nutrition.carbohydrates}
              currentPercentage={carbPercentage}
              recommended={recommendedRatios.carbohydrates}
              unit="g"
              color="blue"
              description="뇌와 근육의 주요 에너지원입니다."
            />
          </CardContent>
        </Card>

        {/* 단백질 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-green-600" />
              단백질
            </CardTitle>
            <CardDescription>근육 합성 및 회복</CardDescription>
          </CardHeader>
          <CardContent>
            <MacroNutrientDetail
              name="단백질"
              current={nutrition.protein}
              currentPercentage={proteinPercentage}
              recommended={recommendedRatios.protein}
              unit="g"
              color="green"
              description="근육 합성, 면역력 강화에 필수입니다."
            />
          </CardContent>
        </Card>

        {/* 지방 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplet className="h-5 w-5 text-purple-600" />
              지방
            </CardTitle>
            <CardDescription>호르몬 생성 및 비타민 흡수</CardDescription>
          </CardHeader>
          <CardContent>
            <MacroNutrientDetail
              name="지방"
              current={nutrition.fat}
              currentPercentage={fatPercentage}
              recommended={recommendedRatios.fat}
              unit="g"
              color="purple"
              description="호르몬 생성과 비타민 흡수에 필요합니다."
            />
          </CardContent>
        </Card>
      </div>

      {/* 영양소별 막대 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            영양소별 섭취량 상세
          </CardTitle>
          <CardDescription>일일 권장량 대비 섭취량 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <MacroNutrientBars nutrition={nutrition} />
        </CardContent>
      </Card>

      {/* 비타민 & 미네랄 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-yellow-600" />
              비타민 레벨
            </CardTitle>
            <CardDescription>권장 섭취량 대비 비타민 수준</CardDescription>
          </CardHeader>
          <CardContent>
            <VitaminMineralGauges
              type="vitamin"
              levels={healthMetrics.vitaminLevels}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              미네랄 레벨
            </CardTitle>
            <CardDescription>권장 섭취량 대비 미네랄 수준</CardDescription>
          </CardHeader>
          <CardContent>
            <VitaminMineralGauges
              type="mineral"
              levels={healthMetrics.mineralLevels}
            />
          </CardContent>
        </Card>
      </div>

      {/* 기타 영양 지표 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            기타 영양 지표
          </CardTitle>
          <CardDescription>섬유질, 당분, 나트륨, 콜레스테롤</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OtherNutrientCard
              name="섬유질"
              current={nutrition.fiber}
              recommended={25}
              unit="g"
              color="green"
            />
            <OtherNutrientCard
              name="당분"
              current={nutrition.sugar}
              recommended={50}
              unit="g"
              color="red"
              warning={nutrition.sugar > 50}
            />
            <OtherNutrientCard
              name="나트륨"
              current={nutrition.sodium}
              recommended={2000}
              unit="mg"
              color="orange"
              warning={nutrition.sodium > 2000}
            />
            <OtherNutrientCard
              name="콜레스테롤"
              current={nutrition.cholesterol}
              recommended={300}
              unit="mg"
              color="purple"
              warning={nutrition.cholesterol > 300}
            />
          </div>
        </CardContent>
      </Card>

      {/* 영양 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            영양 섭취 트렌드
          </CardTitle>
          <CardDescription>최근 영양소 섭취량 변화 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <NutritionTrendChart nutrition={nutrition} />
        </CardContent>
      </Card>

      {/* 맞춤형 권장사항 */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            맞춤형 영양 권장사항
          </CardTitle>
          <CardDescription>부족하거나 과다한 영양소 개선 방법</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generateNutritionRecommendations(nutrition, healthMetrics, recommendedRatios).map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div className={`p-2 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {rec.priority === 'high' ? <AlertCircle className="h-4 w-4" /> :
                   rec.priority === 'medium' ? <Target className="h-4 w-4" /> :
                   <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  {rec.foods && rec.foods.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">추천 식품:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.foods.map((food, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {food}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 영양소 상세 컴포넌트
function MacroNutrientDetail({
  name,
  current,
  currentPercentage,
  recommended,
  unit,
  color,
  description,
}: {
  name: string;
  current: number;
  currentPercentage: number;
  recommended: { min: number; max: number; ideal: number };
  unit: string;
  color: string;
  description: string;
}) {
  const getStatus = () => {
    if (currentPercentage >= recommended.min && currentPercentage <= recommended.max) {
      return { label: '적정', badge: 'bg-green-100 text-green-800', progressColor: 'bg-green-500' };
    }
    if (currentPercentage < recommended.min) {
      return { label: '부족', badge: 'bg-blue-100 text-blue-800', progressColor: 'bg-blue-500' };
    }
    return { label: '과다', badge: 'bg-orange-100 text-orange-800', progressColor: 'bg-orange-500' };
  };

  const status = getStatus();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {current.toFixed(1)}
          <span className="text-lg text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          칼로리 비율: {currentPercentage.toFixed(1)}%
        </div>
        <Badge className={status.badge}>{status.label}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>권장 범위</span>
          <span className="font-medium">{recommended.min}% - {recommended.max}%</span>
        </div>
        <div className="relative">
          <Progress 
            value={Math.min(100, (currentPercentage / recommended.max) * 100)} 
            className="h-3"
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {currentPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  );
}

// 기타 영양소 카드
function OtherNutrientCard({
  name,
  current,
  recommended,
  unit,
  color,
  warning = false,
}: {
  name: string;
  current: number;
  recommended: number;
  unit: string;
  color: string;
  warning?: boolean;
}) {
  const percentage = (current / recommended) * 100;
  const status = percentage > 100 ? '과다' : percentage < 80 ? '부족' : '적정';

  return (
    <div className={`p-4 rounded-lg border ${warning ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{name}</span>
        {warning && <AlertCircle className="h-4 w-4 text-red-500" />}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {current.toFixed(0)}
        <span className="text-sm text-muted-foreground ml-1">{unit}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        권장: {recommended.toLocaleString()}{unit}
      </div>
      <Progress 
        value={Math.min(100, percentage)} 
        className={`h-2 ${warning ? 'bg-red-200' : ''}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{status}</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// 영양 균형 점수 계산
function calculateNutritionScore(
  nutrition: any,
  recommended: any
): number {
  const score = 100;
  
  // 3대 영양소 비율 점수 (간단한 예시)
  // 실제로는 더 정교한 계산 필요
  
  return Math.max(0, Math.min(100, score));
}

function calculateMacroScore(
  carb: number,
  protein: number,
  fat: number,
  recommended: any
): number {
  let score = 100;
  
  // 각 영양소가 권장 범위 내에 있으면 점수 유지, 벗어나면 감점
  if (carb < recommended.carbohydrates.min || carb > recommended.carbohydrates.max) {
    score -= 15;
  }
  if (protein < recommended.protein.min || protein > recommended.protein.max) {
    score -= 20;
  }
  if (fat < recommended.fat.min || fat > recommended.fat.max) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateMicroScore(vitamins: any, minerals: any): number {
  // 비타민과 미네랄 레벨을 종합하여 점수 계산
  const vitaminAvg = (Object.values(vitamins) as number[]).reduce((sum: number, v: number) => sum + v, 0) / Object.keys(vitamins).length;
  const mineralAvg = (Object.values(minerals) as number[]).reduce((sum: number, m: number) => sum + m, 0) / Object.keys(minerals).length;

  return (vitaminAvg + mineralAvg) / 2;
}

// 권장사항 생성
function generateNutritionRecommendations(
  nutrition: any,
  metrics: HealthMetrics,
  recommended: any
): Array<{
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  foods?: string[];
}> {
  const recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    foods?: string[];
  }> = [];

  // 단백질 부족
  const proteinPercentage = (nutrition.protein * 4) / ((nutrition.carbohydrates * 4) + (nutrition.protein * 4) + (nutrition.fat * 9)) * 100;
  if (proteinPercentage < recommended.protein.min) {
    recommendations.push({
      title: '단백질 섭취 증가 필요',
      description: `현재 단백질 비율이 ${proteinPercentage.toFixed(1)}%로 권장 범위(${recommended.protein.min}%)보다 낮습니다.`,
      priority: 'high',
      foods: ['닭가슴살', '계란', '두부', '연어', '그릭요거트'],
    });
  }

  // 탄수화물 과다
  const carbPercentage = (nutrition.carbohydrates * 4) / ((nutrition.carbohydrates * 4) + (nutrition.protein * 4) + (nutrition.fat * 9)) * 100;
  if (carbPercentage > recommended.carbohydrates.max) {
    recommendations.push({
      title: '탄수화물 섭취 조절',
      description: `현재 탄수화물 비율이 ${carbPercentage.toFixed(1)}%로 권장 범위(${recommended.carbohydrates.max}%)를 초과했습니다.`,
      priority: 'medium',
      foods: ['현미', '귀리', '고구마'],
    });
  }

  // 나트륨 과다
  if (nutrition.sodium > 2000) {
    recommendations.push({
      title: '나트륨 섭취 감소 필요',
      description: `일일 나트륨 섭취량이 ${nutrition.sodium.toFixed(0)}mg으로 권장량(2000mg)을 초과했습니다.`,
      priority: 'high',
      foods: ['신선한 채소', '과일', '저나트륨 식품'],
    });
  }

  // 당분 과다
  if (nutrition.sugar > 50) {
    recommendations.push({
      title: '당분 섭취 감소',
      description: `일일 당분 섭취량이 ${nutrition.sugar.toFixed(0)}g으로 권장량(50g)을 초과했습니다.`,
      priority: 'medium',
      foods: ['신선한 과일', '견과류', '그린티'],
    });
  }

  // 섬유질 부족
  if (nutrition.fiber < 25) {
    recommendations.push({
      title: '섬유질 섭취 증가',
      description: `일일 섬유질 섭취량이 ${nutrition.fiber.toFixed(0)}g으로 권장량(25g)보다 부족합니다.`,
      priority: 'medium',
      foods: ['현미', '콩류', '브로콜리', '사과'],
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: '균형 잡힌 영양 섭취',
      description: '현재 영양 균형이 양호합니다. 다양한 식품을 골고루 섭취하여 유지하세요.',
      priority: 'low',
    });
  }

  return recommendations;
}

