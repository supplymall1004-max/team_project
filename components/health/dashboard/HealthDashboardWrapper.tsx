/**
 * @file components/health/dashboard/HealthDashboardWrapper.tsx
 * @description HealthDashboard 클라이언트 컴포넌트 래퍼
 *
 * 주요 기능:
 * 1. 서버 컴포넌트에서 HealthDashboard 사용을 위한 래퍼
 * 2. 사용자 인증 상태 확인
 * 3. 다양한 모드 지원
 */

"use client";

import { useUser } from "@clerk/nextjs";
import { HealthDashboard } from "./HealthDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { DashboardMode } from "./types";

interface HealthDashboardWrapperProps {
  mode?: DashboardMode;
  className?: string;
  showFamilyOverview?: boolean;
  showAlerts?: boolean;
  showVisualization?: boolean;
}

/**
 * HealthDashboard 래퍼 컴포넌트
 */
export function HealthDashboardWrapper({
  mode = "integrated",
  className,
  showFamilyOverview = true,
  showAlerts = true,
  showVisualization = false,
}: HealthDashboardWrapperProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground mb-4">
            로그인 후 건강 관리 현황을 확인하세요
          </p>
          <Button asChild className="w-full">
            <Link href="/sign-in">로그인하기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <HealthDashboard
      mode={mode}
      userId={user.id}
      className={className}
      showFamilyOverview={showFamilyOverview}
      showAlerts={showAlerts}
      showVisualization={showVisualization}
    />
  );
}
