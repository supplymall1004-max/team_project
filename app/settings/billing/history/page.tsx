/**
 * @file settings/billing/history/page.tsx
 * @description 결제 내역 페이지
 *
 * 주요 기능:
 * 1. 과거 결제 내역 조회
 * 2. 결제 상세 정보 표시
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { PaymentHistoryList } from "@/components/settings/billing/payment-history-list";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "결제 내역 | 맛의 아카이브",
  description: "과거 결제 내역을 확인하세요",
};

// 동적 렌더링 설정 (사용자별 결제 정보이므로)
export const dynamic = 'force-dynamic';

export default function PaymentHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings/billing">
                <ArrowLeft className="h-4 w-4 mr-2" />
                결제 관리로 돌아가기
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">결제 내역</h1>
          <p className="text-muted-foreground">
            과거 결제 내역을 확인하실 수 있습니다.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="결제 내역을 불러오는 중..." />}>
            <PaymentHistoryList />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

