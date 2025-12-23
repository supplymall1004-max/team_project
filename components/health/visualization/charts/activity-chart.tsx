/**
 * @file activity-chart.tsx
 * @description 활동량 차트 컴포넌트
 *
 * 걸음 수, 운동 시간, 소모 칼로리를 시각화합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityData } from '@/types/health-visualization';
import { Activity } from 'lucide-react';

interface ActivityChartProps {
  activityData: ActivityData[];
  className?: string;
}

export function ActivityChart({ activityData, className }: ActivityChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  if (!isClient || !Recharts) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            활동량
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">차트를 준비하는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } = Recharts;

  // 최근 7일 데이터만 사용
  const chartData = activityData
    .slice(-7)
    .map((activity) => ({
      date: new Date(activity.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      steps: activity.steps,
      exerciseMinutes: activity.exercise_minutes,
      calories: activity.calories_burned,
    }));

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            활동량
          </CardTitle>
          <CardDescription>활동량 기록이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            활동량 기록을 추가하면 차트를 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          활동량
        </CardTitle>
        <CardDescription>최근 7일간의 걸음 수, 운동 시간, 소모 칼로리</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 걸음 수 바 차트 */}
          <div>
            <h4 className="text-sm font-medium mb-4">걸음 수</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  label={{ value: '보', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()}보`, '걸음 수']}
                />
                <Bar dataKey="steps" fill="#8b5cf6" name="걸음 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 운동 시간 및 소모 칼로리 복합 차트 */}
          <div>
            <h4 className="text-sm font-medium mb-4">운동 시간 & 소모 칼로리</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: '분', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'kcal', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="exerciseMinutes" fill="#3b82f6" name="운동 시간 (분)" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="소모 칼로리 (kcal)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
