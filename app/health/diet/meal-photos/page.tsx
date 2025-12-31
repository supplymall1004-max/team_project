/**
 * @file app/health/diet/meal-photos/page.tsx
 * @description 식사 사진 관리 페이지
 *
 * 사용자가 찍은 식사 사진을 관리하고 분석 결과를 확인할 수 있는 페이지
 */

import { Suspense } from "react";
import { MealPhotosClient } from "@/components/health/diet/meal-photos-client";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function MealPhotosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">식사 사진 관리</h1>
        <p className="text-gray-600 mt-2">
          찍은 식사 사진을 통해 실제 섭취 영양소를 추적하고 분석합니다
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner label="로딩 중..." />}>
        <MealPhotosClient />
      </Suspense>
    </div>
  );
}

