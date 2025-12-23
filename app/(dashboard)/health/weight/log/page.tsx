/**
 * @file app/(dashboard)/health/weight/log/page.tsx
 * @description 체중 기록 입력 페이지 (통합 페이지로 리다이렉트)
 */

import { redirect } from 'next/navigation';

export default function WeightLogPage() {
  redirect('/health/log?tab=weight');
}
