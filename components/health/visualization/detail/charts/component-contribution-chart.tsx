/**
 * @file component-contribution-chart.tsx
 * @description 건강 점수 구성 요소별 기여도 도넛 차트
 */

'use client';

import { useEffect, useState } from 'react';

interface ComponentScores {
  bmi: number;
  bodyFat: number;
  nutrition: number;
  diseaseRisk: number;
  activity: number;
}

interface ComponentContributionChartProps {
  componentScores: ComponentScores;
}

export function ComponentContributionChart({ componentScores }: ComponentContributionChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  const data = [
    { name: 'BMI', value: componentScores.bmi, color: '#3b82f6', koreanName: 'BMI' },
    { name: '체지방률', value: componentScores.bodyFat, color: '#8b5cf6', koreanName: '체지방률' },
    { name: '영양 균형', value: componentScores.nutrition, color: '#10b981', koreanName: '영양 균형' },
    { name: '질병 위험도', value: componentScores.diseaseRisk, color: '#f59e0b', koreanName: '질병 위험도' },
    { name: '활동량', value: componentScores.activity, color: '#ef4444', koreanName: '활동량' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!isClient || !Recharts) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = Recharts;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      {/* 도넛 차트 */}
      <div className="flex-shrink-0">
        <ResponsiveContainer width={300} height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}점`, '기여도']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 및 상세 정보 */}
      <div className="flex-1 space-y-3">
        {data.map((item) => {
          const percentage = (item.value / total) * 100;
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-900">{item.koreanName}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{item.value.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1">점</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">총합</span>
            <span className="text-xl font-bold text-gray-900">{total.toFixed(1)}점</span>
          </div>
        </div>
      </div>
    </div>
  );
}

