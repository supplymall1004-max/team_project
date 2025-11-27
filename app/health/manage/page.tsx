/**
 * @file health/manage/page.tsx
 * @description 건강 정보 관리 페이지
 *
 * 주요 기능:
 * 1. 건강 정보 요약 표시
 * 2. 건강 정보 수정 페이지로 이동
 * 3. 건강 정보 입력 상태 확인
 * 4. 가족 구성원 관리
 */

import { Suspense } from "react";
import Link from "next/link";
import { User, Heart } from "lucide-react";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthProfileSummary } from "@/components/health/health-profile-summary";
import { FamilyMemberSection } from "./family-member-section";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "건강 정보 관리 | 맛의 아카이브",
  description: "건강 정보를 확인하고 수정하세요",
};

export default function HealthManagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">건강 정보 관리</h1>
          <p className="text-muted-foreground">
            현재 건강 정보를 확인하고 필요에 따라 수정할 수 있습니다.
            정확한 정보 입력으로 더 좋은 맞춤 식단을 추천받으세요.
          </p>
        </div>

        <div className="space-y-8">
          {/* 사용자 프로필 관리 섹션 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">내 프로필 관리</h3>
                  <p className="text-sm text-muted-foreground">
                    이름, 프로필 사진 등 개인 정보를 수정하세요.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    프로필 수정
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">건강 정보 관리</h3>
                  <p className="text-sm text-muted-foreground">
                    건강 상태, 식이 제한사항 등을 수정하세요.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/health/profile">
                    <Heart className="h-4 w-4 mr-2" />
                    건강 정보 수정
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* 건강 정보 요약 섹션 */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner label="건강 정보를 불러오는 중..." />
            </div>
          }>
            <HealthProfileSummary />
          </Suspense>

          {/* 가족 구성원 관리 섹션 */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner label="가족 구성원 정보를 불러오는 중..." />
            </div>
          }>
            <FamilyMemberSection />
          </Suspense>
        </div>
      </Section>
    </div>
  );
}
