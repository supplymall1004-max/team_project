/**
 * @file home-landing.tsx
 * @description 홈 빠른 시작 섹션 서버 컴포넌트.
 * 히어로 섹션은 별도 컴포넌트로 분리됨.
 *
 * 주요 기능:
 * 1. 데이터베이스에서 히어로 섹션 콘텐츠 조회
 * 2. HeroSection에 props로 전달
 */

import { HeroSection } from "./hero-section";
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

  // 빠른 시작 카드 데이터 구성 (새로운 카테고리 구조)
  const quickStartCards = [
    {
      title: allContent["quick-start-recipe"]?.content.title || "📚 레시피 아카이브",
      description: allContent["quick-start-recipe"]?.content.description || "현대부터 전통까지, 모든 요리 지식을 한 곳에서",
      href: allContent["quick-start-recipe"]?.content.href || "/archive/recipes",
    },
    {
      title: allContent["quick-start-diet"]?.content.title || "🍽️ 식단 관리",
      description: allContent["quick-start-diet"]?.content.description || "AI 기반 개인 맞춤 식단으로 건강한 식생활을 시작하세요",
      href: allContent["quick-start-diet"]?.content.href || "/diet",
    },
    {
      title: "💚 건강 관리",
      description: "가족 건강을 한눈에 확인하고 관리하세요",
      href: "/health",
    },
    {
      title: allContent["quick-start-storybook"]?.content.title || "📖 스토리 & 학습",
      description: allContent["quick-start-storybook"]?.content.description || "전통 음식의 탄생과 역사를 동화처럼 들려드립니다",
      href: allContent["quick-start-storybook"]?.content.href || "/stories",
    },
    {
      title: "🛠️ 유틸리티",
      description: "편리한 기능들로 요리와 건강 관리를 더 쉽게",
      href: "/search",
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

