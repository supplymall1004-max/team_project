/**
 * @file recipe-rating.tsx
 * @description 레시피 별점 평가 컴포넌트
 *
 * 주요 기능:
 * 1. 별점 입력 (1점 단위)
 * 2. 평가 생성/업데이트
 * 3. 평균 별점 표시
 */

"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getRatingStars } from "@/lib/recipes/utils";

interface RecipeRatingProps {
  recipeId: string;
  currentRating?: number;
  averageRating: number;
  ratingCount: number;
  onRatingChange?: () => void;
}

export function RecipeRating({
  recipeId,
  currentRating,
  averageRating,
  ratingCount,
  onRatingChange,
}: RecipeRatingProps) {
  const { user } = useUser();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>(currentRating);

  const handleStarClick = async (rating: number) => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    console.group("[RecipeRating] 별점 평가");
    console.log("recipeId", recipeId);
    console.log("rating", rating);
    console.log("clerk_id", user.id);

    setIsSubmitting(true);

    try {
      // 서버 사이드 API 호출 (사용자 조회 및 평가 저장 모두 처리)
      console.log("💾 평가 저장 중...", {
        recipe_id: recipeId,
        rating: rating,
      });

      const ratingResponse = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!ratingResponse.ok) {
        const errorData = await ratingResponse.json().catch(() => ({}));
        console.error("❌ 평가 저장 실패:", {
          status: ratingResponse.status,
          error: errorData,
        });
        
        // 사용자가 없는 경우 동기화 안내
        if (ratingResponse.status === 404 && errorData.error?.includes("사용자")) {
          // 사용자 동기화 시도
          console.log("⚠️ 사용자 동기화 시도 중...");
          const syncResponse = await fetch("/api/sync-user", {
            method: "POST",
          });

          if (syncResponse.ok) {
            // 동기화 성공 후 재시도
            console.log("✅ 사용자 동기화 성공 - 재시도 중...");
            const retryResponse = await fetch(`/api/recipes/${recipeId}/rating`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ rating }),
            });

            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}));
              throw new Error(retryErrorData.error || "평가 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }

            const retryResult = await retryResponse.json();
            console.log("✅ 재시도 후 평가 저장 성공:", retryResult.data);
            setUserRating(rating);
            onRatingChange?.();
            console.groupEnd();
            return;
          }
        }
        
        const errorMessage = errorData.error || 
          `평가 저장 실패 (상태 코드: ${ratingResponse.status})`;
        
        throw new Error(errorMessage);
      }

      const ratingResult = await ratingResponse.json();
      console.log("✅ 평가 저장 성공:", ratingResult.data);

      console.log("✅ 평가 저장 성공");
      console.groupEnd();

      setUserRating(rating);
      onRatingChange?.();
    } catch (error) {
      console.error("❌ 평가 오류:", {
        error,
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error instanceof Error ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : String(error),
      });
      console.groupEnd();
      
      let errorMessage = "평가 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // Supabase 에러 객체 처리
        const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };
        errorMessage = supabaseError.message || 
          supabaseError.details || 
          supabaseError.hint || 
          errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating !== null ? hoveredRating : (userRating || averageRating);
  const stars = getRatingStars(displayRating);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">별점 평가</h3>
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((rating) => {
                const isActive = rating <= displayRating;

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleStarClick(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(null)}
                    disabled={isSubmitting}
                    className="relative h-8 w-8 cursor-pointer transition-transform hover:scale-110 disabled:opacity-50"
                    aria-label={`${rating}점 평가`}
                  >
                    <Star
                      className={`h-full w-full transition-colors ${
                        isActive
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200 hover:fill-yellow-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {userRating && (
              <span className="text-sm text-muted-foreground">
                내 평가: {userRating}점
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            로그인하면 별점을 평가할 수 있습니다
          </p>
        )}
      </div>

      {/* 평균 별점 표시 */}
      {ratingCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => i + 1).map((starNum) => (
              <Star
                key={starNum}
                className={`h-5 w-5 ${
                  starNum <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            평균 {averageRating.toFixed(1)}점 ({ratingCount}개 평가)
          </span>
        </div>
      )}
    </div>
  );
}

