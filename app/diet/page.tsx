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
import { PremiumRequiredMessage } from '@/components/premium/premium-required-message';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import { getCurrentSubscription } from '@/actions/payments/get-subscription';
import type { UserHealthProfile } from '@/types/health';
import { MealRecordsTab } from '@/components/health/diet/meal-records-tab';

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
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoadingPremium, setIsLoadingPremium] = useState(true);

  // 프리미엄 체크
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const result = await getCurrentSubscription();
        setIsPremium(result.isPremium || false);
      } catch (error) {
        console.error('[DietManagement] 프리미엄 체크 실패:', error);
        setIsPremium(false);
      } finally {
        setIsLoadingPremium(false);
      }
    };

    checkPremium();
  }, []);

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

  // 프리미엄 체크 중이면 로딩 표시
  if (isLoadingPremium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // 프리미엄이 아니면 안내 메시지 표시
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <PremiumRequiredMessage
          title="건강맞춤식단은 프리미엄 회원 전용입니다"
          message="AI 기반 개인 맞춤 식단을 이용하시려면 프리미엄 구독이 필요합니다."
          featureName="건강맞춤식단"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Section className="pt-6 sm:pt-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 dark:text-foreground">🍽️ 식단 관리</h1>
          <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground">
            AI 기반 개인 맞춤 식단으로 건강한 식생활을 시작하세요
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 h-auto p-1">
            <TabsTrigger value="today" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4">오늘의 식단</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4">주간 식단</TabsTrigger>
            <TabsTrigger value="health-guide" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4">건강 맞춤 가이드</TabsTrigger>
            <TabsTrigger value="visualization" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4">건강 시각화</TabsTrigger>
            <TabsTrigger value="records" className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 col-span-2">📸 식사 기록 & 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4 sm:space-y-6">
            <ErrorBoundary>
              <DietSectionClientOnly />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4 sm:space-y-6">
            <ErrorBoundary>
              <LazyWeeklyDietSummary />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="health-guide" className="space-y-4 sm:space-y-6">
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

          <TabsContent value="visualization" className="space-y-4 sm:space-y-6">
            <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">💚 건강 시각화 대시보드</h2>
              <ErrorBoundary>
                <HealthVisualizationPreview compact={false} />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-4 sm:space-y-6">
            <ErrorBoundary>
              <MealRecordsTab />
            </ErrorBoundary>
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
