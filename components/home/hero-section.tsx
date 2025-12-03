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
import { ChefHat, Film, Brain, Calendar } from "lucide-react";

// 아이콘 매핑
const iconMap: Record<string, typeof Film> = {
  "🎬": Film,
  "📚": ChefHat,
  "🤖": Brain,
  "📅": Calendar,
};

interface QuickStartCard {
  title: string;
  description: string;
  href: string;
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
  description = "명인의 전통 레시피부터 AI 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요.",
  searchPlaceholder = "레시피, 명인, 재료를 검색해보세요",
  searchButtonText = "검색",
  quickStartCards = [
    {
      title: "🎬 레거시 아카이브",
      description: "명인 인터뷰와 전통 조리법을 고화질로 감상하세요.",
      href: "/legacy",
    },
    {
      title: "📚 현대 레시피 북",
      description: "별점과 난이도로 정리된 최신 레시피를 확인해요.",
      href: "/recipes",
    },
    {
      title: "🤖 AI 맞춤 식단",
      description: "건강 정보를 기반으로 개인 맞춤 식단을 추천받아요.",
      href: "/diet",
    },
    {
      title: "📅 주간 식단",
      description: "7일간의 식단을 한눈에 확인하고 장보기 리스트를 관리하세요.",
      href: "/diet/weekly",
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

      {/* 콘텐츠 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* 베타 배지 */}
          <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs sm:px-4 sm:text-sm font-semibold text-orange-700">
            {badgeText}
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
            {titleLines.map((line, index) => (
              <span key={index}>
                {line}
                {index < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          {/* 서브 타이틀 (선택적) */}
          {subtitle && (
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              {subtitle}
            </p>
          )}

          {/* 서브 타이틀 / 설명 */}
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {description}
          </p>

          {/* 빠른 접근 버튼 */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto pt-4 sm:pt-8">
            {quickStartCards.map((card) => {
              // 이모지에서 아이콘 추출 (첫 번째 이모지 사용)
              const emoji = card.title.match(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)?.[0] || "🎬";
              const Icon = iconMap[emoji] || Film;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  onClick={() => handleQuickStartClick(card.href)}
                  className="group rounded-xl sm:rounded-2xl border border-border/60 bg-white/90 backdrop-blur-sm p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:bg-white"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="rounded-lg bg-orange-100 p-1.5 sm:p-2 group-hover:bg-orange-200 transition-colors">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-left">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

