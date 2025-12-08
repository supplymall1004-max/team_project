/**
 * @file health/manage/page.tsx
 * @description 설정 페이지로 리다이렉트
 *
 * 이 페이지는 /settings로 리다이렉트됩니다.
 */

import { redirect } from "next/navigation";

export default function HealthManagePage() {
  redirect("/settings");
}
