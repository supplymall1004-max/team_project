/**
 * @file app/royal-recipes/[era]/page.tsx
 * @description 시대별 궁중 레시피 목록 페이지
 */

import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { getRoyalRecipesByEra, getEraName, RecipeEra } from "@/lib/royal-recipes/queries";
import { RoyalRecipe } from "@/lib/royal-recipes/parser";
import { getRecipeImages } from "@/lib/royal-recipes/images";
import { RoyalRecipeListClient } from "@/components/royal-recipes/royal-recipe-list-client";

interface RoyalRecipesListPageProps {
  params: Promise<{ era: string }>;
}

export async function generateMetadata({ params }: RoyalRecipesListPageProps) {
  const resolvedParams = await params;
  const { era } = resolvedParams;
  const eraName = getEraName(era as RecipeEra);

  return {
    title: `${eraName} 궁중 레시피 | 맛의 아카이브`,
    description: `${eraName} 궁중 음식 레시피 모음`,
  };
}

export default async function RoyalRecipesListPage({
  params,
}: RoyalRecipesListPageProps) {
  const resolvedParams = await params;
  const { era } = resolvedParams;

  // era 유효성 검사
  const validEras: RecipeEra[] = ["sanguk", "goryeo", "joseon"];
  if (!validEras.includes(era as RecipeEra)) {
    notFound();
  }

  let recipes: RoyalRecipe[] = [];
  try {
    recipes = await getRoyalRecipesByEra(era as RecipeEra);
    console.log(`[RoyalRecipesListPage] ${era} 시대 레시피 ${recipes.length}개 로드됨`);
    if (recipes.length > 0) {
      console.log(`[RoyalRecipesListPage] 첫 번째 레시피:`, recipes[0].title);
    }
  } catch (error) {
    console.error(`[RoyalRecipesListPage] ${era} 시대 레시피 로드 실패:`, error);
    if (error instanceof Error) {
      console.error(`[RoyalRecipesListPage] 에러 메시지:`, error.message);
      console.error(`[RoyalRecipesListPage] 스택:`, error.stack);
    }
    recipes = [];
  }

  const eraName = getEraName(era as RecipeEra);

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{eraName} 궁중 레시피</h1>
          <p className="text-muted-foreground">
            잊혀져 가는 전통 궁중 음식 레시피를 만나보세요
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 p-12 text-center">
            <p className="text-muted-foreground">
              {eraName} 레시피를 준비 중입니다.
            </p>
          </div>
        ) : (
          <RoyalRecipeListClient 
            recipes={recipes.map(({ rawContent, ...recipe }) => {
              const images = getRecipeImages({ ...recipe, rawContent: "" } as RoyalRecipe);
              return {
                ...recipe,
                images,
              };
            })} 
            era={era as RecipeEra} 
          />
        )}
      </Section>
    </div>
  );
}

