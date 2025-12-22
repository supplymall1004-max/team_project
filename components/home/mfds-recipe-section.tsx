/**
 * @file mfds-recipe-section.tsx
 * @description 홈페이지 식약처 레시피 섹션
 *
 * 주요 기능:
 * 1. 식약처 API를 통한 레시피 목록 표시 (최대 6개)
 * 2. 레시피 카드 그리드
 * 3. 더보기 버튼
 */

import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { getMfdsRecipeList, parseNutritionInfo, type RecipeItem } from "@/lib/services/mfds-recipe-api";

export async function MfdsRecipeSection() {
  // 식약처 레시피 조회 (최대 6개)
  let featuredRecipes: RecipeItem[] = [];
  
  try {
    console.log("[MfdsRecipeSection] 식약처 레시피 조회 시작");
    featuredRecipes = await getMfdsRecipeList(1, 6);
    console.log("[MfdsRecipeSection] 레시피 조회 완료:", featuredRecipes.length, "개");
  } catch (error) {
    console.error("[MfdsRecipeSection] 레시피 조회 실패:", error);
    // 에러 발생 시 빈 배열로 처리하여 페이지가 계속 로드되도록 함
    featuredRecipes = [];
  }

  const sectionTitle = "🍽️ 식약처 레시피 아카이브";
  const sectionDescription = "식품의약품안전처에서 제공하는 공식 레시피를 확인해보세요";

  return (
    <Section id="mfds-recipes" title={sectionTitle} description={sectionDescription} inTabs>
      <div className="space-y-4 sm:space-y-6">
        {featuredRecipes.length > 0 ? (
          <>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredRecipes.map((recipe) => {
                const nutrition = parseNutritionInfo(recipe);
                const mainImage = recipe.ATT_FILE_NO_MAIN || recipe.ATT_FILE_NO_MK || "";
                const firstStepImage = recipe.MANUAL_IMG01 || "";

                return (
                  <Link
                    key={recipe.RCP_SEQ}
                    href={`/recipes/mfds/${recipe.RCP_SEQ}`}
                    className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative h-48 w-full bg-gray-200">
                      {mainImage ? (
                        <Image
                          src={mainImage}
                          alt={recipe.RCP_NM}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : firstStepImage ? (
                        <Image
                          src={firstStepImage}
                          alt={recipe.RCP_NM}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {recipe.RCP_NM}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">칼로리:</span>
                          <span className="text-blue-600 font-semibold">
                            {nutrition.calories.toFixed(0)} kcal
                          </span>
                        </div>
                        {recipe.RCP_PAT2 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {recipe.RCP_PAT2}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Button size="default" asChild className="sm:h-11">
                <Link href="/recipes/mfds">식약처 레시피 전체 보기</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 sm:py-12 text-center text-muted-foreground">
            <p className="text-sm sm:text-base">레시피를 불러오는 중입니다...</p>
          </div>
        )}
      </div>
    </Section>
  );
}















