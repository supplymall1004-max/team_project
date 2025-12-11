/**
 * @file profile/page.tsx
 * @description 프로필 페이지 리다이렉트
 *
 * 이 페이지는 /settings/profile로 리다이렉트됩니다.
 * 프로필 설정은 설정 페이지에서 통합 관리합니다.
 */

import { redirect } from "next/navigation";

export default function ProfilePage() {
  redirect("/settings/profile");
}


























