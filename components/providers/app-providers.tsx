/**
 * @file components/providers/app-providers.tsx
 * @description 앱 전체 Provider 통합 컴포넌트
 *
 * 모든 전역 Provider를 하나로 통합하여 관리합니다.
 * Provider 순서는 의존성을 고려하여 최적화되었습니다.
 *
 * Provider 순서:
 * 1. SyncUserProvider - 사용자 동기화 (가장 먼저 실행)
 * 2. QueryProvider - React Query 설정
 * 3. ToastProvider - 토스트 알림 (children 없음)
 * 4. DietNotificationProvider - 식단 알림
 * 5. KcdcAlertsProvider - KCDC 알림
 * 6. PopupProvider - 팝업 공지
 *
 * @dependencies
 * - @/components/providers/sync-user-provider
 * - @/components/providers/query-provider
 * - @/components/providers/toast-provider
 * - @/components/providers/diet-notification-provider
 * - @/components/providers/kcdc-alerts-provider
 * - @/components/providers/popup-provider
 */

"use client";

import { MotionConfig } from "framer-motion";
import { SyncUserProvider } from "./sync-user-provider";
import { QueryProvider } from "./query-provider";
import { ToastProvider } from "./toast-provider";
import { DietNotificationProvider } from "./diet-notification-provider";
import { KcdcAlertsProvider } from "./kcdc-alerts-provider";
import { PopupProvider } from "./popup-provider";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * 앱 전체 Provider 통합 컴포넌트
 *
 * 모든 전역 Provider를 중첩하여 앱 전체에 적용합니다.
 * 개발 환경에서만 Provider별 로그를 출력합니다.
 */
export function AppProviders({ children }: AppProvidersProps) {
  if (process.env.NODE_ENV === "development") {
    console.group("[AppProviders] Provider 초기화");
    console.log("SyncUserProvider → QueryProvider → ToastProvider → DietNotificationProvider → KcdcAlertsProvider → PopupProvider");
    console.groupEnd();
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <SyncUserProvider>
        <QueryProvider>
          <ToastProvider />
          <DietNotificationProvider>
            <KcdcAlertsProvider>
              <PopupProvider>{children}</PopupProvider>
            </KcdcAlertsProvider>
          </DietNotificationProvider>
        </QueryProvider>
      </SyncUserProvider>
    </MotionConfig>
  );
}
