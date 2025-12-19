/**
 * @file recipes/[slug]/page.tsx
 * @description 레시피 상세 페이지 (Server Component)
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 단계별 카드 형식 레시피 표시
 * 3. 요리 시작 모드 전환
 */

import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { RecipeDetailClient } from "@/components/recipes/recipe-detail-client";
import { getRecipeBySlug } from "@/lib/recipes/queries";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Suspense } from "react";

export const metadata = {
  title: "레시피 상세 | 맛의 아카이브",
  description: "레시피 상세 정보를 확인하고 요리를 시작하세요",
};

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <Suspense fallback={<LoadingSpinner label="레시피를 불러오는 중..." />}>
          <RecipeDetailClient recipe={recipe} />
        </Suspense>
      </Section>
    </div>
  );
}

