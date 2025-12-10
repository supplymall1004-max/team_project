'use client';

/**
 * @file HealthMetricsCard.tsx
 * @description 건강 메트릭스 카드 컴포넌트
 *
 * 주요 기능:
 * 1. BMI, 체지방률, 근육량 등 건강 지표 표시
 * 2. 지표별 상태 평가 및 색상 코딩
 * 3. 정상 범위 표시 및 현재 값 비교
 */

import { HealthMetrics, HealthStatus } from '@/types/health-visualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Target, Heart, Zap } from 'lucide-react';

interface HealthMetricsCardProps {
  metrics: HealthMetrics;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  status: HealthStatus;
  range?: [number, number]; // [min, max] 정상 범위
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function MetricCard({ title, value, unit, status, range, icon: Icon, description }: MetricCardProps) {
  // 상태에 따른 색상 및 스타일
  const getStatusStyles = (status: HealthStatus) => {
    const styles = {
      excellent: {
        badge: 'bg-green-100 text-green-800 border-green-200',
        progress: 'bg-green-500',
        text: 'text-green-700'
      },
      good: {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        progress: 'bg-blue-500',
        text: 'text-blue-700'
      },
      fair: {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        progress: 'bg-yellow-500',
        text: 'text-yellow-700'
      },
      poor: {
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        progress: 'bg-orange-500',
        text: 'text-orange-700'
      },
      critical: {
        badge: 'bg-red-100 text-red-800 border-red-200',
        progress: 'bg-red-500',
        text: 'text-red-700'
      }
    };
    return styles[status] || styles.fair;
  };

  const statusStyles = getStatusStyles(status);

  // 범위 내에 있는지 확인
  const isInRange = range ? (value >= range[0] && value <= range[1]) : true;

  // 진행률 계산 (범위가 있는 경우)
  const getProgressPercentage = () => {
    if (!range) return 100;
    const [min, max] = range;
    const clampedValue = Math.max(min, Math.min(max, value));
    return ((clampedValue - min) / (max - min)) * 100;
  };

  const progressPercentage = getProgressPercentage();

  // 상태 텍스트
  const getStatusText = (status: HealthStatus) => {
    const statusTexts = {
      excellent: '최상',
      good: '좋음',
      fair: '보통',
      poor: '주의',
      critical: '위험'
    };
    return statusTexts[status] || '보통';
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <Badge variant="outline" className={statusStyles.badge}>
            {getStatusText(status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 메인 값 표시 */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {value.toFixed(1)}
              <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>

          {/* 범위 표시 바 (정상 범위가 있는 경우) */}
          {range && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{range[0]}</span>
                <span className="font-medium">정상 범위</span>
                <span>{range[1]}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                {/* 정상 범위 표시 */}
                <div
                  className="absolute h-full bg-green-200 rounded-full opacity-50"
                  style={{
                    left: '20%',
                    width: '60%'
                  }}
                />
                {/* 현재 값 표시 */}
                <div
                  className={`absolute h-full ${statusStyles.progress} rounded-full transition-all duration-500`}
                  style={{
                    left: `${Math.max(0, Math.min(95, progressPercentage - 2.5))}%`,
                    width: '5%'
                  }}
                />
              </div>
              {!isInRange && (
                <p className={`text-xs ${statusStyles.text}`}>
                  {value < range[0] ? '정상 범위 미만' : '정상 범위 초과'}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthMetricsCard({ metrics, className }: HealthMetricsCardProps) {
  // BMI 상태 평가
  const getBMIStatus = (bmi: number): HealthStatus => {
    if (bmi < 18.5) return 'poor';
    if (bmi < 23) return 'excellent';
    if (bmi < 25) return 'good';
    if (bmi < 30) return 'fair';
    return 'critical';
  };

  // 체지방률 상태 평가 (성별 고려 필요하지만 임시로 일반 기준)
  const getBodyFatStatus = (bodyFat: number): HealthStatus => {
    if (bodyFat < 10) return 'poor';
    if (bodyFat < 20) return 'excellent';
    if (bodyFat < 25) return 'good';
    if (bodyFat < 30) return 'fair';
    return 'critical';
  };

  // 근육량 상태 평가
  const getMuscleStatus = (muscle: number): HealthStatus => {
    if (muscle < 30) return 'poor';
    if (muscle < 40) return 'fair';
    if (muscle < 50) return 'good';
    return 'excellent';
  };

  // 기초대사율 상태 평가
  const getBMRStatus = (bmr: number): HealthStatus => {
    if (bmr < 1200) return 'poor';
    if (bmr < 1400) return 'fair';
    if (bmr < 1800) return 'good';
    return 'excellent';
  };

  const metricCards = [
    {
      title: 'BMI',
      value: metrics.bmi,
      unit: '',
      status: getBMIStatus(metrics.bmi),
      range: [18.5, 25] as [number, number],
      icon: Activity,
      description: '체질량 지수'
    },
    {
      title: '체지방률',
      value: metrics.bodyFatPercentage,
      unit: '%',
      status: getBodyFatStatus(metrics.bodyFatPercentage),
      range: [10, 25] as [number, number],
      icon: Target,
      description: '체지방 비율'
    },
    {
      title: '근육량',
      value: metrics.muscleMass,
      unit: 'kg',
      status: getMuscleStatus(metrics.muscleMass),
      icon: Heart,
      description: '골격근량'
    },
    {
      title: '기초대사율',
      value: metrics.basalMetabolicRate,
      unit: 'kcal',
      status: getBMRStatus(metrics.basalMetabolicRate),
      icon: Zap,
      description: '하루 소모 칼로리'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metricCards.map((card, index) => (
        <MetricCard
          key={index}
          title={card.title}
          value={card.value}
          unit={card.unit}
          status={card.status}
          range={card.range}
          icon={card.icon}
          description={card.description}
        />
      ))}
    </div>
  );
}
