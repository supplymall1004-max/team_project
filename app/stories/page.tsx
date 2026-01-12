/**
 * @file app/stories/page.tsx
 * @description 스토리 & 학습 상세 페이지
 *
 * 주요 기능:
 * 1. 장고의 음식 동화, 음식 스토리 통합
 * 2. 탭 네비게이션으로 각 섹션 전환
 * 3. 필터 및 정렬 기능
 */

import { Suspense } from 'react';
import { Section } from '@/components/section';
import { StoriesTabsClient } from './stories-tabs-client';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import { StorybookSection } from '@/components/storybook/storybook-section';
import { FolktaleSectionServer } from '@/components/folktale-stories/folktale-section-server';
import { ReversalSectionServer } from '@/components/reversal-stories/reversal-section-server';
import { EarthSectionServer } from '@/components/earth-stories/earth-section-server';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

export default function StoriesLearningPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📖 스토리 & 학습</h1>
          <p className="text-muted-foreground">
            전통 음식의 탄생과 역사를 동화처럼 들려드립니다
          </p>
        </div>

        <Suspense fallback={<SectionSkeleton />}>
          <StoriesTabsClient
          allContent={
            <>
              {/* 장고의 음식 동화 */}
              <ErrorBoundary>
                <Suspense fallback={<SectionSkeleton />}>
                  <StorybookSection />
                </Suspense>
              </ErrorBoundary>
              {/* 장고의 전래동화 */}
              <ErrorBoundary>
                <Suspense fallback={<SectionSkeleton />}>
                  <FolktaleSectionServer />
                </Suspense>
              </ErrorBoundary>
              {/* 장고의 반전동화 */}
              <ErrorBoundary>
                <Suspense fallback={<SectionSkeleton />}>
                  <ReversalSectionServer />
                </Suspense>
              </ErrorBoundary>
              {/* 장고의 지구동화 */}
              <ErrorBoundary>
                <Suspense fallback={<SectionSkeleton />}>
                  <EarthSectionServer />
                </Suspense>
              </ErrorBoundary>
            </>
          }
          storybookContent={
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <StorybookSection />
              </Suspense>
            </ErrorBoundary>
          }
          folktaleContent={
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <FolktaleSectionServer />
              </Suspense>
            </ErrorBoundary>
          }
          reversalContent={
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <ReversalSectionServer />
              </Suspense>
            </ErrorBoundary>
          }
          earthContent={
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <EarthSectionServer />
              </Suspense>
            </ErrorBoundary>
          }
          />
        </Suspense>
      </Section>
    </div>
  );
}

