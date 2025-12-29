/**
 * @file app/recipes/mfds/page.tsx
 * @description 식약처 레시피 목록 페이지 (Server Component)
 *
 * 주요 기능:
 * 1. 로컬 파일에서 식약처 레시피 목록 로드
 * 2. 레시피 카드 그리드 표시
 */

import { Section } from "@/components/section";
import { loadAllRecipes } from "@/lib/mfds/recipe-loader";
import { MfdsRecipeCard } from "@/components/mfds-recipes/mfds-recipe-card";
import { MfdsRecipe } from "@/types/mfds-recipe";

export const metadata = {
  title: "식약처 레시피 | 맛의 아카이브",
  description: "식약처에서 제공하는 공식 레시피를 확인하세요",
};

// 동적 데이터를 사용하므로 빌드 시 정적 생성 건너뛰기
export const dynamic = 'force-dynamic';

export default function MfdsRecipesPage() {
  console.group("[MfdsRecipesPage] 레시피 목록 로드 시작");
  
  let recipes: MfdsRecipe[] = [];
  try {
    recipes = loadAllRecipes();
    console.log(`[MfdsRecipesPage] 레시피 ${recipes.length}개 로드됨`);
    if (recipes.length > 0) {
      console.log(`[MfdsRecipesPage] 첫 번째 레시피:`, recipes[0].title);
    }
  } catch (error) {
    console.error(`[MfdsRecipesPage] 레시피 로드 실패:`, error);
    if (error instanceof Error) {
      console.error(`[MfdsRecipesPage] 에러 메시지:`, error.message);
      console.error(`[MfdsRecipesPage] 스택:`, error.stack);
    }
    recipes = [];
  }
  
  console.groupEnd();

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">식약처 레시피</h1>
          <p className="text-muted-foreground">
            식약처에서 제공하는 공식 레시피를 확인하고 요리를 시작하세요
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 p-12 text-center">
            <p className="text-muted-foreground">
              레시피를 준비 중입니다.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <MfdsRecipeCard key={recipe.frontmatter.rcp_seq} recipe={recipe} />
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

