/**
 * @file app/(dashboard)/health/premium/page.tsx
 * @description KCDC 프리미엄 기능 통합 페이지
 * 
 * 프리미엄 사용자 전용 건강 관리 기능들을 통합하여 제공합니다:
 * - 감염병 위험 지수
 * - 예방접종 기록 및 일정
 * - 여행 위험도 평가
 * - 건강검진 기록 및 권장 일정
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Syringe, Plane, Stethoscope } from "lucide-react";
import Link from "next/link";
import { InfectionRiskCard } from "@/components/health/premium/infection-risk-card";
import { VaccinationRecordCard } from "@/components/health/premium/vaccination-record-card";
import { CheckupRecordCard } from "@/components/health/premium/checkup-record-card";
import { PremiumGate } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { LoadingSpinner } from "@/components/loading-spinner";

export const dynamic = "force-dynamic";

async function PremiumContent() {
  const subscription = await getCurrentSubscription();
  const isPremium = subscription.isPremium || false;

  return (
    <PremiumGate isPremium={isPremium} variant="banner">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">KCDC 프리미엄 건강 관리</h1>
            <p className="text-muted-foreground mt-2">
              질병관리청 데이터 기반 개인 맞춤 건강 관리 서비스
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/health">
              <ArrowLeft className="w-4 h-4 mr-2" />
              건강 관리로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 감염병 위험 지수 */}
          <InfectionRiskCard />

          {/* 예방접종 기록 */}
          <VaccinationRecordCard />

          {/* 건강검진 기록 */}
          <CheckupRecordCard />

          {/* 여행 위험도 평가 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                여행 위험도 평가
              </CardTitle>
              <CardDescription>
                여행 목적지의 감염병 위험도 평가
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>여행 위험도 평가 기능</p>
                <p className="text-sm mt-2">
                  여행 계획을 입력하여 위험도를 평가해보세요.
                </p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/health/premium/travel-risk">
                  평가하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>프리미엄 기능 안내</CardTitle>
            <CardDescription>
              KCDC 프리미엄 기능으로 더 정확한 건강 관리를 받아보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold">감염병 위험 지수</span>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  개인 건강 정보를 기반으로 감염병 위험도를 실시간으로 평가합니다.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-primary" />
                  <span className="font-semibold">예방접종 관리</span>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  예방접종 기록을 관리하고 KCDC 권장 일정을 자동으로 동기화합니다.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" />
                  <span className="font-semibold">여행 위험도 평가</span>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  여행 목적지의 감염병 발생 현황을 조회하고 위험도를 평가합니다.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <span className="font-semibold">건강검진 관리</span>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  건강검진 기록을 관리하고 연령대별 권장 일정을 추적합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PremiumGate>
  );
}

export default function PremiumHealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <LoadingSpinner label="프리미엄 기능을 불러오는 중..." />
            </div>
          }
        >
          <PremiumContent />
        </Suspense>
      </div>
    </div>
  );
}

