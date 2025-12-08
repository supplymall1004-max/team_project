/**
 * @file diet/page.tsx
 * @description 건강 맞춤 식단 추천 페이지
 *
 * 주요 기능:
 * 1. 오늘의 추천 식단 표시
 * 2. 식단 카드 (아침/점심/저녁/간식)
 * 3. 총 영양소 정보 표시
 * 4. 식자재 원클릭 구매 기능
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { DietPlanClient } from "@/components/health/diet-plan-client";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "건강 맞춤 식단 | 맛의 아카이브",
  description: "개인 맞춤 식단을 추천받아보세요",
};

export default function DietPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">건강 맞춤 식단</h1>
          <p className="text-muted-foreground">
            건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner label="식단을 불러오는 중..." />}>
          <DietPlanClient />
        </Suspense>
      </Section>
    </div>
  );
}

