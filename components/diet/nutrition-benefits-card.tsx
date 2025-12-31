/**
 * @file components/diet/nutrition-benefits-card.tsx
 * @description 영양소 및 건강 개선 효과 카드 컴포넌트
 *
 * 포함된 주요 영양소와 각 영양소의 건강 개선 효과를 표시합니다.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Heart, Shield, Zap } from 'lucide-react';
import type { MealSelectionReason } from '@/lib/diet/meal-selection-reason';

interface NutritionBenefitsCardProps {
  nutritionBenefits: MealSelectionReason['nutritionBenefits'];
  healthConditions: MealSelectionReason['healthConditions'];
}

const NUTRIENT_ICONS: Record<string, typeof TrendingUp> = {
  칼로리: TrendingUp,
  단백질: Zap,
  탄수화물: Zap,
  지방: Heart,
  식이섬유: Shield,
};

export function NutritionBenefitsCard({
  nutritionBenefits,
  healthConditions,
}: NutritionBenefitsCardProps) {
  if (nutritionBenefits.length === 0 && healthConditions.length === 0) {
    return null;
  }

  return (
    <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          포함된 영양소와 건강 개선 효과
        </CardTitle>
        <CardDescription className="text-slate-600">
          이 식단에 포함된 주요 영양소와 건강 개선 효과를 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* 영양소별 이점 */}
        {nutritionBenefits.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">주요 영양소</h3>
            <div className="space-y-4">
              {nutritionBenefits.map((benefit, index) => {
                const Icon = NUTRIENT_ICONS[benefit.nutrient] || TrendingUp;
                return (
                  <div 
                    key={index} 
                    className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50">
                        <Icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-base text-slate-900">{benefit.nutrient}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            {benefit.amount.toFixed(1)} {benefit.unit}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {benefit.benefit}
                        </p>
                      </div>
                    </div>
                    <div className="pl-11 space-y-2 text-sm border-t border-slate-100 pt-3">
                      <div className="flex items-start gap-2 p-2 rounded bg-slate-50">
                        <span className="text-slate-500 font-medium min-w-[70px]">현재 상태:</span>
                        <span className="text-slate-700">{benefit.currentStatus}</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded bg-emerald-50/50">
                        <span className="text-emerald-700 font-medium min-w-[70px]">개선 효과:</span>
                        <span className="text-slate-800">{benefit.improvement}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 건강 상태별 선택 이유 */}
        {healthConditions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">건강 상태별 맞춤 정보</h3>
            <div className="space-y-4">
              {healthConditions.map((condition, index) => (
                <div 
                  key={index} 
                  className="border border-slate-200 rounded-lg p-4 space-y-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-base text-slate-900">{condition.condition}</span>
                  </div>
                  <div className="pl-11 space-y-2 text-sm border-t border-slate-200 pt-3">
                    <div className="p-2 rounded bg-white/60">
                      <span className="text-slate-600 font-medium">선택 이유: </span>
                      <span className="text-slate-700">{condition.whySelected}</span>
                    </div>
                    <div className="p-2 rounded bg-blue-50/50">
                      <span className="text-blue-700 font-medium">기대 효과: </span>
                      <span className="text-slate-800">{condition.expectedImprovement}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

