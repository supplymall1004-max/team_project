/**
 * @file recipe-list-client.tsx
 * @description 레시피 목록 클라이언트 컴포넌트 (필터링, 검색, 정렬 기능 포함)
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Filter, SortAsc } from "lucide-react";
import { RecipeListItem, RecipeFilterState } from "@/types/recipe";
import { RecipeCard } from "./recipe-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RecipeListClientProps {
  initialRecipes: RecipeListItem[];
}

export function RecipeListClient({ initialRecipes }: RecipeListClientProps) {
  const [recipes] = useState<RecipeListItem[]>(initialRecipes);
  const [filters, setFilters] = useState<RecipeFilterState>({
    searchTerm: "",
    difficulty: [],
    maxCookingTime: null,
    sortBy: "newest",
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 레시피 제목 기반 분류 함수 (foodsafety_rcp_pat2가 없을 때 사용)
  const getCategoryFromTitle = useCallback((title: string): string => {
    const lowerTitle = title.toLowerCase();
    
    // 밥류
    if (lowerTitle.includes("밥") || lowerTitle.includes("rice")) {
      return "밥류";
    }
    
    // 국/탕류
    if (lowerTitle.includes("국") || lowerTitle.includes("탕") || lowerTitle.includes("soup")) {
      return "국/탕류";
    }
    
    // 찌개류
    if (lowerTitle.includes("찌개") || lowerTitle.includes("stew")) {
      return "찌개류";
    }
    
    // 반찬류
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
      lowerTitle.includes("케이크") ||
      lowerTitle.includes("디저트")
    ) {
      return "디저트/간식류";
    }
    
    return "기타";
  }, []);

  // 사용 가능한 카테고리 목록 추출
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    recipes.forEach((recipe) => {
      // foodsafety_rcp_pat2가 있으면 사용, 없으면 제목 기반 분류
      const category = recipe.foodsafety_rcp_pat2?.trim() || getCategoryFromTitle(recipe.title);
      if (category) {
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  }, [recipes, getCategoryFromTitle]);

  // 필터링된 레시피 목록
  const filteredRecipes = useMemo(() => {
    let result = [...recipes];

    // 검색어 필터
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchLower)
      );
    }

    // 분류 필터
    if (selectedCategory !== "all") {
      result = result.filter((recipe) => {
        const recipeCategory = recipe.foodsafety_rcp_pat2?.trim() || getCategoryFromTitle(recipe.title);
        return recipeCategory === selectedCategory;
      });
    }

    // 난이도 필터
    if (filters.difficulty.length > 0) {
      result = result.filter((recipe) =>
        filters.difficulty.includes(recipe.difficulty)
      );
    }

    // 최대 조리 시간 필터
    if (filters.maxCookingTime) {
      result = result.filter(
        (recipe) => recipe.cooking_time_minutes <= filters.maxCookingTime!
      );
    }

    // 정렬
    switch (filters.sortBy) {
      case "rating":
        result.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case "popular":
        result.sort((a, b) => b.rating_count - a.rating_count);
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        break;
    }

    return result;
  }, [recipes, filters, selectedCategory, getCategoryFromTitle]);

  const handleSearch = (term: string) => {
    console.groupCollapsed("[RecipeList] 검색어 입력");
    console.log("term", term);
    console.groupEnd();
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  };

  const handleDifficultyToggle = (difficulty: number) => {
    setFilters((prev) => {
      const newDifficulty = prev.difficulty.includes(difficulty)
        ? prev.difficulty.filter((d) => d !== difficulty)
        : [...prev.difficulty, difficulty];
      return { ...prev, difficulty: newDifficulty };
    });
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 바 */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-4">
        {/* 검색창 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="레시피 제목으로 검색..."
              value={filters.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
                console.log("[RecipeListClient] 전체 버튼 클릭");
                setSelectedCategory("all");
              }}
              className={selectedCategory === "all" ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
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
                    console.log(`[RecipeListClient] ${category} 버튼 클릭`);
                    setSelectedCategory(category);
                  }}
                  className={isSelected ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
                >
                  {category}
                </Button>
              );
            })}
          </div>

        {/* 필터 옵션 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 난이도 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">난이도:</span>
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant={
                  filters.difficulty.includes(level) ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleDifficultyToggle(level)}
              >
                {level}
              </Button>
            ))}
          </div>

          {/* 정렬 옵션 */}
          <div className="flex items-center gap-2 ml-auto">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as RecipeFilterState["sortBy"],
                }))
              }
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="newest">최신순</option>
              <option value="popular">인기순</option>
              <option value="rating">별점순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 레시피 그리드 */}
      {filteredRecipes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            검색 조건에 맞는 레시피가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}

