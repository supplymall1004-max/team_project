'use client';

/**
 * @file MealImpactPredictor.tsx
 * @description 식단 효과 예측 컴포넌트
 *
 * 주요 기능:
 * 1. 특정 식사 섭취 전/후 건강 지표 비교
 * 2. 개선 포인트 시각화
 * 3. 목표 달성도 표시
 * 4. 개인화된 건강 인사이트
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import {
  MealImpactPrediction,
  HealthImprovement,
  GoalProgress,
  HealthStatus
} from '@/types/health-visualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface MealImpactPredictorProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealData: any; // 식단 데이터 (실제 타입에 맞게 조정)
  currentHealth: any; // 현재 건강 데이터
  className?: string;
}

interface ComparisonMetric {
  label: string;
  before: number;
  after: number;
  improvement: number;
  unit: string;
  status: 'improved' | 'maintained' | 'declined';
}

export function MealImpactPredictor({
  mealType,
  mealData,
  currentHealth,
  className
}: MealImpactPredictorProps) {
  const [prediction, setPrediction] = useState<MealImpactPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState(false);

  // 식단 효과 예측 계산
  useEffect(() => {
    calculateMealImpact();
  }, [mealType, mealData, currentHealth]);

  const calculateMealImpact = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[MealImpactPredictor] API 요청 시작');
      console.log('[MealImpactPredictor] 전송 데이터:', {
        mealType,
        mealData: JSON.stringify(mealData, null, 2),
        currentHealth: JSON.stringify(currentHealth, null, 2)
      });

      const response = await fetch('/api/health/meal-impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealType,
          mealData,
          currentHealth
        }),
      });

      console.log('[MealImpactPredictor] API 응답 상태:', response.status);
      console.log('[MealImpactPredictor] 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MealImpactPredictor] API 오류 응답:', errorText);
        throw new Error(`식단 효과 예측에 실패했습니다. (${response.status}: ${errorText})`);
      }

      const data = await response.json();
      console.log('[MealImpactPredictor] API 성공 응답:', data);
      setPrediction(data.prediction);

    } catch (err) {
      console.error('[MealImpactPredictor] 예측 실패:', err);
      setError(err instanceof Error ? err.message : '예측 계산 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 비교 메트릭 생성
  const getComparisonMetrics = (): ComparisonMetric[] => {
    if (!prediction) return [];

    const { beforeMetrics, afterMetrics } = prediction;

    return [
      {
        label: '칼로리 균형',
        before: beforeMetrics.overallHealthScore,
        after: afterMetrics.overallHealthScore,
        improvement: ((afterMetrics.overallHealthScore - beforeMetrics.overallHealthScore) /
                     beforeMetrics.overallHealthScore) * 100,
        unit: '점',
        status: afterMetrics.overallHealthScore > beforeMetrics.overallHealthScore ? 'improved' : 'maintained'
      },
      {
        label: '단백질 섭취',
        before: beforeMetrics.nutritionBalance.protein,
        after: afterMetrics.nutritionBalance.protein,
        improvement: ((afterMetrics.nutritionBalance.protein - beforeMetrics.nutritionBalance.protein) /
                     beforeMetrics.nutritionBalance.protein) * 100,
        unit: 'g',
        status: afterMetrics.nutritionBalance.protein > beforeMetrics.nutritionBalance.protein ? 'improved' : 'maintained'
      },
      {
        label: '탄수화물 균형',
        before: beforeMetrics.nutritionBalance.carbohydrates,
        after: afterMetrics.nutritionBalance.carbohydrates,
        improvement: ((afterMetrics.nutritionBalance.carbohydrates - beforeMetrics.nutritionBalance.carbohydrates) /
                     beforeMetrics.nutritionBalance.carbohydrates) * 100,
        unit: 'g',
        status: Math.abs(afterMetrics.nutritionBalance.carbohydrates - beforeMetrics.nutritionBalance.carbohydrates) < 5
               ? 'maintained' : 'improved'
      }
    ];
  };

  // 건강 상태에 따른 색상 및 아이콘
  const getStatusStyles = (status: 'improved' | 'maintained' | 'declined') => {
    const styles = {
      improved: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: TrendingUp
      },
      maintained: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: CheckCircle
      },
      declined: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: TrendingDown
      }
    };
    return styles[status] || styles.maintained;
  };

  // 목표 달성도 링 차트 렌더링
  const renderGoalProgressRing = (progress: GoalProgress['dailyCalories']) => {
    const size = 120;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* 진행률 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-gray-900">
            {progress.percentage}%
          </div>
          <div className="text-xs text-gray-500">달성</div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">식단 효과를 분석하고 있습니다...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">분석 실패</h3>
            <p className="text-red-600 mb-4">{error || '식단 효과 분석에 실패했습니다.'}</p>
            <Button onClick={calculateMealImpact} variant="outline">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const comparisonMetrics = getComparisonMetrics();
  const mealTypeLabels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 메인 예측 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {mealTypeLabels[mealType]} 식단 효과 예측
          </CardTitle>
          <CardDescription>
            이 식사를 섭취했을 때 예상되는 건강 상태 변화
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 목표 달성도 */}
            <div className="text-center">
              <h3 className="font-semibold mb-4">일일 칼로리 목표 달성도</h3>
              {renderGoalProgressRing(prediction.goalProgress.dailyCalories)}
              <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-600">
                  현재: {prediction.goalProgress.dailyCalories.current}kcal
                </p>
                <p className="text-sm text-gray-600">
                  목표: {prediction.goalProgress.dailyCalories.target}kcal
                </p>
              </div>
            </div>

            {/* 건강 점수 변화 */}
            <div className="space-y-4">
              <h3 className="font-semibold">전체 건강 점수 변화</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {prediction.beforeMetrics.overallHealthScore}
                  </div>
                  <div className="text-sm text-gray-500">섭취 전</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {prediction.afterMetrics.overallHealthScore}
                  </div>
                  <div className="text-sm text-green-600">섭취 후</div>
                </div>
              </div>
              <div className="text-center">
                <Badge
                  variant={prediction.afterMetrics.overallHealthScore > prediction.beforeMetrics.overallHealthScore
                         ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {prediction.afterMetrics.overallHealthScore > prediction.beforeMetrics.overallHealthScore
                   ? '+점수 향상' : '점수 유지'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 비교 메트릭 */}
      <Card>
        <CardHeader>
          <CardTitle>영양소 변화 상세</CardTitle>
          <CardDescription>섭취 전/후 주요 영양소 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonMetrics.map((metric, index) => {
              const styles = getStatusStyles(metric.status);
              const Icon = styles.icon;

              return (
                <div key={index} className={`p-4 rounded-lg border ${styles.borderColor} ${styles.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{metric.label}</h4>
                    <div className={`flex items-center gap-1 ${styles.color}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {metric.before}{metric.unit}
                      </div>
                      <div className="text-xs text-gray-500">섭취 전</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {metric.after}{metric.unit}
                      </div>
                      <div className="text-xs text-gray-500">섭취 후</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 건강 인사이트 및 추천 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            건강 인사이트
          </CardTitle>
          <CardDescription>
            이 식단이 주는 건강상의 의미와 개선 방향
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prediction.insights.slice(0, expandedInsights ? undefined : 3).map((insight, index) => (
              <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  index % 3 === 0 ? 'bg-green-500' :
                  index % 3 === 1 ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              </div>
            ))}

            {prediction.insights.length > 3 && (
              <Button
                variant="ghost"
                onClick={() => setExpandedInsights(!expandedInsights)}
                className="w-full"
              >
                {expandedInsights ? '접기' : `더 보기 (${prediction.insights.length - 3}개)`}
              </Button>
            )}
          </div>

          {/* 추천 사항 */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-3">추천 사항</h4>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
