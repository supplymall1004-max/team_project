/**
 * @file app/(dashboard)/health/log/page.tsx
 * @description 건강 데이터 입력 페이지 (통합 프로필 페이지로 리다이렉트)
 */

import { redirect } from 'next/navigation';

export default function HealthLogPage() {
  redirect('/health/profile?tab=data-entry');
}
