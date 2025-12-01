/**
 * @file premium-banner.tsx
 * @description 프리미엄 배너 컴포넌트
 * 
 * 배달의민족 앱의 프리미엄 배너를 참고하여 구현했습니다.
 * 
 * 주요 기능:
 * 1. 주황색 배경에 흰색 텍스트로 눈에 띄는 디자인 (웹페이지 브랜드 색상)
 * 2. 클릭 시 프리미엄 가격 페이지로 이동
 * 3. 호버 효과로 상호작용 피드백 제공
 * 4. 스크롤해도 항상 보이도록 고정 영역에 배치
 * 
 * 디자인 가이드라인:
 * - 배경: bg-orange-500 (주황색, Primary 색상)
 * - 텍스트: text-white (흰색, #FFFFFF)
 * - 패딩: px-4 py-3 (16px 12px)
 * - 폰트: font-medium (중간 굵기)
 */

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PremiumBannerProps {
  text?: string;
  href?: string;
}

export function PremiumBanner({
  text = "프리미엄 결제 혜택을 받아보세요",
  href = "/pricing",
}: PremiumBannerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <Link
      href={href}
      className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-center font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-2 min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
      onClick={() => {
        console.groupCollapsed("[PremiumBanner] 배너 클릭");
        console.log("href:", href);
        console.log("timestamp:", Date.now());
        console.groupEnd();
      }}
      onKeyDown={handleKeyDown}
      aria-label="프리미엄 결제 혜택 페이지로 이동"
      role="button"
      tabIndex={0}
      style={{
        touchAction: 'manipulation',
        width: '100%',
      }}
    >
      <div className="flex items-center justify-center gap-2 group">
        <span>{text}</span>
        <ChevronRight
          className="w-4 h-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

