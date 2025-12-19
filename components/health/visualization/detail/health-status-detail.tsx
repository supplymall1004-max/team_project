/**
 * @file health-status-detail.tsx
 * @description 현재 건강 상태 상세보기 컴포넌트
 * 
 * 시각적 요소:
 * - 건강 점수 대형 게이지 차트
 * - BMI/체지방률 게이지 차트
 * - 질병 위험도 게이지 차트
 * - 활동량 진행률 바
 * - 건강 트렌드 라인 차트
 * - 구성 요소별 기여도 도넛 차트
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
  Activity, 
  Heart, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Zap,
  Users,
  BarChart3,
  LineChart
} from 'lucide-react';
import type { HealthMetrics } from '@/types/health-visualization';
import { HealthScoreGauge } from './charts/health-score-gauge';
import { BMIGauge } from './charts/bmi-gauge';
import { BodyFatGauge } from './charts/body-fat-gauge';
import { DiseaseRiskGauges } from './charts/disease-risk-gauges';
import { HealthTrendChart } from './charts/health-trend-chart';
import { ComponentContributionChart } from './charts/component-contribution-chart';

export function HealthStatusDetail() {
  const router = useRouter();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [healthProfile, setHealthProfile] = useState<{ gender?: string; age?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealthData() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[HealthStatusDetail] 건강 데이터 조회 시작');

        // 건강 메트릭스와 프로필 정보를 병렬로 조회
        const [metricsResult, profile] = await Promise.all([
          getHealthMetrics(),
          getHealthProfile().catch(() => null), // 프로필 조회 실패해도 계속 진행
        ]);

        console.log('[HealthStatusDetail] 건강 메트릭스 조회 완료:', metricsResult);
        
        setHealthMetrics(metricsResult.metrics);

        // 프로필 정보가 있으면 저장
        if (profile) {
          setHealthProfile({
            gender: profile.gender || undefined,
            age: profile.age || undefined,
          });
        }
      } catch (err) {
        console.error('[HealthStatusDetail] 건강 데이터 조회 실패:', err);
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
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
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

  // 건강 점수에 따른 상태
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { text: '최상', color: 'text-green-600', badge: 'bg-green-100 text-green-800', icon: Heart };
    if (score >= 75) return { text: '좋음', color: 'text-blue-600', badge: 'bg-blue-100 text-blue-800', icon: Activity };
    if (score >= 60) return { text: '보통', color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800', icon: Target };
    if (score >= 45) return { text: '주의', color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
    return { text: '위험', color: 'text-red-600', badge: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const healthStatus = getHealthStatus(healthMetrics.overallHealthScore);
  const stars = Math.round((healthMetrics.overallHealthScore / 100) * 5);
  const starDisplay = '⭐'.repeat(stars);

  // 건강 점수 구성 요소 계산 (예시)
  const componentScores = {
    bmi: calculateBMIScore(healthMetrics.bmi),
    bodyFat: calculateBodyFatScore(healthMetrics.bodyFatPercentage, healthMetrics),
    nutrition: calculateNutritionScore(healthMetrics.nutritionBalance),
    diseaseRisk: calculateDiseaseRiskScore(healthMetrics.diseaseRiskScores),
    activity: calculateActivityScore(healthMetrics.dailyActivity),
  };

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
              <Activity className="h-8 w-8 text-orange-600" />
              현재 건강 상태
            </h1>
            <p className="text-muted-foreground mt-1">오늘의 건강 메트릭스 상세 분석</p>
          </div>
        </div>
        <Badge className={healthStatus.badge} variant="outline">
          {healthStatus.text}
        </Badge>
      </div>

      {/* 건강 점수 대형 게이지 */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-orange-600" />
            전체 건강 점수
          </CardTitle>
          <CardDescription>종합 건강 상태 평가</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* 게이지 차트 */}
            <div className="flex justify-center">
              <HealthScoreGauge score={healthMetrics.overallHealthScore} />
            </div>
            
            {/* 점수 상세 정보 */}
            <div className="space-y-4">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <span className={`text-5xl font-bold ${healthStatus.color}`}>
                    {healthMetrics.overallHealthScore.toFixed(1)}
                  </span>
                  <span className="text-2xl text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Badge className={healthStatus.badge}>{healthStatus.text}</Badge>
                  <span className="text-lg">{starDisplay}</span>
                </div>
                <Progress 
                  value={healthMetrics.overallHealthScore} 
                  className="h-3"
                />
              </div>

              {/* 구성 요소별 기여도 */}
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">점수 구성 요소</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>BMI</span>
                    <span className="font-semibold">{componentScores.bmi.toFixed(1)}점</span>
                  </div>
                  <Progress value={componentScores.bmi} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>체지방률</span>
                    <span className="font-semibold">{componentScores.bodyFat.toFixed(1)}점</span>
                  </div>
                  <Progress value={componentScores.bodyFat} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>영양 균형</span>
                    <span className="font-semibold">{componentScores.nutrition.toFixed(1)}점</span>
                  </div>
                  <Progress value={componentScores.nutrition} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>질병 위험도</span>
                    <span className="font-semibold">{componentScores.diseaseRisk.toFixed(1)}점</span>
                  </div>
                  <Progress value={componentScores.diseaseRisk} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>활동량</span>
                    <span className="font-semibold">{componentScores.activity.toFixed(1)}점</span>
                  </div>
                  <Progress value={componentScores.activity} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 구성 요소별 기여도 도넛 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            건강 점수 구성 요소 분석
          </CardTitle>
          <CardDescription>각 요소가 건강 점수에 기여하는 비율</CardDescription>
        </CardHeader>
        <CardContent>
          <ComponentContributionChart componentScores={componentScores} />
        </CardContent>
      </Card>

      {/* 신체 지표 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BMI 게이지 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              BMI (체질량지수)
            </CardTitle>
            <CardDescription>신장과 체중을 기반으로 한 비만도 지표</CardDescription>
          </CardHeader>
          <CardContent>
            <BMIGauge bmi={healthMetrics.bmi} />
          </CardContent>
        </Card>

        {/* 체지방률 게이지 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              체지방률
            </CardTitle>
            <CardDescription>체중 대비 지방의 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <BodyFatGauge 
              bodyFatPercentage={healthMetrics.bodyFatPercentage}
              gender={healthProfile || { gender: undefined, age: undefined }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 근육량 및 기초대사율 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              근육량
            </CardTitle>
            <CardDescription>추정 근육량</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {healthMetrics.muscleMass.toFixed(1)}
                  <span className="text-xl text-muted-foreground ml-1">kg</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  체중의 약 {((healthMetrics.muscleMass / (healthMetrics as any).weight_kg || 70) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>권장 범위</span>
                  <span className="font-semibold">35-45kg</span>
                </div>
                <Progress 
                  value={Math.min(100, (healthMetrics.muscleMass / 45) * 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              기초대사율 (BMR)
            </CardTitle>
            <CardDescription>안정 상태에서 소모하는 최소 칼로리</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {healthMetrics.basalMetabolicRate.toFixed(0)}
                  <span className="text-xl text-muted-foreground ml-1">kcal</span>
                </div>
                <p className="text-sm text-muted-foreground">하루 최소 소모 칼로리</p>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>활동량 반영 (TDEE)</span>
                  <span className="font-semibold">
                    {Math.round(healthMetrics.basalMetabolicRate * 1.5)}kcal
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  보통 활동량 기준 예상 총 소모 칼로리
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 질병 위험도 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            질병 위험도 분석
          </CardTitle>
          <CardDescription>주요 질병별 위험도 평가 (낮을수록 안전)</CardDescription>
        </CardHeader>
        <CardContent>
          <DiseaseRiskGauges diseaseRiskScores={healthMetrics.diseaseRiskScores} />
        </CardContent>
      </Card>

      {/* 일일 활동량 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            일일 활동량
          </CardTitle>
          <CardDescription>오늘의 활동 통계</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">걸음 수</span>
                <Target className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{healthMetrics.dailyActivity.steps.toLocaleString()}</div>
              <Progress value={Math.min(100, (healthMetrics.dailyActivity.steps / 10000) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">목표: 10,000보</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">활동 시간</span>
                <Activity className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{healthMetrics.dailyActivity.activeMinutes}</div>
              <Progress value={Math.min(100, (healthMetrics.dailyActivity.activeMinutes / 30) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">목표: 30분</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">소모 칼로리</span>
                <Zap className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{healthMetrics.dailyActivity.caloriesBurned}</div>
              <Progress value={Math.min(100, (healthMetrics.dailyActivity.caloriesBurned / 500) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">목표: 500kcal</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">운동 강도</span>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold capitalize">
                {healthMetrics.dailyActivity.exerciseIntensity === 'low' ? '낮음' :
                 healthMetrics.dailyActivity.exerciseIntensity === 'moderate' ? '보통' : '높음'}
              </div>
              <Badge 
                variant="outline"
                className={
                  healthMetrics.dailyActivity.exerciseIntensity === 'high' ? 'bg-green-100 text-green-800' :
                  healthMetrics.dailyActivity.exerciseIntensity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }
              >
                {healthMetrics.dailyActivity.exerciseIntensity === 'high' ? '적극적' :
                 healthMetrics.dailyActivity.exerciseIntensity === 'moderate' ? '보통' : '낮음'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 건강 트렌드 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-purple-600" />
            건강 트렌드
          </CardTitle>
          <CardDescription>최근 건강 상태 변화 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthTrendChart healthMetrics={healthMetrics} />
        </CardContent>
      </Card>

      {/* 개선 권장사항 */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            개선 권장사항
          </CardTitle>
          <CardDescription>건강 점수 향상을 위한 실행 가능한 액션</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generateRecommendations(healthMetrics, componentScores).map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div className={`p-2 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {rec.priority === 'high' ? <AlertTriangle className="h-4 w-4" /> :
                   rec.priority === 'medium' ? <Target className="h-4 w-4" /> :
                   <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  {rec.action && (
                    <Button size="sm" variant="outline" className="mt-2">
                      {rec.action}
                    </Button>
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

// 건강 점수 구성 요소 계산 함수들
function calculateBMIScore(bmi: number): number {
  if (bmi >= 18.5 && bmi <= 25) return 20;
  if (bmi >= 25 && bmi <= 30) return 12;
  return 5;
}

function calculateBodyFatScore(bodyFat: number, metrics: any): number {
  const gender = metrics.gender || 'male';
  const idealRange = gender === 'male' ? [10, 20] : [18, 28];
  
  if (bodyFat >= idealRange[0] && bodyFat <= idealRange[1]) return 15;
  if (bodyFat < idealRange[0] || bodyFat > idealRange[1] + 5) return 5;
  return 10;
}

function calculateNutritionScore(nutrition: any): number {
  // 영양 균형 점수 계산 (간단한 예시)
  const score = 25;
  // 실제로는 영양소 비율, 미네랄, 비타민 등을 종합 평가
  return score;
}

function calculateDiseaseRiskScore(risks: any): number {
  const riskValues = Object.values(risks);
  const numericRisks = riskValues.filter((risk: any) => typeof risk === 'number') as number[];
  const avgRisk = numericRisks.length > 0 ? numericRisks.reduce((sum, risk) => sum + risk, 0) / numericRisks.length : 0;
  return Math.max(0, 20 - (avgRisk * 0.2));
}

function calculateActivityScore(activity: any): number {
  let score = 0;
  if (activity.steps >= 10000) score += 5;
  else if (activity.steps >= 5000) score += 3;
  else score += 1;
  
  if (activity.activeMinutes >= 30) score += 3;
  else if (activity.activeMinutes >= 15) score += 2;
  else score += 1;
  
  if (activity.exerciseIntensity === 'high') score += 3;
  else if (activity.exerciseIntensity === 'moderate') score += 2;
  else score += 1;
  
  return score;
}

// 권장사항 생성 함수
function generateRecommendations(metrics: HealthMetrics, scores: any): Array<{
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}> {
  const recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
  }> = [];

  // BMI 권장사항
  if (metrics.bmi > 25) {
    recommendations.push({
      title: '체중 관리 필요',
      description: `현재 BMI가 ${metrics.bmi.toFixed(1)}로 과체중 범위입니다. 식단 조절과 운동을 통해 건강한 체중을 유지하세요.`,
      priority: 'high',
      action: '식단 관리하기',
    });
  } else if (metrics.bmi < 18.5) {
    recommendations.push({
      title: '체중 증가 권장',
      description: `현재 BMI가 ${metrics.bmi.toFixed(1)}로 저체중 범위입니다. 균형 잡힌 식단으로 건강한 체중을 늘리세요.`,
      priority: 'medium',
      action: '식단 관리하기',
    });
  }

  // 활동량 권장사항
  if (metrics.dailyActivity.steps < 5000) {
    recommendations.push({
      title: '활동량 증가 필요',
      description: `하루 걸음 수가 ${metrics.dailyActivity.steps.toLocaleString()}보로 부족합니다. 목표 10,000보를 달성하기 위해 더 많이 움직이세요.`,
      priority: 'high',
      action: '운동 계획 세우기',
    });
  }

  // 질병 위험도 권장사항
  const highRiskDiseases = Object.entries(metrics.diseaseRiskScores)
    .filter(([_, risk]) => risk > 50)
    .map(([disease, _]) => disease);

  if (highRiskDiseases.length > 0) {
    recommendations.push({
      title: '질병 위험도 관리',
      description: `${highRiskDiseases.join(', ')} 위험도가 높습니다. 정기적인 건강검진과 생활습관 개선이 필요합니다.`,
      priority: 'high',
      action: '건강 정보 관리',
    });
  }

  // 기본 권장사항
  if (recommendations.length === 0) {
    recommendations.push({
      title: '건강한 생활 유지',
      description: '현재 건강 상태가 양호합니다. 규칙적인 운동과 균형 잡힌 식단을 유지하세요.',
      priority: 'low',
    });
  }

  return recommendations;
}

