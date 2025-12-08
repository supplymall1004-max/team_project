/**
 * @file settings/billing/page.tsx
 * @description 결제 및 구독 관리 페이지
 *
 * 주요 기능:
 * 1. 현재 구독 정보 표시
 * 2. 결제 내역 조회
 * 3. 구독 취소 및 프로모션 코드 등록 링크 제공
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { BillingOverview } from "@/components/settings/billing/billing-overview";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "결제 및 구독 | 맛의 아카이브",
  description: "구독 관리, 결제 내역, 프로모션 코드 등록",
};

// 동적 렌더링 설정 (사용자별 결제 정보이므로)
export const dynamic = 'force-dynamic';

export default function BillingPage() {
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
          <h1 className="text-4xl font-bold mb-2">결제 관리</h1>
          <p className="text-muted-foreground">
            결제 정보 확인, 쿠폰 등록, 구독 취소 등을 관리할 수 있습니다.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="결제 정보를 불러오는 중..." />}>
            <BillingOverview />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

