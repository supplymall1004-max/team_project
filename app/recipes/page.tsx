/**
 * @file recipes/page.tsx
 * @description 레시피 목록 페이지 (Server Component)
 *
 * 주요 기능:
 * 1. 레시피 목록 표시 (카드 그리드)
 * 2. 필터링 및 검색 기능
 * 3. 정렬 기능
 * 4. 탭 네비게이션 (전체, 현대 레시피, 궁중, 식약처, 이유식, 죽, 특수, 비건)
 */

// 동적 렌더링 설정: 빌드 타임에 정적 생성하지 않고 런타임에 렌더링
// 정적 파일 기반 시스템 사용
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Section } from '@/components/section';
import { RecipeTabsClient } from '@/app/archive/recipes/recipe-tabs-client';
import { RecipeSectionServer } from '@/app/archive/recipes/recipe-section-server';
import { RoyalRecipesQuickAccess } from '@/components/royal-recipes/royal-recipes-quick-access';
import { BabyRecipeNotice } from '@/components/baby-recipes/baby-recipe-notice';
import { BabyRecipeList } from '@/components/baby-recipes/baby-recipe-list';
import { GruelRecipeList } from '@/components/gruel-recipes/gruel-recipe-list';
import { SpecialRecipeList } from '@/components/special-recipes/special-recipe-list';
import { VeganRecipeList } from '@/components/vegan-recipes/vegan-recipe-list';
import { MfdsRecipeSection } from '@/components/mfds-recipes/mfds-recipe-section';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingSpinner } from '@/components/loading-spinner';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

// Server Component로 각 탭 콘텐츠를 직접 렌더링
function AllTabContent() {
  return (
    <div className="space-y-8">
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RecipeSectionServer />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <RoyalRecipesQuickAccess id="royal-recipes" />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <BabyRecipeNotice />
          <BabyRecipeList />
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <GruelRecipeList />
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <SpecialRecipeList />
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="space-y-6">
          <VeganRecipeList />
        </div>
      </ErrorBoundary>
    </div>
  );
}

function ModernTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <RecipeSectionServer />
      </Suspense>
    </ErrorBoundary>
  );
}

function RoyalTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <RoyalRecipesQuickAccess id="royal-recipes" />
      </Suspense>
    </ErrorBoundary>
  );
}

function MfdsTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <MfdsRecipeSection />
      </Suspense>
    </ErrorBoundary>
  );
}

function BabyTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <BabyRecipeNotice />
        <BabyRecipeList />
      </div>
    </ErrorBoundary>
  );
}

function GruelTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <GruelRecipeList />
      </div>
    </ErrorBoundary>
  );
}

function SpecialTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SpecialRecipeList />
      </div>
    </ErrorBoundary>
  );
}

function VeganTabContent() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <VeganRecipeList />
      </div>
    </ErrorBoundary>
  );
}

export const metadata = {
  title: "레시피 아카이브 | 맛의 아카이브",
  description: "다양한 레시피를 검색하고 탐색해보세요",
};

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">레시피 아카이브</h1>
          <p className="text-muted-foreground">
            다양한 레시피를 검색하고 탐색해보세요
          </p>
        </div>

        <RecipeTabsClient
          allContent={<AllTabContent />}
          modernContent={<ModernTabContent />}
          royalContent={<RoyalTabContent />}
          mfdsContent={<MfdsTabContent />}
          babyContent={<BabyTabContent />}
          gruelContent={<GruelTabContent />}
          specialContent={<SpecialTabContent />}
          veganContent={<VeganTabContent />}
        />
      </Section>
    </div>
  );
}

