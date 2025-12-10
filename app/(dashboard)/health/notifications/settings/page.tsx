/**
 * @file app/(dashboard)/health/notifications/settings/page.tsx
 * @description 통합 건강 알림 설정 페이지
 *
 * 사용자가 모든 건강 관련 알림을 통합적으로 설정할 수 있는 페이지입니다.
 * - 예방주사 알림 설정
 * - 약물 복용 알림 설정
 * - 건강검진 알림 설정
 * - 병원 진료 알림 설정
 * - 가족 구성원별 알림 설정
 */

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Pill, Calendar, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { UnifiedNotificationSettings } from "@/components/health/unified-notification-settings";
import { FamilyNotificationSettings } from "@/components/health/family-notification-settings";
import { LoadingSpinner } from "@/components/loading-spinner";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";

export const dynamic = "force-dynamic";

async function NotificationSettingsContent() {
  // 프리미엄 체크
  const premiumCheck = await checkPremiumAccess();
  const isPremium = premiumCheck.isPremium;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">건강 알림 설정</h1>
          <p className="text-muted-foreground mt-2">
            건강 관리에 필요한 모든 알림을 설정하세요
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/health/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 알림 종류 개요 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예방주사 알림</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">활성</div>
            <p className="text-xs text-muted-foreground">
              생애주기별 접종 일정
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">약물 복용 알림</CardTitle>
            <Pill className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">활성</div>
            <p className="text-xs text-muted-foreground">
              복용 시간 및 재처방 알림
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">건강검진 알림</CardTitle>
            <Stethoscope className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{isPremium ? "활성" : "프리미엄"}</div>
            <p className="text-xs text-muted-foreground">
              정기 검진 및 결과 알림
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">가족 알림</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">활성</div>
            <p className="text-xs text-muted-foreground">
              가족 구성원별 맞춤 알림
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 알림 설정 탭 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 통합 알림 설정 */}
        <div className="lg:col-span-2">
          <UnifiedNotificationSettings />
        </div>

        {/* 가족별 알림 설정 */}
        <div>
          <FamilyNotificationSettings />
        </div>
      </div>

      {/* 알림 기록 및 테스트 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              최근 알림 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">김민준 인플루엔자 예방접종</p>
                  <p className="text-sm text-gray-600">예정일 3일 전 알림</p>
                  <p className="text-xs text-gray-500">2024-12-08</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Pill className="w-4 h-4 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">김철수 혈압약 복용</p>
                  <p className="text-sm text-gray-600">오전 9시 복용 알림</p>
                  <p className="text-xs text-gray-500">2024-12-08</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Stethoscope className="w-4 h-4 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">김영희 건강검진 결과</p>
                  <p className="text-sm text-gray-600">검진 결과 확인 알림</p>
                  <p className="text-xs text-gray-500">2024-12-07</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href="/health/notifications/history">
                  전체 알림 기록 보기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              알림 테스트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              설정한 알림이 제대로 작동하는지 테스트해보세요.
            </p>

            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full">
                📱 푸시 알림 테스트
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                📧 이메일 알림 테스트
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                📱 앱 내 알림 테스트
              </Button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>알림 권한:</strong> 브라우저 알림 권한이 필요합니다.
                <Button size="sm" variant="link" className="p-0 h-auto text-yellow-800 underline">
                  권한 설정하기
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 알림 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 통계</CardTitle>
          <p className="text-sm text-gray-600">
            이번 달 알림 발송 현황을 확인하세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <p className="text-sm text-gray-600">총 알림 발송</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">22</div>
              <p className="text-sm text-gray-600">성공 발송</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">2</div>
              <p className="text-sm text-gray-600">실패 발송</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <p className="text-sm text-gray-600">성공률</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HealthNotificationsSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <NotificationSettingsContent />
      </Suspense>
    </div>
  );
}

