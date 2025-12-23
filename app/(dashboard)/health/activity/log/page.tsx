/**
 * @file app/(dashboard)/health/activity/log/page.tsx
 * @description 활동량 기록 입력 페이지 (통합 페이지로 리다이렉트)
 */

import { redirect } from 'next/navigation';

export default function ActivityLogPage() {
  redirect('/health/log?tab=activity');
}
