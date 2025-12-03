/**
 * @file lazy-sections.tsx
 * @description 지연 로딩 섹션 래퍼 컴포넌트
 * 
 * 성능 최적화를 위해 클라이언트 컴포넌트를 동적으로 로드합니다.
 * 사용자가 스크롤하여 해당 섹션에 도달할 때까지 로딩을 지연시킵니다.
 */

"use client";

import { lazy, Suspense } from "react";

// 동적 import로 컴포넌트 로드
const WeeklyDietSummary = lazy(() =>
  import("./weekly-diet-summary").then((mod) => ({
    default: mod.WeeklyDietSummary,
  }))
);

const FrequentItemsSection = lazy(() =>
  import("./frequent-items-section").then((mod) => ({
    default: mod.FrequentItemsSection,
  }))
);

// 로딩 스켈레톤
function SectionSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-100 rounded-lg h-48 animate-pulse" />
      </div>
    </div>
  );
}

export function LazyWeeklyDietSummary() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <WeeklyDietSummary />
    </Suspense>
  );
}

export function LazyFrequentItemsSection() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <FrequentItemsSection />
    </Suspense>
  );
}
















