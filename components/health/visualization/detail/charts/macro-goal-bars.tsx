/**
 * @file macro-goal-bars.tsx
 * @description 3대 영양소 목표 달성률 막대 차트
 */

'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface MacroGoalBarsProps {
  goalProgress: any;
}

export function MacroGoalBars({ goalProgress }: MacroGoalBarsProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  const data = [
    {
      name: '탄수화물',
      current: goalProgress.macros.carbohydrates.current,
      target: goalProgress.macros.carbohydrates.target,
      percentage: goalProgress.macros.carbohydrates.percentage,
      color: '#3b82f6',
    },
    {
      name: '단백질',
      current: goalProgress.macros.protein.current,
      target: goalProgress.macros.protein.target,
      percentage: goalProgress.macros.protein.percentage,
      color: '#10b981',
    },
    {
      name: '지방',
      current: goalProgress.macros.fat.current,
      target: goalProgress.macros.fat.target,
      percentage: goalProgress.macros.fat.percentage,
      color: '#8b5cf6',
    },
  ];

  if (!isClient || !Recharts) {
    return (
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>{item.current.toFixed(1)}g / {item.target}g</span>
            </div>
            <Progress value={Math.min(100, item.percentage)} className="h-4" />
          </div>
        ))}
      </div>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } = Recharts;

  const chartData = data.map(item => ({
    name: item.name,
    현재: item.current,
    목표: item.target,
    달성률: item.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* 막대 차트 */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === '달성률') return [`${value.toFixed(0)}%`, '달성률'];
              return [`${value.toFixed(1)}g`, name];
            }}
          />
          <Legend />
          <Bar dataKey="현재" fill="#f97316" name="현재 섭취량" />
          <Bar dataKey="목표" fill="#e5e7eb" name="목표 섭취량" />
        </BarChart>
      </ResponsiveContainer>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((item) => (
          <div key={item.name} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{item.name}</h4>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">현재</span>
                <span className="font-semibold">{item.current.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">목표</span>
                <span className="font-semibold">{item.target}g</span>
              </div>
              <Progress value={Math.min(100, item.percentage)} className="h-2" />
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline"
                  className={
                    item.percentage >= 80 && item.percentage <= 120
                      ? 'bg-green-100 text-green-800'
                      : item.percentage < 80
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }
                >
                  {item.percentage >= 80 && item.percentage <= 120 ? '달성' :
                   item.percentage < 80 ? '부족' : '과다'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

