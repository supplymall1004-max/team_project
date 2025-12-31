/**
 * @file theme-provider.tsx
 * @description 테마 프로바이더 컴포넌트
 *
 * 주요 기능:
 * 1. 다크/라이트 모드 관리
 * 2. 시스템 설정 감지 (auto 모드)
 * 3. HTML 요소에 클래스 적용
 */

"use client";

import { useEffect } from "react";
import { useHomeCustomization } from "@/hooks/use-home-customization";
import type { ThemeMode } from "@/types/home-customization";

/**
 * 테마 프로바이더 컴포넌트
 * 홈페이지 커스텀 설정에 따라 테마를 적용합니다.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { customization, isLoaded } = useHomeCustomization();

  useEffect(() => {
    if (!isLoaded) return;

    const htmlElement = document.documentElement;
    const themeMode = customization.theme.mode;

    // auto 모드인 경우 시스템 설정 감지
    if (themeMode === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const isDark = mediaQuery.matches;

      if (isDark) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }

      // 시스템 설정 변경 감지
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          htmlElement.classList.add("dark");
        } else {
          htmlElement.classList.remove("dark");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // light 또는 dark 모드
      if (themeMode === "dark") {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
  }, [customization.theme.mode, isLoaded]);

  return <>{children}</>;
}

