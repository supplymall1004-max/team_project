/**
 * @file components/health/identity-verification-card.tsx
 * @description 신원확인 상태 확인 및 신원확인 페이지로 이동하는 카드 컴포넌트
 *
 * 신원확인 상태를 확인하고, 신원확인이 필요하면 신원확인 페이지로 이동할 수 있는 버튼을 제공합니다.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import Link from "next/link";

export function IdentityVerificationCard() {
  const { user, isLoaded } = useUser();

  // 신원확인 상태 조회
  const {
    data: verifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["identity-verifications"],
    queryFn: async () => {
      const res = await fetch("/api/identity/verifications");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Identity verifications fetch failed");
      }
      return res.json();
    },
    enabled: isLoaded && !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  const hasVerifiedIdentity =
    Array.isArray(verifications) &&
    verifications.some((v: any) => v.status === "verified");

  if (!isLoaded || isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    console.error("[IdentityVerificationCard] 신원확인 조회 오류:", error);
    // 에러가 있어도 카드는 표시하되, 신원확인 필요 상태로 표시
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">신원확인</h3>
            {hasVerifiedIdentity ? (
              <Badge variant="outline" className="text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                확인 완료
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-yellow-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                확인 필요
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {hasVerifiedIdentity
              ? "신원확인이 완료되었습니다. 건강정보 데이터 소스를 연결할 수 있습니다."
              : "건강정보 데이터 소스를 연결하려면 먼저 신원확인이 필요합니다. 이름, 주민등록번호를 입력하고 개인정보 동의를 해주세요."}
          </p>
        </div>
        {!hasVerifiedIdentity && (
          <Button asChild variant="default" className="ml-4">
            <Link href="/health/data-sources">
              <UserCheck className="h-4 w-4 mr-2" />
              신원확인 하기
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

