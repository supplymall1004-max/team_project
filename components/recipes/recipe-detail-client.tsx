/**
 * @file recipe-detail-client.tsx
 * @description 레시피 상세 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 레시피 메타 정보 표시 (제목, 설명, 별점, 난이도, 조리 시간)
 * 2. 재료 목록 표시
 * 3. 단계별 카드 형식 레시피 표시
 * 4. 요리 시작 모드 전환 (타이머, 체크리스트)
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import Image from "next/image";
import { Clock, ChefHat, Star, Play, CheckCircle2 } from "lucide-react";
import { RecipeDetail } from "@/types/recipe";
import {
  formatCookingTime,
  formatDifficulty,
  getRatingStars,
} from "@/lib/recipes/utils";
import { getRecipeImageUrlEnhanced, getRecipeCategory } from "@/lib/utils/recipe-image";
import {
  preloadImage,
  validateAndFallbackImage,
} from "@/lib/food-image-fallback";
import { logImageLoading } from "@/lib/image-monitoring";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { FOOD_IMAGE_LIBRARY } from "@/data/food-image-links";
import {
  getCachedRecipeImage,
  setCachedRecipeImage,
} from "@/lib/cache/image-cache";
import { Button } from "@/components/ui/button";
import { RecipeStepCard } from "./recipe-step-card";
import { CookingMode } from "./cooking-mode";
import { RecipeRating } from "./recipe-rating";

interface RecipeDetailClientProps {
  recipe: RecipeDetail;
}

export function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set()
  );

  const ratingStars = getRatingStars(recipe.rating_stats?.average_rating || 0);

  const handleIngredientToggle = (ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  const handleStartCooking = () => {
    console.groupCollapsed("[RecipeDetail] 요리 시작");
    console.log("recipeId", recipe.id);
    console.log("stepsCount", recipe.steps.length);
    console.groupEnd();
    setIsCookingMode(true);
  };

  if (isCookingMode) {
    return (
      <CookingMode
        recipe={recipe}
        checkedIngredients={checkedIngredients}
        onIngredientToggle={handleIngredientToggle}
        onExit={() => setIsCookingMode(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* 레시피 헤더 */}
      <div className="space-y-4">
        <RecipeHeroImage recipe={recipe} />

        {/* 제목 및 메타 정보 */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">
                {recipe.description}
              </p>
            )}
          </div>

          {/* 별점 */}
          {recipe.rating_stats && recipe.rating_stats.rating_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {ratingStars.map((star, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${
                      star === "full"
                        ? "fill-yellow-400 text-yellow-400"
                        : star === "half"
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {recipe.rating_stats.average_rating.toFixed(1)} (
                {recipe.rating_stats.rating_count}개 평가)
              </span>
            </div>
          )}

          {/* 메타 정보 (조리 시간, 난이도, 인분) */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{formatCookingTime(recipe.cooking_time_minutes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              <span>{formatDifficulty(recipe.difficulty)}</span>
            </div>
            <div>
              <span>{recipe.servings}인분</span>
            </div>
          </div>

          {/* 요리 시작 버튼 */}
          <Button size="lg" onClick={handleStartCooking} className="mt-4">
            <Play className="h-5 w-5 mr-2" />
            요리 시작하기
          </Button>
        </div>
      </div>

      {/* 별점 평가 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6">
        <RecipeRating
          recipeId={recipe.id}
          currentRating={recipe.user_rating}
          averageRating={recipe.rating_stats?.average_rating || 0}
          ratingCount={recipe.rating_stats?.rating_count || 0}
        />
      </div>

      {/* 재료 목록 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">재료</h2>
        <ul className="space-y-3">
          {recipe.ingredients.map((ingredient) => {
            const isChecked = checkedIngredients.has(ingredient.id);
            return (
              <li
                key={ingredient.id}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleIngredientToggle(ingredient.id)}
              >
                <CheckCircle2
                  className={`h-5 w-5 flex-shrink-0 ${
                    isChecked
                      ? "text-green-600 fill-green-600"
                      : "text-gray-300"
                  }`}
                />
                <span
                  className={isChecked ? "line-through text-muted-foreground" : ""}
                >
                  {ingredient.name}
                  {ingredient.quantity && ingredient.unit
                    ? ` ${ingredient.quantity}${ingredient.unit}`
                    : ingredient.quantity
                    ? ` ${ingredient.quantity}`
                    : ""}
                  {ingredient.notes && ` (${ingredient.notes})`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 단계별 레시피 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">조리 과정</h2>
        <div className="space-y-4">
          {recipe.steps.map((step) => (
            <RecipeStepCard key={step.id} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RecipeHeroImageProps {
  recipe: RecipeDetail;
}

function RecipeHeroImage({ recipe }: RecipeHeroImageProps) {
  const supabase = useClerkSupabaseClient();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [validatedImageUrl, setValidatedImageUrl] = useState<string | null>(
    null
  );
  const [loadStartTime, setLoadStartTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCacheHit, setIsCacheHit] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const resolvedImageUrl = getRecipeImageUrlEnhanced(
    recipe.title,
    recipe.thumbnail_url
  );
  const finalImageUrl = validatedImageUrl || resolvedImageUrl;
  const recipeCacheKey = recipe.slug || recipe.id || recipe.title;

  const cacheValidatedImage = useCallback(
    (url: string, cacheHitValue: boolean) => {
      if (!recipeCacheKey) return;
      setCachedRecipeImage(
        recipeCacheKey,
        url,
        resolveImageSource(url),
        cacheHitValue
      );
    },
    [recipeCacheKey]
  );

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    const startTime = new Date();
    setLoadStartTime(startTime);
    setImageLoaded(false);
    setImageError(false);
    setValidatedImageUrl(null);
    setRetryCount(0);
    setIsCacheHit(false);

    let errorCode:
      | "timeout"
      | "network"
      | "validation"
      | "unknown"
      | undefined;
    let actualRetryCount = 0;

    const cachedImage = recipeCacheKey
      ? getCachedRecipeImage(recipeCacheKey)
      : null;

    if (cachedImage) {
      setValidatedImageUrl(cachedImage.imageUrl);
      setImageLoaded(true);
      setImageError(false);
      setIsCacheHit(cachedImage.cacheHit);
      setRetryCount(0);
      setLoadStartTime(new Date(cachedImage.storedAt));
      return () => {
        isMounted = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }

    const loadImage = async () => {
      try {
        const preloadPromise = preloadImage(resolvedImageUrl);
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Preload timeout")), 5000);
        });

        await Promise.race([preloadPromise, timeoutPromise]);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const validatedUrl = await validateAndFallbackImage(
          resolvedImageUrl,
          recipe.title,
          {
            foodName: recipe.title,
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2,
            timeout: 3000,
            onError: (error, attempt) => {
              if (!isMounted) return;
              setRetryCount(attempt);
              actualRetryCount = attempt;

              const message =
                error instanceof Error ? error.message : String(error);
              if (message.includes("timeout")) {
                errorCode = "timeout";
              } else if (
                message.includes("network") ||
                message.includes("fetch")
              ) {
                errorCode = "network";
              } else {
                errorCode = "validation";
              }
            },
          }
        );

        if (!isMounted) return;

        const cacheHit = validatedUrl === resolvedImageUrl;
        setIsCacheHit(cacheHit);
        setValidatedImageUrl(validatedUrl);
        setImageLoaded(true);
        setImageError(false);
        cacheValidatedImage(validatedUrl, cacheHit);

        await logImageLoading(supabase, {
          recipeTitle: recipe.title,
          imageUrl: resolvedImageUrl,
          finalImageUrl: validatedUrl,
          imageSource: resolveImageSource(validatedUrl),
          loadStartTime: startTime,
          loadEndTime: new Date(),
          success: true,
          retryCount: actualRetryCount,
          cacheHit,
        });
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const totalTime = new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("timeout")) {
          errorCode = "timeout";
        } else if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          errorCode = "network";
        } else if (!errorCode) {
          errorCode = "unknown";
        }

        if (!isMounted) return;

        setValidatedImageUrl(resolvedImageUrl);
        setImageLoaded(true);
        setImageError(true);

        await logImageLoading(supabase, {
          recipeTitle: recipe.title,
          imageUrl: resolvedImageUrl,
          finalImageUrl: resolvedImageUrl,
          imageSource: resolveImageSource(resolvedImageUrl),
          loadStartTime: startTime,
          loadEndTime: totalTime,
          success: false,
          errorMessage,
          errorCode,
          retryCount: actualRetryCount,
          cacheHit: false,
        });
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    cacheValidatedImage,
    recipe.title,
    recipeCacheKey,
    reloadToken,
    resolvedImageUrl,
    supabase,
  ]);

  const handleRetry = () => {
    setReloadToken((prev) => prev + 1);
  };

  const handleImageError = () => {
    const errorMsg = `[RecipeDetail] 이미지 로딩 실패: ${finalImageUrl}`;
    setImageError(true);
    if (!loadStartTime) return;

    logImageLoading(supabase, {
      recipeTitle: recipe.title,
      imageUrl: finalImageUrl,
      finalImageUrl,
      imageSource: resolveImageSource(finalImageUrl),
      loadStartTime,
      loadEndTime: new Date(),
      success: false,
      errorMessage: errorMsg,
      errorCode: "network",
      retryCount,
      cacheHit: isCacheHit,
    }).catch((loggingError) => {
      console.error("[RecipeDetail] 이미지 로딩 실패 로그 실패:", loggingError);
    });
  };

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!loadStartTime || !finalImageUrl) return;

    if (process.env.NODE_ENV === "development") {
      console.log("[RecipeDetail] 이미지 로딩 성공", {
        width: event.currentTarget.naturalWidth,
        height: event.currentTarget.naturalHeight,
      });
    }

    logImageLoading(supabase, {
      recipeTitle: recipe.title,
      imageUrl: finalImageUrl,
      finalImageUrl: finalImageUrl,
      imageSource: resolveImageSource(finalImageUrl),
      loadStartTime,
      loadEndTime: new Date(),
      success: true,
      retryCount,
      cacheHit: isCacheHit,
    }).catch((loggingError) => {
      console.error("[RecipeDetail] 이미지 로딩 성공 로그 실패:", loggingError);
    });
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
      {!imageLoaded ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-200" />
            <p className="text-sm text-muted-foreground">이미지를 불러오는 중...</p>
          </div>
        </div>
      ) : !imageError ? (
        finalImageUrl.includes("lh3.googleusercontent.com") ? (
          <Image
            src={getRecipeCategory(recipe.title) === 'rice' ? FOOD_IMAGE_LIBRARY.rice.url :
                 getRecipeCategory(recipe.title) === 'soup' ? FOOD_IMAGE_LIBRARY.soup.url :
                 getRecipeCategory(recipe.title) === 'stew' ? FOOD_IMAGE_LIBRARY.stew.url :
                 getRecipeCategory(recipe.title) === 'side' ? FOOD_IMAGE_LIBRARY.side.url :
                 getRecipeCategory(recipe.title) === 'fruit' ? FOOD_IMAGE_LIBRARY.fruit.url :
                 FOOD_IMAGE_LIBRARY.default.url}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
            unoptimized={true}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <Image
            src={finalImageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
            unoptimized={
              finalImageUrl.includes("unsplash.com") ||
              finalImageUrl.includes("pixabay.com") ||
              finalImageUrl.includes("images.unsplash.com")
            }
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-6 text-center">
          <div>
            <p className="text-sm font-semibold text-orange-700">이미지 로딩에 실패했습니다.</p>
            <p className="text-xs text-orange-600 mt-1">네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
            <button
              type="button"
              className="mt-3 text-xs font-medium text-orange-700 underline-offset-2 hover:underline"
              onClick={handleRetry}
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function resolveImageSource(url: string | null) {
  if (!url) return "unknown";
  if (url.includes("pixabay.com")) return "pixabay";
  if (url.includes("unsplash.com") || url.includes("images.unsplash.com")) {
    return "unsplash";
  }
  return url.startsWith("http") ? "fallback" : "local";
}

