/**
 * @file settings/notifications/page.tsx
 * @description 알림 설정 페이지
 *
 * 주요 기능:
 * 1. 건강 관련 팝업과 알림 수신 여부 설정
 * 2. 질병청 알림 (코로나19, 감염병 등 공공 보건 알림)
 * 3. 일반 알림 (서비스 업데이트, 건강 팁 등 일반 알림)
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "알림 설정 | 맛의 아카이브",
  description: "질병청 알림, 일반 알림 등 알림 수신 여부를 설정하세요",
};

// 동적 렌더링 설정 (사용자별 설정이므로)
export const dynamic = 'force-dynamic';

export default function NotificationSettingsPage() {
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
          <h1 className="text-4xl font-bold mb-2">알림 설정</h1>
          <p className="text-muted-foreground">
            건강 관련 팝업과 알림 수신 여부를 설정하세요.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="알림 설정을 불러오는 중..." />}>
            <NotificationSettings />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

