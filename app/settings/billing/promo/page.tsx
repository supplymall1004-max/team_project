/**
 * @file settings/billing/promo/page.tsx
 * @description 프로모션 코드 등록 페이지
 *
 * 주요 기능:
 * 1. 프로모션 코드 입력 및 검증
 * 2. 코드 적용 및 할인 정보 표시
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { PromoCodeForm } from "@/components/settings/billing/promo-code-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "프로모션 코드 등록 | 맛의 아카이브",
  description: "프로모션 코드를 등록하여 할인 혜택을 받으세요",
};

// 동적 렌더링 설정 (사용자별 정보이므로)
export const dynamic = 'force-dynamic';

export default function PromoCodePage() {
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
          <h1 className="text-4xl font-bold mb-2">프로모션 코드 등록</h1>
          <p className="text-muted-foreground">
            프로모션 코드를 입력하여 할인 혜택을 받으세요. 코드는 결제 시 적용됩니다.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="프로모션 코드 정보를 불러오는 중..." />}>
            <PromoCodeForm />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

