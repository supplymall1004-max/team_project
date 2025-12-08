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
    "quick-start-diet",
    "quick-start-weekly",
    "quick-start-storybook",
    "hero-background-image",
  ]);

  // 빠른 시작 카드 데이터 구성
  const quickStartCards = [
    {
      title: allContent["quick-start-recipe"]?.content.title || "📚 현대 레시피 아카이브",
      description: allContent["quick-start-recipe"]?.content.description || "별점과 난이도로 정리된 최신 레시피를 확인해요.",
      href: allContent["quick-start-recipe"]?.content.href || "/recipes",
    },
    {
      title: allContent["quick-start-diet"]?.content.title || "🤖 건강 맞춤 식단",
      description: allContent["quick-start-diet"]?.content.description || "건강 정보를 기반으로 개인 맞춤 식단을 추천받아요.",
      href: allContent["quick-start-diet"]?.content.href || "/diet",
    },
    {
      title: allContent["quick-start-weekly"]?.content.title || "📅 주간 식단",
      description: allContent["quick-start-weekly"]?.content.description || "7일간의 식단을 한눈에 확인하고 장보기 리스트를 관리하세요.",
      href: allContent["quick-start-weekly"]?.content.href || "/diet/weekly",
    },
    {
      title: allContent["quick-start-storybook"]?.content.title || "📖 마카의 음식 동화",
      description: allContent["quick-start-storybook"]?.content.description || "전통 음식의 탄생과 역사를 동화처럼 들려주는 이야기입니다.",
      href: allContent["quick-start-storybook"]?.content.href || "/storybook",
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
        description={allContent["hero-description"]?.content.text || "궁중 레시피부터 AI 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요."}
        searchPlaceholder={allContent["hero-search-placeholder"]?.content.text || "레시피를 검색해보세요"}
        searchButtonText={allContent["hero-search-button"]?.content.text || "검색"}
        quickStartCards={quickStartCards}
      />
    </div>
  );
}

