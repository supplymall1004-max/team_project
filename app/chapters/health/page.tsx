/**
 * @file app/chapters/health/page.tsx
 * @description 챕터 2: 건강 관리 현황 전체 페이지
 *
 * 주요 기능:
 * 1. 가족 건강 대시보드
 * 2. 건강 트렌드 차트
 * 3. 건강 알림 및 권장사항
 * 4. 건강 목표 추적
 * 5. 건강 시각화 대시보드
 */

import { Suspense } from 'react';
import { Section } from '@/components/section';
import { HealthDashboardWrapper } from '@/components/health/health-dashboard-wrapper';
import { HealthVisualizationPreview } from '@/components/home/health-visualization-preview';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Activity, Heart, Bell, Target } from 'lucide-react';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

export const metadata = {
  title: '건강 관리 현황 | 맛의 아카이브',
  description: '가족 건강을 한눈에 확인하고 관리하세요',
};

export default function Chapter2Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">💚 챕터 2: 건강 관리 현황</h1>
          <p className="text-muted-foreground">
            가족 건강을 한눈에 확인하고 관리하세요
          </p>
        </div>

        {/* 건강 시각화 대시보드 */}
        <div className="mb-8">
          <ErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <div className="rounded-xl border border-green-200 bg-green-50/30 p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">💚 건강 시각화 대시보드</h2>
                <HealthVisualizationPreview compact={false} />
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* 건강 대시보드 */}
        <ErrorBoundary>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">👨‍👩‍👧‍👦 가족 건강 대시보드</h2>
            <HealthDashboardWrapper />
          </div>
        </ErrorBoundary>

        {/* 건강 트렌드 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                📊 건강 트렌드
              </CardTitle>
              <CardDescription>체중, 활동량, 영양 섭취 추이 확인</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                최근 3개월 건강 데이터 차트를 확인하세요
              </p>
              <Button asChild variant="outline">
                <Link href="/health/dashboard">
                  상세보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 건강 알림 및 권장사항 */}
        <div className="mb-8">
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
                <p className="text-sm text-muted-foreground">• 예방접종 예정일</p>
                <p className="text-sm text-muted-foreground">• 건강검진 권장일</p>
                <p className="text-sm text-muted-foreground">• 약물 복용 알림</p>
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/health/dashboard">
                  더보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 건강 목표 추적 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                🎯 건강 목표 추적
              </CardTitle>
              <CardDescription>건강 목표 달성률 확인</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">75%</span>
                  <span className="text-sm text-muted-foreground">진행 중</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  주간 목표 진행 상황을 확인하세요
                </p>
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/health/dashboard">
                  상세보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 건강 인사이트 */}
        <div className="mb-8">
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
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/health/dashboard">
                  더보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}

