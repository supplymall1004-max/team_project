/**
 * @file NutritionBalanceChart.tsx
 * @description 영양 균형 도넛 차트 컴포넌트
 *
 * 주요 기능:
 * 1. 탄수화물, 단백질, 지방의 균형 표시
 * 2. 칼로리 기준 비율로 시각화
 * 3. 각 영양소별 권장 비율과 비교
 * 4. 상호작용 가능한 도넛 차트
 */

'use client';

import { useState, useEffect } from 'react';
import { NutritionBalance } from '@/types/health-visualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface NutritionBalanceChartProps {
  balance: NutritionBalance;
  className?: string;
}

// 각 영양소의 칼로리 변환 계수 (g당 kcal)
const CALORIE_FACTORS = {
  carbohydrates: 4,       // 탄수화물 1g = 4kcal
  protein: 4,             // 단백질 1g = 4kcal
  fat: 9                   // 지방 1g = 9kcal
};

// 권장 비율 (kcal 기준)
const RECOMMENDED_RATIOS = {
  carbohydrates: { min: 45, max: 65 }, // 45-65%
  protein: { min: 10, max: 20 },       // 10-20%
  fat: { min: 20, max: 35 }           // 20-35%
};

interface NutritionItem {
  name: string;
  koreanName: string;
  value: number; // g
  calories: number; // kcal
  percentage: number; // %
  color: string;
  recommended: { min: number; max: number };
  status: 'good' | 'low' | 'high';
}

function getNutritionStatus(percentage: number, recommended: { min: number; max: number }): 'good' | 'low' | 'high' {
  if (percentage >= recommended.min && percentage <= recommended.max) return 'good';
  if (percentage < recommended.min) return 'low';
  return 'high';
}

export function NutritionBalanceChart({ balance, className }: NutritionBalanceChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  // 총 칼로리 계산
  const totalCalories = (balance.carbohydrates * CALORIE_FACTORS.carbohydrates) +
                       (balance.protein * CALORIE_FACTORS.protein) +
                       (balance.fat * CALORIE_FACTORS.fat);

  // 각 영양소 데이터 생성
  const nutritionData: NutritionItem[] = [
    {
      name: 'carbohydrates',
      koreanName: '탄수화물',
      value: balance.carbohydrates,
      calories: balance.carbohydrates * CALORIE_FACTORS.carbohydrates,
      percentage: totalCalories > 0 ? (balance.carbohydrates * CALORIE_FACTORS.carbohydrates / totalCalories) * 100 : 0,
      color: '#3B82F6', // blue-500
      recommended: RECOMMENDED_RATIOS.carbohydrates,
      status: getNutritionStatus(
        totalCalories > 0 ? (balance.carbohydrates * CALORIE_FACTORS.carbohydrates / totalCalories) * 100 : 0,
        RECOMMENDED_RATIOS.carbohydrates
      )
    },
    {
      name: 'protein',
      koreanName: '단백질',
      value: balance.protein,
      calories: balance.protein * CALORIE_FACTORS.protein,
      percentage: totalCalories > 0 ? (balance.protein * CALORIE_FACTORS.protein / totalCalories) * 100 : 0,
      color: '#10B981', // green-500
      recommended: RECOMMENDED_RATIOS.protein,
      status: getNutritionStatus(
        totalCalories > 0 ? (balance.protein * CALORIE_FACTORS.protein / totalCalories) * 100 : 0,
        RECOMMENDED_RATIOS.protein
      )
    },
    {
      name: 'fat',
      koreanName: '지방',
      value: balance.fat,
      calories: balance.fat * CALORIE_FACTORS.fat,
      percentage: totalCalories > 0 ? (balance.fat * CALORIE_FACTORS.fat / totalCalories) * 100 : 0,
      color: '#8B5CF6', // purple-500
      recommended: RECOMMENDED_RATIOS.fat,
      status: getNutritionStatus(
        totalCalories > 0 ? (balance.fat * CALORIE_FACTORS.fat / totalCalories) * 100 : 0,
        RECOMMENDED_RATIOS.fat
      )
    },
  ];

  if (!isClient || !Recharts) {
    return (
      <div className={`h-64 flex items-center justify-center bg-gray-50 rounded-lg ${className || ''}`}>
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = Recharts;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 도넛 차트 */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie
                data={nutritionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ koreanName, percentage }: any) => `${koreanName} ${percentage.toFixed(0)}%`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="percentage"
              >
                {nutritionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const item = nutritionData.find(d => d.name === name || d.koreanName === name);
                  return [
                    `${value.toFixed(1)}% (${item?.calories.toFixed(0)}kcal, ${item?.value.toFixed(1)}g)`,
                    '비율'
                  ];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 상세 정보 */}
        <div className="flex-1 space-y-4">
          {nutritionData.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-900">{item.koreanName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{item.percentage.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                  <Badge 
                    variant="outline"
                    className={
                      item.status === 'good' ? 'bg-green-100 text-green-800' :
                      item.status === 'low' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }
                  >
                    {item.status === 'good' ? '적정' : item.status === 'low' ? '부족' : '과다'}
                  </Badge>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.calories.toFixed(0)}kcal</span>
                <span>{item.value.toFixed(1)}g</span>
                <span>권장: {item.recommended.min}% - {item.recommended.max}%</span>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">총 칼로리</span>
              <span className="text-xl font-bold text-gray-900">{totalCalories.toFixed(0)}kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

