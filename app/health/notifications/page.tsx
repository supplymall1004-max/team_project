/**
 * @file app/health/notifications/page.tsx
 * @description 알림 센터 페이지
 * 
 * 모든 가족 구성원의 생애주기별 건강 알림을 통합 관리하는 페이지입니다.
 */

'use client';

import { Suspense } from 'react';
import { Section } from '@/components/section';
import { LifecycleNotificationGrid } from '@/components/health/lifecycle-notification-grid';
import { LifecycleNotificationStats } from '@/components/health/lifecycle-notification-stats';
import { GamificationDisplay } from '@/components/health/gamification-display';
import { LifecycleNotificationReminderSettings } from '@/components/health/lifecycle-notification-reminder-settings';
import { LifecycleNotificationHistory } from '@/components/health/lifecycle-notification-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import { ArrowLeft, Bell, Filter, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

function NotificationCenterContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const priority = searchParams.get('priority') || undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/health">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">🔔 건강 알림 센터</h1>
          <p className="text-muted-foreground">
            가족 구성원의 생애주기별 건강 알림을 한눈에 확인하고 관리하세요
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="high">High 우선순위</TabsTrigger>
            <TabsTrigger value="pending">대기 중</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <LifecycleNotificationGrid />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="high" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <LifecycleNotificationGrid priority="high" />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <LifecycleNotificationGrid />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LifecycleNotificationStats />
                  <GamificationDisplay />
                </div>
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <LifecycleNotificationHistory />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <LifecycleNotificationReminderSettings />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

export default function NotificationCenterPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <NotificationCenterContent />
      </Suspense>
    </ErrorBoundary>
  );
}

