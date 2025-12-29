/**
 * @file components/mfds-recipes/mfds-recipe-section.tsx
 * @description 식약처 레시피 목록 컴포넌트 (Server Component)
 *
 * 주요 기능:
 * 1. 레시피 카드 그리드 표시
 * 2. 각 카드: 썸네일 이미지 + 제목 + 조리법/요리종류 태그
 * 3. 클릭 시 상세 페이지로 이동
 */

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MfdsRecipe } from "@/types/mfds-recipe";
import { getMainImageUrl } from "@/lib/mfds/recipe-image-utils";
import { loadAllRecipes } from "@/lib/mfds/recipe-loader";
import { MfdsRecipeCard } from "./mfds-recipe-card";

export function MfdsRecipeSection() {
  console.group("[MfdsRecipeSection] 레시피 목록 로드 시작");
  const recipes = loadAllRecipes();
  console.log("[MfdsRecipeSection] 레시피 개수:", recipes.length);
  console.groupEnd();

  if (recipes.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        레시피가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <MfdsRecipeCard key={recipe.frontmatter.rcp_seq} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

