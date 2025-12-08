/**
 * @file settings/billing/cancel/page.tsx
 * @description 구독 취소 페이지
 *
 * 주요 기능:
 * 1. 구독 취소 옵션 선택 (즉시 취소 vs 기간 종료 시 취소)
 * 2. 취소 확인 및 처리
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { CancelSubscriptionForm } from "@/components/settings/billing/cancel-subscription-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "구독 취소 | 맛의 아카이브",
  description: "프리미엄 구독을 취소하세요",
};

// 동적 렌더링 설정 (사용자별 구독 정보이므로)
export const dynamic = 'force-dynamic';

export default function CancelSubscriptionPage() {
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
          <h1 className="text-4xl font-bold mb-2">구독 취소</h1>
          <p className="text-muted-foreground">
            프리미엄 구독을 취소하시겠습니까? 언제든 다시 구독하실 수 있습니다.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="구독 정보를 불러오는 중..." />}>
            <CancelSubscriptionForm />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

