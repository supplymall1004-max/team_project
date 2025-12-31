/**
 * @file home-sections-wrapper.tsx
 * @description 홈페이지 섹션을 커스텀 순서에 따라 렌더링하는 래퍼 컴포넌트
 *
 * 주요 기능:
 * 1. 커스텀 설정에서 섹션 순서 읽기
 * 2. 섹션 순서에 따라 동적 렌더링
 * 3. 각 섹션에 data-section-id 속성 추가
 */

"use client";

import { Suspense } from "react";
import { useHomeCustomization } from "@/hooks/use-home-customization";
import { ErrorBoundary } from "@/components/error-boundary";
import { EmergencyQuickAccess } from "@/components/home/emergency-quick-access";
import { WeatherWidget } from "@/components/home/weather-widget";
import { HomeLanding } from "@/components/home/home-landing";
// CharacterGameHomeWrapper는 더 이상 사용하지 않음 (3D 뷰어 기능 제거됨)
import { CommunityPreview } from "@/components/home/community-preview";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { ParallaxSection } from "@/components/motion/parallax-section";
import { SECTION_IDS } from "@/types/home-customization";

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function HomeLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="px-4 pt-2 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-24 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-24 bg-gray-200 rounded-lg" />
      </div>
      <div className="px-4">
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

// 섹션 컴포넌트 렌더링 함수 매핑
const SECTION_COMPONENTS: Record<
  string,
  () => React.ReactNode
> = {
  [SECTION_IDS.emergency]: () => (
    <div
      data-section-id={SECTION_IDS.emergency}
      className="px-4 pt-6 pb-4 space-y-4 bg-gradient-to-b from-white to-gray-50/30 dark:from-black dark:to-black"
    >
      <EmergencyQuickAccess />
    </div>
  ),
  [SECTION_IDS.weather]: () => (
    <div
      data-section-id={SECTION_IDS.weather}
      className="px-4 pt-6 pb-4 space-y-4 bg-gradient-to-b from-white to-gray-50/30 dark:from-black dark:to-black"
    >
      <ErrorBoundary>
        <WeatherWidget />
      </ErrorBoundary>
    </div>
  ),
  [SECTION_IDS.hero]: () => (
    <ParallaxSection
      speed={0.3}
      scaleRange={[0.98, 1]}
      data-section-id={SECTION_IDS.hero}
    >
      <DirectionalEntrance direction="up" delay={0.5}>
        <ErrorBoundary>
          <Suspense fallback={<HomeLoadingSkeleton />}>
            <HomeLanding />
          </Suspense>
        </ErrorBoundary>
      </DirectionalEntrance>
    </ParallaxSection>
  ),
  [SECTION_IDS.characterGame]: () => {
    // 3D 뷰어 기능이 제거되어 아무것도 렌더링하지 않음
    return null;
  },
  [SECTION_IDS.community]: () => (
    <div data-section-id={SECTION_IDS.community}>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <CommunityPreview />
        </Suspense>
      </ErrorBoundary>
    </div>
  ),
};

/**
 * 홈페이지 섹션 래퍼 컴포넌트
 * 커스텀 설정의 섹션 순서에 따라 섹션을 렌더링합니다.
 */
export function HomeSectionsWrapper() {
  const { customization, isLoaded } = useHomeCustomization();

  // 로딩 중일 때는 기본 순서로 렌더링 (Hydration 오류 방지)
  if (!isLoaded) {
    return (
      <>
        {/* 기본 순서로 렌더링 */}
        <div
          data-section-id={SECTION_IDS.emergency}
          className="px-4 pt-6 pb-4 space-y-4 bg-gradient-to-b from-white to-gray-50/30 dark:from-black dark:to-black"
        >
          <EmergencyQuickAccess />
          <ErrorBoundary>
            <WeatherWidget />
          </ErrorBoundary>
        </div>
        <ParallaxSection speed={0.3} scaleRange={[0.98, 1]}>
          <DirectionalEntrance direction="up" delay={0.5}>
            <ErrorBoundary>
              <Suspense fallback={<HomeLoadingSkeleton />}>
                <HomeLanding />
              </Suspense>
            </ErrorBoundary>
          </DirectionalEntrance>
        </ParallaxSection>
        {/* 3D 뷰어 기능이 제거되어 렌더링하지 않음 */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <CommunityPreview />
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  // 커스텀 순서에 따라 섹션 렌더링
  return (
    <>
      {customization.sectionOrder.map((sectionId) => {
        const renderComponent = SECTION_COMPONENTS[sectionId];
        if (!renderComponent) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[HomeSectionsWrapper] 알 수 없는 섹션 ID: ${sectionId}`);
          }
          return null;
        }
        return <div key={sectionId}>{renderComponent()}</div>;
      })}
    </>
  );
}

