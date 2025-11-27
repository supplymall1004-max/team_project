/**
 * @file recipe-list-client.tsx
 * @description 레시피 목록 클라이언트 컴포넌트 (필터링, 검색, 정렬 기능 포함)
 */

"use client";

import { useState, useMemo } from "react";
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
  }, [recipes, filters]);

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

