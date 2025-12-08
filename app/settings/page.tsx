/**
 * @file settings/page.tsx
 * @description 설정 메인 페이지
 *
 * 주요 기능:
 * 1. 설정 목록 표시
 * 2. 각 설정 항목으로 이동하는 링크 제공
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { SettingsNavigation } from "@/components/settings/settings-navigation";
import { BillingCard } from "@/components/settings/billing-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata = {
  title: "설정 | 맛의 아카이브",
  description: "프로필 정보와 알림 설정을 관리하세요",
};

// 동적 렌더링 설정 (사용자별 설정이므로)
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">설정</h1>
          <p className="text-muted-foreground">
            건강 정보, 알림 설정, 프로필 등을 관리하세요.
          </p>
        </div>

        {/* 설정 목록 */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="설정 목록을 불러오는 중..." />}>
            <SettingsNavigation />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

