/**
 * @file recipe-blog-steps.tsx
 * @description 레시피 조리 과정을 블로그 형태로 표시하는 컴포넌트
 *
 * 주요 기능:
 * 1. 조리 과정을 블로그 포스트처럼 연속된 텍스트로 표시
 * 2. 각 단계를 자연스럽게 연결
 * 3. 이미지는 중간에 삽입
 * 4. 읽기 좋은 폰트와 간격 사용
 */

"use client";

import Image from "next/image";
import { Clock } from "lucide-react";
import { RecipeStep } from "@/types/recipe";
import { formatCookingTime } from "@/lib/recipes/utils";

interface RecipeBlogStepsProps {
  steps: RecipeStep[];
}

export function RecipeBlogSteps({ steps }: RecipeBlogStepsProps) {
  // steps가 없거나 비어있는 경우
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">조리 방법</h2>
        <p className="text-muted-foreground">조리 과정 정보가 없습니다.</p>
      </div>
    );
  }

  // content가 있는 steps만 필터링
  const validSteps = steps.filter(step => step && step.content && step.content.trim());

  if (validSteps.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">조리 방법</h2>
        <p className="text-muted-foreground">조리 과정 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <article className="max-w-none">
      <div className="rounded-2xl border border-border/60 bg-white p-8 md:p-12">
        <h2 className="text-3xl font-bold mb-8 pb-4 border-b border-border">
          조리 방법
        </h2>
        
        <div className="space-y-8">
          {validSteps.map((step, index) => (
            <div key={step.id || `step-${index}`} className="space-y-4">
              {/* 단계 번호와 내용 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
                    {step.step_number ?? index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-base md:text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {step.content}
                  </p>
                </div>
              </div>

              {/* 이미지 (식약처 API 이미지 우선 사용) */}
              {(step.foodsafety_manual_img || step.image_url) && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 mt-4">
                  <Image
                    src={step.foodsafety_manual_img || step.image_url || ""}
                    alt={`${step.step_number || index + 1}단계 이미지`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 80vw"
                  />
                </div>
              )}

              {/* 영상 */}
              {step.video_url && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 mt-4">
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
                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-700 mt-4">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    타이머: {formatCookingTime(step.timer_minutes)}
                  </span>
                </div>
              )}

              {/* 단계 구분선 (마지막 단계 제외) */}
              {index < validSteps.length - 1 && (
                <div className="border-t border-gray-200 pt-8 mt-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

