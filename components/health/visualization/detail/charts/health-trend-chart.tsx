/**
 * @file health-trend-chart.tsx
 * @description 건강 트렌드 라인 차트 컴포넌트
 */

'use client';

import { useEffect, useState } from 'react';
import type { HealthMetrics } from '@/types/health-visualization';

interface HealthTrendChartProps {
  healthMetrics: HealthMetrics;
}

export function HealthTrendChart({ healthMetrics }: HealthTrendChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  // 모의 트렌드 데이터 (실제로는 API에서 가져와야 함)
  const trendData = generateMockTrendData(healthMetrics);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 건강 점수 트렌드 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">건강 점수 추이</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="healthScore" 
                stroke="#f97316" 
                strokeWidth={2}
                name="건강 점수"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BMI 트렌드 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">BMI 추이</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[15, 35]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="bmi" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="BMI"
              />
              <Line 
                type="monotone" 
                dataKey="bmiTarget" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="목표 (22)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 체지방률 트렌드 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">체지방률 추이</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 40]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bodyFat" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="체지방률 (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function generateMockTrendData(currentMetrics: HealthMetrics) {
  // 최근 7일 모의 데이터 생성
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 약간의 변동을 주어 트렌드처럼 보이게 함
    const variation = (Math.random() - 0.5) * 2;
    
    data.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      healthScore: Math.max(0, Math.min(100, currentMetrics.overallHealthScore + variation * 2)),
      bmi: Math.max(18, Math.min(30, currentMetrics.bmi + variation * 0.3)),
      bmiTarget: 22,
      bodyFat: Math.max(10, Math.min(35, currentMetrics.bodyFatPercentage + variation * 0.5)),
    });
  }
  
  return data;
}

