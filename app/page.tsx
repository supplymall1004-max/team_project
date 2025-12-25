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
import { HomeLanding } from "@/components/home/home-landing";
import { FixedHeader } from "@/components/home/fixed-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { EmergencyQuickAccess } from "@/components/home/emergency-quick-access";
import { WeatherWidget } from "@/components/home/weather-widget";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { ParallaxSection } from "@/components/motion/parallax-section";
import { CharacterPreview } from "@/components/home/character-preview";
import { CommunityPreview } from "@/components/home/community-preview";

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

// 동적 렌더링 강제 (MFDS API 등 외부 API 사용으로 인해)
export const dynamic = 'force-dynamic';

// 홈 페이지 로딩 스켈레톤
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

export default async function Home() {
  return (
    <main
      className="space-y-4"
      style={{
        // 스크롤 성능 최적화
        contain: 'layout style paint',
      }}
    >
      {/* 스크롤 진행 표시기 */}
      <ScrollProgress />

      {/* 고정 헤더 (검색바 + 프리미엄 배너) */}
      <FixedHeader />

      {/* 동화 스타일 네비게이션 - 메인 페이지에서 제거 (상세 페이지에서는 유지) */}

      {/* 카드 섹션 (응급조치 안내, 예방접종 안내, 주변 의료기관 찾기, 날씨 정보 등) */}
      <div className="px-4 pt-2 space-y-2">
        <EmergencyQuickAccess />
        
        <ErrorBoundary>
          <WeatherWidget />
        </ErrorBoundary>
      </div>

      {/* 히어로 섹션 (아래에서 진입 + 패럴랙스 효과) */}
      <ParallaxSection speed={0.3} scaleRange={[0.98, 1]}>
        <DirectionalEntrance direction="up" delay={1.2}>
          <ErrorBoundary>
            <Suspense fallback={<HomeLoadingSkeleton />}>
              <HomeLanding />
            </Suspense>
          </ErrorBoundary>
        </DirectionalEntrance>
      </ParallaxSection>

      {/* 카테고리별 미리보기 섹션들 */}
      {/* 레시피 아카이브 미리보기 - 메인 화면 바로가기로 접근 가능하므로 숨김 */}
      {/* <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RecipeArchivePreview />
        </Suspense>
      </ErrorBoundary> */}

      {/* 식단 관리 미리보기 - 메인 화면 바로가기로 접근 가능하므로 숨김 */}
      {/* <ErrorBoundary>
        <DietManagementPreview />
      </ErrorBoundary> */}

      {/* 건강 관리 미리보기 - 캐릭터창 프리뷰 */}
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <CharacterPreview />
        </Suspense>
      </ErrorBoundary>

      {/* 커뮤니티 미리보기 - 맨 아래 섹션 */}
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <CommunityPreview />
        </Suspense>
      </ErrorBoundary>

      {/* 스토리 & 학습 미리보기 - 메인 화면 바로가기로 접근 가능하므로 숨김 */}
      {/* <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <StoriesLearningPreview />
        </Suspense>
      </ErrorBoundary> */}

      {/* 유틸리티 미리보기 - 메인 화면 바로가기로 접근 가능하므로 숨김 */}
      {/* <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <UtilitiesPreview />
        </Suspense>
      </ErrorBoundary> */}

      {/* 하단 네비게이션 높이만큼 패딩 추가 (모바일) */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </main>
  );
}
