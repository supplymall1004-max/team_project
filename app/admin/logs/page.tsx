/**
 * @file app/admin/logs/page.tsx
 * @description 관리자 알림 로그 페이지
 */

import { Suspense } from "react";
import { LogsPageClient } from "./logs-page-client";

export default async function AdminLogsPage() {
  // 서버 사이드에서 초기 데이터 로드
  // const initialLogs = await listLogs({ limit: 50 });

  return (
    <div className="h-full">
      <Suspense fallback={<LogsPageSkeleton />}>
        <LogsPageClient />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function LogsPageSkeleton() {
  return (
    <div className="h-full p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
























