/**
 * @file health/profile/page.tsx
 * @description 건강 정보 입력 페이지
 *
 * 주요 기능:
 * 1. 기본 정보 입력 (나이, 성별, 키, 몸무게, 활동량)
 * 2. 질병 정보 선택
 * 3. 알레르기 정보 선택
 * 4. 선호/비선호 식재료 입력
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { HealthProfileForm } from "@/components/health/health-profile-form";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "건강 정보 입력 | 맛의 아카이브",
  description: "개인 맞춤 식단을 위해 건강 정보를 입력해주세요",
};

export default function HealthProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">건강 정보 입력</h1>
          <p className="text-muted-foreground">
            개인 맞춤 식단 추천을 위해 건강 정보를 입력해주세요. 입력된 정보는
            안전하게 보관됩니다.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner label="폼을 불러오는 중..." />}>
          <HealthProfileForm />
        </Suspense>
      </Section>
    </div>
  );
}

