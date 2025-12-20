/**
 * @file diet-impact-detail.tsx
 * @description 식단 효과 예측 상세보기 컴포넌트
 * 
 * 시각적 요소:
 * - 목표 달성률 링 차트
 * - 칼로리 목표 게이지
 * - 3대 영양소 목표 달성률 막대 차트
 * - 개선 포인트 카드
 * - 식단 효과 시뮬레이션 차트
 * - 건강 목표별 달성률
 * - 트렌드 그래프
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
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight
} from 'lucide-react';
import type { HealthMetrics } from '@/types/health-visualization';
import { GoalProgressRing } from './charts/goal-progress-ring';
import { CalorieGoalGauge } from './charts/calorie-goal-gauge';
import { MacroGoalBars } from './charts/macro-goal-bars';
import { ImpactSimulationChart } from './charts/impact-simulation-chart';
import { GoalProgressTrend } from './charts/goal-progress-trend';
import { getHealthMetrics } from '@/actions/health/metrics';
import { getHealthProfile } from '@/actions/health/profile';

export function DietImpactDetail() {
  const router = useRouter();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealthData() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[DietImpactDetail] 건강 데이터 조회 시작');

        const [metricsResult, profile] = await Promise.all([
          getHealthMetrics(),
          getHealthProfile().catch(() => null),
        ]);

        console.log('[DietImpactDetail] 건강 메트릭스 조회 완료:', metricsResult);
        
        setHealthMetrics(metricsResult.metrics);

        if (profile) {
          setHealthProfile(profile);
        }
      } catch (err) {
        console.error('[DietImpactDetail] 건강 데이터 조회 실패:', err);
        setError(err instanceof Error ? err.message : '건강 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHealthData();
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

  // 목표 달성률 계산
  const goalProgress = calculateGoalProgress(healthMetrics, healthProfile);
  const improvements = generateImprovements(healthMetrics, goalProgress);

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
              <TrendingUp className="h-8 w-8 text-orange-600" />
              식단 효과 예측
            </h1>
            <p className="text-muted-foreground mt-1">목표 달성률 및 개선 포인트 분석</p>
          </div>
        </div>
        <Badge className="bg-orange-100 text-orange-800" variant="outline">
          달성률: {goalProgress.overall.toFixed(0)}%
        </Badge>
      </div>

      {/* 목표 달성률 종합 */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-orange-600" />
            전체 목표 달성률
          </CardTitle>
          <CardDescription>칼로리, 영양소, 활동량 종합 평가</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <GoalProgressRing progress={goalProgress.overall} />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">칼로리 목표</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {goalProgress.calories.percentage.toFixed(0)}%
                  </div>
                  <Progress value={goalProgress.calories.percentage} className="h-2 mt-2" />
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">영양 균형</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {goalProgress.nutrition.percentage.toFixed(0)}%
                  </div>
                  <Progress value={goalProgress.nutrition.percentage} className="h-2 mt-2" />
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">활동량</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {goalProgress.activity.percentage.toFixed(0)}%
                  </div>
                  <Progress value={goalProgress.activity.percentage} className="h-2 mt-2" />
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">건강 점수</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {healthMetrics.overallHealthScore.toFixed(0)}점
                  </div>
                  <Progress value={healthMetrics.overallHealthScore} className="h-2 mt-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 칼로리 목표 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            칼로리 목표 분석
          </CardTitle>
          <CardDescription>섭취 칼로리 vs 소모 칼로리 vs 목표 칼로리</CardDescription>
        </CardHeader>
        <CardContent>
          <CalorieGoalGauge 
            current={goalProgress.calories.current}
            target={goalProgress.calories.target}
            burned={healthMetrics.dailyActivity.caloriesBurned}
            bmr={healthMetrics.basalMetabolicRate}
          />
        </CardContent>
      </Card>

      {/* 3대 영양소 목표 달성률 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            3대 영양소 목표 달성률
          </CardTitle>
          <CardDescription>탄수화물, 단백질, 지방 목표 대비 달성률</CardDescription>
        </CardHeader>
        <CardContent>
          <MacroGoalBars goalProgress={goalProgress} />
        </CardContent>
      </Card>

      {/* 주요 개선 포인트 */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            주요 개선 포인트
          </CardTitle>
          <CardDescription>우선순위별 개선이 필요한 항목</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {improvements.map((improvement, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  improvement.priority === 'high' ? 'border-red-200 bg-red-50' :
                  improvement.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    improvement.priority === 'high' ? 'bg-red-100 text-red-600' :
                    improvement.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {improvement.priority === 'high' ? <AlertCircle className="h-5 w-5" /> :
                     improvement.priority === 'medium' ? <Target className="h-5 w-5" /> :
                     <TrendingUp className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{improvement.title}</h4>
                      <Badge 
                        variant="outline"
                        className={
                          improvement.priority === 'high' ? 'bg-red-100 text-red-800' :
                          improvement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {improvement.priority === 'high' ? '높음' :
                         improvement.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{improvement.description}</p>
                    {improvement.currentValue !== undefined && improvement.targetValue !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">현재</span>
                          <span className="font-semibold">{improvement.currentValue}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">목표</span>
                          <span className="font-semibold">{improvement.targetValue}</span>
                        </div>
                        <Progress 
                          value={improvement.progress || 0} 
                          className="h-2"
                        />
                      </div>
                    )}
                    {improvement.actions && improvement.actions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">실행 방법:</p>
                        <ul className="space-y-1">
                          {improvement.actions.map((action, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 식단 효과 시뮬레이션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-purple-600" />
            식단 효과 시뮬레이션
          </CardTitle>
          <CardDescription>개선된 식단 적용 시 예상 건강 점수 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ImpactSimulationChart 
            currentScore={healthMetrics.overallHealthScore}
            improvements={improvements}
          />
        </CardContent>
      </Card>

      {/* 건강 목표별 달성률 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            건강 목표별 달성률
          </CardTitle>
          <CardDescription>체중 관리, 근육량, 심혈관 건강 등 목표 달성 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generateHealthGoals(healthMetrics, goalProgress).map((goal, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                  <Badge 
                    variant="outline"
                    className={
                      goal.percentage >= 80 ? 'bg-green-100 text-green-800' :
                      goal.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }
                  >
                    {goal.percentage.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={goal.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 목표 달성률 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            목표 달성률 트렌드
          </CardTitle>
          <CardDescription>일일/주간/월간 목표 달성률 변화 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <GoalProgressTrend currentProgress={goalProgress.overall} />
        </CardContent>
      </Card>

      {/* 실행 가능한 액션 플랜 */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            실행 가능한 액션 플랜
          </CardTitle>
          <CardDescription>오늘부터 시작할 수 있는 구체적인 개선 방법</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                오늘 할 수 있는 개선 사항
              </h4>
              <div className="space-y-2">
                {improvements
                  .filter(imp => imp.priority === 'high')
                  .slice(0, 3)
                  .map((imp, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-lg border">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{imp.title}</p>
                        {imp.actions && imp.actions[0] && (
                          <p className="text-xs text-muted-foreground mt-1">{imp.actions[0]}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                이번 주 목표
              </h4>
              <div className="space-y-2">
                {generateWeeklyGoals(improvements).map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm text-gray-700">{goal}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                이번 달 목표
              </h4>
              <div className="space-y-2">
                {generateMonthlyGoals(goalProgress).map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-sm text-gray-700">{goal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 목표 달성률 계산
function calculateGoalProgress(metrics: HealthMetrics, profile: any): any {
  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const nutrition = metrics.nutritionBalance;
  
  // 현재 섭취 칼로리 계산
  const currentCalories = (nutrition.carbohydrates * 4) + (nutrition.protein * 4) + (nutrition.fat * 9);
  
  return {
    overall: 75, // 종합 달성률 (예시)
    calories: {
      current: currentCalories,
      target: calorieGoal,
      percentage: Math.min(100, (currentCalories / calorieGoal) * 100),
    },
    nutrition: {
      percentage: 70, // 영양 균형 달성률 (예시)
    },
    activity: {
      percentage: Math.min(100, (metrics.dailyActivity.steps / 10000) * 100),
    },
    macros: {
      carbohydrates: {
        current: nutrition.carbohydrates,
        target: 300,
        percentage: Math.min(100, (nutrition.carbohydrates / 300) * 100),
      },
      protein: {
        current: nutrition.protein,
        target: 100,
        percentage: Math.min(100, (nutrition.protein / 100) * 100),
      },
      fat: {
        current: nutrition.fat,
        target: 70,
        percentage: Math.min(100, (nutrition.fat / 70) * 100),
      },
    },
  };
}

// 개선 포인트 생성
function generateImprovements(metrics: HealthMetrics, goalProgress: any): Array<{
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  currentValue?: string;
  targetValue?: string;
  progress?: number;
  actions?: string[];
}> {
  const improvements: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    currentValue?: string;
    targetValue?: string;
    progress?: number;
    actions?: string[];
  }> = [];

  // 단백질 부족
  if (goalProgress.macros.protein.percentage < 80) {
    improvements.push({
      title: '단백질 섭취 증가 권장',
      description: `현재 단백질 섭취량이 ${goalProgress.macros.protein.current.toFixed(1)}g으로 목표(${goalProgress.macros.protein.target}g)의 ${goalProgress.macros.protein.percentage.toFixed(0)}%만 달성했습니다.`,
      priority: 'high',
      currentValue: `${goalProgress.macros.protein.current.toFixed(1)}g`,
      targetValue: `${goalProgress.macros.protein.target}g`,
      progress: goalProgress.macros.protein.percentage,
      actions: [
        '아침 식사에 계란 2개 추가',
        '점심에 닭가슴살 또는 두부 추가',
        '간식으로 그릭요거트 섭취',
      ],
    });
  }

  // 활동량 부족
  if (goalProgress.activity.percentage < 50) {
    improvements.push({
      title: '운동 시간 확대 필요',
      description: `현재 하루 걸음 수가 ${metrics.dailyActivity.steps.toLocaleString()}보로 목표(10,000보)의 ${goalProgress.activity.percentage.toFixed(0)}%만 달성했습니다.`,
      priority: 'high',
      currentValue: `${metrics.dailyActivity.steps.toLocaleString()}보`,
      targetValue: '10,000보',
      progress: goalProgress.activity.percentage,
      actions: [
        '하루 30분 산책 추가',
        '계단 이용하기',
        '점심 시간 짧은 산책',
      ],
    });
  }

  // 칼로리 목표
  if (goalProgress.calories.percentage < 80 || goalProgress.calories.percentage > 120) {
    improvements.push({
      title: goalProgress.calories.percentage < 80 ? '칼로리 섭취 증가' : '칼로리 섭취 조절',
      description: `현재 칼로리 섭취량이 ${goalProgress.calories.current.toFixed(0)}kcal로 목표(${goalProgress.calories.target}kcal)의 ${goalProgress.calories.percentage.toFixed(0)}%입니다.`,
      priority: goalProgress.calories.percentage < 50 || goalProgress.calories.percentage > 150 ? 'high' : 'medium',
      currentValue: `${goalProgress.calories.current.toFixed(0)}kcal`,
      targetValue: `${goalProgress.calories.target}kcal`,
      progress: Math.min(100, goalProgress.calories.percentage),
      actions: goalProgress.calories.percentage < 80
        ? ['건강한 간식 추가', '식사량 조금씩 늘리기']
        : ['식사량 조절', '고칼로리 간식 줄이기'],
    });
  }

  if (improvements.length === 0) {
    improvements.push({
      title: '목표 달성 중',
      description: '현재 목표를 잘 달성하고 있습니다. 꾸준히 유지하세요!',
      priority: 'low',
    });
  }

  return improvements;
}

// 건강 목표 생성
function generateHealthGoals(metrics: HealthMetrics, goalProgress: any): Array<{
  name: string;
  percentage: number;
  description: string;
}> {
  return [
    {
      name: '체중 관리',
      percentage: metrics.bmi >= 18.5 && metrics.bmi <= 25 ? 90 : 60,
      description: '건강한 BMI 범위 유지',
    },
    {
      name: '근육량 증가',
      percentage: 70,
      description: '근육량 유지 및 증가',
    },
    {
      name: '심혈관 건강',
      percentage: 100 - metrics.diseaseRiskScores.cardiovascular,
      description: '심혈관 질환 위험도 감소',
    },
    {
      name: '당뇨 관리',
      percentage: 100 - metrics.diseaseRiskScores.diabetes,
      description: '당뇨 위험도 감소',
    },
    {
      name: '신장 건강',
      percentage: 100 - metrics.diseaseRiskScores.kidney,
      description: '신장 질환 위험도 감소',
    },
    {
      name: '활동량 증가',
      percentage: goalProgress.activity.percentage,
      description: '일일 활동량 목표 달성',
    },
  ];
}

// 주간 목표 생성
function generateWeeklyGoals(improvements: any[]): string[] {
  const goals: string[] = [];
  
  if (improvements.some(imp => imp.title.includes('단백질'))) {
    goals.push('주 5일 이상 단백질 풍부한 식사 섭취');
  }
  if (improvements.some(imp => imp.title.includes('운동'))) {
    goals.push('주 3회 이상 30분 이상 운동');
  }
  if (improvements.some(imp => imp.title.includes('칼로리'))) {
    goals.push('일일 칼로리 목표 달성률 80% 이상 유지');
  }

  if (goals.length === 0) {
    goals.push('현재 식단과 활동량 유지');
  }

  return goals;
}

// 월간 목표 생성
function generateMonthlyGoals(goalProgress: any): string[] {
  return [
    `월간 평균 목표 달성률 ${goalProgress.overall + 5}% 달성`,
    '건강 점수 5점 이상 향상',
    '체중/체지방률 목표 범위 유지',
  ];
}

