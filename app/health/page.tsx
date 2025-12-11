/**
 * @file app/health/page.tsx
 * @description 건강 관리 상세 페이지
 *
 * 주요 기능:
 * 1. 건강 대시보드, 건강 프로필, 가족 건강, 건강 기록, 건강 인사이트 통합
 * 2. 탭 네비게이션으로 각 섹션 전환
 * 3. 건강 시각화 대시보드 포함
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Section } from '@/components/section';
import { HealthDashboardWrapper } from '@/components/health/health-dashboard-wrapper';
import { HealthVisualizationPreview } from '@/components/home/health-visualization-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import Link from 'next/link';
import { ArrowRight, Activity, Heart, Bell, Target, FileText } from 'lucide-react';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

function HealthManagementContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">💚 건강 관리</h1>
          <p className="text-muted-foreground">
            가족 건강을 한눈에 확인하고 관리하세요
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="profile">건강 프로필</TabsTrigger>
            <TabsTrigger value="family">가족 건강</TabsTrigger>
            <TabsTrigger value="records">건강 기록</TabsTrigger>
            <TabsTrigger value="insights">건강 인사이트</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* 건강 대시보드 */}
            <ErrorBoundary>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">👨‍👩‍👧‍👦 가족 건강 대시보드</h2>
                <HealthDashboardWrapper />
              </div>
            </ErrorBoundary>

            {/* 건강 시각화 대시보드 */}
            <ErrorBoundary>
              <div className="rounded-xl border border-green-200 bg-green-50/30 p-6">
                <h2 className="text-2xl font-bold mb-4">💚 건강 시각화 대시보드</h2>
                <HealthVisualizationPreview compact={false} />
              </div>
            </ErrorBoundary>

            {/* 건강 트렌드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  📊 건강 트렌드
                </CardTitle>
                <CardDescription>체중, 활동량, 영양 섭취 추이 확인</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">차트 영역 (개발 예정)</span>
                </div>
              </CardContent>
            </Card>

            {/* 건강 알림 및 권장사항 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  🔔 건강 알림 및 권장사항
                </CardTitle>
                <CardDescription>예방접종, 건강검진, 약물 복용 알림</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">• 예방접종 예정일: 할머니 독감 예방접종 (2025.02.15)</p>
                  <p className="text-sm">• 건강검진 권장일: 아빠 정기 건강검진 (2025.02.20)</p>
                  <p className="text-sm">• 약물 복용 알림: 할머니 혈압약 오전 9시 (완료 ✓)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>👤 건강 프로필</CardTitle>
                <CardDescription>기본 건강 정보 입력 및 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/health/profile">건강 프로필 관리</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>👨‍👩‍👧‍👦 가족 건강</CardTitle>
                <CardDescription>가족 구성원별 건강 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/settings/family">가족 관리</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  📝 건강 기록
                </CardTitle>
                <CardDescription>건강검진, 약물, 활동량, 영양 기록 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  건강 기록을 추가하고 관리할 수 있습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  (기능 개발 예정)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  💡 건강 인사이트
                </CardTitle>
                <CardDescription>개인화된 건강 개선 추천사항</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 운동 부족: 주 3회 이상 운동을 권장합니다</li>
                  <li>• 영양 균형: 단백질 섭취를 늘려보세요</li>
                  <li>• 수면 개선: 취침 시간을 30분 앞당겨보세요</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

export default function HealthManagementPage() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <HealthManagementContent />
    </Suspense>
  );
}

