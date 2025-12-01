/**
 * @file components/royal-recipes/royal-recipes-quick-access.tsx
 * @description 시대별 궁중 레시피 바로가기 카드 섹션
 */

import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/section";

const eras = [
  {
    id: "sanguk",
    name: "삼국시대",
    description: "삼국시대 및 통일신라 궁중 레시피",
    iconImage: "/api/royal-recipes/images/삼국시대 아이콘.jpg",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    backgroundImage: "/api/royal-recipes/images/삼국시대.jpg",
    count: 14,
  },
  {
    id: "goryeo",
    name: "고려시대",
    description: "불교와 원나라 교류의 영향이 담긴 궁중 레시피",
    iconImage: "/api/royal-recipes/images/고려시대 아이콘.jpg",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    backgroundImage: "/api/royal-recipes/images/고려시대.jpg",
    count: 16,
  },
  {
    id: "joseon",
    name: "조선시대",
    description: "체계적으로 발달한 궁중 음식 레시피",
    iconImage: "/api/royal-recipes/images/조선시대 아이콘.jpg",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    backgroundImage: "/api/royal-recipes/images/조선시대.jpg",
    count: 20,
  },
];

export function RoyalRecipesQuickAccess() {
  return (
    <Section
      title="궁중 레시피 아카이브"
      description="잊혀져 가는 시대별 궁중 음식 레시피를 만나보세요"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {eras.map((era) => {
          return (
            <Link
              key={era.id}
              href={`/royal-recipes/${era.id}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl border-2 border-border/70 bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-2 h-full">
                {/* 배경 이미지 */}
                {era.backgroundImage && (
                  <div className="absolute inset-0">
                    <Image
                      src={era.backgroundImage}
                      alt={`${era.name} 배경`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* 어두운 오버레이 */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  </div>
                )}
                
                {/* 그라데이션 배경 (이미지가 없을 때) */}
                {!era.backgroundImage && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${era.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                )}
                
                <div className="relative p-6 z-10">
                  {/* 아이콘 */}
                  <div className={`mb-4 w-14 h-14 rounded-xl ${era.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform border-2 ${era.borderColor}`}>
                    <Image
                      src={era.iconImage}
                      alt={`${era.name} 아이콘`}
                      width={28}
                      height={28}
                      className="object-contain"
                      unoptimized
                    />
                  </div>

                  {/* 제목 */}
                  <h3 className={`text-xl font-bold mb-2 ${era.backgroundImage ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
                    {era.name}
                  </h3>

                  {/* 설명 */}
                  <p className={`text-sm mb-4 ${era.backgroundImage ? 'text-white/90 drop-shadow-md' : 'text-muted-foreground'}`}>
                    {era.description}
                  </p>

                  {/* 레시피 개수 및 화살표 */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${era.backgroundImage ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
                      {era.count}개의 레시피
                    </span>
                    <span className={`transition-colors ${era.backgroundImage ? 'text-white/80 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

