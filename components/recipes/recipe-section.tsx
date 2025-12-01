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
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";

export async function RecipeSection() {
  // 섹션 콘텐츠 조회
  const sectionContent = await getMultipleCopyContent([
    "recipe-section-title",
    "recipe-section-description",
    "recipe-section-button",
  ]);

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

  const sectionTitle =
    sectionContent["recipe-section-title"]?.content.title || "🍴 현대 레시피 북";
  const sectionDescription =
    sectionContent["recipe-section-description"]?.content.description ||
    "별점과 난이도로 정리된 최신 레시피를 확인해보세요";
  const buttonText =
    sectionContent["recipe-section-button"]?.content.text || "레시피 북 전체 보기";

  return (
    <Section id="recipes" title={sectionTitle} description={sectionDescription}>
      <div className="space-y-4 sm:space-y-6">
        {featuredRecipes.length > 0 ? (
          <>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
            <div className="flex justify-center">
              <Button size="default" asChild className="sm:h-11">
                <Link href="/recipes">{buttonText}</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 sm:py-12 text-center text-muted-foreground">
            <p className="text-sm sm:text-base">아직 등록된 레시피가 없습니다.</p>
            <Button size="default" asChild className="mt-3 sm:mt-4">
              <Link href="/recipes/new">첫 레시피 업로드하기</Link>
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

