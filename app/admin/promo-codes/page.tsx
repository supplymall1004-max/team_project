/**
 * @file app/admin/promo-codes/page.tsx
 * @description 관리자 프로모션 코드 관리 페이지
 *
 * 주요 기능:
 * 1. 프로모션 코드 목록 조회 및 관리
 * 2. 프로모션 코드 생성/수정/삭제
 * 3. 사용 통계 및 상태 모니터링
 */

import { Suspense } from "react";
import { PromoCodesPageClient } from "./promo-codes-page-client";
import { listPromoCodes } from "@/actions/admin/promo-codes/list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function AdminPromoCodesPage() {
  // 서버 사이드에서 초기 데이터 로드
  let result;
  let errorMessage: string | null = null;
  
  try {
    result = await listPromoCodes();
    
    if (!result.success) {
      errorMessage = "error" in result ? result.error : "알 수 없는 오류";
      console.error("[AdminPromoCodesPage] initial_load_error", errorMessage);
    }
  } catch (error) {
    console.error("[AdminPromoCodesPage] 예상치 못한 오류:", {
      error,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === "string" 
      ? error 
      : "알 수 없는 오류가 발생했습니다";
    result = {
      success: false as const,
      error: errorMessage,
    };
  }

  return (
    <div className="h-full">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터 로드 실패</AlertTitle>
          <AlertDescription className="space-y-2">
            <div>{errorMessage}</div>
            {errorMessage.includes("테이블") && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <strong>해결 방법:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Supabase 마이그레이션을 적용해주세요</li>
                  <li>promo_codes 테이블이 생성되었는지 확인</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<PromoCodesPageSkeleton />}>
        <PromoCodesPageClient initialCodes={result.success ? result.data : []} />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function PromoCodesPageSkeleton() {
  return (
    <div className="h-full flex">
      {/* 좌측 테이블 스켈레톤 */}
      <div className="w-1/2 border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 패널 스켈레톤 */}
      <div className="w-1/2 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

