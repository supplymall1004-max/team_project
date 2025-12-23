/**
 * @file sleep-pattern-chart.tsx
 * @description 수면 패턴 차트 컴포넌트
 *
 * 수면 시간, 수면 품질, 수면 단계를 시각화합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SleepData } from '@/types/health-visualization';
import { Moon } from 'lucide-react';

interface SleepPatternChartProps {
  sleepData: SleepData[];
  className?: string;
}

export function SleepPatternChart({ sleepData, className }: SleepPatternChartProps) {
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
            <Moon className="h-5 w-5" />
            수면 패턴
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

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } = Recharts;

  // 최근 7일 데이터만 사용
  const chartData = sleepData
    .slice(-7)
    .map((sleep) => ({
      date: new Date(sleep.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      hours: sleep.sleep_duration_minutes ? (sleep.sleep_duration_minutes / 60).toFixed(1) : 0,
      quality: sleep.sleep_quality_score || 0,
      deep: sleep.deep_sleep_minutes ? (sleep.deep_sleep_minutes / 60).toFixed(1) : 0,
      light: sleep.light_sleep_minutes ? (sleep.light_sleep_minutes / 60).toFixed(1) : 0,
      rem: sleep.rem_sleep_minutes ? (sleep.rem_sleep_minutes / 60).toFixed(1) : 0,
    }));

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            수면 패턴
          </CardTitle>
          <CardDescription>수면 기록이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            수면 기록을 추가하면 패턴을 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          수면 패턴
        </CardTitle>
        <CardDescription>최근 7일간의 수면 시간 및 품질</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 수면 시간 바 차트 */}
          <div>
            <h4 className="text-sm font-medium mb-4">수면 시간</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} label={{ value: '시간', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}시간`, '수면 시간']}
                />
                <Bar dataKey="hours" fill="#6366f1" name="수면 시간" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 수면 품질 라인 차트 */}
          <div>
            <h4 className="text-sm font-medium mb-4">수면 품질 점수</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} label={{ value: '점수', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="수면 품질"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 수면 단계 스택 바 차트 (데이터가 있는 경우만) */}
          {chartData.some(d => {
            const deep = typeof d.deep === 'string' ? parseFloat(d.deep) : (d.deep || 0);
            const light = typeof d.light === 'string' ? parseFloat(d.light) : (d.light || 0);
            const rem = typeof d.rem === 'string' ? parseFloat(d.rem) : (d.rem || 0);
            return deep > 0 || light > 0 || rem > 0;
          }) && (
            <div>
              <h4 className="text-sm font-medium mb-4">수면 단계</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: '시간', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deep" stackId="sleep" fill="#1e40af" name="깊은 수면" />
                  <Bar dataKey="light" stackId="sleep" fill="#3b82f6" name="얕은 수면" />
                  <Bar dataKey="rem" stackId="sleep" fill="#60a5fa" name="REM 수면" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
