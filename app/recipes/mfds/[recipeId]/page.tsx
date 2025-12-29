/**
 * @file app/recipes/mfds/[recipeId]/page.tsx
 * @description 식약처 레시피 상세 페이지 (Server Component)
 *
 * 주요 기능:
 * 1. 레시피 데이터 로드 (RCP_SEQ 기반)
 * 2. 404 처리 (레시피 없을 때)
 * 3. 메타데이터 설정
 */

import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { MfdsRecipeDetailClient } from "@/components/mfds-recipes/mfds-recipe-detail-client";
import { loadRecipeBySeq } from "@/lib/mfds/recipe-loader";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Suspense } from "react";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";

interface MfdsRecipePageProps {
  params: Promise<{ recipeId: string }>;
}

export async function generateMetadata({
  params,
}: MfdsRecipePageProps) {
  const resolvedParams = await params;
  const { recipeId } = resolvedParams;
  const recipe = loadRecipeBySeq(recipeId);

  if (!recipe) {
    return {
      title: "레시피를 찾을 수 없습니다 | 맛의 아카이브",
      description: "요청하신 레시피를 찾을 수 없습니다",
    };
  }

  return {
    title: `${recipe.title} | 식약처 레시피 | 맛의 아카이브`,
    description: recipe.description || `${recipe.title} 레시피를 확인하고 요리를 시작하세요`,
  };
}

// 동적 데이터를 사용하므로 빌드 시 정적 생성 건너뛰기
export const dynamic = 'force-dynamic';

export default async function MfdsRecipePage({
  params,
}: MfdsRecipePageProps) {
  const resolvedParams = await params;
  const { recipeId } = resolvedParams;

  console.group(`[MfdsRecipePage] 레시피 페이지 로드: ${recipeId}`);

  let recipe;
  try {
    recipe = loadRecipeBySeq(recipeId);
    
    if (!recipe) {
      console.warn(`[MfdsRecipePage] 레시피를 찾을 수 없습니다: ${recipeId}`);
      console.groupEnd();
      notFound();
    }

    console.log(`[MfdsRecipePage] 레시피 로드 완료:`, {
      title: recipe.title,
      stepsCount: recipe.steps.length,
      ingredientsCount: recipe.ingredients.length,
      hasNutrition: !!recipe.nutrition.calories,
    });
    console.groupEnd();
  } catch (error) {
    console.error(`[MfdsRecipePage] 레시피 로드 중 오류 발생:`, error);
    if (error instanceof Error) {
      console.error(`[MfdsRecipePage] 에러 메시지:`, error.message);
      console.error(`[MfdsRecipePage] 스택:`, error.stack);
    }
    console.groupEnd();
    notFound();
  }

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50">
        <Section className="pt-8">
          <Suspense
            fallback={<LoadingSpinner label="레시피를 불러오는 중..." />}
          >
            <MfdsRecipeDetailClient recipe={recipe} />
          </Suspense>
        </Section>
      </div>
    </DirectionalEntrance>
  );
}

