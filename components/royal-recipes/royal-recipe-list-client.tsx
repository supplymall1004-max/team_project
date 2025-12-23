/**
 * @file royal-recipe-list-client.tsx
 * @description 궁중 레시피 목록 클라이언트 컴포넌트 (분류 탭 포함)
 */

"use client";

import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { RecipeEra } from "@/lib/royal-recipes/queries";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// rawContent를 제외하고 이미지 URL을 포함한 타입
type RoyalRecipeListItem = {
  id: string;
  era: RecipeEra;
  title: string;
  number: number;
  content: {
    characteristics?: string;
    ingredients?: string;
    steps: string[];
    tips?: string[];
  };
  images: {
    palace: string | null;
    modern: string | null;
  };
};

interface RoyalRecipeListClientProps {
  recipes: RoyalRecipeListItem[];
  era: RecipeEra;
}

// 레시피 제목 기반 분류 함수
function getRecipeCategory(title: string): string {
  const lowerTitle = title.toLowerCase();

  // 밥류
  if (lowerTitle.includes("밥") || lowerTitle.includes("rice")) {
    return "밥류";
  }

  // 국/탕류
  if (
    lowerTitle.includes("국") ||
    lowerTitle.includes("탕") ||
    lowerTitle.includes("soup")
  ) {
    return "국/탕류";
  }

  // 찌개류
  if (lowerTitle.includes("찌개") || lowerTitle.includes("stew")) {
    return "찌개류";
  }

  // 반찬류 (나물, 무침, 볶음, 조림, 구이, 튀김 등)
  if (
    lowerTitle.includes("나물") ||
    lowerTitle.includes("무침") ||
    lowerTitle.includes("볶음") ||
    lowerTitle.includes("조림") ||
    lowerTitle.includes("구이") ||
    lowerTitle.includes("튀김") ||
    lowerTitle.includes("전") ||
    lowerTitle.includes("찐")
  ) {
    return "반찬류";
  }

  // 디저트/간식류
  if (
    lowerTitle.includes("과자") ||
    lowerTitle.includes("떡") ||
    lowerTitle.includes("한과") ||
    lowerTitle.includes("약과")
  ) {
    return "디저트/간식류";
  }

  // 기본값
  return "기타";
}

export function RoyalRecipeListClient({
  recipes,
  era,
}: RoyalRecipeListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 사용 가능한 카테고리 목록 추출
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    recipes.forEach((recipe) => {
      const category = getRecipeCategory(recipe.title);
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [recipes]);

  // 필터링된 레시피 목록
  const filteredRecipes = useMemo(() => {
    if (selectedCategory === "all") {
      return recipes;
    }
    return recipes.filter(
      (recipe) => getRecipeCategory(recipe.title) === selectedCategory
    );
  }, [recipes, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* 분류 탭 - 항상 표시 */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">분류:</span>
          </div>
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              console.log("[RoyalRecipeListClient] 전체 버튼 클릭");
              setSelectedCategory("all");
            }}
            className={
              selectedCategory === "all"
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : ""
            }
          >
            전체
          </Button>
          {availableCategories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log(`[RoyalRecipeListClient] ${category} 버튼 클릭`);
                  setSelectedCategory(category);
                }}
                className={
                  isSelected
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : ""
                }
              >
                {category}
              </Button>
            );
            })}
        </div>

      {/* 레시피 그리드 */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const images = recipe.images;

            return (
              <Link
                key={recipe.id}
                href={`/royal-recipes/${era}/${recipe.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                  {/* 썸네일 이미지 */}
                  {images.palace ? (
                    <div className="relative w-full aspect-video overflow-hidden">
                      <Image
                        src={images.palace}
                        alt={recipe.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}

                  {/* 카드 내용 */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-orange-600">
                        {recipe.number}번째 레시피
                      </span>
                    </div>
                    <h3
                      className="text-lg font-bold text-gray-900 mb-2 line-clamp-2"
                      style={{
                        fontFamily:
                          "'Noto Sans SC', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
                      }}
                    >
                      {recipe.title}
                    </h3>
                    {recipe.content.characteristics && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recipe.content.characteristics}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            선택한 분류에 해당하는 레시피가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}

