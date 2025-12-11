/**
 * @file calorie-goal-gauge.tsx
 * @description 칼로리 목표 게이지 차트
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface CalorieGoalGaugeProps {
  current: number;
  target: number;
  burned: number;
  bmr: number;
}

export function CalorieGoalGauge({ current, target, burned, bmr }: CalorieGoalGaugeProps) {
  const percentage = (current / target) * 100;
  const balance = current - (bmr + burned); // 섭취 - 소모
  const tdee = bmr + burned; // 총 소모 칼로리

  const getStatus = () => {
    if (percentage >= 90 && percentage <= 110) {
      return { label: '적정', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', icon: TrendingUp };
    }
    if (percentage < 90) {
      return { label: '부족', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', icon: TrendingDown };
    }
    return { label: '과다', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', icon: TrendingUp };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* 칼로리 균형 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border text-center">
          <div className="text-sm text-muted-foreground mb-1">섭취 칼로리</div>
          <div className="text-3xl font-bold text-orange-600">{current.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">kcal</div>
        </div>
        <div className="p-4 bg-white rounded-lg border text-center">
          <div className="text-sm text-muted-foreground mb-1">소모 칼로리</div>
          <div className="text-3xl font-bold text-blue-600">{tdee.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">kcal (BMR + 활동)</div>
        </div>
        <div className={`p-4 rounded-lg border text-center ${
          balance > 0 ? 'bg-red-50 border-red-200' : 
          balance < -200 ? 'bg-blue-50 border-blue-200' : 
          'bg-green-50 border-green-200'
        }`}>
          <div className="text-sm text-muted-foreground mb-1">칼로리 균형</div>
          <div className={`text-3xl font-bold ${
            balance > 0 ? 'text-red-600' : 
            balance < -200 ? 'text-blue-600' : 
            'text-green-600'
          }`}>
            {balance > 0 ? '+' : ''}{balance.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">kcal</div>
        </div>
      </div>

      {/* 목표 달성률 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-gray-900">목표 달성률</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4 text-gray-500" />
            <Badge className={status.badge}>{status.label}</Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">현재: {current.toFixed(0)}kcal</span>
            <span className="text-muted-foreground">목표: {target.toFixed(0)}kcal</span>
          </div>
          <Progress value={Math.min(100, percentage)} className="h-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-semibold">{percentage.toFixed(0)}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 칼로리 소모 상세 */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="text-sm font-medium text-gray-900 mb-2">칼로리 소모 상세</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">기초대사율 (BMR)</div>
            <div className="font-semibold">{bmr.toFixed(0)}kcal</div>
          </div>
          <div>
            <div className="text-muted-foreground">활동 소모</div>
            <div className="font-semibold">{burned.toFixed(0)}kcal</div>
          </div>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">총 소모량 (TDEE)</span>
            <span className="font-semibold">{tdee.toFixed(0)}kcal</span>
          </div>
        </div>
      </div>

      {/* 권장사항 */}
      {balance > 500 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>주의:</strong> 섭취 칼로리가 소모 칼로리보다 {balance.toFixed(0)}kcal 많습니다. 
            식사량을 조절하거나 활동량을 늘리세요.
          </p>
        </div>
      )}
      {balance < -500 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>권장:</strong> 섭취 칼로리가 소모 칼로리보다 {Math.abs(balance).toFixed(0)}kcal 적습니다. 
            건강한 간식을 추가하여 칼로리를 보충하세요.
          </p>
        </div>
      )}
    </div>
  );
}

