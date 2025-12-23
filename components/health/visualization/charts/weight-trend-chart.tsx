/**
 * @file weight-trend-chart.tsx
 * @description 체중 추이 차트 컴포넌트
 *
 * 체중, BMI, 체지방률 추이를 시각화합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeightLog } from '@/types/health-visualization';
import { TrendingUp } from 'lucide-react';

interface WeightTrendChartProps {
  weightLogs: WeightLog[];
  heightCm?: number; // BMI 계산용
  className?: string;
}

export function WeightTrendChart({ weightLogs, heightCm, className }: WeightTrendChartProps) {
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
            <TrendingUp className="h-5 w-5" />
            체중 추이
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

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } = Recharts;

  // BMI 계산 함수
  const calculateBMI = (weight: number, height: number) => {
    if (!height) return null;
    return weight / Math.pow(height / 100, 2);
  };

  // 차트 데이터 준비
  const chartData = weightLogs
    .slice(-30) // 최근 30일
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      weight: parseFloat(log.weight_kg.toString()),
      bmi: heightCm ? calculateBMI(parseFloat(log.weight_kg.toString()), heightCm) : null,
      bodyFat: log.body_fat_percentage ? parseFloat(log.body_fat_percentage.toString()) : null,
      muscleMass: log.muscle_mass_kg ? parseFloat(log.muscle_mass_kg.toString()) : null,
    }));

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            체중 추이
          </CardTitle>
          <CardDescription>체중 기록이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            체중 기록을 추가하면 추이를 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          체중 추이
        </CardTitle>
        <CardDescription>최근 체중, BMI, 체지방률 변화</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 체중 추이 */}
          <div>
            <h4 className="text-sm font-medium mb-4">체중 (kg)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="체중 (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BMI 추이 (키 정보가 있는 경우) */}
          {heightCm && chartData.some(d => d.bmi) && (
            <div>
              <h4 className="text-sm font-medium mb-4">BMI</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={[15, 35]}
                    label={{ value: 'BMI', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="bmi" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="BMI"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => 18.5} 
                    stroke="#10b981" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    name="저체중 기준"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => 25} 
                    stroke="#f59e0b" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    name="과체중 기준"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 체지방률 추이 (데이터가 있는 경우) */}
          {chartData.some(d => d.bodyFat) && (
            <div>
              <h4 className="text-sm font-medium mb-4">체지방률 (%)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={[0, 40]}
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="bodyFat" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    name="체지방률 (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
