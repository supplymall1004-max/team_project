/**
 * @file home-landing.tsx
 * @description 홈 빠른 시작 섹션 서버 컴포넌트.
 * 히어로 섹션은 별도 컴포넌트로 분리됨.
 *
 * 주요 기능:
 * 1. 데이터베이스에서 히어로 섹션 콘텐츠 조회
 * 2. HeroSection에 props로 전달
 */

import { HeroSection, QuickStartCard } from "./hero-section";
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";

export async function HomeLanding() {
  // 히어로 섹션 관련 콘텐츠 조회 (한 번에 조회)
  const allContent = await getMultipleCopyContent([
    "hero-badge",
    "hero-title",
    "hero-description",
    "hero-search-placeholder",
    "hero-search-button",
    "quick-start-recipe",
    "quick-start-royal",
    "quick-start-diet",
    "quick-start-weekly",
    "quick-start-storybook",
    "hero-background-image",
  ]);

  // 빠른 시작 카드 데이터 구성 (앱 아이콘 스타일 - 세련된 그라데이션 적용)
  // 아이콘 중복 제거 및 각 기능에 맞는 아이콘으로 재배치
  const quickStartCards: QuickStartCard[] = [
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
      title: "이유식 레시피",
      description: "아기 이유식 레시피",
      href: "/archive/recipes?tab=baby",
      iconSrc: "/icons/24.png", // 18.png에서 변경
      color: "bg-pink-500",
      gradient: "bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600",
    },
    {
      title: "죽 레시피",
      description: "영양 가득한 죽 레시피",
      href: "/archive/recipes?tab=gruel",
      iconSrc: "/icons/23.png", // 15.png에서 변경
      color: "bg-amber-600",
      gradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600",
    },
    {
      title: "특수 레시피",
      description: "해독, 염증 완화, 기력 회복 특수 레시피",
      href: "/archive/recipes?tab=special",
      iconSrc: "/icons/17.png",
      color: "bg-purple-600",
      gradient: "bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700",
    },
    {
      title: "비건 레시피",
      description: "지속가능한 비건 레시피",
      href: "/archive/recipes?tab=vegan",
      iconSrc: "/icons/25.png",
      color: "bg-emerald-600",
      gradient: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600",
    },
    {
      title: "식약처레시피",
      description: "공식 식약처 레시피",
      href: "/recipes/mfds",
      iconSrc: "/icons/21.png", // 13.png에서 변경 (궁중요리와 중복이지만 사용자 요청)
      color: "bg-green-600",
      gradient: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600",
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
      title: "건강관리",
      description: "가족 건강 관리",
      href: "/health",
      iconSrc: "/icons/36.png", // 20.png에서 변경
      color: "bg-red-500",
      gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    },
    {
      title: "요리이야기",
      description: "맛있는 이야기들",
      href: "/stories",
      iconSrc: "/icons/14.png", // 16.png에서 변경
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700",
    },
    {
      title: "반려동물",
      description: "반려동물 건강 관리",
      href: "/health/pets",
      iconSrc: "/icons/30.png", // 19.png에서 변경
      color: "bg-orange-500",
      gradient: "bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600",
    },
    {
      title: "냉장고 파수꾼",
      description: "세균 퇴치 게임",
      href: "/game/fridge-guardian",
      iconSrc: "/icons/40.png",
      color: "bg-cyan-500",
      gradient: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600",
    },
    {
      title: "냉장고 디펜스",
      description: "타워 디펜스 게임",
      href: "/game/fridge-defense",
      iconSrc: "/icons/37.png",
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500",
    },
    {
      title: "냉장고 짝맞추기",
      description: "메모리 게임",
      href: "/game/fridge-memory",
      iconSrc: "/icons/15.png",
      color: "bg-blue-500",
      gradient: "bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600",
    },
    {
      title: "유틸리티",
      description: "편리한 도구들",
      href: "/game/fridge-guardian",
      iconSrc: "/icons/7.png",
      color: "bg-gray-500",
      gradient: "bg-gradient-to-br from-slate-500 via-gray-600 to-slate-700",
    },
  ];

  // 배경 이미지 URL
  const backgroundImageUrl =
    allContent["hero-background-image"]?.content.imageUrl || null;

  return (
    <div className="space-y-4">
      {/* 히어로 섹션 (콘텐츠 전달) */}
      <HeroSection
        backgroundImageUrl={backgroundImageUrl}
        badgeText={allContent["hero-badge"]?.content.text || "Flavor Archive Beta"}
        title={allContent["hero-title"]?.content.title || "잊혀진 손맛을 연결하는\n디지털 식탁"}
        subtitle={allContent["hero-title"]?.content.subtitle}
        description={allContent["hero-description"]?.content.text || "궁중 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요."}
        searchPlaceholder={allContent["hero-search-placeholder"]?.content.text || "레시피를 검색해보세요"}
        searchButtonText={allContent["hero-search-button"]?.content.text || "검색"}
        quickStartCards={quickStartCards}
      />
    </div>
  );
}

