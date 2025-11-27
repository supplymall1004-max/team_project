/**
 * @file recipe-rating.tsx
 * @description 레시피 별점 평가 컴포넌트
 *
 * 주요 기능:
 * 1. 별점 입력 (0.5점 단위)
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
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => {
                const isHalf = rating % 1 === 0.5;
                const fullStarIndex = Math.floor(rating);
                const isActive = rating <= displayRating;

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleStarClick(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(null)}
                    disabled={isSubmitting}
                    className="relative h-8 w-8 cursor-pointer disabled:opacity-50"
                  >
                    <Star
                      className={`h-full w-full ${
                        isActive
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                    {isHalf && (
                      <div className="absolute inset-0 overflow-hidden">
                        <Star className="h-full w-full fill-yellow-400 text-yellow-400" />
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {userRating && (
              <span className="text-sm text-muted-foreground">
                내 평가: {userRating.toFixed(1)}점
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
            {stars.map((star, index) => (
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
            평균 {averageRating.toFixed(1)}점 ({ratingCount}개 평가)
          </span>
        </div>
      )}
    </div>
  );
}

