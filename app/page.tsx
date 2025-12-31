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
import { FixedHeader } from "@/components/home/fixed-header";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { HomeSectionsWrapper } from "@/components/home/home-sections-wrapper";
import { GameMenuProvider } from "@/components/home/game-menu-context";
import { HomeBackNavigationHandler } from "@/components/home/home-back-navigation-handler";

// 동적 렌더링 설정 (뒤로가기 시 캐시 문제 방지를 위해 제거)
// export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <GameMenuProvider>
      {/* 뒤로가기 네비게이션 핸들러 */}
      <HomeBackNavigationHandler />
      <main
        className="space-y-0 relative"
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

      {/* 커스텀 순서에 따라 섹션 렌더링 */}
      <HomeSectionsWrapper />

      {/* 하단 네비게이션 높이만큼 패딩 추가 (모바일) */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      </main>
    </GameMenuProvider>
  );
}
