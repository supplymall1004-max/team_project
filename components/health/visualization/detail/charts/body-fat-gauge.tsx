/**
 * @file body-fat-gauge.tsx
 * @description 체지방률 게이지 차트 컴포넌트
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface BodyFatGaugeProps {
  bodyFatPercentage: number;
  gender?: { gender?: string; age?: number };
}

export function BodyFatGauge({ bodyFatPercentage, gender }: BodyFatGaugeProps) {
  const userGender = gender?.gender || 'male';
  const userAge = gender?.age || 30;

  // 성별/연령대별 체지방률 기준
  const getBodyFatCategory = (percentage: number, gender: string, age: number) => {
    if (gender === 'male') {
      if (age < 30) {
        if (percentage < 8) return { label: '매우 낮음', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', status: 'low' };
        if (percentage < 14) return { label: '건강', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', status: 'good' };
        if (percentage < 18) return { label: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', status: 'fair' };
        if (percentage < 25) return { label: '높음', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', status: 'high' };
        return { label: '매우 높음', color: 'bg-red-500', badge: 'bg-red-100 text-red-800', status: 'very-high' };
      } else {
        if (percentage < 11) return { label: '매우 낮음', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', status: 'low' };
        if (percentage < 17) return { label: '건강', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', status: 'good' };
        if (percentage < 22) return { label: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', status: 'fair' };
        if (percentage < 28) return { label: '높음', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', status: 'high' };
        return { label: '매우 높음', color: 'bg-red-500', badge: 'bg-red-100 text-red-800', status: 'very-high' };
      }
    } else {
      if (age < 30) {
        if (percentage < 16) return { label: '매우 낮음', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', status: 'low' };
        if (percentage < 20) return { label: '건강', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', status: 'good' };
        if (percentage < 25) return { label: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', status: 'fair' };
        if (percentage < 32) return { label: '높음', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', status: 'high' };
        return { label: '매우 높음', color: 'bg-red-500', badge: 'bg-red-100 text-red-800', status: 'very-high' };
      } else {
        if (percentage < 20) return { label: '매우 낮음', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', status: 'low' };
        if (percentage < 24) return { label: '건강', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', status: 'good' };
        if (percentage < 29) return { label: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', status: 'fair' };
        if (percentage < 35) return { label: '높음', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', status: 'high' };
        return { label: '매우 높음', color: 'bg-red-500', badge: 'bg-red-100 text-red-800', status: 'very-high' };
      }
    }
  };

  const category = getBodyFatCategory(bodyFatPercentage, userGender, userAge);
  const progressValue = Math.min(100, (bodyFatPercentage / 40) * 100);

  return (
    <div className="space-y-6">
      {/* 체지방률 값 및 카테고리 */}
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-900 mb-2">
          {bodyFatPercentage.toFixed(1)}
          <span className="text-2xl text-muted-foreground ml-1">%</span>
        </div>
        <Badge className={category.badge}>{category.label}</Badge>
      </div>

      {/* 체지방률 게이지 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">체지방률</span>
          <span className="font-semibold">{bodyFatPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={progressValue} className="h-4" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>40%</span>
        </div>
      </div>

      {/* 성별/연령대별 기준 */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {userGender === 'male' ? '남성' : '여성'} ({userAge}세) 기준
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">건강한 범위</span>
            <span className="font-medium text-green-600">
              {userGender === 'male' 
                ? (userAge < 30 ? '8-14%' : '11-17%')
                : (userAge < 30 ? '16-20%' : '20-24%')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">보통 범위</span>
            <span className="font-medium text-yellow-600">
              {userGender === 'male'
                ? (userAge < 30 ? '14-18%' : '17-22%')
                : (userAge < 30 ? '20-25%' : '24-29%')}
            </span>
          </div>
        </div>
      </div>

      {/* 권장사항 */}
      {category.status === 'high' || category.status === 'very-high' ? (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>권장사항:</strong> 유산소 운동과 근력 운동을 병행하여 체지방률을 낮추세요.
          </p>
        </div>
      ) : category.status === 'low' ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>권장사항:</strong> 체지방률이 너무 낮을 수 있습니다. 건강한 식단으로 적정 체지방을 유지하세요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

