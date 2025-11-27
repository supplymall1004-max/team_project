/**
 * @file hero-section.tsx
 * @description 히어로 섹션 컴포넌트 (배경 이미지/비디오 포함)
 *
 * 주요 기능:
 * 1. 슬로건 표시
 * 2. 메인 검색창 (통합 검색)
 * 3. 빠른 접근 버튼 3개
 * 4. 배경 이미지/비디오 처리
 * 5. 모바일 반응형 레이아웃
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, ChefHat, Film, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quickStart = [
  {
    title: "🎬 레거시 아카이브",
    description: "명인 인터뷰와 전통 조리법을 고화질로 감상하세요.",
    href: "/legacy",
    icon: Film,
  },
  {
    title: "📚 현대 레시피 북",
    description: "별점과 난이도로 정리된 최신 레시피를 확인해요.",
    href: "/recipes",
    icon: ChefHat,
  },
  {
    title: "🤖 AI 맞춤 식단",
    description: "건강 정보를 기반으로 개인 맞춤 식단을 추천받아요.",
    href: "/diet",
    icon: Brain,
  },
];

interface HeroSectionProps {
  backgroundImageUrl?: string | null;
}

export function HeroSection({ backgroundImageUrl }: HeroSectionProps = {}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    console.groupCollapsed("[HeroSection] 통합 검색");
    console.log("query", searchQuery);
    console.groupEnd();

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleQuickStartClick = (href: string) => {
    console.groupCollapsed("[HeroSection] 빠른 카드 클릭");
    console.log("target:", href);
    console.groupEnd();
  };

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
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          {/* 베타 배지 */}
          <div className="inline-flex items-center rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-700">
            Flavor Archive Beta
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            잊혀진 손맛을 연결하는
            <br />
            디지털 식탁
          </h1>

          {/* 서브 타이틀 */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            명인의 전통 레시피부터 AI 맞춤 식단까지, 세대와 세대를 넘나드는
            요리 지식을 한 곳에서 경험하세요.
          </p>

          {/* 메인 검색창 */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="레시피, 명인, 재료를 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base"
                  onFocus={() => {
                    console.groupCollapsed("[HeroSection] 검색창 포커스");
                    console.log("timestamp:", Date.now());
                    console.groupEnd();
                  }}
                />
              </div>
              <Button type="submit" size="lg" className="h-14 sm:px-10">
                검색
              </Button>
            </div>
          </form>

          {/* 빠른 접근 버튼 */}
          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto pt-8">
            {quickStart.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  onClick={() => handleQuickStartClick(card.href)}
                  className="group rounded-2xl border border-border/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:bg-white"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg bg-orange-100 p-2 group-hover:bg-orange-200 transition-colors">
                      <Icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
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

