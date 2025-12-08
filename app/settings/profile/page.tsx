/**
 * @file settings/profile/page.tsx
 * @description 프로필 설정 페이지
 *
 * 주요 기능:
 * 1. Clerk 사용자 정보 수정 (이름, 이메일 등)
 * 2. 프로필 사진 업로드
 * 3. 계정 설정
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { UserProfileForm } from "@/components/profile/user-profile-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "프로필 설정 | 맛의 아카이브",
  description: "이름, 이메일 등 개인 정보를 수정하고 계정을 관리하세요",
};

// 동적 렌더링 설정 (사용자별 프로필이므로)
export const dynamic = 'force-dynamic';

export default function ProfileSettingsPage() {
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
          <h1 className="text-4xl font-bold mb-2">프로필 설정</h1>
          <p className="text-muted-foreground">
            이름, 이메일 등 개인 정보를 수정하고 계정을 관리하세요.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="프로필을 불러오는 중..." />}>
            <UserProfileForm />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

