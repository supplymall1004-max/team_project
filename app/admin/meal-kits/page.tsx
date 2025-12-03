/**
 * @file app/admin/meal-kits/page.tsx
 * @description 관리자 밀키트 제품 관리 페이지
 *
 * 주요 기능:
 * 1. 좌측: 밀키트 테이블
 * 2. 우측: 선택된 밀키트 상세 편집 패널
 * 3. 반응형 레이아웃 (데스크톱: 양분, 모바일: 탭 전환)
 */

import { Suspense } from "react";
import { MealKitsPageClient } from "./meal-kits-page-client";
import { listMealKits } from "@/actions/admin/meal-kits/list";

export default async function AdminMealKitsPage() {
  // 서버 사이드에서 초기 데이터 로드
  const result = await listMealKits();

  if (!result.success) {
    // 에러 발생 시 빈 데이터로 시작 (클라이언트에서 재시도)
    const errorMessage = "error" in result ? result.error : "알 수 없는 오류";
    console.error("[AdminMealKitsPage] initial_load_error", errorMessage);
  }

  return (
    <div className="h-full">
      <Suspense fallback={<MealKitsPageSkeleton />}>
        <MealKitsPageClient initialMealKits={result.success ? result.data : []} />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function MealKitsPageSkeleton() {
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

















