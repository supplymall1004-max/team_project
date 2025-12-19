'use client';

/**
 * @file HealthDashboard.tsx
 * @description 건강 상태 종합 대시보드 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 건강 상태 종합 표시
 * 2. 건강 메트릭스 카드들
 * 3. 영양 균형 차트
 * 4. 질병 위험도 게이지
 * 5. 건강 인사이트 및 추천
 */

import { useState, useEffect } from 'react';
import { Activity, Heart, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { HealthMetrics, HealthStatus, HealthInsight } from '@/types/health-visualization';
import { HealthMetricsCard } from './HealthMetricsCard';
import { NutritionBalanceChart } from './NutritionBalanceChart';
import { DiseaseRiskGauge } from './DiseaseRiskGauge';
import { HealthInsightsCard } from './HealthInsightsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getHealthMetrics } from '@/actions/health/metrics';

interface HealthDashboardProps {
  userId?: string;
  className?: string;
}

export function HealthDashboard({ userId, className }: HealthDashboardProps) {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 건강 데이터 로드
  useEffect(() => {
    loadHealthData();
  }, [userId]);

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getHealthMetrics();
      setHealthMetrics(result.metrics);

      // 건강 인사이트 생성
      const generatedInsights = generateHealthInsights(result.metrics);
      setInsights(generatedInsights);

    } catch (err) {
      console.error('[HealthDashboard] 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 건강 상태에 따른 인사이트 생성
  const generateHealthInsights = (metrics: HealthMetrics): HealthInsight[] => {
    const insights: HealthInsight[] = [];

    // BMI 인사이트
    if (metrics.bmi < 18.5) {
      insights.push({
        type: 'warning',
        title: '저체중 상태',
        description: '균형 잡힌 식단으로 건강한 체중을 유지하는 것이 중요합니다.',
        actionable: true,
        priority: 'high'
      });
    } else if (metrics.bmi > 25) {
      insights.push({
        type: 'warning',
        title: '체중 관리 필요',
        description: '적정 칼로리 섭취와 운동으로 건강한 체중을 목표로 하세요.',
        actionable: true,
        priority: 'high'
      });
    } else {
      insights.push({
        type: 'positive',
        title: '건강한 체중 범위',
        description: '현재 체중이 건강한 범위에 있습니다.',
        actionable: false,
        priority: 'low'
      });
    }

    // 영양 균형 인사이트
    const { nutritionBalance } = metrics;
    if (nutritionBalance.protein < 50) {
      insights.push({
        type: 'info',
        title: '단백질 섭취량 확인',
        description: '근육 유지와 면역력 강화를 위해 단백질 섭취를 늘려보세요.',
        actionable: true,
        priority: 'medium'
      });
    }

    // 질병 위험도 인사이트
    const { diseaseRiskScores } = metrics;
    if (diseaseRiskScores.cardiovascular > 70) {
      insights.push({
        type: 'warning',
        title: '심혈관 건강 주의',
        description: '심혈관 건강을 위해 지방 섭취를 조절하고 운동을 늘려보세요.',
        actionable: true,
        priority: 'high'
      });
    }

    if (diseaseRiskScores.diabetes > 70) {
      insights.push({
        type: 'warning',
        title: '혈당 관리 필요',
        description: '혈당 조절을 위해 식이섬유가 풍부한 음식을 추천합니다.',
        actionable: true,
        priority: 'high'
      });
    }

    return insights;
  };

  // 건강 상태에 따른 색상 및 아이콘
  const getHealthStatusInfo = (status: HealthStatus) => {
    const statusMap = {
      excellent: { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
      good: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: TrendingUp },
      fair: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle },
      poor: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle },
      critical: { color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle }
    };
    return statusMap[status] || statusMap.fair;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !healthMetrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">데이터 로드 실패</h3>
            <p className="text-red-600 mb-4">{error || '건강 데이터를 불러올 수 없습니다.'}</p>
            <Button onClick={loadHealthData} variant="outline">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // healthMetrics가 없으면 로딩 또는 에러 상태 표시
  if (!healthMetrics) {
    if (isLoading) {
      return (
        <div className={`flex justify-center items-center py-12 ${className}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">건강 데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className={`text-center py-12 ${className}`}>
          <p className="text-red-600">{error}</p>
        </div>
      );
    }
    
    return null;
  }

  const statusInfo = getHealthStatusInfo(healthMetrics.healthStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 건강 상태 개요 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                건강 상태 대시보드
              </CardTitle>
              <CardDescription>
                현재 건강 상태와 개선 방향을 확인하세요
              </CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.color} ${statusInfo.bgColor}`}>
              <StatusIcon className="h-4 w-4" />
              {healthMetrics.healthStatus === 'excellent' && '최상'}
              {healthMetrics.healthStatus === 'good' && '좋음'}
              {healthMetrics.healthStatus === 'fair' && '보통'}
              {healthMetrics.healthStatus === 'poor' && '주의'}
              {healthMetrics.healthStatus === 'critical' && '위험'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {healthMetrics.overallHealthScore}점
            </div>
            <p className="text-gray-600">전체 건강 점수</p>
          </div>
        </CardContent>
      </Card>

      {/* 탭으로 구분된 세부 정보 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            건강 개요
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            영양 분석
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            건강 인사이트
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 건강 메트릭스 카드들 */}
          {healthMetrics && <HealthMetricsCard metrics={healthMetrics} />}

          {/* 질병 위험도 게이지 */}
          {healthMetrics?.diseaseRiskScores && <DiseaseRiskGauge risks={healthMetrics.diseaseRiskScores} />}
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6">
          {/* 영양 균형 차트 */}
          {healthMetrics?.nutritionBalance && <NutritionBalanceChart balance={healthMetrics.nutritionBalance} />}

          {/* 비타민 및 미네랄 레벨 */}
          {healthMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>비타민 레벨</CardTitle>
                  <CardDescription>일일 권장 섭취량 대비 현재 상태</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {healthMetrics.vitaminLevels && Object.entries(healthMetrics.vitaminLevels || {}).map(([vitamin, level]) => (
                    <div key={vitamin} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        비타민 {vitamin.slice(-1)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              level >= 80 ? 'bg-green-500' :
                              level >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(level, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{level}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>미네랄 레벨</CardTitle>
                <CardDescription>중요 미네랄 영양소 섭취 상태</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                    {healthMetrics.mineralLevels && Object.entries(healthMetrics.mineralLevels || {}).map(([mineral, level]) => (
                    <div key={mineral} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {mineral === 'calcium' ? '칼슘' :
                         mineral === 'iron' ? '철분' :
                         mineral === 'magnesium' ? '마그네슘' :
                         mineral === 'potassium' ? '칼륨' :
                         mineral === 'zinc' ? '아연' : mineral}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              level >= 80 ? 'bg-green-500' :
                              level >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(level, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{level}%</span>
                      </div>
                    </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* 건강 인사이트 카드 */}
          <HealthInsightsCard insights={insights} />

          {/* 건강 목표 설정으로 연결 */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">개인 맞춤 건강 목표 설정</h3>
                <p className="text-gray-600 mb-4">
                  건강 상태에 맞는 개인별 목표를 설정하고 꾸준히 관리해보세요.
                </p>
                <Button>
                  건강 목표 설정하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
