/**
 * @file diet-card.tsx
 * @description 식단 카드 컴포넌트 (아침/점심/저녁/간식)
 *
 * 주요 기능:
 * 1. 식사 유형별 카드 표시
 * 2. 레시피 정보 및 영양소 표시
 * 3. 레시피 바로가기 링크
 * 4. 즐겨찾기 기능 (프리미엄 전용)
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { DietPlan, MealType, MEAL_TYPE_LABELS } from "@/types/health";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/diet/favorite-button";
import {
  getFruitIdFromRecipeTitle,
} from "@/lib/utils/fruit-mapper";
import { getRecipeImageUrlEnhanced } from "@/lib/utils/recipe-image";

const SOUP_KEYWORDS = ["국", "찌개", "탕"];
const DEFAULT_SOUP_IMAGE = getRecipeImageUrlEnhanced("된장찌개");

interface DietCardProps {
  mealType: MealType;
  dietPlan: DietPlan | null;
  className?: string;
  date?: string; // 날짜 정보 추가
}

export function DietCard({
  mealType,
  dietPlan,
  className,
  date,
}: DietCardProps) {
  if (!dietPlan || !dietPlan.recipe) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-gray-50 p-6 text-center",
          className,
        )}
      >
        <p className="text-muted-foreground">
          {MEAL_TYPE_LABELS[mealType]} 추천이 없습니다
        </p>
      </div>
    );
  }

  return (
    <DietCardContent
      mealType={mealType}
      dietPlan={dietPlan}
      className={className}
      date={date}
    />
  );
}

interface DietCardContentProps {
  mealType: MealType;
  dietPlan: DietPlan;
  className?: string;
  date?: string;
}

function DietCardContent({
  mealType,
  dietPlan,
  className,
  date,
}: DietCardContentProps) {
  const recipe = dietPlan.recipe;
  const imageFromPlan = getRepresentativeImageUrl(mealType, dietPlan);
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setUseDefaultImage(false);
    setImageError(false);
  }, [imageFromPlan]);

  const displayedImageUrl = useDefaultImage
    ? DEFAULT_SOUP_IMAGE
    : imageFromPlan;

  const handleImageError = () => {
    if (!useDefaultImage) {
      setUseDefaultImage(true);
      return;
    }
    setImageError(true);
  };

  // 레시피 제목 (compositionSummary가 있으면 첫 번째 항목, 없으면 recipe.title)
  const recipeTitle =
    dietPlan.compositionSummary && dietPlan.compositionSummary.length > 0
      ? dietPlan.compositionSummary.join(", ")
      : recipe.title;

  // 식단 상세 페이지 링크 생성
  let href: string;

  if (mealType === "snack") {
    // 간식 카드: 제철과일 상세 페이지로 이동
    const fruitId = getFruitIdFromRecipeTitle(recipeTitle);
    if (fruitId) {
      href = `/snacks/${fruitId}`;
    } else {
      // 제철과일이 아닌 경우 레시피 페이지로 이동
      href = `/recipes/${recipe.slug}`;
    }
  } else if (date) {
    // 아침/점심/저녁: 날짜가 있으면 식단 상세 페이지로
    href = `/diet/${mealType}/${date}`;
  } else {
    // 기본: 레시피 페이지로
    href = `/recipes/${recipe.slug}`;
  }

  // 영양 정보
  const nutrition = {
    calories: dietPlan.calories ?? null,
    protein: dietPlan.protein ?? null,
    carbs: dietPlan.carbohydrates ?? null,
    fat: dietPlan.fat ?? null,
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {/* 즐겨찾기 버튼 (우측 상단) */}
      <div
        className="absolute top-3 right-3 z-20"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200/50">
          <FavoriteButton
            recipeId={recipe.id}
            recipeTitle={recipeTitle}
            mealType={mealType}
            nutrition={nutrition}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>

      {/* 썸네일 */}
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {!imageError ? (
            <img
              src={displayedImageUrl}
              alt={`${MEAL_TYPE_LABELS[mealType]} 대표 국/찌개 이미지`}
              className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="text-center">
                <ImageOff className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-xs text-emerald-600">이미지 로딩 실패</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* 카드 내용 */}
      <Link href={href} className="block">
        <div className="p-4 space-y-3">
          {/* 식사 유형 및 구성품 목록 */}
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              {MEAL_TYPE_LABELS[mealType]}
            </p>
            {dietPlan.compositionSummary &&
            dietPlan.compositionSummary.length > 0 ? (
              <div className="mt-1">
                <p className="font-semibold text-base text-gray-900 group-hover:text-emerald-600 transition-colors leading-relaxed">
                  {dietPlan.compositionSummary.join(", ")}
                </p>
              </div>
            ) : (
              // compositionSummary가 없을 경우 기존 방식 (레거시 호환)
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-emerald-600 transition-colors mt-1">
                {recipe.title}
              </h3>
            )}
          </div>

          {/* 영양소 정보 */}
          <div className="space-y-1 text-sm">
            {typeof dietPlan.calories === "number" &&
              Number.isFinite(dietPlan.calories) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">칼로리</span>
                  <span className="font-medium">
                    {Math.round(dietPlan.calories)}kcal
                  </span>
                </div>
              )}
            <div className="flex justify-between text-xs text-muted-foreground">
              {typeof dietPlan.carbohydrates === "number" &&
                Number.isFinite(dietPlan.carbohydrates) && (
                  <span>탄 {dietPlan.carbohydrates.toFixed(1)}g</span>
                )}
              {typeof dietPlan.protein === "number" &&
                Number.isFinite(dietPlan.protein) && (
                  <span>단 {dietPlan.protein.toFixed(1)}g</span>
                )}
              {typeof dietPlan.fat === "number" &&
                Number.isFinite(dietPlan.fat) && (
                  <span>지 {dietPlan.fat.toFixed(1)}g</span>
                )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * 식단 카드 대표 이미지 결정 규칙 (사용자 요청 반영)
 *
 * - **식약처(MFDS) 이미지 우선**: foodsafety 레시피(foodsafety-*)의 thumbnail_url이 있으면 우선 사용
 * - **아침/점심/저녁 대표사진은 국/찌개/탕**: compositionSummary에서 국/찌개/탕 항목을 찾아 그 제목 기반 이미지 사용
 * - **간식(제철 과일)**: fruit-mapper의 imageUrl 사용 (사과 이미지 오류 방지)
 */
function getRepresentativeImageUrl(mealType: MealType, dietPlan: DietPlan): string {
  const recipe = dietPlan.recipe;

  const recipeId = recipe?.id ?? "";
  const thumbnailUrl = recipe?.thumbnail_url ?? null;
  const isFoodsafety = recipeId.startsWith("foodsafety-");

  // 1) 식약처 레시피 썸네일이 있으면 우선 (요청: 식약처 API 우선 적용)
  if (isFoodsafety && thumbnailUrl && thumbnailUrl.trim().length > 0) {
    return thumbnailUrl;
  }

  // 2) 간식은 제철과일 이미지 우선
  if (mealType === "snack") {
    const title =
      Array.isArray(dietPlan.compositionSummary) && dietPlan.compositionSummary.length > 0
        ? dietPlan.compositionSummary[0]
        : recipe?.title ?? "";
    const fruitId = getFruitIdFromRecipeTitle(title);
    if (fruitId) {
      // 제철 과일은 docs/foodjpg.md의 로컬 이미지(/images/food/사과.jpg 등)를 우선 사용하도록
      // getRecipeImageUrlEnhanced 내부에서 직접 링크 매칭을 먼저 시도합니다.
      return getRecipeImageUrlEnhanced(title, null);
    }
    // 폴백: 관련성 기반 이미지 생성
    return getRecipeImageUrlEnhanced(title, thumbnailUrl);
  }

  // 3) 아침/점심/저녁은 “국/찌개/탕”을 대표 이미지로 사용
  const safeSummary = dietPlan.compositionSummary?.map((item) => item.trim()).filter(Boolean) ?? [];
  const soupFocusedItem =
    safeSummary.find((item) => SOUP_KEYWORDS.some((keyword) => item.includes(keyword))) ?? null;

  if (soupFocusedItem) {
    // 제목 기반 이미지 (카테고리/매칭 규칙 적용)
    const candidate = getRecipeImageUrlEnhanced(soupFocusedItem);
    // 카테고리 SVG(아이콘)로 떨어지면, 실사 국/찌개 이미지로 강제 폴백
    if (candidate === "/images/food/soup.svg") {
      return DEFAULT_SOUP_IMAGE;
    }
    return candidate;
  }

  // 4) 그래도 없으면 레시피 제목 기반 (식약처 아닌 경우도 thumbnail은 관련성 점수로 판단)
  const fallback = getRecipeImageUrlEnhanced(recipe?.title ?? "", thumbnailUrl);
  if (fallback === "/images/food/soup.svg") {
    return DEFAULT_SOUP_IMAGE;
  }
  return fallback;
}
