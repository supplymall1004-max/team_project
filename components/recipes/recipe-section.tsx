/**
 * @file recipe-section.tsx
 * @description 홈페이지 레시피 북 섹션 (Section B)
 *
 * 주요 기능:
 * 1. 인기 레시피 목록 표시
 * 2. 레시피 카드 그리드
 * 3. 더보기 버튼
 */

import Link from "next/link";
import { Section } from "@/components/section";
import { RecipeCard } from "./recipe-card";
import { Button } from "@/components/ui/button";
import { getRecipes } from "@/lib/recipes/queries";
import { RecipeListItem } from "@/types/recipe";

export async function RecipeSection() {
  // 인기 레시피 조회 (최신순, 최대 6개)
  // limit을 쿼리 레벨에서 적용하여 성능 최적화
  let featuredRecipes: RecipeListItem[] = [];
  
  try {
    featuredRecipes = await getRecipes(
      {
        searchTerm: "",
        difficulty: [],
        maxCookingTime: null,
        sortBy: "newest",
      },
      { limit: 6 }
    );
  } catch (error) {
    console.error("[RecipeSection] 레시피 조회 실패:", error);
    // 에러 발생 시 빈 배열로 처리하여 페이지가 계속 로드되도록 함
    featuredRecipes = [];
  }

  return (
    <Section id="recipes" title="🍴 현대 레시피 북" description="별점과 난이도로 정리된 최신 레시피를 확인해보세요">
      <div className="space-y-6">
        {featuredRecipes.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
            <div className="flex justify-center">
              <Button size="lg" asChild>
                <Link href="/recipes">레시피 북 전체 보기</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>아직 등록된 레시피가 없습니다.</p>
            <Button size="lg" asChild className="mt-4">
              <Link href="/recipes/new">첫 레시피 업로드하기</Link>
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

