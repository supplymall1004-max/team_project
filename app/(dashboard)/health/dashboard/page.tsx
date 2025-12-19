/**
 * @file app/(dashboard)/health/dashboard/page.tsx
 * @description 건강 정보 통합 대시보드 페이지
 *
 * 사용자의 건강 정보를 종합적으로 보여주는 대시보드입니다.
 * - 건강 프로필 요약
 * - 가족 구성원 건강 상태
 * - 최근 건강 기록 (병원, 약물, 검진)
 * - 예방주사 일정 및 알림
 * - 건강 데이터 동기화 상태
 */

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  User,
  Calendar,
  Activity,
  RefreshCw,
  Settings,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import Link from "next/link";
import { HealthDashboard } from "@/components/health/dashboard/HealthDashboard";
import { FamilyHealthOverview } from "@/components/health/family-health-overview";
import { VaccinationLifecycleCalendar } from "@/components/health/vaccination-lifecycle-calendar";
import { VaccinationNotificationSettings } from "@/components/health/vaccination-notification-settings";
import { LoadingSpinner } from "@/components/loading-spinner";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  // 프리미엄 체크
  const premiumCheck = await checkPremiumAccess();
  const isPremium = premiumCheck.isPremium;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">건강 관리 대시보드</h1>
          <p className="text-gray-600 mt-2">
            건강 정보를 종합적으로 관리하고 모니터링하세요
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/health/profile">
              <Settings className="w-4 h-4 mr-2" />
              건강 프로필
            </Link>
          </Button>

          {isPremium && (
            <Button variant="outline" asChild>
              <Link href="/health/data-sources">
                <RefreshCw className="w-4 h-4 mr-2" />
                데이터 연동
              </Link>
            </Button>
          )}

          <Button asChild>
            <Link href="/health/profile">
              <Plus className="w-4 h-4 mr-2" />
              건강 정보 추가
            </Link>
          </Button>
        </div>
      </div>

      {/* 건강 상태 개요 카드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">건강 점수</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">
              +2.5 지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">가족 구성원</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              모두 건강 관리 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예방주사 일정</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
            <p className="text-xs text-muted-foreground">
              이번 달 예정
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">데이터 동기화</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm font-medium">최신</div>
                <p className="text-xs text-muted-foreground">
                  2시간 전 동기화
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 대시보드 탭 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">건강 개요</TabsTrigger>
          <TabsTrigger value="family">가족 건강</TabsTrigger>
          <TabsTrigger value="vaccinations">예방주사</TabsTrigger>
          <TabsTrigger value="settings">알림 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<LoadingSpinner />}>
            <HealthDashboard mode="summary" />
          </Suspense>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <Suspense fallback={<LoadingSpinner />}>
            <FamilyHealthOverview />
          </Suspense>
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-4">
          <VaccinationLifecycleCalendar
            userId={premiumCheck.userId || ""}
            familyMembers={[
              { id: "user", name: "나" },
              { id: "family1", name: "배우자" },
              { id: "family2", name: "자녀" },
            ]}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <VaccinationNotificationSettings />
        </TabsContent>
      </Tabs>

      {/* 빠른 액션 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-blue-500" />
              건강 기록 추가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              병원 방문, 약물 복용, 건강검진 결과를 직접 입력하세요.
            </p>
            <Button size="sm" asChild>
              <Link href="/health/profile">기록 추가하기</Link>
            </Button>
          </CardContent>
        </Card>

        {isPremium && (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  데이터 동기화
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  마이데이터나 건강정보고속도로에서 최신 건강 정보를 가져옵니다.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/health/data-sources">동기화하기</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  건강 알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  예방주사 일정, 약물 복용 시간 등 건강 관련 알림을 설정하세요.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="#settings">알림 설정</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-purple-500" />
              건강 검진 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              국가건강검진, 종합건강검진 등 검진 일정을 확인하고 예약하세요.
            </p>
            <Button size="sm" variant="outline">
              일정 확인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HealthDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

