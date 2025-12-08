/**
 * @file components/diet/mfds-recipe-search.tsx
 * @description 식약처 API 레시피 검색 컴포넌트
 *
 * 주요 기능:
 * 1. 레시피 이름으로 식약처 API 검색
 * 2. 검색 결과를 카드 그리드로 표시
 * 3. 각 결과 카드 클릭 시 식약처 레시피 상세 페이지로 이동
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ImageOff } from "lucide-react";
import Link from "next/link";
import type { RecipeItem } from "@/lib/services/mfds-recipe-api";

interface MfdsRecipeSearchProps {
  defaultSearchTerms?: string[];
}

export function MfdsRecipeSearch({
  defaultSearchTerms = [],
}: MfdsRecipeSearchProps) {
  const [searchTerm, setSearchTerm] = useState(
    defaultSearchTerms.length > 0 ? defaultSearchTerms[0] : ""
  );
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.group("[MfdsRecipeSearch] 컴포넌트 렌더링");
  console.log("defaultSearchTerms:", defaultSearchTerms);
  console.log("searchTerm:", searchTerm);
  console.groupEnd();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      console.group("[MfdsRecipeSearch] 검색 시작");
      console.log("검색어:", searchTerm);

      const response = await fetch(
        `/api/mfds-recipes/search?q=${encodeURIComponent(searchTerm)}&limit=12`
      );

      if (!response.ok) {
        throw new Error("검색에 실패했습니다.");
      }

      const data = await response.json();
      console.log("검색 결과:", data);

      if (data.success && data.recipes) {
        setRecipes(data.recipes);
        console.log(`✅ ${data.recipes.length}개의 레시피 검색 성공`);
      } else {
        setError(data.error || "검색 결과가 없습니다.");
      }

      console.groupEnd();
    } catch (err) {
      console.error("[MfdsRecipeSearch] 검색 오류:", err);
      setError(
        err instanceof Error ? err.message : "검색 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="레시피 이름을 입력하세요 (예: 어묵볶음)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          검색
        </Button>
      </div>

      {/* 기본 검색어 버튼들 */}
      {defaultSearchTerms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">빠른 검색:</span>
          {defaultSearchTerms.map((term, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm(term);
                // 자동 검색은 하지 않고 검색어만 설정
              }}
            >
              {term}
            </Button>
          ))}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 검색 결과 */}
      {recipes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            검색 결과 ({recipes.length}개)
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.RCP_SEQ}
                href={`/recipes/mfds/${recipe.RCP_SEQ}`}
                className="group block rounded-xl border border-border/60 bg-white overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* 이미지 */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  {recipe.ATT_FILE_NO_MAIN ? (
                    <img
                      src={recipe.ATT_FILE_NO_MAIN}
                      alt={recipe.RCP_NM}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                      <ImageOff className="h-8 w-8 text-emerald-300" />
                    </div>
                  )}
                </div>

                {/* 카드 내용 */}
                <div className="p-4">
                  <h4 className="font-semibold text-base text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {recipe.RCP_NM}
                  </h4>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {recipe.RCP_WAY2 && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {recipe.RCP_WAY2}
                      </span>
                    )}
                    {recipe.RCP_PAT2 && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {recipe.RCP_PAT2}
                      </span>
                    )}
                  </div>
                  {recipe.INFO_ENG && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      칼로리: {recipe.INFO_ENG}kcal
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 검색 안내 */}
      {!loading && recipes.length === 0 && !error && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            검색어를 입력하고 검색 버튼을 클릭하거나 Enter 키를 눌러주세요.
          </p>
        </div>
      )}
    </div>
  );
}













