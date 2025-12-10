/**
 * @file app/stories/page.tsx
 * @description 스토리 & 학습 상세 페이지
 *
 * 주요 기능:
 * 1. 마카의 음식 동화, 음식 스토리 통합
 * 2. 탭 네비게이션으로 각 섹션 전환
 * 3. 필터 및 정렬 기능
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Section } from '@/components/section';
import { StorybookSection } from '@/components/storybook/storybook-section';
import { FoodStoriesSection } from '@/components/food-stories/food-stories-section';
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

function StoriesLearningContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📖 스토리 & 학습</h1>
          <p className="text-muted-foreground">
            전통 음식의 탄생과 역사를 동화처럼 들려드립니다
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="storybook">마카의 음식 동화</TabsTrigger>
            <TabsTrigger value="food-stories">음식 스토리</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {/* 마카의 음식 동화 */}
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <StorybookSection />
              </Suspense>
            </ErrorBoundary>

            {/* 음식 스토리 */}
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <FoodStoriesSection />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="storybook">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <StorybookSection />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="food-stories">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <FoodStoriesSection />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

export default function StoriesLearningPage() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <StoriesLearningContent />
    </Suspense>
  );
}

