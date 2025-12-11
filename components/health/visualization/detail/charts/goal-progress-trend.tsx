/**
 * @file goal-progress-trend.tsx
 * @description 목표 달성률 트렌드 라인 차트
 */

'use client';

import { useEffect, useState } from 'react';

interface GoalProgressTrendProps {
  currentProgress: number;
}

export function GoalProgressTrend({ currentProgress }: GoalProgressTrendProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  // 모의 트렌드 데이터
  const trendData = generateMockTrendData(currentProgress);

  if (!isClient || !Recharts) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

  return (
    <div className="space-y-4">
      {/* 일일 트렌드 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">일일 목표 달성률 (최근 7일)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(0)}%`, '달성률']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="progress" 
              stroke="#f97316" 
              strokeWidth={2}
              name="목표 달성률"
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="목표 (80%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 주간 평균 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-lg text-center">
          <div className="text-sm text-muted-foreground mb-1">이번 주 평균</div>
          <div className="text-2xl font-bold text-gray-900">
            {trendData.weeklyAverage.toFixed(0)}%
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg text-center">
          <div className="text-sm text-muted-foreground mb-1">지난 주 평균</div>
          <div className="text-2xl font-bold text-gray-900">
            {(trendData.weeklyAverage - 5).toFixed(0)}%
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg text-center">
          <div className="text-sm text-muted-foreground mb-1">변화</div>
          <div className="text-2xl font-bold text-green-600">
            +5.0%
          </div>
        </div>
      </div>
    </div>
  );
}

function generateMockTrendData(current: number) {
  const daily = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const variation = (Math.random() - 0.5) * 10;
    
    daily.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      progress: Math.max(0, Math.min(100, current + variation)),
      target: 80,
    });
  }
  
  const weeklyAverage = daily.reduce((sum, d) => sum + d.progress, 0) / daily.length;
  
  return { daily, weeklyAverage };
}

