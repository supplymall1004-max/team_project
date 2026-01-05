/**
 * @file components/health/diet/diet-card-overlay.tsx
 * @description 식단 카드 오버레이 컴포넌트
 *
 * 카드 호버 시 표시되는 식사 사진 업로드 바로가기 오버레이
 */

"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealType, MEAL_TYPE_LABELS } from "@/types/health";
import { cn } from "@/lib/utils";

interface DietCardOverlayProps {
  mealType: MealType;
  date?: string;
  onUploadClick: () => void;
}

export function DietCardOverlay({
  mealType,
  onUploadClick,
}: DietCardOverlayProps) {
  const mealLabel = MEAL_TYPE_LABELS[mealType];
  const [isTouched, setIsTouched] = useState(false);

  return (
    <div
      className={cn(
        "absolute inset-0 z-10",
        "bg-black/40 backdrop-blur-sm",
        "opacity-0 group-hover:opacity-100",
        // 모바일: 터치 시 표시
        isTouched && "opacity-100",
        "transition-opacity duration-300",
        "flex items-center justify-center",
        "rounded-2xl",
        // 모바일 터치 타겟 확보
        "touch-manipulation"
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onUploadClick();
      }}
      onTouchStart={(e) => {
        // 모바일에서 터치 시작 시 오버레이 표시
        e.stopPropagation();
        setIsTouched(true);
      }}
      onTouchEnd={(e) => {
        // 터치 종료 후 약간의 지연 후 원래대로
        e.stopPropagation();
        setTimeout(() => {
          setIsTouched(false);
        }, 200);
      }}
    >
      <Button
        size="lg"
        className={cn(
          "bg-white/95 hover:bg-white",
          "text-emerald-600 hover:text-emerald-700",
          "shadow-xl border-2 border-white/50",
          // 모바일 터치 타겟 최소 크기 (44x44px)
          "min-h-[56px] min-w-[56px] sm:min-h-[56px] sm:min-w-[56px]",
          "flex flex-col items-center justify-center gap-2",
          "px-6 py-4",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
          // 모바일 터치 피드백
          "touch-manipulation"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onUploadClick();
        }}
        aria-label={`${mealLabel} 식사 사진 업로드`}
      >
        <Camera className="h-6 w-6" />
        <span className="text-sm font-semibold whitespace-nowrap">
          {mealLabel} 사진 업로드
        </span>
      </Button>
    </div>
  );
}

