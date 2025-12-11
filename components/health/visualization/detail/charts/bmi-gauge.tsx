/**
 * @file bmi-gauge.tsx
 * @description BMI 게이지 차트 컴포넌트
 */

'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface BMIGaugeProps {
  bmi: number;
}

export function BMIGauge({ bmi }: BMIGaugeProps) {
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '저체중', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', range: [0, 18.5] };
    if (bmi < 23) return { label: '정상', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', range: [18.5, 23] };
    if (bmi < 25) return { label: '과체중', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', range: [23, 25] };
    if (bmi < 30) return { label: '비만', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', range: [25, 30] };
    return { label: '고도비만', color: 'bg-red-500', badge: 'bg-red-100 text-red-800', range: [30, 40] };
  };

  const category = getBMICategory(bmi);
  const position = ((bmi - 15) / (35 - 15)) * 100; // 15-35 범위를 0-100%로 변환

  return (
    <div className="space-y-6">
      {/* BMI 값 및 카테고리 */}
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-900 mb-2">
          {bmi.toFixed(1)}
        </div>
        <Badge className={category.badge}>{category.label}</Badge>
      </div>

      {/* BMI 게이지 바 */}
      <div className="relative">
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
          {/* 범위 색상 표시 */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-blue-400"></div>
            <div className="flex-1 bg-green-400"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-orange-400"></div>
            <div className="flex-1 bg-red-400"></div>
          </div>
          
          {/* 현재 위치 표시 */}
          <div 
            className="absolute top-0 h-full w-1 bg-gray-900 z-10 transform -translate-x-1/2"
            style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        {/* 범위 레이블 */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>15</span>
          <span>18.5</span>
          <span>23</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
        </div>
      </div>

      {/* BMI 범위 설명 */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-muted-foreground">저체중</span>
          <span className="font-medium">18.5 미만</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
          <span className="text-green-800 font-medium">정상</span>
          <span className="font-semibold text-green-800">18.5 - 23</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-muted-foreground">과체중</span>
          <span className="font-medium">23 - 25</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-muted-foreground">비만</span>
          <span className="font-medium">25 - 30</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-muted-foreground">고도비만</span>
          <span className="font-medium">30 이상</span>
        </div>
      </div>

      {/* 권장사항 */}
      {bmi >= 25 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>권장사항:</strong> 건강한 체중을 위해 식단 조절과 규칙적인 운동을 시작하세요.
          </p>
        </div>
      )}
      {bmi < 18.5 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>권장사항:</strong> 균형 잡힌 식단으로 건강한 체중을 늘리세요.
          </p>
        </div>
      )}
    </div>
  );
}

