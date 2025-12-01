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
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
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
  const supabase = useClerkSupabaseClient();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>(currentRating);

  const handleStarClick = async (rating: number) => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    console.groupCollapsed("[RecipeRating] 별점 평가");
    console.log("recipeId", recipeId);
    console.log("rating", rating);
    console.groupEnd();

    setIsSubmitting(true);

    try {
      // 사용자 ID 조회
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (userError || !userData) {
        throw new Error("사용자 정보를 찾을 수 없습니다");
      }

      // 평가 생성 또는 업데이트
      const { error: ratingError } = await supabase
        .from("recipe_ratings")
        .upsert(
          {
            recipe_id: recipeId,
            user_id: userData.id,
            rating: rating,
          },
          {
            onConflict: "recipe_id,user_id",
          }
        );

      if (ratingError) {
        throw ratingError;
      }

      setUserRating(rating);
      onRatingChange?.();
    } catch (error) {
      console.error("rating error", error);
      alert("평가 저장에 실패했습니다");
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

