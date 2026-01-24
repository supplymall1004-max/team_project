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

import { Suspense, useMemo } from "react";
import { useHomeCustomization } from "@/hooks/use-home-customization";
import { ErrorBoundary } from "@/components/error-boundary";
import { EmergencyQuickAccess } from "@/components/home/emergency-quick-access";
import { WeatherWidget } from "@/components/home/weather-widget";
import { TodayHeader } from "@/components/home/today-header";
import { DailyRecommendationsSection } from "@/components/home/daily-recommendations-section";
import { TrendingSection } from "@/components/home/trending-section";
import { RecentActivityFeed } from "@/components/home/recent-activity-feed";
import { HomeLanding } from "@/components/home/home-landing";
// CharacterGameHomeWrapper는 더 이상 사용하지 않음 (3D 뷰어 기능 제거됨)
import { CommunityPreview } from "@/components/home/community-preview";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { ParallaxSection } from "@/components/motion/parallax-section";
import { SECTION_IDS, DEFAULT_HOME_CUSTOMIZATION } from "@/types/home-customization";

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
      className="px-4 pt-6 pb-4 space-y-4"
    >
      <EmergencyQuickAccess />
    </div>
  ),
  [SECTION_IDS.weather]: () => (
    <div
      data-section-id={SECTION_IDS.weather}
      className="px-4 pt-6 pb-4 space-y-4"
    >
      <ErrorBoundary>
        <WeatherWidget />
      </ErrorBoundary>
    </div>
  ),
  [SECTION_IDS.todayHeader]: () => (
    <div
      data-section-id={SECTION_IDS.todayHeader}
      className="px-4 pt-6 pb-4"
    >
      <ErrorBoundary>
        <TodayHeader />
      </ErrorBoundary>
    </div>
  ),
  [SECTION_IDS.dailyRecommendations]: () => (
    <div
      data-section-id={SECTION_IDS.dailyRecommendations}
      className="px-4 pt-6 pb-4"
    >
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <DailyRecommendationsSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  ),
  [SECTION_IDS.trending]: () => (
    <div
      data-section-id={SECTION_IDS.trending}
      className="px-4 pt-6 pb-4"
    >
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <TrendingSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  ),
  [SECTION_IDS.recentActivity]: () => (
    <div
      data-section-id={SECTION_IDS.recentActivity}
      className="px-4 pt-6 pb-4"
    >
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RecentActivityFeed />
        </Suspense>
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
 * 
 * 핵심: isLoaded 여부와 무관하게 항상 기본 섹션을 먼저 렌더링합니다.
 * 안정성: useHomeCustomization의 상태 변경에 영향받지 않도록 안정적인 렌더링 보장
 */
export function HomeSectionsWrapper() {
  const { customization, isLoaded } = useHomeCustomization();

  // 커스텀 순서 결정 - 안정적인 렌더링을 위해 항상 기본 순서를 우선 사용
  const sectionOrder = useMemo(() => {
    // 항상 기본 순서로 시작 (로딩 중이어도 화면에 표시)
    const defaultOrder = DEFAULT_HOME_CUSTOMIZATION.sectionOrder;
    
    // isLoaded가 false이면 무조건 기본 순서 사용
    if (!isLoaded) {
      return defaultOrder;
    }
    
    // isLoaded가 true이고 커스텀 순서가 유효하면 사용
    if (customization?.sectionOrder && Array.isArray(customization.sectionOrder) && customization.sectionOrder.length > 0) {
      // 배열 복사하여 안정적인 참조 유지
      return [...customization.sectionOrder];
    }
    
    // 커스텀 순서가 없으면 기본 순서 반환
    return defaultOrder;
  }, [isLoaded, customization?.sectionOrder]);

  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed('[HomeSectionsWrapper] 렌더링');
    console.log('섹션 개수:', sectionOrder?.length ?? 0);
    console.log('섹션 순서:', sectionOrder);
    console.log('isLoaded:', isLoaded);
    console.log('timestamp:', new Date().toISOString());
    console.groupEnd();
  }
  
  // 항상 섹션 렌더링 (조건부 렌더링 제거)
  // sectionOrder가 비어있거나 유효하지 않은 경우 기본 순서 사용
  const safeSectionOrder = Array.isArray(sectionOrder) && sectionOrder.length > 0
    ? sectionOrder
    : DEFAULT_HOME_CUSTOMIZATION.sectionOrder;

  // safeSectionOrder가 여전히 비어있으면 에러 방지
  if (!safeSectionOrder || safeSectionOrder.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.error('[HomeSectionsWrapper] 섹션 순서가 비어있음 - 기본 섹션 표시');
    }
    return (
      <div>
        <div className="px-4 pt-6 pb-4 space-y-4">
          <EmergencyQuickAccess />
        </div>
        <div className="px-4 pt-6 pb-4">
          <TodayHeader />
        </div>
      </div>
    );
  }

  // ErrorBoundary로 전체를 감싸서 오류 발생 시에도 기본 섹션 표시
  return (
    <ErrorBoundary
      fallback={
        <div>
          <div className="px-4 pt-6 pb-4 space-y-4">
            <EmergencyQuickAccess />
          </div>
          <div className="px-4 pt-6 pb-4">
            <TodayHeader />
          </div>
        </div>
      }
    >
      <div>
        {safeSectionOrder.map((sectionId, index) => {
          const renderComponent = SECTION_COMPONENTS[sectionId];
          if (!renderComponent) {
            if (process.env.NODE_ENV === "development") {
              console.warn(`[HomeSectionsWrapper] 알 수 없는 섹션 ID: ${sectionId}`);
            }
            return null;
          }
          
          // 각 섹션을 독립적인 ErrorBoundary로 감싸서 한 섹션 오류가 전체를 막지 않도록
          return (
            <ErrorBoundary
              key={`section-${sectionId}-${index}`}
              fallback={
                <div className="px-4 pt-6 pb-4">
                  <p className="text-sm text-muted-foreground">섹션을 불러오는 중 오류가 발생했습니다.</p>
                </div>
              }
            >
              {renderComponent()}
            </ErrorBoundary>
          );
        })}
      </div>
    </ErrorBoundary>
  );
}

