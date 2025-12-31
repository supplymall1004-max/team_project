/**
 * @file app/settings/api-keys/page.tsx
 * @description API 키 관리 페이지
 *
 * 사용자가 발급받은 외부 API 키를 관리하는 페이지입니다.
 * 각 API별 발급 가이드를 제공하고, 키를 입력/수정/삭제할 수 있습니다.
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import { ApiKeysManager } from "@/components/settings/api-keys/api-keys-manager";

export const metadata = {
  title: "API 키 관리 | 설정",
  description: "외부 API 키를 관리하고 발급 가이드를 확인하세요",
};

// 동적 렌더링 설정 (사용자별 설정이므로)
export const dynamic = "force-dynamic";

export default function ApiKeysSettingsPage() {
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
          <h1 className="text-4xl font-bold mb-2">API 키 관리</h1>
          <p className="text-muted-foreground">
            외부 서비스 API 키를 발급받아 입력하면 더 많은 기능을 사용할 수 있습니다.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="API 키 목록을 불러오는 중..." />}>
            <ApiKeysManager />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

