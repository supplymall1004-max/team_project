/**
 * @file app/admin/popups/page.tsx
 * @description 관리자 팝업 공지 페이지
 *
 * 주요 기능:
 * 1. 좌측: 팝업 테이블
 * 2. 우측: 선택된 팝업 상세 편집 패널
 * 3. 반응형 레이아웃 (데스크톱: 양분, 모바일: 탭 전환)
 */

import { Suspense } from "react";
import { PopupsPageClient } from "./popups-page-client";
import { listPopups } from "@/actions/admin/popups/list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function AdminPopupsPage() {
  // 서버 사이드에서 초기 데이터 로드
  let result;
  let errorMessage: string | null = null;
  
  try {
    result = await listPopups();
    
    if (!result.success) {
      errorMessage = "error" in result ? result.error : "알 수 없는 오류";
      console.error("[AdminPopupsPage] initial_load_error", errorMessage);
      console.error("[AdminPopupsPage] error_details", {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[AdminPopupsPage] 예상치 못한 오류:", {
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
            {errorMessage.includes("환경 변수") && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <strong>해결 방법:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>.env 파일에 NEXT_PUBLIC_SUPABASE_URL이 설정되어 있는지 확인</li>
                  <li>.env 파일에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있는지 확인</li>
                  <li>서버를 재시작해주세요</li>
                </ul>
              </div>
            )}
            {errorMessage.includes("테이블") && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <strong>해결 방법:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Supabase 마이그레이션을 적용해주세요</li>
                  <li>popup_announcements 테이블이 생성되었는지 확인</li>
                </ul>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              클라이언트에서 자동으로 재시도합니다.
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<PopupsPageSkeleton />}>
        <PopupsPageClient initialPopups={result.success ? result.data : []} />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function PopupsPageSkeleton() {
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
