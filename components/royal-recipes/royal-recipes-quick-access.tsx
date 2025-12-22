/**
 * @file components/royal-recipes/royal-recipes-quick-access.tsx
 * @description 시대별 궁중 레시피 바로가기 카드 섹션
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Section } from "@/components/section";

const eras = [
  {
    id: "sanguk",
    name: "삼국시대",
    description: "삼국시대 및 통일신라 궁중 레시피",
    iconImage: "/images/royalrecipe/삼국시대 아이콘.jpg",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    backgroundImage: "/images/royalrecipe/삼국시대.jpg",
    count: 14,
  },
  {
    id: "goryeo",
    name: "고려시대",
    description: "불교와 원나라 교류의 영향이 담긴 궁중 레시피",
    iconImage: "/images/royalrecipe/고려시대 아이콘.jpg",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    backgroundImage: "/images/royalrecipe/고려시대.jpg",
    count: 16,
  },
  {
    id: "joseon",
    name: "조선시대",
    description: "체계적으로 발달한 궁중 음식 레시피",
    iconImage: "/images/royalrecipe/조선시대 아이콘.jpg",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    backgroundImage: "/images/royalrecipe/조선시대.jpg",
    count: 20,
  },
] as const;

interface EraCardProps {
  era: (typeof eras)[number];
}

function EraCard({ era }: EraCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link
      href={`/royal-recipes/${era.id}`}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-border/70 bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-2 h-full min-h-[280px]">
        {/* 그라데이션 배경 (기본 배경) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${era.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
        
        {/* 배경 이미지 */}
        {era.backgroundImage && !imageError && (
          <div className="absolute inset-0 z-0">
            <Image
              src={era.backgroundImage}
              alt={`${era.name} 배경`}
              fill
              className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority
              onLoad={() => {
                console.log(`[RoyalRecipesQuickAccess] ${era.name} 배경 이미지 로드 완료`);
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.error(`[RoyalRecipesQuickAccess] ${era.name} 배경 이미지 로드 실패:`, era.backgroundImage);
                setImageError(true);
              }}
            />
            {/* 어두운 오버레이 (텍스트 가독성을 위해) */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 group-hover:from-black/40 group-hover:via-black/30 group-hover:to-black/50 transition-all" />
          </div>
        )}
        
        <div className="relative p-6 sm:p-8 z-10">
          {/* 아이콘 */}
          <div className={`mb-4 w-14 h-14 rounded-xl ${era.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform border-2 ${era.borderColor}`}>
            <Image
              src={era.iconImage}
              alt={`${era.name} 아이콘`}
              width={28}
              height={28}
              className="object-contain"
              style={{ width: "auto", height: "auto" }}
              unoptimized
            />
          </div>

          {/* 제목 */}
          <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${(era.backgroundImage && !imageError) ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
            {era.name}
          </h3>

          {/* 설명 */}
          <p className={`text-sm sm:text-base mb-4 ${(era.backgroundImage && !imageError) ? 'text-white/95 drop-shadow-md' : 'text-muted-foreground'}`}>
            {era.description}
          </p>

          {/* 레시피 개수 및 화살표 */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${(era.backgroundImage && !imageError) ? 'text-white drop-shadow-md' : 'text-gray-700'}`}>
              {era.count}개의 레시피
            </span>
            <span className={`text-lg sm:text-xl transition-colors ${(era.backgroundImage && !imageError) ? 'text-white/90 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface RoyalRecipesQuickAccessProps {
  id?: string;
  showSection?: boolean;
}

export function RoyalRecipesQuickAccess({ 
  id = "royal-recipes",
  showSection = true 
}: RoyalRecipesQuickAccessProps) {
  const content = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {eras.map((era) => (
        <EraCard key={era.id} era={era} />
      ))}
    </div>
  );

  if (showSection) {
    return (
      <Section
        id={id}
        title="궁중 레시피 아카이브"
        description="잊혀져 가는 시대별 궁중 음식 레시피를 만나보세요"
        inTabs
      >
        {content}
      </Section>
    );
  }

  return <div id={id}>{content}</div>;
}

