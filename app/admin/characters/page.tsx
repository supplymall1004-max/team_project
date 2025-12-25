/**
 * @file app/admin/characters/page.tsx
 * @description 관리자 캐릭터 관리 페이지
 *
 * 캐릭터 정보 및 게임화 데이터를 관리할 수 있는 페이지입니다.
 */

import { Suspense } from "react";
import { CharactersPageClient } from "./characters-page-client";
import { getCharacterStats } from "@/actions/admin/characters/get-character-stats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function AdminCharactersPage() {
  // 서버 사이드에서 초기 통계 데이터 로드
  let statsResult;
  let errorMessage: string | null = null;

  try {
    statsResult = await getCharacterStats();

    if (!statsResult.success) {
      errorMessage = statsResult.error || "알 수 없는 오류";
      console.error("[AdminCharactersPage] initial_load_error", errorMessage);
    }
  } catch (error) {
    console.error("[AdminCharactersPage] 예상치 못한 오류:", error);
    errorMessage = error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "알 수 없는 오류가 발생했습니다";
    statsResult = {
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
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<CharactersPageSkeleton />}>
        <CharactersPageClient initialStats={statsResult.success ? statsResult.data : undefined} />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function CharactersPageSkeleton() {
  return (
    <div className="h-full p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

