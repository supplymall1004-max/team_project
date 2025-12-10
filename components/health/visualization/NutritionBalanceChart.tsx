'use client';

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

import { useState } from 'react';
import { NutritionBalance } from '@/types/health-visualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NutritionBalanceChartProps {
  balance: NutritionBalance;
  className?: string;
}

// 각 영양소의 칼로리 변환 계수 (g당 kcal)
const CALORIE_FACTORS = {
  carbohydrates: 4, // 탄수화물 1g = 4kcal
  protein: 4,       // 단백질 1g = 4kcal
  fat: 9           // 지방 1g = 9kcal
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
  status: 'low' | 'normal' | 'high';
}

export function NutritionBalanceChart({ balance, className }: NutritionBalanceChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

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
      color: '#EF4444', // red-500
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
      color: '#F59E0B', // amber-500
      recommended: RECOMMENDED_RATIOS.fat,
      status: getNutritionStatus(
        totalCalories > 0 ? (balance.fat * CALORIE_FACTORS.fat / totalCalories) * 100 : 0,
        RECOMMENDED_RATIOS.fat
      )
    }
  ];

  // 영양소 상태 평가 함수
  function getNutritionStatus(percentage: number, recommended: { min: number; max: number }): 'low' | 'normal' | 'high' {
    if (percentage < recommended.min) return 'low';
    if (percentage > recommended.max) return 'high';
    return 'normal';
  }

  // 도넛 차트 렌더링
  const renderDonutChart = () => {
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    let cumulativeAngle = -90; // 12시 방향부터 시작

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        {nutritionData.map((item, index) => {
          const angle = (item.percentage / 100) * 360;
          const startAngle = cumulativeAngle;
          const endAngle = cumulativeAngle + angle;

          // SVG arc path 계산
          const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

          cumulativeAngle = endAngle;

          return (
            <path
              key={item.name}
              d={pathData}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              className={`cursor-pointer transition-all duration-200 ${
                selectedSegment === item.name ? 'stroke-opacity-100' : 'stroke-opacity-80 hover:stroke-opacity-100'
              }`}
              onClick={() => setSelectedSegment(selectedSegment === item.name ? null : item.name)}
              onMouseEnter={() => setSelectedSegment(item.name)}
              onMouseLeave={() => setSelectedSegment(null)}
            />
          );
        })}
        {/* 중앙 텍스트 */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="text-2xl font-bold fill-gray-900"
          transform={`rotate(90 ${center} ${center})`}
        >
          {totalCalories.toFixed(0)}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="text-sm fill-gray-500"
          transform={`rotate(90 ${center} ${center})`}
        >
          kcal
        </text>
      </svg>
    );
  };

  // 선택된 세그먼트 정보
  const selectedItem = nutritionData.find(item => item.name === selectedSegment);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>영양 균형 분석</CardTitle>
        <CardDescription>
          탄수화물, 단백질, 지방의 칼로리 비율 및 균형 상태
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* 도넛 차트 */}
          <div className="flex-shrink-0">
            {renderDonutChart()}
          </div>

          {/* 범례 및 상세 정보 */}
          <div className="flex-1 space-y-4">
            {nutritionData.map((item) => (
              <div
                key={item.name}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedSegment === item.name
                    ? 'border-gray-300 bg-gray-50 shadow-sm'
                    : 'border-transparent hover:border-gray-200'
                }`}
                onClick={() => setSelectedSegment(selectedSegment === item.name ? null : item.name)}
              >
                <div className="flex items-center gap-3">
                  {/* 색상 표시 */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* 영양소 정보 */}
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.koreanName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.value}g ({item.calories.toFixed(0)}kcal)
                    </div>
                  </div>
                </div>

                {/* 비율 및 상태 */}
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {item.percentage.toFixed(1)}%
                  </div>
                  <Badge
                    variant={item.status === 'normal' ? 'default' :
                           item.status === 'low' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {item.status === 'low' ? '부족' :
                     item.status === 'high' ? '과다' : '적정'}
                  </Badge>
                </div>
              </div>
            ))}

            {/* 권장 비율 안내 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">권장 칼로리 비율</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div>탄수화물: {RECOMMENDED_RATIOS.carbohydrates.min}-{RECOMMENDED_RATIOS.carbohydrates.max}%</div>
                <div>단백질: {RECOMMENDED_RATIOS.protein.min}-{RECOMMENDED_RATIOS.protein.max}%</div>
                <div>지방: {RECOMMENDED_RATIOS.fat.min}-{RECOMMENDED_RATIOS.fat.max}%</div>
              </div>
            </div>

            {/* 선택된 세그먼트 상세 정보 */}
            {selectedItem && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">
                  {selectedItem.koreanName} 상세 정보
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>섭취량:</span>
                    <span className="font-medium">{selectedItem.value}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>칼로리:</span>
                    <span className="font-medium">{selectedItem.calories.toFixed(0)}kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>비율:</span>
                    <span className="font-medium">{selectedItem.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>권장 범위:</span>
                    <span className="font-medium">
                      {selectedItem.recommended.min}-{selectedItem.recommended.max}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>상태:</span>
                    <Badge
                      variant={selectedItem.status === 'normal' ? 'default' :
                             selectedItem.status === 'low' ? 'destructive' : 'secondary'}
                    >
                      {selectedItem.status === 'low' ? '권장량 미만' :
                       selectedItem.status === 'high' ? '권장량 초과' : '적정 범위'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
