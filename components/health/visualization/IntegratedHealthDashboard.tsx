/**
 * @file IntegratedHealthDashboard.tsx
 * @description 통합 건강 대시보드 컴포넌트
 *
 * 모든 건강 시각화 자료를 하나의 대시보드에 통합하여 표시합니다.
 * - 요약 카드 (건강점수, BMI, 활동량, 수면)
 * - 주요 건강 지표 (BMI, 영양 균형, 질병 위험도)
 * - 생활 패턴 (활동량, 수면)
 * - 건강 모니터링 (혈압/혈당, 체중 추이)
 * - 건강 트렌드
 * - 건강 인사이트
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Activity, 
  Heart, 
  Moon, 
  TrendingUp, 
  AlertTriangle,
  Target,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { getIntegratedHealthDashboard, type Period } from '@/actions/health/integrated-dashboard';
import type { IntegratedHealthDashboard } from '@/types/health-visualization';

interface ExtendedDashboardData extends IntegratedHealthDashboard {
  heightCm?: number;
}
import { HealthMetricsCard } from './HealthMetricsCard';
import { NutritionBalanceChart } from './NutritionBalanceChart';
import { DiseaseRiskGauge } from './DiseaseRiskGauge';
import { HealthInsightsCard } from './HealthInsightsCard';
import { SleepPatternChart } from './charts/sleep-pattern-chart';
import { ActivityChart } from './charts/activity-chart';
import { BloodPressureChart } from './charts/blood-pressure-chart';
import { WeightTrendChart } from './charts/weight-trend-chart';
import { HealthScoreTrendChart } from './charts/health-score-trend-chart';

interface IntegratedHealthDashboardProps {
  className?: string;
  defaultPeriod?: Period;
}

export function IntegratedHealthDashboard({ 
  className,
  defaultPeriod = 'week'
}: IntegratedHealthDashboardProps) {
  const [dashboardData, setDashboardData] = useState<IntegratedHealthDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[IntegratedHealthDashboard] 데이터 로드 시작, 기간:', period);
      const data = await getIntegratedHealthDashboard(period);
      setDashboardData(data);

      console.log('[IntegratedHealthDashboard] 데이터 로드 완료');
    } catch (err) {
      console.error('[IntegratedHealthDashboard] 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">데이터 로드 실패</h3>
            <p className="text-red-600 mb-4">{error || '건강 데이터를 불러올 수 없습니다.'}</p>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, healthIndicators, lifestylePatterns, healthMonitoring, healthTrends, insights } = dashboardData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 - 기간 선택 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-orange-600" />
            건강 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">종합 건강 상태를 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('today')}
          >
            오늘
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            1주
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            1개월
          </Button>
          <Button
            variant={period === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('quarter')}
          >
            3개월
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 빠른 추가 버튼 */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="default" asChild>
          <a href="/health/profile?tab=data-entry">
            <Calendar className="mr-2 h-4 w-4" />
            건강 데이터 입력
          </a>
        </Button>
      </div>

      {/* 요약 카드 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              건강 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.healthScore.toFixed(0)}</div>
            <p className="text-xs text-green-600 mt-1">/ 100점</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Target className="h-4 w-4" />
              BMI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{summary.bmi.toFixed(1)}</div>
            <p className="text-xs text-blue-600 mt-1">
              {summary.bmi < 18.5 ? '저체중' : summary.bmi > 25 ? '과체중' : '정상'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              걸음 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {summary.dailySteps.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">보</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              수면 시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">
              {summary.sleepHours > 0 ? summary.sleepHours.toFixed(1) : '-'}
            </div>
            <p className="text-xs text-indigo-600 mt-1">시간</p>
          </CardContent>
        </Card>
      </div>

      {/* 주요 건강 지표 - Accordion */}
      <Accordion type="multiple" defaultValue={['health-indicators']} className="space-y-4">
        <AccordionItem value="health-indicators" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              주요 건강 지표
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {/* 건강 메트릭스 카드 */}
              <HealthMetricsCard metrics={healthIndicators} />

              {/* 영양 균형 차트 */}
              <NutritionBalanceChart balance={healthIndicators.nutritionBalance} />

              {/* 질병 위험도 게이지 */}
              <DiseaseRiskGauge risks={healthIndicators.diseaseRiskScores} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 생활 패턴 */}
        <AccordionItem value="lifestyle-patterns" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              생활 패턴
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {/* 활동량 차트 */}
              <ActivityChart activityData={lifestylePatterns.activity} />

              {/* 수면 패턴 차트 */}
              <SleepPatternChart sleepData={lifestylePatterns.sleep} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 건강 모니터링 */}
        <AccordionItem value="health-monitoring" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              건강 모니터링
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {/* 혈압/혈당 차트 */}
              {healthMonitoring.vitalSigns.length > 0 && (
                <BloodPressureChart vitalSigns={healthMonitoring.vitalSigns} />
              )}

              {/* 체중 추이 차트 */}
              {healthMonitoring.weightTrend.length > 0 && (
                <WeightTrendChart 
                  weightLogs={healthMonitoring.weightTrend}
                  heightCm={(dashboardData as ExtendedDashboardData).heightCm}
                />
              )}

              {/* 데이터가 없는 경우 */}
              {healthMonitoring.vitalSigns.length === 0 && healthMonitoring.weightTrend.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center py-4">
                      건강 모니터링 기록이 없습니다. 혈압/혈당이나 체중 기록을 추가해주세요.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 건강 트렌드 */}
        <AccordionItem value="health-trends" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              건강 트렌드
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {/* 건강 점수 추이 차트 */}
              <HealthScoreTrendChart trendData={healthTrends.healthScoreTrend} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 건강 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            건강 인사이트 & 권장사항
          </CardTitle>
          <CardDescription>우선순위별 개선 항목</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthInsightsCard insights={insights} />
        </CardContent>
      </Card>
    </div>
  );
}
