/**
 * @file components/diet/meal-recipe-card.tsx
 * @description 식단 상세 페이지의 레시피 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 반찬/국/찌개를 카드 형식으로 표시
 * 2. 레시피 이미지, 제목, 영양소 정보 표시
 * 3. 레시피 보기 버튼 (source에 따라 자동으로 올바른 경로로 연결)
 */

"use client";

import { RecipeDetailForDiet, RecipeNutrition } from "@/types/recipe";
import { Button } from "@/components/ui/button";
import { ExternalLink, ImageOff } from "lucide-react";
import { useState } from "react";
import { FOOD_IMAGE_DIRECT_LINKS } from "@/data/food-image-links";
import Link from "next/link";

interface MealRecipeCardProps {
  recipe: RecipeDetailForDiet;
  category: string;
  nutrition: RecipeNutrition;
}

export function MealRecipeCard({
  recipe,
  category,
  nutrition,
}: MealRecipeCardProps) {
  console.group("[MealRecipeCard] 레시피 카드 렌더링");
  console.log("recipe:", recipe);
  console.log("category:", category);
  console.log("nutrition:", nutrition);
  console.groupEnd();

  const [imageError, setImageError] = useState(false);

  // 레시피 이미지 URL 가져오기
  const getRecipeImageUrl = (): string => {
    if (recipe.image) return recipe.image;
    if (recipe.imageUrl) return recipe.imageUrl;

    // FOOD_IMAGE_DIRECT_LINKS에서 찾기
    const directLink = FOOD_IMAGE_DIRECT_LINKS[recipe.title];
    if (directLink) return directLink;

    // 기본 이미지
    return "/images/food/default.jpg";
  };

  // 레시피 링크 생성 (source에 따라)
  const getRecipeLink = (): string => {
    // source가 'foodsafety'이고 id가 RCP_SEQ 형식인 경우
    if (recipe.source === "foodsafety" && recipe.id) {
      // id가 이미 RCP_SEQ 형식인지 확인
      if (/^\d+$/.test(recipe.id)) {
        return `/recipes/mfds/${recipe.id}`;
      }
      // foodsafety-{RCP_SEQ} 형식인 경우
      if (recipe.id.startsWith("foodsafety-")) {
        const rcpSeq = recipe.id.replace("foodsafety-", "");
        return `/recipes/mfds/${rcpSeq}`;
      }
    }

    // 그 외의 경우 slug 사용 (타입 가드)
    if ('slug' in recipe && recipe.slug) {
      return `/recipes/${recipe.slug}`;
    }

    // slug가 없으면 title 기반 생성
    const slug = recipe.title.toLowerCase().replace(/\s+/g, "-");
    return `/recipes/${slug}`;
  };

  const imageUrl = getRecipeImageUrl();
  const recipeLink = getRecipeLink();

  return (
    <div className="rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all hover:shadow-lg">
      {/* 이미지 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
            loading="lazy"
            onError={() => {
              console.log("[MealRecipeCard] 이미지 로딩 실패:", imageUrl);
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="text-center">
              <ImageOff className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-xs text-emerald-600">이미지 없음</p>
            </div>
          </div>
        )}
        {/* 카테고리 배지 */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md">
            {category}
          </span>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className="p-4 space-y-3">
        {/* 제목 */}
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
          {recipe.title}
        </h3>

        {/* 영양소 정보 */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">칼로리</span>
            <span className="font-medium">
              {Math.round(nutrition.calories || 0)}kcal
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {nutrition.carbs !== null && nutrition.carbs !== undefined && (
              <span>탄 {nutrition.carbs.toFixed(1)}g</span>
            )}
            {nutrition.protein !== null && nutrition.protein !== undefined && (
              <span>단 {nutrition.protein.toFixed(1)}g</span>
            )}
            {nutrition.fat !== null && nutrition.fat !== undefined && (
              <span>지 {nutrition.fat.toFixed(1)}g</span>
            )}
          </div>
        </div>

        {/* 레시피 보기 버튼 */}
        <Button asChild className="w-full" variant="outline">
          <Link href={recipeLink}>
            레시피 보기
            <ExternalLink className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}













