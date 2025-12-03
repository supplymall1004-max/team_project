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

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { User, Heart, Bell, Shield } from "lucide-react";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HealthProfileSummary } from "@/components/health/health-profile-summary";
import { FamilyMemberSection } from "./family-member-section";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function HealthManagePage() {
  // 팝업 설정 상태 관리
  const [kcdcAlertsEnabled, setKcdcAlertsEnabled] = useState(true);
  const [generalNotificationsEnabled, setGeneralNotificationsEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">건강 정보 관리 및 설정</h1>
          <p className="text-muted-foreground">
            현재 건강 정보를 확인하고 필요에 따라 수정할 수 있습니다.
            정확한 정보 입력으로 더 좋은 맞춤 식단을 추천받으세요.
          </p>
        </div>

        <div className="space-y-8">
          {/* 팝업 설정 섹션 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">팝업 및 알림 설정</h3>
                <p className="text-sm text-muted-foreground">
                  건강 관련 팝업과 알림 수신 여부를 설정하세요.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">질병청 알림</p>
                    <p className="text-sm text-muted-foreground">코로나19, 감염병 등 공공 보건 알림</p>
                  </div>
                </div>
                <Switch
                  checked={kcdcAlertsEnabled}
                  onCheckedChange={setKcdcAlertsEnabled}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">일반 알림</p>
                    <p className="text-sm text-muted-foreground">서비스 업데이트, 건강 팁 등 일반 알림</p>
                  </div>
                </div>
                <Switch
                  checked={generalNotificationsEnabled}
                  onCheckedChange={setGeneralNotificationsEnabled}
                />
              </div>
            </div>
          </Card>

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
