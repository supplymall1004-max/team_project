/**
 * @file recipes/[slug]/page.tsx
 * @description 레시피 상세 페이지 (Server Component)
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 단계별 카드 형식 레시피 표시
 * 3. 요리 시작 모드 전환
 *
 * 로컬 파일 기반 레시피 지원:
 * - 숫자 slug인 경우: 식약처 레시피를 로컬 파일에서 직접 로드
 * - 그 외: 기존 DB/API 방식 사용
 */

import { notFound, redirect } from "next/navigation";
import { Section } from "@/components/section";
import { RecipeDetailClient } from "@/components/recipes/recipe-detail-client";
import { MfdsRecipeDetailClient } from "@/components/mfds-recipes/mfds-recipe-detail-client";
import { getRecipeBySlug } from "@/lib/recipes/queries";
import { loadRecipeBySeq } from "@/lib/mfds/recipe-loader";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Suspense } from "react";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";

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

  console.group(`[RecipeDetailPage] 레시피 페이지 로드: ${slug}`);

  // "mfds"는 목록 페이지로 리다이렉트
  if (slug === "mfds") {
    console.log(`[RecipeDetailPage] mfds slug 감지, 목록 페이지로 리다이렉트`);
    console.groupEnd();
    redirect("/recipes/mfds");
  }

  // slug가 숫자만 있는 경우 (식약처 레시피)
  // 로컬 파일에서 직접 로드 (DB/API 사용 안 함)
  if (/^\d+$/.test(slug)) {
    console.log(`[RecipeDetailPage] 숫자 slug 감지, 로컬 파일에서 식약처 레시피 로드: ${slug}`);
    const mfdsRecipe = loadRecipeBySeq(slug);
    
    if (mfdsRecipe) {
      console.log(`[RecipeDetailPage] 식약처 레시피 로드 완료: ${mfdsRecipe.title}`);
      console.groupEnd();
      
      return (
        <DirectionalEntrance direction="up" delay={0.3}>
          <div className="min-h-screen bg-gray-50">
            <Section className="pt-8">
              <Suspense fallback={<LoadingSpinner label="레시피를 불러오는 중..." />}>
                <MfdsRecipeDetailClient recipe={mfdsRecipe} />
              </Suspense>
            </Section>
          </div>
        </DirectionalEntrance>
      );
    }
    
    console.warn(`[RecipeDetailPage] 식약처 레시피를 찾을 수 없습니다: ${slug}`);
    console.groupEnd();
    notFound();
  }

  // 그 외의 경우: 기존 DB/API 방식 사용
  console.log(`[RecipeDetailPage] 일반 레시피 조회: ${slug}`);
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    console.warn(`[RecipeDetailPage] 레시피를 찾을 수 없습니다: ${slug}`);
    console.groupEnd();
    notFound();
  }

  console.log(`[RecipeDetailPage] 레시피 로드 완료: ${recipe.title}`);
  console.groupEnd();

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50">
        <Section className="pt-8">
          <Suspense fallback={<LoadingSpinner label="레시피를 불러오는 중..." />}>
            <RecipeDetailClient recipe={recipe} />
          </Suspense>
        </Section>
      </div>
    </DirectionalEntrance>
  );
}

