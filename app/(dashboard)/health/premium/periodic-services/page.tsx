/**
 * @file app/(dashboard)/health/premium/periodic-services/page.tsx
 * @description 주기적 건강 관리 서비스 페이지 (프리미엄 전용)
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PeriodicServiceCard } from "@/components/health/premium/periodic-service-card";
import { DewormingRecordCard } from "@/components/health/premium/deworming-record-card";
import { NotificationSettingsCard } from "@/components/health/premium/notification-settings-card";
import { PeriodicServicesCalendar } from "@/components/health/premium/periodic-services-calendar";
import { PremiumGate } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { LoadingSpinner } from "@/components/loading-spinner";

export const dynamic = "force-dynamic";

async function PeriodicServicesContent() {
  try {
    console.log("[PeriodicServicesContent] 구독 정보 조회 시작");
    const subscription = await getCurrentSubscription();
    console.log("[PeriodicServicesContent] 구독 정보 조회 완료:", {
      isPremium: subscription.isPremium,
      success: subscription.success,
      error: subscription.error,
    });

    return (
      <PremiumGate isPremium={subscription.isPremium}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/health/premium">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">주기적 건강 관리 서비스</h1>
              <p className="text-muted-foreground">
                예방접종, 건강검진, 구충제 등 주기적 서비스를 통합 관리하세요
              </p>
            </div>
          </div>

          {/* 통합 캘린더 뷰 */}
          <PeriodicServicesCalendar />

          <div className="grid gap-6 md:grid-cols-2">
            <PeriodicServiceCard />
            <DewormingRecordCard />
          </div>

          <NotificationSettingsCard />
        </div>
      </PremiumGate>
    );
  } catch (error) {
    console.error("[PeriodicServicesContent] 에러 발생:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>오류가 발생했습니다</CardTitle>
          <CardDescription>
            페이지를 불러오는 중 문제가 발생했습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
          </p>
        </CardContent>
      </Card>
    );
  }
}

export default function PeriodicServicesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <Suspense fallback={<LoadingSpinner />}>
        <PeriodicServicesContent />
      </Suspense>
    </div>
  );
}

