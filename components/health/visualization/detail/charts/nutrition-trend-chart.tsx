/**
 * @file nutrition-trend-chart.tsx
 * @description 영양 섭취 트렌드 라인 차트
 */

'use client';

import { useEffect, useState } from 'react';
import type { NutritionBalance } from '@/types/health-visualization';

interface NutritionTrendChartProps {
  nutrition: NutritionBalance;
}

export function NutritionTrendChart({ nutrition }: NutritionTrendChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  // 모의 트렌드 데이터
  const trendData = generateMockNutritionTrend(nutrition);

  if (!isClient || !Recharts) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="carbohydrates" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="탄수화물 (g)"
        />
        <Line 
          type="monotone" 
          dataKey="protein" 
          stroke="#10b981" 
          strokeWidth={2}
          name="단백질 (g)"
        />
        <Line 
          type="monotone" 
          dataKey="fat" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          name="지방 (g)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function generateMockNutritionTrend(current: NutritionBalance) {
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const variation = (Math.random() - 0.5) * 0.2;
    
    data.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      carbohydrates: Math.max(0, current.carbohydrates * (1 + variation)),
      protein: Math.max(0, current.protein * (1 + variation)),
      fat: Math.max(0, current.fat * (1 + variation)),
    });
  }
  
  return data;
}

