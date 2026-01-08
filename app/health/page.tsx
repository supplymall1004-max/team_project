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
import { HealthDashboardWrapper } from '@/components/health/dashboard/HealthDashboardWrapper';
import { HealthVisualizationPreview } from '@/components/home/health-visualization-preview';
import { LifecycleNotificationGrid } from '@/components/health/lifecycle-notification-grid';
import { HealthComprehensiveTab } from '@/components/health/comprehensive/health-comprehensive-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import Link from 'next/link';
import { Activity, FileText, Camera, Sparkles } from 'lucide-react';

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-6 text-foreground gap-1 h-auto min-h-9 p-1">
            <TabsTrigger 
              value="dashboard" 
              className="text-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              대시보드
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="text-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              건강 프로필
            </TabsTrigger>
            <TabsTrigger 
              value="family" 
              className="text-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              가족 건강
            </TabsTrigger>
            <TabsTrigger 
              value="pets" 
              className="text-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:via-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:font-bold"
            >
              반려동물 건강
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="text-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              건강 기록
            </TabsTrigger>
            <TabsTrigger
              value="comprehensive"
              className="text-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              종합
            </TabsTrigger>
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

            {/* 생애주기별 건강 알림 */}
            <ErrorBoundary>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">🔔 생애주기별 건강 알림</h2>
                <Suspense fallback={<SectionSkeleton />}>
                  <LifecycleNotificationGrid />
                </Suspense>
              </div>
            </ErrorBoundary>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    📝 건강 기록
                  </CardTitle>
                  <CardDescription>건강검진, 약물, 활동량 기록 관리</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/health/medication-records">
                        <FileText className="mr-2 h-4 w-4" />
                        약물 복용 기록
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/health/hospital-records">
                        <FileText className="mr-2 h-4 w-4" />
                        병원 기록
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/health/disease-records">
                        <FileText className="mr-2 h-4 w-4" />
                        질병 기록
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Camera className="h-5 w-5" />
                    📸 식사 사진 분석
                  </CardTitle>
                  <CardDescription>AI로 식사 사진을 분석하고 영양소를 추적하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      식사 사진을 업로드하면 AI가 자동으로 음식을 인식하고 영양소를 계산합니다.
                    </p>
                    <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                      <Link href="/diet?tab=records">
                        <Camera className="mr-2 h-4 w-4" />
                        식사 사진 분석하기
                      </Link>
                    </Button>
                    <div className="pt-2 border-t border-green-200">
                      <p className="text-xs text-green-700 font-medium mb-2">주요 기능:</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        <li>• AI 기반 음식 인식</li>
                        <li>• 자동 영양소 계산</li>
                        <li>• 건강 식단과 비교</li>
                        <li>• 일주일간 영양소 분석</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🐾</span>
                  반려동물 건강
                </CardTitle>
                <CardDescription>반려동물 생애주기별 건강 관리 및 백신 추적</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    반려동물의 건강을 체계적으로 관리하고, AVMA/AAHA 기준에 따른 생애주기별 건강 이벤트를 추적할 수 있습니다.
                  </p>
                  <Button asChild className="bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 hover:from-orange-500 hover:via-amber-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200">
                    <Link href="/health/pets">반려동물 건강 관리 시작하기</Link>
                  </Button>
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">주요 기능</h4>
                    <ul className="space-y-1 text-sm text-orange-800">
                      <li>• 반려동물 프로필 관리 (강아지/고양이)</li>
                      <li>• 생애주기별 건강 이벤트 자동 매칭</li>
                      <li>• 백신 D-Day 카운트다운</li>
                      <li>• 체중 변화 그래프 시각화</li>
                      <li>• 건강 검진 일정 관리</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comprehensive" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-emerald-600" />
                  종합 건강 관리
                </h2>
                <p className="text-muted-foreground mt-1">
                  공공 건강정보 + 웨어러블 데이터를 연결하고, 대시보드·기록·시각화에 자동 반영합니다.
                </p>
              </div>
            </div>

            <ErrorBoundary>
              <HealthComprehensiveTab />
            </ErrorBoundary>
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

