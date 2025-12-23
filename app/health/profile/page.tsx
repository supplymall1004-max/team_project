/**
 * @file health/profile/page.tsx
 * @description 통합 건강 프로필 관리 페이지
 *
 * 주요 기능:
 * 1. 기본 정보 입력 (나이, 성별, 키, 몸무게, 활동량, 질병, 알레르기 등)
 * 2. 건강 데이터 입력 (수면, 활동량, 혈압/혈당, 체중)
 * 3. 스마트 기기 연동 (Google Fit, Fitbit 등)
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { UnifiedHealthProfile } from "@/components/health/unified-health-profile";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "건강 프로필 관리 | 맛의 아카이브",
  description: "건강 정보를 설정하고 데이터를 기록하세요",
};

export default function HealthProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <Suspense fallback={<LoadingSpinner label="프로필을 불러오는 중..." />}>
          <UnifiedHealthProfile />
        </Suspense>
      </Section>
    </div>
  );
}

