/**
 * @file components/providers/toast-provider.tsx
 * @description 전역 Sonner Toaster Provider
 *
 * 주요 기능:
 * 1. 전역 토스트 컨테이너 렌더링
 * 2. 기본 지속시간/위치 설정
 * 3. 라이트/다크 테마 자동 대응
 */

"use client";

import { Toaster } from "sonner";

import { DEFAULT_TOAST_DURATION } from "@/lib/toast/normalize-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      duration={DEFAULT_TOAST_DURATION}
      expand
      closeButton
    />
  );
}


























