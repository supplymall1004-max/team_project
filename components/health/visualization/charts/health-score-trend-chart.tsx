/**
 * @file health-score-trend-chart.tsx
 * @description 건강 점수 추이 차트 컴포넌트
 *
 * 건강 점수 변화 추이를 시각화합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface HealthScoreTrendChartProps {
  trendData: { date: string; score: number }[];
  className?: string;
}

export function HealthScoreTrendChart({ trendData, className }: HealthScoreTrendChartProps) {
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
            건강 점수 추이
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

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } = Recharts;

  // 날짜 포맷팅
  const formattedData = trendData.map(item => ({
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    score: item.score,
  }));

  if (formattedData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            건강 점수 추이
          </CardTitle>
          <CardDescription>트렌드 데이터가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            건강 점수 추이를 확인하려면 시간이 더 필요합니다.
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
          건강 점수 추이
        </CardTitle>
        <CardDescription>건강 점수 변화 추이</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              domain={[0, 100]}
              label={{ value: '점수', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}점`, '건강 점수']}
            />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label="우수 기준" />
            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label="양호 기준" />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#f97316" 
              strokeWidth={2}
              fill="url(#scoreGradient)"
              name="건강 점수"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
