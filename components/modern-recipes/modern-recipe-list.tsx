/**
 * @file components/modern-recipes/modern-recipe-list.tsx
 * @description 현대 레시피 목록 컴포넌트
 *
 * 주요 기능:
 * 1. dishType별 필터 (반찬, 국, 찌개, 밥, 후식, 주요리)
 * 2. 레시피 카드 그리드 표시
 * 3. 검색 기능
 *
 * @dependencies
 * - React 19
 * - Tailwind CSS v4
 * - lucide-react (아이콘)
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, UtensilsCrossed, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernRecipe } from "@/types/modern-recipe";

// Props 타입
interface ModernRecipeListProps {
  recipes: ModernRecipe[];
}

// dishType별 라벨
const dishTypeLabels: Record<
  "side" | "soup" | "stew" | "rice" | "dessert" | "main",
  string
> = {
  side: "반찬",
  soup: "국",
  stew: "찌개",
  rice: "밥",
  dessert: "후식",
  main: "주요리",
};

// dishType별 색상
const dishTypeColors: Record<
  "side" | "soup" | "stew" | "rice" | "dessert" | "main",
  string
> = {
  side: "bg-green-100 text-green-700",
  soup: "bg-blue-100 text-blue-700",
  stew: "bg-red-100 text-red-700",
  rice: "bg-yellow-100 text-yellow-700",
  dessert: "bg-pink-100 text-pink-700",
  main: "bg-purple-100 text-purple-700",
};

export function ModernRecipeList({ recipes }: ModernRecipeListProps) {
  console.log("[ModernRecipeList] 현대 레시피 목록 렌더링, 레시피 수:", recipes.length);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDishType, setSelectedDishType] = useState<
    "side" | "soup" | "stew" | "rice" | "dessert" | "main" | "all"
  >("all");

  // 필터링된 레시피
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !recipe.title.toLowerCase().includes(query) &&
          !recipe.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // dishType 필터
      if (
        selectedDishType !== "all" &&
        !recipe.dishType.includes(selectedDishType)
      ) {
        return false;
      }

      return true;
    });
  }, [recipes, searchQuery, selectedDishType]);

  return (
    <div className="space-y-6 pt-8">
      {/* 검색 및 필터 */}
      <div className="space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="레시피 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">분류:</span>
          </div>
          <Button
            variant={selectedDishType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDishType("all")}
            className={
              selectedDishType === "all"
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : ""
            }
          >
            전체
          </Button>
          {Object.entries(dishTypeLabels).map(([dishType, label]) => {
            const isSelected = selectedDishType === dishType;
            return (
              <Button
                key={dishType}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedDishType(
                    dishType as "side" | "soup" | "stew" | "rice" | "dessert" | "main"
                  )
                }
                className={
                  isSelected
                    ? `${dishTypeColors[dishType as keyof typeof dishTypeColors]} border-2`
                    : ""
                }
                style={{
                  zIndex: isSelected ? 10 : 1,
                  position: "relative",
                  pointerEvents: "auto",
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 결과 개수 */}
      <div className="text-sm text-gray-600">
        총 <strong>{filteredRecipes.length}개</strong>의 레시피를 찾았습니다.
      </div>

      {/* 레시피 그리드 */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/archive/recipes/modern/${recipe.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {recipe.emoji && (
                        <span className="text-2xl">{recipe.emoji}</span>
                      )}
                      <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    </div>
                    <UtensilsCrossed className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  </div>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {recipe.dishType.map((type) => (
                      <Badge key={type} className={dishTypeColors[type]}>
                        {dishTypeLabels[type]}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>🔥 {recipe.nutrition.calories}kcal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>단백질 {recipe.nutrition.protein}g</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

