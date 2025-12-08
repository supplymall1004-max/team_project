/**
 * @file favorite-button.tsx
 * @description 즐겨찾기 버튼 컴포넌트 (프리미엄 전용)
 *
 * 주요 기능:
 * 1. 하트 아이콘으로 즐겨찾기 추가/삭제
 * 2. 프리미엄 사용자만 사용 가능
 * 3. 로딩 상태 및 에러 처리
 */

"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { addFavoriteMeal, removeFavoriteMeal, isFavoriteMeal } from "@/lib/diet/favorite-meals";
import { PremiumGate } from "@/components/premium/premium-gate";
import type { MealType } from "@/types/health";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  /** 레시피 ID (null이면 레시피가 아닌 경우) */
  recipeId: string | null;
  /** 레시피 제목 */
  recipeTitle: string;
  /** 식사 유형 */
  mealType?: MealType | null;
  /** 영양 정보 */
  nutrition?: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  };
  /** 버튼 크기 */
  size?: "sm" | "default" | "lg" | "icon";
  /** 버튼 스타일 */
  variant?: "default" | "ghost" | "outline";
}

export function FavoriteButton({
  recipeId,
  recipeTitle,
  mealType = null,
  nutrition = {},
  size = "default",
  variant = "ghost",
}: FavoriteButtonProps) {
  const { user, isLoaded } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // 프리미엄 여부 확인
  useEffect(() => {
    async function checkPremium() {
      if (!isLoaded || !user) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium);
      } catch (error) {
        console.error("[FavoriteButton] 프리미엄 확인 실패:", error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPremium();
  }, [user, isLoaded]);

  // 즐겨찾기 여부 확인
  useEffect(() => {
    async function checkFavorite() {
      if (!isLoaded || !user || !recipeId || !isPremium) {
        setIsFavorite(false);
        return;
      }

      try {
        const favorite = await isFavoriteMeal(recipeId);
        setIsFavorite(favorite);
      } catch (error) {
        console.error("[FavoriteButton] 즐겨찾기 확인 실패:", error);
        setIsFavorite(false);
      }
    }

    if (isPremium) {
      checkFavorite();
    }
  }, [user, isLoaded, recipeId, isPremium]);

  const handleToggle = async () => {
    if (!user || !isPremium || !recipeId) {
      toast.error("프리미엄 회원만 즐겨찾기를 사용할 수 있습니다.");
      return;
    }

    setIsToggling(true);
    console.group("[FavoriteButton] 즐겨찾기 토글");
    console.log("recipeId:", recipeId);
    console.log("현재 상태:", isFavorite);

    try {
      if (isFavorite) {
        // 즐겨찾기 삭제
        const result = await removeFavoriteMeal(recipeId);
        if (result.success) {
          setIsFavorite(false);
          toast.success("💔 즐겨찾기에서 제거되었습니다.", {
            duration: 2000,
          });
          console.log("✅ 즐겨찾기 삭제 성공");
        } else {
          toast.error(result.error || "즐겨찾기 삭제에 실패했습니다.");
          console.error("❌ 즐겨찾기 삭제 실패:", result.error);
        }
      } else {
        // 즐겨찾기 추가
        const result = await addFavoriteMeal(recipeId, recipeTitle, mealType, nutrition);
        if (result.success) {
          setIsFavorite(true);
          toast.success("❤️ 즐겨찾기에 저장되었습니다!", {
            duration: 2000,
            description: recipeTitle,
          });
          console.log("✅ 즐겨찾기 추가 성공");
        } else {
          toast.error(result.error || "즐겨찾기 추가에 실패했습니다.");
          console.error("❌ 즐겨찾기 추가 실패:", result.error);
        }
      }
    } catch (error) {
      console.error("❌ 즐겨찾기 토글 오류:", error);
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsToggling(false);
      console.groupEnd();
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Heart className="w-4 h-4" />
      </Button>
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return null;
  }

  // 프리미엄이 아닌 경우 - 프리미엄 가드 표시
  if (!isPremium) {
    return (
      <PremiumGate
        isPremium={false}
        variant="overlay"
        message="즐겨찾기는 프리미엄 전용 기능입니다. 무제한으로 즐겨찾기를 저장하세요!"
      >
        <Button variant={variant} size={size} disabled>
          <Heart className="w-4 h-4" />
        </Button>
      </PremiumGate>
    );
  }

  // 프리미엄 사용자 - 즐겨찾기 버튼 표시
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isToggling || !recipeId}
      className={cn(
        isFavorite 
          ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100" 
          : "text-gray-600 hover:text-red-500 hover:bg-red-50",
        "transition-all duration-200"
      )}
      title={isFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-all duration-200",
          isFavorite && "fill-current scale-110",
          isToggling && "animate-pulse"
        )}
      />
    </Button>
  );
}



