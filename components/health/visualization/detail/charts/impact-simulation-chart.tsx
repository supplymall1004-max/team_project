/**
 * @file impact-simulation-chart.tsx
 * @description 식단 효과 시뮬레이션 차트
 */

'use client';

import { useEffect, useState } from 'react';

interface ImpactSimulationChartProps {
  currentScore: number;
  improvements: Array<{
    title: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export function ImpactSimulationChart({ currentScore, improvements }: ImpactSimulationChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  // 개선 효과 계산
  const highPriorityCount = improvements.filter(imp => imp.priority === 'high').length;
  const mediumPriorityCount = improvements.filter(imp => imp.priority === 'medium').length;
  
  // 개선 시 예상 점수 (간단한 계산)
  const improvedScore = Math.min(100, currentScore + (highPriorityCount * 5) + (mediumPriorityCount * 2));

  const data = [
    { name: '현재', score: currentScore, color: '#f97316' },
    { name: '개선 후', score: improvedScore, color: '#10b981' },
  ];

  if (!isClient || !Recharts) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } = Recharts;

  return (
    <div className="space-y-6">
      {/* 비교 막대 차트 */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}점`, '건강 점수']}
          />
          <Legend />
          <Bar dataKey="score" name="건강 점수">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 개선 효과 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">현재 건강 점수</div>
          <div className="text-3xl font-bold text-orange-600">{currentScore.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">점</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">개선 후 예상 점수</div>
          <div className="text-3xl font-bold text-green-600">{improvedScore.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">점 (예상)</div>
        </div>
      </div>

      {/* 개선 효과 상세 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-gray-900 mb-2">예상 개선 효과</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">점수 향상</span>
            <span className="font-semibold text-green-600">
              +{(improvedScore - currentScore).toFixed(1)}점
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">개선 항목</span>
            <span className="font-semibold">
              {highPriorityCount}개 (높음) + {mediumPriorityCount}개 (보통)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">예상 기간</span>
            <span className="font-semibold">2-4주</span>
          </div>
        </div>
      </div>
    </div>
  );
}

