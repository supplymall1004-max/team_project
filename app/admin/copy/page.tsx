/**
 * @file app/admin/copy/page.tsx
 * @description 관리자 페이지 문구 편집 페이지
 *
 * 주요 기능:
 * 1. 좌측: 문구 블록 리스트 패널
 * 2. 우측: 선택된 블록 편집기
 * 3. 반응형 레이아웃 (데스크톱: 양분, 모바일: 탭 전환)
 */

import { Suspense } from "react";
import { CopyPageClient } from "./copy-page-client";
import { listCopyBlocks } from "@/actions/admin/copy/list";

export default async function AdminCopyPage() {
  // 서버 사이드에서 초기 데이터 로드
  const result = await listCopyBlocks();

  if (!result.success) {
    // 에러 발생 시 빈 데이터로 시작 (클라이언트에서 재시도)
    const errorMessage = "error" in result ? result.error : "알 수 없는 오류";
    console.error("[AdminCopyPage] initial_load_error", errorMessage);
  }

  return (
    <div className="h-full">
      <Suspense fallback={<CopyPageSkeleton />}>
        <CopyPageClient initialBlocks={result.success ? result.data : []} />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function CopyPageSkeleton() {
  return (
    <div className="h-full flex">
      {/* 좌측 패널 스켈레톤 */}
      <div className="w-80 border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 에디터 스켈레톤 */}
      <div className="flex-1 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
