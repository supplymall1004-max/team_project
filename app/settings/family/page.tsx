/**
 * @file settings/family/page.tsx
 * @description 가족 구성원 관리 페이지
 *
 * 주요 기능:
 * 1. 가족 구성원 목록 표시
 * 2. 가족 구성원 추가/수정/삭제
 * 3. 구독 플랜 정보 확인
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { FamilyMemberSection } from "@/app/health/manage/family-member-section";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "가족 구성원 관리 | 맛의 아카이브",
  description: "가족 구성원을 추가하고 관리하세요",
};

// 동적 렌더링 설정 (사용자별 가족 정보이므로)
export const dynamic = 'force-dynamic';

export default function FamilySettingsPage() {
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
          <h1 className="text-4xl font-bold mb-2">가족 구성원 관리</h1>
          <p className="text-muted-foreground">
            가족 구성원을 추가하고 관리하여 맞춤 식단을 추천받으세요.
          </p>
        </div>

        {/* 가족 구성원 관리 섹션 */}
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner label="가족 구성원 정보를 불러오는 중..." />
            </div>
          }>
            <FamilyMemberSection />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

