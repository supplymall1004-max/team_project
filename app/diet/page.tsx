/**
 * @file app/diet/page.tsx
 * @description 식단 관리 상세 페이지
 *
 * 주요 기능:
 * 1. 오늘의 식단, 주간 식단, 건강 시각화, 식단 기록 통합
 * 2. 탭 네비게이션으로 각 섹션 전환
 * 3. 건강 시각화 대시보드 포함
 */

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Section } from '@/components/section';
import { DietSectionClientOnly } from '@/components/health/diet-section';
import { LazyWeeklyDietSummary } from '@/components/home/lazy-sections';
import { HealthVisualizationPreview } from '@/components/home/health-visualization-preview';
import { HealthInfoTabs } from '@/components/diet/health-info-tabs';
import { PremiumDietSummary } from '@/components/diet/premium-diet-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import type { UserHealthProfile } from '@/types/health';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

function DietManagementContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'today';
  const [healthProfile, setHealthProfile] = useState<UserHealthProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 건강 정보 로드
  useEffect(() => {
    const loadHealthProfile = async () => {
      try {
        const response = await fetch('/api/health/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setHealthProfile(data.profile);
          }
        }
      } catch (error) {
        console.error('[DietManagement] 건강 정보 로드 실패:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadHealthProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🍽️ 식단 관리</h1>
          <p className="text-muted-foreground">
            AI 기반 개인 맞춤 식단으로 건강한 식생활을 시작하세요
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="today">오늘의 식단</TabsTrigger>
            <TabsTrigger value="weekly">주간 식단</TabsTrigger>
            <TabsTrigger value="health-guide">건강 맞춤 가이드</TabsTrigger>
            <TabsTrigger value="visualization">건강 시각화</TabsTrigger>
            <TabsTrigger value="records">식단 기록</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <ErrorBoundary>
              <DietSectionClientOnly />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            <ErrorBoundary>
              <LazyWeeklyDietSummary />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="health-guide" className="space-y-6">
            <ErrorBoundary>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <PremiumDietSummary healthProfile={healthProfile} />
                  <HealthInfoTabs healthProfile={healthProfile} />
                </>
              )}
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6">
            <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-6">
              <h2 className="text-2xl font-bold mb-4">💚 건강 시각화 대시보드</h2>
              <ErrorBoundary>
                <HealthVisualizationPreview compact={false} />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <div className="rounded-xl border border-purple-200 bg-white p-6">
              <h2 className="text-xl font-bold mb-4">📝 식단 기록</h2>
              <p className="text-muted-foreground">
                과거 식단 기록을 확인하고 분석할 수 있습니다
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (기능 개발 예정)
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

export default function DietManagementPage() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <DietManagementContent />
    </Suspense>
  );
}
