/**
 * @file recipes/page.tsx
 * @description 레시피 목록 페이지 (Server Component)
 *
 * 주요 기능:
 * 1. 레시피 목록 표시 (카드 그리드)
 * 2. 필터링 및 검색 기능
 * 3. 정렬 기능
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { RecipeListClient } from "@/components/recipes/recipe-list-client";
import { getRecipes } from "@/lib/recipes/queries";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "레시피 아카이브 | 맛의 아카이브",
  description: "다양한 레시피를 검색하고 탐색해보세요",
};

export default async function RecipesPage() {
  // 초기 레시피 목록 조회 (필터 없음)
  const initialRecipes = await getRecipes();

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">레시피 아카이브</h1>
          <p className="text-muted-foreground">
            다양한 레시피를 검색하고 탐색해보세요
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner label="레시피를 불러오는 중..." />}>
          <RecipeListClient initialRecipes={initialRecipes} />
        </Suspense>
      </Section>
    </div>
  );
}

