/**
 * @file recipe-step-card.tsx
 * @description 레시피 단계 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 단계별 설명 표시
 * 2. 단계별 이미지/영상 표시
 * 3. 타이머 표시 (있는 경우)
 */

"use client";

import Image from "next/image";
import { Clock } from "lucide-react";
import { RecipeStep } from "@/types/recipe";
import { formatCookingTime } from "@/lib/recipes/utils";

interface RecipeStepCardProps {
  step: RecipeStep;
}

export function RecipeStepCard({ step }: RecipeStepCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white p-6">
      <div className="flex gap-4">
        {/* 단계 번호 */}
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
            {step.step_number}
          </div>
        </div>

        {/* 단계 내용 */}
        <div className="flex-1 space-y-4">
          <p className="text-base leading-relaxed">{step.content}</p>

          {/* 이미지 (식약처 API 이미지 우선 사용) */}
          {(step.foodsafety_manual_img || step.image_url) && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={step.foodsafety_manual_img || step.image_url || ""}
                alt={`단계 ${step.step_number} 이미지`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          )}

          {/* 영상 */}
          {step.video_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <video
                src={step.video_url}
                controls
                className="h-full w-full object-cover"
              >
                비디오를 재생할 수 없습니다.
              </video>
            </div>
          )}

          {/* 타이머 */}
          {step.timer_minutes && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-700">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                타이머: {formatCookingTime(step.timer_minutes)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

