/**
 * @file app/admin/logs/logs-page-client.tsx
 * @description 관리자 알림 로그 페이지 클라이언트 컴포넌트
 */

"use client";

import { NotificationLogsViewer } from "@/components/admin/logs/notification-logs-viewer";

export function LogsPageClient() {
  return (
    <div className="h-full">
      <NotificationLogsViewer className="h-full" />
    </div>
  );
}
























