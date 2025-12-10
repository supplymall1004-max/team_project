/**
 * @file app/archive/recipes/page.tsx
 * @description 레시피 아카이브 상세 페이지
 *
 * 주요 기능:
 * 1. 현대 레시피, 궁중 레시피, 식약처 레시피 통합
 * 2. 탭 네비게이션으로 각 섹션 전환
 * 3. 필터 및 정렬 기능
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Section } from '@/components/section';
import { RecipeSection } from '@/components/recipes/recipe-section';
import { RoyalRecipesQuickAccess } from '@/components/royal-recipes/royal-recipes-quick-access';
import { MfdsRecipeSection } from '@/components/home/mfds-recipe-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

function RecipeArchiveContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📚 레시피 아카이브</h1>
          <p className="text-muted-foreground">
            현대부터 전통까지, 모든 요리 지식을 한 곳에서
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="modern">현대 레시피</TabsTrigger>
            <TabsTrigger value="royal">궁중 레시피</TabsTrigger>
            <TabsTrigger value="mfds">식약처 레시피</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
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

            {/* 식약처 레시피 */}
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <MfdsRecipeSection />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="modern">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <RecipeSection />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="royal">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <RoyalRecipesQuickAccess id="royal-recipes" />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="mfds">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <MfdsRecipeSection />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

export default function RecipeArchivePage() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <RecipeArchiveContent />
    </Suspense>
  );
}

