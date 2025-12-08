/**
 * @file health/manage/page.tsx
 * @description 설정 메인 페이지
 *
 * 주요 기능:
 * 1. 각 설정 항목으로 이동할 수 있는 카드 링크 제공
 * 2. 프로필 설정, 건강 정보 관리, 가족 구성원 관리, 알림 설정으로 이동
 */

"use client";

import Link from "next/link";
import { User, Heart, Bell, Users } from "lucide-react";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HealthManagePage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">설정</h1>
          <p className="text-muted-foreground">
            건강 정보, 알림 설정, 프로필 등을 관리하세요.
          </p>
        </div>

        <div className="space-y-8">
          {/* 설정 항목 카드들 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">프로필 설정</h3>
                  <p className="text-sm text-muted-foreground">
                    이름, 프로필 사진 등 개인 정보를 수정하세요.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/settings/profile">
                    <User className="h-4 w-4 mr-2" />
                    이동
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
                  <Link href="/settings/health">
                    <Heart className="h-4 w-4 mr-2" />
                    이동
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">가족 구성원 관리</h3>
                  <p className="text-sm text-muted-foreground">
                    가족 구성원을 추가하고 관리하세요.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/settings/family">
                    <Users className="h-4 w-4 mr-2" />
                    이동
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">알림 설정</h3>
                  <p className="text-sm text-muted-foreground">
                    질병청 알림, 일반 알림 등을 설정하세요.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/settings/notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    이동
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
}
