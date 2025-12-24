/**
 * @file components/health/pets/pet-weight-chart.tsx
 * @description 반려동물 체중 추이 차트 컴포넌트
 * 
 * Recharts를 사용하여 반려동물의 체중 변화를 시각화합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PetWeightRecord } from '@/types/pet';
import { Weight, TrendingUp } from 'lucide-react';

interface PetWeightChartProps {
  weightRecords: PetWeightRecord[];
  className?: string;
}

export function PetWeightChart({ weightRecords, className }: PetWeightChartProps) {
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
            <Weight className="h-5 w-5" />
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

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

  // 차트 데이터 준비 (최근 30일)
  const chartData = weightRecords
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
    .map((record) => ({
      date: new Date(record.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      weight: parseFloat(record.weight_kg.toString()),
      fullDate: record.date,
    }));

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
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

  // 체중 범위 계산 (Y축 범위 설정)
  const weights = chartData.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight;
  const yAxisMin = Math.max(0, minWeight - weightRange * 0.1);
  const yAxisMax = maxWeight + weightRange * 0.1;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          체중 추이
        </CardTitle>
        <CardDescription>최근 체중 변화 추이</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[yAxisMin, yAxisMax]}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: '체중 (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}kg`, '체중']}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

