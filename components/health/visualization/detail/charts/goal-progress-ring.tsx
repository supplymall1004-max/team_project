/**
 * @file goal-progress-ring.tsx
 * @description 목표 달성률 링 차트 컴포넌트
 */

'use client';

import { useEffect, useState } from 'react';

interface GoalProgressRingProps {
  progress: number;
  size?: number;
}

export function GoalProgressRing({ progress, size = 200 }: GoalProgressRingProps) {
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
          <div className="text-3xl font-bold text-gray-400">{progress.toFixed(0)}</div>
          <div className="text-sm text-gray-400">%</div>
        </div>
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer } = Recharts;

  const data = [
    { name: 'progress', value: progress, fill: getProgressColor(progress) },
    { name: 'remaining', value: 100 - progress, fill: '#e5e7eb' },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
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
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getProgressTextColor(progress)}`}>
            {progress.toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground">%</div>
        </div>
      </div>
    </div>
  );
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return '#10b981'; // green
  if (progress >= 60) return '#3b82f6'; // blue
  if (progress >= 40) return '#eab308'; // yellow
  return '#f97316'; // orange
}

function getProgressTextColor(progress: number): string {
  if (progress >= 80) return 'text-green-600';
  if (progress >= 60) return 'text-blue-600';
  if (progress >= 40) return 'text-yellow-600';
  return 'text-orange-600';
}

