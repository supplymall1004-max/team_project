/**
 * @file settings/health/page.tsx
 * @description 건강 정보 관리 페이지
 *
 * 주요 기능:
 * 1. 건강 정보 요약 표시
 * 2. 건강 정보 수정 페이지로 이동
 * 3. 건강 정보 입력 상태 확인
 * 4. 건강정보 데이터 소스 연결 (프리미엄 전용)
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { HealthProfileSummary } from "@/components/health/health-profile-summary";
import { HealthSyncButton } from "@/components/health/health-sync-button";
import { IdentityVerificationCard } from "@/components/health/identity-verification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "건강 정보 관리 | 맛의 아카이브",
  description: "건강 상태, 식이 제한사항 등을 수정하세요",
};

// 동적 렌더링 설정 (사용자별 건강 정보이므로)
export const dynamic = 'force-dynamic';

export default async function HealthSettingsPage() {
  // 프리미엄 체크
  const premiumCheck = await checkPremiumAccess();
  const isPremium = premiumCheck.isPremium;

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                설정으로 돌아가기
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">건강 정보 관리</h1>
          <p className="text-muted-foreground">
            현재 건강 정보를 확인하고 필요에 따라 수정할 수 있습니다.
            정확한 정보 입력으로 더 좋은 맞춤 식단을 추천받으세요.
          </p>
        </div>

        {/* 건강 정보 수정 버튼 */}
        <div className="mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">건강 정보 수정</h3>
                <p className="text-sm text-muted-foreground">
                  건강 상태, 식이 제한사항 등을 수정하세요.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/health/profile">
                  <Heart className="h-4 w-4 mr-2" />
                  건강 정보 수정
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* 건강정보 데이터 소스 연결 및 동기화 (프리미엄 전용) */}
        {isPremium && (
          <ErrorBoundary>
            <Suspense fallback={
              <Card className="p-6">
                <div className="flex justify-center">
                  <LoadingSpinner label="동기화 정보를 불러오는 중..." />
                </div>
              </Card>
            }>
              {/* 신원확인 카드 */}
              <div className="mb-6">
                <IdentityVerificationCard />
              </div>

              {/* 데이터 소스 연결 버튼 */}
              <div className="mb-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">데이터 소스 관리</h3>
                      <p className="text-sm text-muted-foreground">
                        마이데이터, 건강정보고속도로 등 건강정보 데이터 소스를 연결하고 관리하세요.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/health/data-sources">
                        <Database className="h-4 w-4 mr-2" />
                        데이터 소스 연결
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>

              {/* 건강정보 동기화 */}
              <div className="mb-6">
                <HealthSyncButton />
              </div>
            </Suspense>
          </ErrorBoundary>
        )}

        {/* 건강 정보 요약 섹션 */}
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner label="건강 정보를 불러오는 중..." />
            </div>
          }>
            <HealthProfileSummary />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

