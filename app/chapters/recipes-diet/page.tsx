/**
 * @file app/chapters/recipes-diet/page.tsx
 * @description 챕터 1: 레시피 & 식단 아카이브 전체 페이지
 *
 * 주요 기능:
 * 1. 현대 레시피, 궁중 레시피, 건강 맞춤 식단, 주간 식단, 마카의 음식 동화 통합
 * 2. 탭 네비게이션으로 각 섹션 전환
 * 3. 건강 시각화 대시보드 포함
 */

import { Suspense } from 'react';
import { Section } from '@/components/section';
import { RecipeSection } from '@/components/recipes/recipe-section';
import { RoyalRecipesQuickAccess } from '@/components/royal-recipes/royal-recipes-quick-access';
import { DietSection } from '@/components/health/diet-section';
import { StorybookSection } from '@/components/storybook/storybook-section';
import { LazyWeeklyDietSummary } from '@/components/home/lazy-sections';
import { HealthVisualizationPreview } from '@/components/home/health-visualization-preview';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

export const metadata = {
  title: '레시피 & 식단 아카이브 | 맛의 아카이브',
  description: '현대 레시피부터 전통 궁중 레시피, 건강 맞춤 식단까지 모든 요리 지식을 한 곳에서',
};

export default function Chapter1Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📚 챕터 1: 레시피 & 식단 아카이브</h1>
          <p className="text-muted-foreground">
            현대 레시피부터 전통 궁중 레시피, 건강 맞춤 식단까지 모든 요리 지식을 한 곳에서
          </p>
        </div>

        {/* 건강 시각화 대시보드 */}
        <div className="mb-8">
          <ErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">💚 건강 시각화 대시보드</h2>
                <HealthVisualizationPreview compact={false} />
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* 현대 레시피 */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <RecipeSection />
          </Suspense>
        </ErrorBoundary>

        {/* 궁중 레시피 */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <RoyalRecipesQuickAccess id="royal-recipes" />
          </Suspense>
        </ErrorBoundary>

        {/* 건강 맞춤 식단 */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <DietSection />
          </Suspense>
        </ErrorBoundary>

        {/* 주간 식단 */}
        <ErrorBoundary>
          <LazyWeeklyDietSummary />
        </ErrorBoundary>

        {/* 마카의 음식 동화 */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <StorybookSection />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

