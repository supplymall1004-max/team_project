/**
 * @file components/family/diet-meal-card.tsx
 * @description 가족 식단용 식사 카드 컴포넌트
 *
 * 이 컴포넌트는 가족 식단에서 사용되는 식사 정보를 카드 형식으로 표시합니다.
 * - 레시피 정보, 영양 정보, 재료 목록 표시
 * - 가족 식단 특화 UI (통합 식단 표시)
 *
 * @dependencies
 * - 기존 MealCard 컴포넌트 활용 가능
 * - 영양 정보 표시
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, ChefHat, AlertTriangle } from "lucide-react";
import type { MealComposition, RecipeDetailForDiet } from "@/types/recipe";

interface DietMealCardProps {
  meal: MealComposition | RecipeDetailForDiet;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  isUnified?: boolean;
  showIngredients?: boolean;
  showInstructions?: boolean;
  compact?: boolean;
}

export function DietMealCard({
  meal,
  mealType,
  isUnified = false,
  showIngredients = true,
  showInstructions = false,
  compact = false,
}: DietMealCardProps) {
  // MealComposition 타입인지 확인
  const isMealComposition = "rice" in meal && "sides" in meal;

  // 식사 타입 한글 변환
  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "breakfast": return "아침";
      case "lunch": return "점심";
      case "dinner": return "저녁";
      case "snack": return "간식";
      default: return type;
    }
  };

  // 칼로리 계산
  const calculateCalories = () => {
    if (isMealComposition) {
      const composition = meal as MealComposition;
      const allDishes = [composition.rice, ...composition.sides, composition.soup].filter(Boolean);
      return allDishes.reduce((total, dish) => total + (dish?.nutrition.calories || 0), 0);
    } else {
      return (meal as RecipeDetailForDiet).nutrition.calories;
    }
  };

  const totalCalories = calculateCalories();

  if (compact) {
    return (
      <Card className={`border-2 ${isUnified ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isUnified ? "default" : "secondary"} className="text-xs">
                  {getMealTypeLabel(mealType)}
                </Badge>
                {isUnified && (
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    통합 식단
                  </Badge>
                )}
              </div>

              {isMealComposition ? (
                <div className="space-y-1">
                  {(meal as MealComposition).rice && (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      🍚 {(meal as MealComposition).rice!.title}
                    </p>
                  )}
                  {(meal as MealComposition).sides.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-green-700">🥬 반찬</p>
                      <div className="flex flex-wrap gap-1">
                        {(meal as MealComposition).sides.slice(0, 3).map((side, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded truncate max-w-[80px]">
                            {side.title}
                          </span>
                        ))}
                        {(meal as MealComposition).sides.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{(meal as MealComposition).sides.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {(meal as MealComposition).soup && (
                    <p className="text-xs font-medium text-blue-700">
                      🥣 {(meal as MealComposition).soup!.title}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-900 truncate">
                  {(meal as RecipeDetailForDiet).title}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-orange-600">
                {totalCalories}kcal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${isUnified ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ChefHat className="h-5 w-5 text-orange-500" />
            {getMealTypeLabel(mealType)}
            {isUnified && (
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                통합 식단
              </Badge>
            )}
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-600">
              {totalCalories}kcal
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isMealComposition ? (
          // MealComposition 표시
          <div className="space-y-3">
            {/* 밥 */}
            {(meal as MealComposition).rice && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    🍚 {(meal as MealComposition).rice!.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(meal as MealComposition).rice!.nutrition.calories}kcal
                  </p>
                </div>
              </div>
            )}

            {/* 반찬들 */}
            {(meal as MealComposition).sides.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">반찬</p>
                <div className="space-y-2">
                  {(meal as MealComposition).sides.map((side, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm text-gray-900">{side.title}</span>
                      <span className="text-sm text-gray-600">{side.nutrition.calories}kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 국/찌개 */}
            {(meal as MealComposition).soup && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    🥣 {(meal as MealComposition).soup!.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(meal as MealComposition).soup!.nutrition.calories}kcal
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 단일 레시피 표시
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">
                {(meal as RecipeDetailForDiet).title}
              </h4>

              {(meal as RecipeDetailForDiet).description && (
                <p className="text-sm text-gray-600 mb-3">
                  {(meal as RecipeDetailForDiet).description}
                </p>
              )}

              {/* 영양 정보 */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {(meal as RecipeDetailForDiet).nutrition.protein}g
                  </p>
                  <p className="text-gray-600">단백질</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {(meal as RecipeDetailForDiet).nutrition.carbs}g
                  </p>
                  <p className="text-gray-600">탄수화물</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {(meal as RecipeDetailForDiet).nutrition.fat}g
                  </p>
                  <p className="text-gray-600">지방</p>
                </div>
              </div>
            </div>

            {/* 재료 목록 */}
            {showIngredients && (meal as RecipeDetailForDiet).ingredients && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">재료</h5>
                <div className="flex flex-wrap gap-2">
                  {(meal as RecipeDetailForDiet).ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ingredient.name} {ingredient.amount}{ingredient.unit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 조리법 */}
            {showInstructions && (meal as RecipeDetailForDiet).instructions && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">조리법</h5>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {(meal as RecipeDetailForDiet).instructions}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 추가 정보 */}
        <Separator />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>예상 조리시간: 30분</span>
          </div>
          {isUnified && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>가족 모두 가능</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
