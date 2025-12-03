/**
 * @file page.tsx
 * @description Flavor Archive 홈 페이지. 서버 컴포넌트에서 데이터를 준비하고,
 *              클라이언트 섹션과 레거시 아카이브 섹션을 조합합니다.
 * 
 * 성능 최적화:
 * - Suspense를 사용하여 각 섹션을 독립적으로 스트리밍 렌더링
 * - 데이터 로딩이 병렬로 실행되어 전체 로딩 시간 단축
 * - 코드 스플리팅: LazyWeeklyDietSummary, LazyFrequentItemsSection 사용
 * - CSS contain 속성으로 렌더링 최적화
 * 
 * 레이아웃 구조:
 * - 고정 헤더 (검색바 + 프리미엄 배너) - 스크롤해도 상단에 고정
 * - 스크롤 가능 영역 (히어로 섹션, 콘텐츠 섹션들)
 * - 하단 네비게이션은 layout.tsx에서 처리
 * 
 * 배달의민족 앱 UI/UX 적용:
 * - 배달의민족 앱의 레이아웃 구조를 참고하여 구현
 * - 고정 영역과 스크롤 영역 분리
 * - 바로가기 메뉴, 하단 네비게이션 등 주요 UI 요소 적용
 */

import { Suspense } from "react";
import { LegacyArchiveSection } from "@/components/legacy/legacy-archive-section";
import { HomeLanding } from "@/components/home/home-landing";
import { RecipeSection } from "@/components/recipes/recipe-section";
import { DietSection } from "@/components/health/diet-section";
import { FixedHeader } from "@/components/home/fixed-header";
import {
  LazyWeeklyDietSummary,
  LazyFrequentItemsSection,
} from "@/components/home/lazy-sections";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import { RoyalRecipesQuickAccess } from "@/components/royal-recipes/royal-recipes-quick-access";
import { EmergencyQuickAccess } from "@/components/home/emergency-quick-access";

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
    <div
      className="space-y-4"
      style={{
        // 스크롤 성능 최적화
        contain: 'layout style paint',
      }}
    >
      {/* 고정 헤더 (검색바 + 프리미엄 배너) */}
      <FixedHeader />

      {/* 응급조치 바로가기 */}
      <EmergencyQuickAccess />

      {/* 즉시 렌더링되는 클라이언트 섹션 */}
      <HomeLanding />

      {/* 궁중 레시피 바로가기 섹션 */}
      <ErrorBoundary>
        <RoyalRecipesQuickAccess />
      </ErrorBoundary>

      {/* 자주 구매하는 식자재 (지연 로딩) */}
      <ErrorBoundary>
        <LazyFrequentItemsSection />
      </ErrorBoundary>

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

      {/* 주간 식단 요약 (지연 로딩) - 네비게이션 바 바로 위 배치 */}
      <ErrorBoundary>
        <LazyWeeklyDietSummary />
      </ErrorBoundary>

      {/* 하단 네비게이션 높이만큼 패딩 추가 (모바일) */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  );
}
