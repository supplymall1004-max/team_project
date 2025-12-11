/**
 * @file health-score-gauge.tsx
 * @description 건강 점수 게이지 차트 컴포넌트
 */

'use client';

import { useEffect, useState } from 'react';

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
}

export function HealthScoreGauge({ score, size = 200 }: HealthScoreGaugeProps) {
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
      <div 
        className="flex items-center justify-center rounded-full border-8 border-gray-200"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-400">{score.toFixed(0)}</div>
          <div className="text-sm text-gray-400">점</div>
        </div>
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer } = Recharts;

  // 게이지 데이터 (0-100 점수를 180도 반원으로 표시)
  const data = [
    { name: 'score', value: score, fill: getScoreColor(score) },
    { name: 'remaining', value: 100 - score, fill: '#e5e7eb' },
  ];

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center" style={{ bottom: '10%' }}>
        <div className={`text-4xl font-bold ${getScoreTextColor(score)}`}>
          {score.toFixed(1)}
        </div>
        <div className="text-sm text-muted-foreground">점</div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 75) return '#3b82f6'; // blue
  if (score >= 60) return '#eab308'; // yellow
  if (score >= 45) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 45) return 'text-orange-600';
  return 'text-red-600';
}

