/**
 * @file app/(dashboard)/health/premium/travel-risk/page.tsx
 * @description 여행 위험도 평가 페이지 (프리미엄 전용)
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane } from "lucide-react";
import Link from "next/link";
import { TravelRiskAssessmentForm } from "@/components/health/premium/travel-risk-assessment-form";
import { TravelRiskResult } from "@/components/health/premium/travel-risk-result";
import { PremiumGate } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { LoadingSpinner } from "@/components/loading-spinner";

export const dynamic = "force-dynamic";

async function TravelRiskContent() {
  const subscription = await getCurrentSubscription();
  const isPremium = subscription.isPremium || false;

  return (
    <PremiumGate isPremium={isPremium} variant="banner">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">여행 위험도 평가</h1>
            <p className="text-muted-foreground mt-2">
              여행 목적지의 감염병 위험도를 평가하고 예방 조치를 확인하세요
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/health/premium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              프리미엄 건강 관리로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 평가 폼 및 결과 */}
        <TravelRiskAssessmentForm />
      </div>
    </PremiumGate>
  );
}

export default function TravelRiskPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <LoadingSpinner label="여행 위험도 평가를 불러오는 중..." />
            </div>
          }
        >
          <TravelRiskContent />
        </Suspense>
      </div>
    </div>
  );
}

