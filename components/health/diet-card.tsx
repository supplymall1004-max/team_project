/**
 * @file diet-card.tsx
 * @description 식단 카드 컴포넌트 (아침/점심/저녁/간식)
 *
 * 주요 기능:
 * 1. 식사 유형별 카드 표시
 * 2. 레시피 정보 및 영양소 표시
 * 3. 레시피 바로가기 링크
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { DietPlan, MealType, MEAL_TYPE_LABELS } from "@/types/health";
import { cn } from "@/lib/utils";
import { FOOD_IMAGE_DIRECT_LINKS } from "@/data/food-image-links";

const SOUP_KEYWORDS = ["국", "찌개", "탕"];
const SOUP_IMAGE_ENTRIES = Object.entries(FOOD_IMAGE_DIRECT_LINKS).filter(
  ([foodName, url]) => url.endsWith(".jpg") && SOUP_KEYWORDS.some((keyword) => foodName.includes(keyword))
);

// 실제 존재하는 파일들만 사용 (public/images/food/에 실제로 존재하는 파일들)
const EXISTING_SOUP_FILES = [
  '김치찌개', '순두부찌개', '된장찌개'
];

const EXISTING_SOUP_IMAGES = SOUP_IMAGE_ENTRIES.filter(([foodName]) =>
  EXISTING_SOUP_FILES.some(name => foodName.includes(name))
);

const DEFAULT_SOUP_IMAGE = EXISTING_SOUP_IMAGES.length > 0
  ? EXISTING_SOUP_IMAGES[0][1]
  : "/images/food/soup.svg"; // SVG 파일로 fallback


interface DietCardProps {
  mealType: MealType;
  dietPlan: DietPlan | null;
  className?: string;
}

export function DietCard({ mealType, dietPlan, className }: DietCardProps) {
  if (!dietPlan || !dietPlan.recipe) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-gray-50 p-6 text-center",
          className
        )}
      >
        <p className="text-muted-foreground">
          {MEAL_TYPE_LABELS[mealType]} 추천이 없습니다
        </p>
      </div>
    );
  }

  return (
    <DietCardContent mealType={mealType} dietPlan={dietPlan} className={className} />
  );
}

interface DietCardContentProps {
  mealType: MealType;
  dietPlan: DietPlan;
  className?: string;
}

function DietCardContent({ mealType, dietPlan, className }: DietCardContentProps) {
  const recipe = dietPlan.recipe;
  const soupImageFromSummary = getSoupImageFromSummary(dietPlan.compositionSummary);
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setUseDefaultImage(false);
    setImageError(false);
  }, [soupImageFromSummary]);

  const displayedImageUrl = useDefaultImage ? DEFAULT_SOUP_IMAGE : soupImageFromSummary;

  const handleImageError = () => {
    if (!useDefaultImage) {
      setUseDefaultImage(true);
      return;
    }
    setImageError(true);
  };

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={cn(
        "group block rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={displayedImageUrl}
            alt={`${MEAL_TYPE_LABELS[mealType]} 대표 국/찌개 이미지`}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
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

      {/* 카드 내용 */}
      <div className="p-4 space-y-3">
        {/* 식사 유형 및 구성품 목록 */}
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            {MEAL_TYPE_LABELS[mealType]}
          </p>
          {dietPlan.compositionSummary && dietPlan.compositionSummary.length > 0 ? (
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
          {dietPlan.calories && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">칼로리</span>
              <span className="font-medium">{dietPlan.calories}kcal</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            {dietPlan.carbohydrates !== null && (
              <span>탄 {dietPlan.carbohydrates.toFixed(1)}g</span>
            )}
            {dietPlan.protein !== null && (
              <span>단 {dietPlan.protein.toFixed(1)}g</span>
            )}
            {dietPlan.fat !== null && (
              <span>지 {dietPlan.fat.toFixed(1)}g</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getSoupImageFromSummary(summary?: string[] | null): string {
  const safeSummary = summary?.map((item) => item.trim()).filter(Boolean) ?? [];

  // summary가 없거나 비어있으면 바로 기본 이미지 반환
  if (safeSummary.length === 0) {
    return DEFAULT_SOUP_IMAGE;
  }

  const findImageForFood = (foodName: string): string | null => {
    const exactMatch = FOOD_IMAGE_DIRECT_LINKS[foodName];
    if (exactMatch && exactMatch.endsWith(".jpg")) {
      return exactMatch;
    }

    const partialMatch = SOUP_IMAGE_ENTRIES.find(([name]) => foodName.includes(name));
    if (partialMatch) {
      return partialMatch[1];
    }

    return null;
  };

  // 국/찌개/탕이 포함된 항목을 최우선으로 선택
  const soupFocusedItem = safeSummary.find((item) =>
    SOUP_KEYWORDS.some((keyword) => item.includes(keyword))
  );
  if (soupFocusedItem) {
    const soupImage = findImageForFood(soupFocusedItem);
    if (soupImage) {
      return soupImage;
    }
  }

  // 그 외 항목에서도 이미지 찾기
  for (const item of safeSummary) {
    const image = findImageForFood(item);
    if (image) {
      return image;
    }
  }

  // 기본값: 실제 존재하는 국/찌개 이미지
  return DEFAULT_SOUP_IMAGE;
}

