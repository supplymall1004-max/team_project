/**
 * @file app/royal-recipes/page.tsx
 * @description 궁중 레시피 메인 페이지 (시대별 선택)
 */

import { Section } from "@/components/section";
import Link from "next/link";
import Image from "next/image";

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
    count: 20,
  },
];

export const metadata = {
  title: "궁중 레시피 | 맛의 아카이브",
  description: "잊혀져 가는 시대별 궁중 레시피를 만나보세요",
};

export default function RoyalRecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            궁중 레시피 아카이브
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            잊혀져 가는 시대별 궁중 음식 레시피를 디지털로 보존합니다.
            <br />
            삼국시대부터 조선시대까지 전통 궁중 요리의 비밀을 만나보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eras.map((era) => {
            return (
              <Link
                key={era.id}
                href={`/royal-recipes/${era.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-2 h-full">
                  {/* 그라데이션 배경 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${era.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="relative p-8">
                    {/* 아이콘 */}
                    <div className={`mb-6 w-16 h-16 rounded-2xl ${era.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform border-2 ${era.borderColor}`}>
                      <Image
                        src={era.iconImage}
                        alt={`${era.name} 아이콘`}
                        width={32}
                        height={32}
                        className="object-contain"
                        unoptimized
                      />
                    </div>

                    {/* 제목 */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {era.name}
                    </h2>

                    {/* 설명 */}
                    <p className="text-muted-foreground mb-4">
                      {era.description}
                    </p>

                    {/* 레시피 개수 */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <span>{era.count}개의 레시피</span>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-6 border border-amber-200">
          <p className="text-sm text-center text-gray-700">
            각 레시피는 <strong>궁중 사진 + 상세 조리법 + 현대 재현 이미지</strong>로 구성되어 있습니다.
            <br />
            전통의 맛과 정신을 현대 주방에서 재현할 수 있도록 상세히 기록했습니다.
          </p>
        </div>
      </Section>
    </div>
  );
}

