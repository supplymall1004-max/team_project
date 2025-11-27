/**
 * @file page.tsx
 * @description Flavor Archive 홈 페이지. 서버 컴포넌트에서 데이터를 준비하고,
 *              클라이언트 섹션과 레거시 아카이브 섹션을 조합합니다.
 * 
 * 성능 최적화:
 * - Suspense를 사용하여 각 섹션을 독립적으로 스트리밍 렌더링
 * - 데이터 로딩이 병렬로 실행되어 전체 로딩 시간 단축
 */

import { Suspense } from "react";
import { LegacyArchiveSection } from "@/components/legacy/legacy-archive-section";
import { HomeLanding } from "@/components/home/home-landing";
import { RecipeSection } from "@/components/recipes/recipe-section";
import { DietSection } from "@/components/health/diet-section";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";

// 섹션별 로딩 스켈레톤
function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

export default async function Home() {
  return (
    <div className="space-y-4">
      {/* 즉시 렌더링되는 클라이언트 섹션 */}
      <HomeLanding />
      
      {/* 병렬로 로딩되는 서버 섹션들 */}
      {/* 각 섹션 내부에서 try-catch로 에러 처리됨 */}
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <LegacyArchiveSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RecipeSection />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <DietSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
