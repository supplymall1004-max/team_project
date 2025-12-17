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

import { HomeLanding } from "@/components/home/home-landing";
import { FixedHeader } from "@/components/home/fixed-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { EmergencyQuickAccess } from "@/components/home/emergency-quick-access";
import { WeatherWidget } from "@/components/home/weather-widget";
import { FairytaleNavigation } from "@/components/home/fairytale-navigation";

// 동적 렌더링 강제 (MFDS API 등 외부 API 사용으로 인해)
export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <main
      className="space-y-4"
      style={{
        // 스크롤 성능 최적화
        contain: 'layout style paint',
      }}
    >
      {/* 고정 헤더 (검색바 + 프리미엄 배너) */}
      <FixedHeader />


      {/* 동화 스타일 네비게이션 (데스크톱만 표시, 모바일에서는 자동으로 숨김) */}
      <ErrorBoundary>
        <div className="px-4 pt-4">
          <FairytaleNavigation />
        </div>
      </ErrorBoundary>

      {/* 응급조치 안내 + 날씨 위젯 (같은 줄에 배치) */}
      <div className="px-4 pt-12 flex flex-col sm:flex-row gap-4">
        {/* 응급조치 안내 (왼쪽, 가로 50%) */}
        <div className="flex-1">
          <EmergencyQuickAccess />
        </div>
        
        {/* 날씨 위젯 (오른쪽, 가로 50%) */}
        <div className="flex-1">
          <ErrorBoundary>
            <WeatherWidget />
          </ErrorBoundary>
        </div>
      </div>

      {/* 즉시 렌더링되는 클라이언트 섹션 */}
      <HomeLanding />

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

      {/* 건강 관리 미리보기 - 메인 화면 바로가기로 접근 가능하므로 숨김 */}
      {/* <ErrorBoundary>
        <HealthManagementPreview />
      </ErrorBoundary> */}

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
