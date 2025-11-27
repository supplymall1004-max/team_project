/**
 * @file recipe-card.tsx
 * @description 레시피 카드 컴포넌트 (목록 페이지용)
 *
 * 주요 기능:
 * 1. 레시피 썸네일, 제목, 별점, 난이도, 조리 시간 표시
 * 2. 클릭 시 레시피 상세 페이지로 이동
 * 3. 반응형 디자인 (모바일/데스크톱)
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Clock, Star, ChefHat, ImageOff } from "lucide-react";
import { RecipeListItem } from "@/types/recipe";
import {
  formatCookingTime,
  formatDifficulty,
  getRatingStars,
} from "@/lib/recipes/utils";
import { cn } from "@/lib/utils";
import { getRecipeImageUrlEnhanced } from "@/lib/utils/recipe-image";
import { FOOD_IMAGE_LIBRARY, FOOD_IMAGE_FALLBACK_URL } from "@/data/food-image-links";

interface RecipeCardProps {
  recipe: RecipeListItem;
  className?: string;
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const ratingStars = getRatingStars(recipe.average_rating || 0);

  // 로컬 이미지 직접 사용 - 검색 로직 제거
  const imageUrl = getRecipeImageUrlEnhanced(recipe.title, recipe.thumbnail_url);

  // 폴백 이미지 URL 초기화
  const fallbackImageUrl = FOOD_IMAGE_FALLBACK_URL || FOOD_IMAGE_LIBRARY.default.url;


  const handleClick = () => {
    console.groupCollapsed("[RecipeCard] 카드 클릭");
    console.log("recipeId", recipe.id);
    console.log("slug", recipe.slug);
    console.groupEnd();
  };

  return (
    <div ref={cardRef} data-preload-images={JSON.stringify([fallbackImageUrl])}>
      <Link
        href={`/recipes/${recipe.slug}`}
        onClick={handleClick}
        className={cn(
          "group block rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
          className
        )}
      >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {!imageError ? (
          <>
            {imageUrl.startsWith("/images/food/") && imageUrl.endsWith(".jpg") ? (
              // 로컬 JPG 파일 직접 로딩 (public/images/food/ 폴더에서)
              <Image
                src={imageUrl}
                alt={recipe.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                unoptimized={false}
                onError={() => {
                  console.error("[RecipeCard] 로컬 JPG 이미지 로딩 실패:", imageUrl);
                  setImageError(true);
                }}
              />
            ) : (
              <Image
                src={imageUrl}
                alt={recipe.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                unoptimized={imageUrl.includes("images.unsplash.com") || imageUrl.includes("pixabay.com") || imageUrl.endsWith(".svg")}
                onError={() => {
                  console.error("[RecipeCard] 이미지 로딩 실패:", imageUrl);
                  setImageError(true);
                }}
          />
          )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="text-center">
              <ImageOff className="h-8 w-8 text-orange-300 mx-auto mb-2" />
              <p className="text-xs text-orange-600">이미지 로딩 실패</p>
            </div>
          </div>
        )}

      </div>

      {/* 카드 내용 */}
      <div className="p-4 space-y-3">
        {/* 제목 */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
          {recipe.title}
        </h3>

        {/* 별점 및 평가 개수 */}
        {recipe.rating_count > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {ratingStars.map((star, index) => (
                <Star
                  key={index}
                  className={cn(
                    "h-4 w-4",
                    star === "full"
                      ? "fill-yellow-400 text-yellow-400"
                      : star === "half"
                      ? "fill-yellow-400/50 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {recipe.average_rating.toFixed(1)} ({recipe.rating_count})
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">아직 평가가 없습니다</div>
        )}

        {/* 메타 정보 (조리 시간, 난이도) */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatCookingTime(recipe.cooking_time_minutes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4" />
            <span>{formatDifficulty(recipe.difficulty)}</span>
          </div>
        </div>

        {/* 작성자 */}
        <div className="text-xs text-muted-foreground">
          by {recipe.user.name}
        </div>
      </div>
    </Link>
    </div>
  );
}

