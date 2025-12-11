/**
 * @file recipe-archive-preview.tsx
 * @description 레시피 아카이브 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 현대 레시피, 궁중 레시피, 식약처 레시피 미리보기
 * 2. 각 카테고리별 대표 레시피 2-3개 표시
 * 3. 전체보기 링크 제공
 */

import Link from 'next/link';
import { Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { RecipeSection } from '@/components/recipes/recipe-section';
import { RoyalRecipesQuickAccess } from '@/components/royal-recipes/royal-recipes-quick-access';
import { MfdsRecipeSection } from '@/components/home/mfds-recipe-section';

export async function RecipeArchivePreview() {
  console.log("[RecipeArchivePreview] 메인 페이지 레시피 아카이브 미리보기 시작");

  return (
    <div className="space-y-8 bg-orange-50/50 py-12">
      <Section
        id="recipe-archive"
        title="📚 레시피 아카이브"
        description="현대부터 전통까지, 모든 요리 지식을 한 곳에서"
      >
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
            <Link href="/archive/recipes">
              레시피 아카이브 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* 현대 레시피 */}
      <RecipeSection />

      {/* 궁중 레시피 */}
      <RoyalRecipesQuickAccess id="royal-recipes-preview" />

      {/* 식약처 레시피 */}
      <MfdsRecipeSection />
    </div>
  );
}

