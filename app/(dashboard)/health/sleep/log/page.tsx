/**
 * @file app/(dashboard)/health/sleep/log/page.tsx
 * @description 수면 기록 입력 페이지 (통합 페이지로 리다이렉트)
 */

import { redirect } from 'next/navigation';

export default function SleepLogPage() {
  redirect('/health/log?tab=sleep');
}
