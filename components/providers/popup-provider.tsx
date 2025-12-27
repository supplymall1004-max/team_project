/**
 * @file components/providers/popup-provider.tsx
 * @description 전역 팝업 Provider
 *
 * 주요 기능:
 * 1. 페이지 로드 시 활성 팝업 조회
 * 2. 사용자의 healthPopups 설정 확인
 * 3. 설정이 off이면 팝업을 표시하지 않음
 * 4. PopupDisplay 컴포넌트에 데이터 전달
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { PopupDisplay } from "@/components/popups/popup-display";
import { getActivePopups } from "@/actions/popups/get-active-popups";
import type { ActivePopup } from "@/actions/popups/get-active-popups";

interface NotificationSettings {
  kcdcAlerts?: boolean;
  healthPopups?: boolean;
  generalNotifications?: boolean;
}

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [popups, setPopups] = useState<ActivePopup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<NotificationSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 사용자 알림 설정 불러오기
  useEffect(() => {
    async function loadUserSettings() {
      if (!isLoaded || !userId) {
        console.log("[PopupProvider] 사용자 인증 대기 중...");
        setSettingsLoaded(true);
        return;
      }

      try {
        console.group("[PopupProvider] 사용자 설정 불러오기");
        console.log("사용자 ID:", userId);

        const response = await fetch("/api/users/notification-settings");

        if (response.ok) {
          const result = await response.json();
          const settings = result.settings || {};
          console.log("✅ 사용자 설정 로드 성공:", settings);
          setUserSettings(settings);
        } else if (response.status === 404) {
          // 404는 API 라우트가 없거나 사용자가 없을 때 발생할 수 있으므로 정상 처리
          // 기본값 사용 (healthPopups: false)
          setUserSettings({ healthPopups: false });
        } else {
          // 다른 에러는 로그만 남기고 기본값 사용
          console.warn("⚠️ 설정 조회 실패:", response.status);
          setUserSettings({ healthPopups: false });
        }
      } catch (error) {
        console.error("❌ 설정 불러오기 실패:", error);
        // 에러 발생 시 기본값 사용 (healthPopups: false)
        setUserSettings({ healthPopups: false });
      } finally {
        setSettingsLoaded(true);
        console.groupEnd();
      }
    }

    loadUserSettings();
  }, [userId, isLoaded]);

  // 팝업 불러오기
  useEffect(() => {
    async function loadPopups() {
      console.group("[PopupProvider] 팝업 불러오기");
      console.log("event", "load_popups");

      try {
        const result = await getActivePopups();

        if (result.success) {
          console.log("popups_loaded", result.data.length);
          setPopups(result.data);
        } else {
          const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
          console.error("load_error", errorMessage);
        }
      } catch (error) {
        console.error("unexpected_error", error);
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    loadPopups();
  }, []);

  // 팝업 표시 여부 결정
  const shouldShowPopups = () => {
    // 설정이 아직 로드되지 않았으면 표시하지 않음 (로딩 중)
    if (!settingsLoaded) {
      console.log("[PopupProvider] 설정 로딩 중... 팝업 표시 안 함");
      return false;
    }

    // 로그인하지 않은 사용자는 팝업 표시하지 않음
    if (!userId || !isLoaded) {
      console.log("[PopupProvider] 비로그인 사용자 또는 인증 대기 중, 팝업 표시 안 함");
      return false;
    }

    // 사용자 설정 확인
    const healthPopupsEnabled = userSettings?.healthPopups ?? false;
    console.log("[PopupProvider] healthPopups 설정:", healthPopupsEnabled);

    if (!healthPopupsEnabled) {
      console.log("🚫 사용자가 건강 팝업을 꺼놓았습니다. 팝업을 표시하지 않습니다.");
      return false;
    }

    return true;
  };

  const canShowPopups = shouldShowPopups();

  return (
    <>
      {children}
      {!isLoading && settingsLoaded && canShowPopups && popups.length > 0 && (
        <PopupDisplay popups={popups} />
      )}
    </>
  );
}

