/**
 * @file app/(dashboard)/health/vital-signs/log/page.tsx
 * @description 혈압/혈당 기록 입력 페이지 (통합 페이지로 리다이렉트)
 */

import { redirect } from 'next/navigation';

export default function VitalSignsLogPage() {
  redirect('/health/log?tab=vital-signs');
}
