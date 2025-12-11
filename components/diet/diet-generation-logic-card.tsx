/**
 * @file components/diet/diet-generation-logic-card.tsx
 * @description 식단 생성 로직 설명 컴포넌트
 * 
 * 주요 기능:
 * 1. 식단이 어떻게 생성되었는지 설명
 * 2. 사용된 알고리즘 및 기준 표시
 * 3. 질병별 필터링 로직 설명
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator, Filter, Target, TrendingUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface DietGenerationLogicCardProps {
  healthProfile: {
    diseases?: string[];
    daily_calorie_goal?: number;
    age?: number;
    gender?: string;
  } | null;
  mealNutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  className?: string;
}

export function DietGenerationLogicCard({
  healthProfile,
  mealNutrition,
  mealType,
  className,
}: DietGenerationLogicCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const mealTypeLabels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
  };

  const mealCalorieRatios = {
    breakfast: 0.30,
    lunch: 0.35,
    dinner: 0.30,
    snack: 0.05,
  };

  const expectedCalories = healthProfile?.daily_calorie_goal
    ? healthProfile.daily_calorie_goal * mealCalorieRatios[mealType]
    : null;

  const calorieDeviation = expectedCalories
    ? ((mealNutrition.calories - expectedCalories) / expectedCalories) * 100
    : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          식단 생성 로직
        </CardTitle>
        <CardDescription>
          이 식단이 어떻게 만들어졌는지 알아보세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">식사 타입</div>
            <div className="text-lg font-semibold text-blue-700">
              {mealTypeLabels[mealType]}
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">칼로리</div>
            <div className="text-lg font-semibold text-green-700">
              {mealNutrition.calories.toFixed(0)} kcal
            </div>
            {expectedCalories && calorieDeviation && (
              <div className="text-xs text-gray-500 mt-1">
                목표 대비 {calorieDeviation > 0 ? '+' : ''}
                {calorieDeviation.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        {/* 생성 단계 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="font-medium">1단계: 칼로리 계산</span>
          </div>
          <div className="ml-6 text-sm text-gray-700">
            <p>
              하루 목표 칼로리: <strong>{healthProfile?.daily_calorie_goal || 2000} kcal</strong>
            </p>
            <p className="mt-1">
              {mealTypeLabels[mealType]} 식사 비율: <strong>{(mealCalorieRatios[mealType] * 100).toFixed(0)}%</strong>
            </p>
            {expectedCalories && (
              <p className="mt-1">
                예상 칼로리: <strong>{expectedCalories.toFixed(0)} kcal</strong>
              </p>
            )}
          </div>

          {healthProfile?.diseases && healthProfile.diseases.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4">
                <Filter className="h-4 w-4 text-purple-600" />
                <span className="font-medium">2단계: 질병별 필터링</span>
              </div>
              <div className="ml-6">
                <div className="flex flex-wrap gap-2">
                  {healthProfile.diseases.map((disease, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {getDiseaseLabel(disease)}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  질병 정보를 바탕으로 부적합한 레시피를 제외하고, 권장 식품에 가산점을 부여했습니다.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="font-medium">3단계: 영양소 균형</span>
          </div>
          <div className="ml-6 text-sm text-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-600">단백질</div>
                <div className="font-semibold">{mealNutrition.protein.toFixed(1)}g</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">탄수화물</div>
                <div className="font-semibold">{mealNutrition.carbohydrates.toFixed(1)}g</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">지방</div>
                <div className="font-semibold">{mealNutrition.fat.toFixed(1)}g</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-medium">4단계: 최적화</span>
          </div>
          <div className="ml-6 text-sm text-gray-700">
            <p>
              칼로리 목표에 가장 가깝고, 영양소 균형이 좋으며, 질병 관리에 도움이 되는 레시피를 선택했습니다.
            </p>
          </div>
        </div>

        {/* 상세 정보 (접기/펼치기) */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="text-sm">상세 알고리즘 보기</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">칼로리 계산 공식</h4>
              <p className="text-gray-700">
                Mifflin-St Jeor 공식을 사용하여 기초대사량을 계산하고, 활동 수준에 따라 조정합니다.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">레시피 선택 알고리즘</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>칼로리 목표와의 차이 (가장 작을수록 높은 점수)</li>
                <li>영양소 균형 (단백질, 탄수화물, 지방 비율)</li>
                <li>질병별 권장 식품 가산점</li>
                <li>최근 30일 사용 이력 제외 (다양성 확보)</li>
              </ul>
            </div>

            {healthProfile?.diseases && healthProfile.diseases.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">질병별 필터링 규칙</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {healthProfile.diseases.map((disease, idx) => (
                    <li key={idx}>
                      <strong>{getDiseaseLabel(disease)}</strong>: {getDiseaseFilterRule(disease)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function getDiseaseLabel(disease: string): string {
  const labels: Record<string, string> = {
    diabetes: '당뇨병',
    kidney_disease: '신장질환',
    cardiovascular_disease: '심혈관질환',
    hypertension: '고혈압',
    gout: '통풍',
    gastritis: '위염',
    liver_disease: '간질환',
  };
  return labels[disease] || disease;
}

function getDiseaseFilterRule(disease: string): string {
  const rules: Record<string, string> = {
    diabetes: '저GI 식품 우선, 탄수화물 제한',
    kidney_disease: '저단백, 저나트륨, 저칼륨, 저인 식품 우선',
    cardiovascular_disease: '저나트륨, 저지방 식품 우선',
    hypertension: '저나트륨 식품 우선',
    gout: '저퓨린 식품 우선, 단백질 제한',
    gastritis: '저나트륨, 부드러운 식품 우선',
    liver_disease: '저지방, 저단백 식품 우선',
  };
  return rules[disease] || '일반 필터링';
}

