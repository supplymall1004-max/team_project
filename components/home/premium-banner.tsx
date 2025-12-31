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

import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Palette } from "lucide-react";
import { getCurrentSubscription } from '@/actions/payments/get-subscription';

interface PremiumBannerProps {
  text?: string;
  href?: string;
}

export function PremiumBanner({
  text = "프리미엄 결제 혜택을 받아보세요",
  href = "/pricing",
}: PremiumBannerProps) {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscription = async () => {
    try {
      const result = await getCurrentSubscription();
      setIsPremium(result.isPremium || false);
    } catch (error) {
      console.error('❌ 구독 정보 로드 실패:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로딩 중이거나 프리미엄 사용자인 경우 표시하지 않음
  if (isLoading || isPremium) {
    return null;
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <div className="relative w-full bg-orange-500 hover:bg-orange-600 text-white py-3 min-h-[44px] flex items-center justify-between px-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <Link
        href={href}
        className="flex-1 flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
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
        }}
      >
        <span className="font-medium">{text}</span>
        <ChevronRight
          className="w-4 h-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
      
      {/* 커스터마이징 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push("/settings/customization");
        }}
        className="relative flex items-center justify-center group transition-all hover:scale-110 active:scale-95 ml-2"
        title="홈페이지 커스터마이징"
        aria-label="홈페이지 커스터마이징 설정"
      >
        <div className="relative bg-white/20 backdrop-blur-sm p-1.5 rounded-full border border-white/30 shadow-sm group-hover:border-white/50 group-hover:bg-white/30 transition-all duration-200">
          <Palette className="w-4 h-4 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
        </div>
      </button>
    </div>
  );
}

