/**
 * @file hero-section.tsx
 * @description 히어로 섹션 컴포넌트 (배경 이미지/비디오 포함)
 *
 * 주요 기능:
 * 1. 슬로건 표시
 * 2. 메인 검색창 (통합 검색)
 * 3. 빠른 접근 버튼 4개
 * 4. 배경 이미지/비디오 처리
 * 5. 모바일 반응형 레이아웃
 */

"use client";

import Image from "next/image";
import Link from "next/link";

export interface QuickStartCard {
  title: string;
  description: string;
  href: string;
  /**
   * public 경로 기반 아이콘 이미지
   * 예: "/icons/26.png"
   */
  iconSrc: string;
  color: string;
  gradient?: string; // 그라데이션 클래스 (선택적)
}

interface HeroSectionProps {
  backgroundImageUrl?: string | null;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  searchPlaceholder?: string;
  searchButtonText?: string;
  quickStartCards?: QuickStartCard[];
}

export function HeroSection({
  backgroundImageUrl = null,
  badgeText = "Flavor Archive Beta",
  title = "잊혀진 손맛을 연결하는\n디지털 식탁",
  subtitle,
  description = "궁중 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요.",
  searchPlaceholder = "레시피를 검색해보세요",
  searchButtonText = "검색",
  quickStartCards = [
    {
      title: "레시피",
      description: "최신 레시피 모음",
      href: "/recipes",
      iconSrc: "/icons/26.png",
      color: "bg-blue-500",
      gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
    },
    {
      title: "궁중요리",
      description: "전통 궁중 레시피",
      href: "/royal-recipes",
      iconSrc: "/icons/21.png",
      color: "bg-amber-500",
      gradient: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
    },
    {
      title: "식단관리",
      description: "맞춤 식단 추천",
      href: "/diet",
      iconSrc: "/icons/22.png",
      color: "bg-green-500",
      gradient: "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
    },
    {
      title: "주간식단",
      description: "7일 식단 계획",
      href: "/diet/weekly",
      iconSrc: "/icons/3.png",
      color: "bg-purple-500",
      gradient: "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600",
    },
    {
      title: "검색",
      description: "레시피 검색",
      href: "/search",
      iconSrc: "/icons/14.png",
      color: "bg-gray-500",
      gradient: "bg-gradient-to-br from-slate-500 via-gray-600 to-slate-700",
    },
    {
      title: "건강관리",
      description: "건강 정보 확인",
      href: "/health",
      iconSrc: "/icons/11.png",
      color: "bg-red-500",
      gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    },
    {
      title: "식재료",
      description: "신선한 채소 정보",
      href: "/food",
      iconSrc: "/icons/25.png",
      color: "bg-emerald-500",
      gradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600",
    },
    {
      title: "음식안전",
      description: "안전한 식생활",
      href: "/foodsafety",
      iconSrc: "/icons/12.png",
      color: "bg-orange-500",
      gradient: "bg-gradient-to-br from-orange-400 via-orange-500 to-red-500",
    },
    {
      title: "요리이야기",
      description: "맛있는 이야기들",
      href: "/stories",
      iconSrc: "/icons/14.png",
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700",
    },
  ],
}: HeroSectionProps = {}) {
  const handleQuickStartClick = (href: string) => {
    console.groupCollapsed("[HeroSection] 빠른 카드 클릭");
    console.log("target:", href);
    console.groupEnd();
  };

  // 타이틀을 줄바꿈 기준으로 분리
  const titleLines = title.split("\n");

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* 배경 이미지/비디오 */}
      <div className="absolute inset-0 z-0">
        {/* 배경 그라데이션 (기본) */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-emerald-50" />
        {/* 배경 이미지 (기본 이미지 또는 그라데이션) */}
        {backgroundImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={backgroundImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
              onError={(e) => {
                // 이미지 로딩 실패 시 숨김 (그라데이션만 표시)
                console.error("[HeroSection] 배경 이미지 로딩 실패:", backgroundImageUrl);
                e.currentTarget.style.display = "none";
              }}
              onLoad={() => {
                console.log("[HeroSection] 배경 이미지 로딩 완료:", backgroundImageUrl);
              }}
            />
          </div>
        )}
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80" />
      </div>

      {/* 콘텐츠 - 모바일 앱 아이콘 그리드 */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 sm:px-6 sm:py-20">
        {/* 베타 배지 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs sm:px-4 sm:text-sm font-semibold text-orange-700">
            {badgeText}
          </div>
        </div>

        {/* 앱 아이콘 그리드 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 max-w-2xl mx-auto">
          {quickStartCards.map((card) => {
            return (
              <Link
                key={card.title}
                href={card.href}
                onClick={() => handleQuickStartClick(card.href)}
                className="group flex flex-col items-center space-y-2 p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-200/80 shadow-md transition-all hover:scale-105 hover:shadow-xl hover:bg-white active:scale-95"
              >
                {/* 아이콘 - public/icons 이미지 사용 */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all relative">
                  <Image
                    src={card.iconSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority={false}
                  />
                </div>

                {/* 텍스트 */}
                <div className="text-center">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 leading-tight">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

