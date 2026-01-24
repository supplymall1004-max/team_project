/**
 * @file home-landing.tsx
 * @description 홈 빠른 시작 섹션 클라이언트 컴포넌트.
 * 히어로 섹션은 별도 컴포넌트로 분리됨.
 *
 * 주요 기능:
 * 1. API에서 히어로 섹션 콘텐츠 조회
 * 2. HeroSection에 props로 전달
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { HeroSection, QuickStartCard } from "./hero-section";
import type { CopyContentResult } from "@/lib/admin/copy-reader";

export function HomeLanding() {
  // 콘텐츠를 API에서 로드하도록 변경 (클라이언트에서 API로 로드)
  const [allContent, setAllContent] = useState<Record<string, CopyContentResult>>({});
  
  const slugs = useMemo(() => [
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
  ], []);

  useEffect(() => {
    let mounted = true;
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/copy-content/multi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs, locale: "ko" }),
        });
        if (!res.ok) throw new Error("copy content fetch failed");
        const data = await res.json();
        if (mounted) setAllContent(data?.content ?? {});
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[HomeLanding] 콘텐츠 조회 실패:", error);
        }
        if (mounted) setAllContent({});
      }
    };
    fetchContent();
    return () => { mounted = false; };
  }, [slugs]);

  // 빠른 시작 카드 데이터 구성 (앱 아이콘 스타일 - 세련된 그라데이션 적용)
  // 아이콘 중복 제거 및 각 기능에 맞는 아이콘으로 재배치
  // 카테고리별로 분류하여 네온 효과 적용
  const quickStartCards: QuickStartCard[] = useMemo(() => [
    {
      title: "레시피",
      description: "최신 레시피 모음",
      href: "/recipes",
      iconSrc: "/icons/레시피.png",
      color: "bg-blue-500",
      gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
      category: "recipe",
    },
    {
      title: "궁중요리",
      description: "전통 궁중 레시피",
      href: "/royal-recipes",
      iconSrc: "/icons/궁중요리.png",
      color: "bg-amber-500",
      gradient: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
      category: "recipe",
    },
    {
      title: "이유식\n레시피",
      description: "아기 이유식 레시피",
      href: "/archive/recipes?tab=baby",
      iconSrc: "/icons/이유식 레시피.png",
      color: "bg-pink-500",
      gradient: "bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600",
      category: "recipe",
    },
    {
      title: "죽\n레시피",
      description: "영양 가득한 죽 레시피",
      href: "/archive/recipes?tab=gruel",
      iconSrc: "/icons/죽 레시피.png",
      color: "bg-amber-600",
      gradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600",
      category: "recipe",
    },
    {
      title: "특수\n레시피",
      description: "해독, 염증 완화, 기력 회복 특수 레시피",
      href: "/archive/recipes?tab=special",
      iconSrc: "/icons/특수 레시피.png",
      color: "bg-purple-600",
      gradient: "bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700",
      category: "recipe",
    },
    {
      title: "비건\n레시피",
      description: "지속가능한 비건 레시피",
      href: "/archive/recipes?tab=vegan",
      iconSrc: "/icons/비건레시피.png",
      color: "bg-emerald-600",
      gradient: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600",
      category: "recipe",
    },
    {
      title: "식약처\n레시피",
      description: "공식 식약처 레시피",
      href: "/recipes/mfds",
      iconSrc: "/icons/식약처 레시피.png",
      color: "bg-green-600",
      gradient: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600",
      category: "recipe",
    },
    {
      title: "식단관리",
      description: "맞춤 식단 추천",
      href: "/diet",
      iconSrc: "/icons/식단관리.png",
      color: "bg-green-500",
      gradient: "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
      category: "diet",
    },
    {
      title: "주간식단",
      description: "7일 식단 계획",
      href: "/diet/weekly",
      iconSrc: "/icons/주간식단.png",
      color: "bg-purple-500",
      gradient: "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600",
      category: "diet",
    },
    {
      title: "건강관리",
      description: "가족 건강 관리",
      href: "/health",
      iconSrc: "/icons/건강관리.png",
      color: "bg-red-500",
      gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
      category: "health",
    },
    {
      title: "요리이야기",
      description: "맛있는 이야기들",
      href: "/stories",
      iconSrc: "/icons/요리 이야기.png",
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700",
      category: "story",
    },
    {
      title: "반려동물",
      description: "반려동물 건강 관리",
      href: "/health/pets",
      iconSrc: "/icons/반려동물.png",
      color: "bg-orange-500",
      gradient: "bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600",
      category: "health",
    },
    {
      title: "냉장고\n파수꾼",
      description: "세균 퇴치 게임",
      href: "/game/fridge-guardian",
      iconSrc: "/icons/냉장고 파수꾼.png",
      color: "bg-cyan-500",
      gradient: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600",
      category: "game",
    },
    {
      title: "Django\nDefender",
      description: "타워 디펜스 게임",
      href: "/game/fridge-defense",
      iconSrc: "/icons/냉장고 디펜스.png",
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500",
      category: "game",
    },
    {
      title: "냉장고\n짝 맞추기",
      description: "메모리 게임",
      href: "/game/fridge-memory",
      iconSrc: "/icons/냉장고 짝 맞추기.png",
      color: "bg-blue-500",
      gradient: "bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600",
      category: "game",
    },
    {
      title: "뇌 훈련 숫자맞추기",
      description: "코드 브레이커 게임",
      href: "/game/codebreaker",
      iconSrc: "/icons/숫자 맞추기.png",
      color: "bg-purple-500",
      gradient: "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600",
      category: "game",
    },
  ], []);

  // 배경 이미지 URL
  const backgroundImageUrl =
    allContent["hero-background-image"]?.content.imageUrl ?? null;

  return (
    <div className="space-y-4">
      {/* 히어로 섹션 (콘텐츠 전달) */}
      <HeroSection
        backgroundImageUrl={backgroundImageUrl}
        badgeText={allContent["hero-badge"]?.content.text ?? ""}
        title={allContent["hero-title"]?.content.title ?? "장씨집안집사 장고"}
        subtitle={allContent["hero-title"]?.content.subtitle ?? "잊혀진 손맛을 보관하는 디지털 식탁"}
        description={allContent["hero-description"]?.content.text ?? "전통과 현대를 잇는 레시피 아카이브. 명인의 전통 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요."}
        searchPlaceholder={allContent["hero-search-placeholder"]?.content.text ?? "레시피를 검색해보세요"}
        searchButtonText={allContent["hero-search-button"]?.content.text ?? "검색"}
        quickStartCards={quickStartCards}
      />
    </div>
  );
}

