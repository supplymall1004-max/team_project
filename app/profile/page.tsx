/**
 * @file profile/page.tsx
 * @description 사용자 프로필 수정 페이지
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

export const metadata = {
  title: "프로필 수정 | 맛의 아카이브",
  description: "사용자 정보를 수정하고 계정을 관리하세요",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">프로필 수정</h1>
          <p className="text-muted-foreground">
            이름, 이메일 등 개인 정보를 수정하고 계정을 관리하세요.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner label="프로필을 불러오는 중..." />}>
          <UserProfileForm />
        </Suspense>
      </Section>
    </div>
  );
}






















