/**
 * @file fixed-header.tsx
 * @description 고정 헤더 컴포넌트
 * 
 * 배달의민족 앱의 상단 고정 영역을 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 검색바와 프리미엄 배너를 포함하는 고정 헤더
 * 2. position: fixed로 스크롤해도 상단에 고정
 * 3. 배경색 흰색, 그림자 효과로 다른 콘텐츠와 구분
 * 4. 모바일/태블릿/데스크톱 반응형 디자인
 * 5. 위치를 수동으로 조절 가능 (top 값 설정)
 */

"use client";

import { PremiumBanner } from "./premium-banner";

interface FixedHeaderProps {
  premiumBannerText?: string;
  premiumBannerHref?: string;
  /** 
   * 프리미엄 배너의 상단 위치 (px 단위 또는 CSS 값).
   * 기본값: 64px (Navbar 높이 h-16)
   * 예시: top={64}, top="80px", top="4rem"
   */
  top?: number | string;
  /** 
   * z-index 값. 기본값: 40
   * Navbar의 z-index는 50이므로 배너는 그 아래에 위치합니다.
   */
  zIndex?: number;
}

export function FixedHeader({
  premiumBannerText = "프리미엄 결제 혜택을 받아보세요",
  premiumBannerHref = "/pricing",
  top = 0, // 맨 위에 위치 (Navbar 위)
  zIndex = 50, // Navbar와 동일한 z-index로 설정
}: FixedHeaderProps) {
  // top 값을 문자열로 변환 (px 단위)
  const topValue = typeof top === 'number' ? `${top}px` : top;

  return (
    <div 
      className="fixed left-0 right-0 w-full"
      style={{ 
        top: topValue,
        zIndex,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        margin: 0,
        padding: 0,
        width: '100%',
      }}
    >
      {/* 프리미엄 배너 */}
      <PremiumBanner
        text={premiumBannerText}
        href={premiumBannerHref}
      />
    </div>
  );
}


