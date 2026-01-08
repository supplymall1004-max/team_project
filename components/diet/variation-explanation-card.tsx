/**
 * @file components/diet/variation-explanation-card.tsx
 * @description 변형 설명 카드 - 레시피 선택 이유 및 영양소 보완 이유 설명
 *
 * 주요 기능:
 * - 레시피 선택 이유 설명
 * - 영양소 보완 이유 표시
 * - 대체 레시피 추천
 *
 * @dependencies
 * - components/ui/card: 카드 컴포넌트
 * - components/ui/badge: 배지 컴포넌트
 * - lucide-react: 아이콘
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, TrendingUp, RefreshCw } from "lucide-react";
import type { RecipeDetailForDiet } from "@/types/recipe";

interface VariationExplanationCardProps {
  recipe: RecipeDetailForDiet;
  reason: {
    type: "nutrition" | "variation" | "preference" | "health";
    description: string;
    nutrients?: string[]; // 보완된 영양소 (예: ["단백질", "칼슘"])
  };
  alternativeRecipes?: RecipeDetailForDiet[]; // 대체 레시피
  onSelectAlternative?: (recipe: RecipeDetailForDiet) => void;
}

/**
 * 변형 설명 카드
 */
export function VariationExplanationCard({
  recipe,
  reason,
  alternativeRecipes = [],
  onSelectAlternative,
}: VariationExplanationCardProps) {
  const getReasonIcon = () => {
    switch (reason.type) {
      case "nutrition":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "variation":
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case "preference":
        return <Info className="h-4 w-4 text-green-500" />;
      case "health":
        return <Info className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getReasonLabel = () => {
    switch (reason.type) {
      case "nutrition":
        return "영양소 보완";
      case "variation":
        return "변형 레시피";
      case "preference":
        return "선호도 반영";
      case "health":
        return "건강 고려";
      default:
        return "선택 이유";
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getReasonIcon()}
            {recipe.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {getReasonLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 선택 이유 설명 */}
        <div className="text-sm text-gray-700">
          <p>{reason.description}</p>
        </div>

        {/* 영양소 보완 정보 */}
        {reason.nutrients && reason.nutrients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reason.nutrients.map((nutrient) => (
              <Badge key={nutrient} variant="secondary" className="text-xs">
                {nutrient} 보완
              </Badge>
            ))}
          </div>
        )}

        {/* 영양소 정보 */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">칼로리:</span> {recipe.nutrition.calories}kcal
          </div>
          <div>
            <span className="font-medium">단백질:</span> {Math.round(recipe.nutrition.protein)}g
          </div>
          <div>
            <span className="font-medium">탄수화물:</span> {Math.round(recipe.nutrition.carbs)}g
          </div>
          <div>
            <span className="font-medium">지방:</span> {Math.round(recipe.nutrition.fat)}g
          </div>
        </div>

        {/* 대체 레시피 추천 */}
        {alternativeRecipes.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-gray-600 mb-2">대체 레시피</p>
            <div className="space-y-1">
              {alternativeRecipes.slice(0, 3).map((alt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-1.5"
                  onClick={() => onSelectAlternative?.(alt)}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  {alt.title}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

