/**
 * @file app/settings/customization/page.tsx
 * @description 홈페이지 커스터마이징 설정 페이지
 *
 * 주요 기능:
 * 1. 테마 모드 선택 (light, dark, auto)
 * 2. 배경 타입 선택 (gradient, image, color)
 * 3. 배경 이미지 업로드
 * 4. 섹션 순서 변경
 * 5. 기본값 복원
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { HomeCustomizationSettings } from "@/components/settings/home-customization";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata = {
  title: "홈페이지 커스터마이징 | 맛의 아카이브",
  description: "테마, 배경 이미지, 섹션 순서 등을 커스터마이징하세요",
};

// 동적 렌더링 설정 (사용자별 설정이므로)
export const dynamic = 'force-dynamic';

export default function CustomizationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 dark:text-foreground">홈페이지 커스터마이징</h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            테마, 배경 이미지, 섹션 순서 등을 커스터마이징하여 나만의 홈페이지를 만들어보세요.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="설정을 불러오는 중..." />}>
            <HomeCustomizationSettings />
          </Suspense>
        </ErrorBoundary>
      </Section>
    </div>
  );
}

