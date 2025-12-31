/**
 * @file components/diet/meal-detail-page.tsx
 * @description 건강 맞춤 식단 상세 페이지 메인 클라이언트 컴포넌트
 *
 * 식단 정보, 선택 이유, 영양소 및 건강 개선 효과, 주의사항, 레시피 바로가기를 통합하여 표시합니다.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ChefHat, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NutritionBenefitsCard } from './nutrition-benefits-card';
import { HealthWarningsCard } from './health-warnings-card';
import { RecipeQuickLink } from './recipe-quick-link';
import { MfdsRecipeModal } from './mfds-recipe-modal';
import { useState } from 'react';
import type { MealType } from '@/types/health';
import type { DietPlan } from '@/types/health';
import type { MfdsRecipe } from '@/types/mfds-recipe';
import type { MealSelectionReason } from '@/lib/diet/meal-selection-reason';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

interface MealDetailPageClientProps {
  mealType: MealType;
  date: string;
  mealData: DietPlan | null;
  mfdsRecipe: MfdsRecipe | null;
  relatedRecipes: Array<{ rcpSeq: string; title: string; category: string }>;
  selectionReason: MealSelectionReason | null;
  healthProfile: {
    age: number;
    gender: string;
    height_cm: number;
    weight_kg: number;
    activity_level: string;
    daily_calorie_goal: number;
    diseases: string[];
    allergies: string[];
    dietary_preferences: string[];
  } | null;
  userName: string;
}

export function MealDetailPageClient({
  mealType,
  date,
  mealData,
  mfdsRecipe,
  relatedRecipes,
  selectionReason,
  healthProfile,
  userName,
}: MealDetailPageClientProps) {
  const router = useRouter();
  const [selectedRecipeSeq, setSelectedRecipeSeq] = useState<string | null>(null);

  const mealTypeLabel = MEAL_TYPE_LABELS[mealType];
  const mealName = mfdsRecipe?.title || mealData?.recipe?.title || `${mealTypeLabel} 식단`;

  // 날짜 포맷팅
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <ChefHat className="h-6 w-6 text-blue-600" />
                </div>
                {mealName}
              </h1>
              <p className="text-sm text-slate-600">
                {userName}님을 위한 건강 맞춤 식단
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">

      {/* 식단 정보 카드 */}
      {(mfdsRecipe || mealData) && (
        <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              식단 정보
            </CardTitle>
            <CardDescription className="text-slate-600">
              {mfdsRecipe?.description || mealData?.recipe?.title || '건강 맞춤 식단입니다'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="text-xs font-medium text-blue-700 mb-2">칼로리</div>
                <div className="text-2xl font-bold text-blue-900">
                  {mfdsRecipe?.nutrition.calories?.toFixed(0) || mealData?.calories?.toFixed(0) || 0}
                  <span className="text-sm font-normal text-blue-600 ml-1">kcal</span>
                </div>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 hover:border-purple-300 hover:shadow-sm transition-all">
                <div className="text-xs font-medium text-purple-700 mb-2">단백질</div>
                <div className="text-2xl font-bold text-purple-900">
                  {mfdsRecipe?.nutrition.protein?.toFixed(1) || mealData?.protein?.toFixed(1) || 0}
                  <span className="text-sm font-normal text-purple-600 ml-1">g</span>
                </div>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 hover:border-green-300 hover:shadow-sm transition-all">
                <div className="text-xs font-medium text-green-700 mb-2">탄수화물</div>
                <div className="text-2xl font-bold text-green-900">
                  {mfdsRecipe?.nutrition.carbohydrates?.toFixed(1) || mealData?.carbohydrates?.toFixed(1) || 0}
                  <span className="text-sm font-normal text-green-600 ml-1">g</span>
                </div>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 hover:border-amber-300 hover:shadow-sm transition-all">
                <div className="text-xs font-medium text-amber-700 mb-2">지방</div>
                <div className="text-2xl font-bold text-amber-900">
                  {mfdsRecipe?.nutrition.fat?.toFixed(1) || mealData?.fat?.toFixed(1) || 0}
                  <span className="text-sm font-normal text-amber-600 ml-1">g</span>
                </div>
              </div>
            </div>
            {(mfdsRecipe?.nutrition.sodium || mealData?.sodium) && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-1">나트륨</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {(mfdsRecipe?.nutrition.sodium || mealData?.sodium || 0).toFixed(0)} mg
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600 bg-white">
                    하루 권장량의 {((((mfdsRecipe?.nutrition.sodium || mealData?.sodium || 0) / 2000) * 100).toFixed(0))}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 선택 이유 섹션 */}
      {selectionReason && selectionReason.primaryReasons.length > 0 ? (
        <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              왜 이 식단을 선택했나요?
            </CardTitle>
            <CardDescription className="text-slate-600">
              {userName}님의 건강 상태를 고려하여 이 식단을 추천했습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {selectionReason.primaryReasons.map((reason, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-4 rounded-lg bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all shadow-sm"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 flex-1 pt-1">{reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : mealData && (
        <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              왜 이 식단을 선택했나요?
            </CardTitle>
            <CardDescription className="text-slate-600">
              {userName}님의 건강 상태를 고려하여 이 식단을 추천했습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 leading-relaxed">
              균형 잡힌 영양소 구성으로 건강한 식단입니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 영양소 및 건강 개선 효과 */}
      {selectionReason ? (
        <NutritionBenefitsCard
          nutritionBenefits={selectionReason.nutritionBenefits}
          healthConditions={selectionReason.healthConditions}
        />
      ) : mealData && healthProfile && (
        <Card>
          <CardHeader>
            <CardTitle>포함된 영양소와 건강 개선 효과</CardTitle>
            <CardDescription>
              이 식단에 포함된 주요 영양소 정보입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              영양소 분석 정보를 불러오는 중입니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 레시피 바로가기 */}
      {relatedRecipes.length > 0 && (
        <RecipeQuickLink
          recipes={relatedRecipes}
          onRecipeClick={(rcpSeq) => setSelectedRecipeSeq(rcpSeq)}
        />
      )}

      {/* 주의사항 */}
      {healthProfile && (mfdsRecipe || mealData) && (
        <HealthWarningsCard
          healthProfile={healthProfile}
          mealNutrition={mfdsRecipe?.nutrition || {
            calories: mealData?.calories || 0,
            protein: mealData?.protein || 0,
            carbohydrates: mealData?.carbohydrates || 0,
            fat: mealData?.fat || 0,
            sodium: mealData?.sodium || 0,
            fiber: null,
          }}
        />
      )}

      {/* 레시피 모달 */}
      {selectedRecipeSeq && (
        <MfdsRecipeModal
          rcpSeq={selectedRecipeSeq}
          open={!!selectedRecipeSeq}
          onOpenChange={(open) => !open && setSelectedRecipeSeq(null)}
        />
      )}
      </div>
    </div>
  );
}

