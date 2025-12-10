/**
 * @file components/providers/kcdc-alerts-provider.tsx
 * @description KCDC 알림 Provider 컴포넌트
 * 
 * 사용자가 사이트에 접속했을 때 자동으로 KCDC 알림 팝업을 표시
 * 사용자의 알림 설정(kcdcAlerts)을 확인하여 설정이 꺼져있으면 팝업을 표시하지 않음
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { KcdcAlertPopup } from "@/components/health/kcdc-alert-popup";
import type { KcdcAlert } from "@/types/kcdc";

const DISMISSED_ALERTS_KEY = "kcdc_dismissed_alerts";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6시간

interface NotificationSettings {
  kcdcAlerts?: boolean;
  healthPopups?: boolean;
  generalNotifications?: boolean;
}

export function KcdcAlertsProvider({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const [alerts, setAlerts] = useState<KcdcAlert[]>([]);
  const [userSettings, setUserSettings] = useState<NotificationSettings | null>(null);
  const { userId } = useAuth();

  // 사용자 알림 설정 불러오기
  const loadUserSettings = async () => {
    if (!userId) {
      console.log("🏥 [KCDC] 사용자 미로그인, 알림 설정 확인 불가");
      return null;
    }

    let groupOpened = false;
    try {
      console.group("🏥 [KCDC] 사용자 알림 설정 확인");
      groupOpened = true;
      
      const response = await fetch("/api/users/notification-settings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((fetchError) => {
        // 네트워크 에러 처리
        console.warn("⚠️ 네트워크 에러:", fetchError);
        throw fetchError;
      });
      
      if (!response.ok) {
        // 서버 에러(5xx)인 경우 재시도를 시도하고, 비정상 종료를 피합니다.
        if (response.status >= 500) {
          console.warn("⚠️ 알림 설정 조회 실패(서버에러, 재시도):", response.status);
          if (groupOpened) console.groupEnd();
          // 간단 재시도: 1회 시도 후 실패 시 null 반환
          try {
            await new Promise((r) => setTimeout(r, 1500));
            // 재시도 시도
            const retryResponse = await fetch("/api/users/notification-settings", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              const retrySettings = retryData.settings as NotificationSettings;
              console.log("✅ 재시도 알림 설정:", retrySettings);
              return retrySettings;
            }
          } catch {
            // 두 번째 시도 실패 시 무시하고 null 반환
          }
          return null;
        }
        console.warn("⚠️ 알림 설정 조회 실패:", response.status);
        if (groupOpened) console.groupEnd();
        return null;
      }

      const data = await response.json();
      const settings = data.settings as NotificationSettings;
      
      console.log("✅ 알림 설정:", settings);
      console.log("✅ kcdcAlerts:", settings.kcdcAlerts);
      if (groupOpened) console.groupEnd();
      
      return settings;
    } catch (error) {
      // 네트워크 에러와 다른 에러 구분
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("⚠️ 네트워크 연결 실패 또는 API 엔드포인트 접근 불가");
      } else if (error instanceof Error && error.name === "AbortError") {
        console.warn("⚠️ 요청 타임아웃");
      } else {
        console.error("❌ 알림 설정 조회 오류:", error);
      }
      
      // console.group이 열려있으면 닫기
      if (groupOpened) {
        try {
          console.groupEnd();
        } catch {
          // group이 없어도 무시
        }
      }
      
      return null;
    }
  };

  // 알림 확인
  const checkAlerts = async () => {
    try {
      console.group("🏥 KCDC 알림 확인");

      // 사용자 알림 설정 확인
      const settings = await loadUserSettings();
      setUserSettings(settings);

      // 사용자가 질병청 알림을 꺼놓은 경우 팝업을 표시하지 않음
      if (settings && settings.kcdcAlerts === false) {
        console.log("🚫 사용자가 질병청 알림을 꺼놓았습니다. 팝업을 표시하지 않습니다.");
        console.groupEnd();
        return;
      }

      // 로컬 스토리지에서 무시된 알림 목록 가져오기
      const dismissedAlertsJson = localStorage.getItem(DISMISSED_ALERTS_KEY);
      const dismissedAlerts: string[] = dismissedAlertsJson
        ? JSON.parse(dismissedAlertsJson)
        : [];

      console.log("무시된 알림:", dismissedAlerts.length, "개");

      // API에서 알림 가져오기
      const response = await fetch("/api/health/kcdc/alerts?limit=5").catch((fetchError) => {
        // 네트워크 에러 처리
        console.warn("⚠️ 네트워크 에러:", fetchError);
        console.groupEnd();
        return null;
      });

      // fetch 실패 시 (네트워크 에러 등)
      if (!response) {
        console.log("⚠️ API 요청 실패, 알림을 표시하지 않습니다");
        console.groupEnd();
        return;
      }

      // 404 에러 처리 (API 라우트가 존재하지 않는 경우)
      if (response.status === 404) {
        console.warn("⚠️ KCDC 알림 API를 찾을 수 없습니다 (404). 알림 기능이 비활성화되었을 수 있습니다.");
        console.groupEnd();
        return;
      }

      if (!response.ok) {
        // 404가 아닌 다른 에러
        const errorText = await response.text().catch(() => "응답 본문을 읽을 수 없습니다");
        // HTML 응답인 경우 (404 페이지 등) 첫 200자만 로그
        const truncatedError = errorText.length > 200 
          ? errorText.substring(0, 200) + "..."
          : errorText;
        console.warn("⚠️ 알림 조회 실패:", response.status, truncatedError);
        console.groupEnd();
        return;
      }

      const data = await response.json().catch((jsonError) => {
        console.error("❌ JSON 파싱 실패:", jsonError);
        return { alerts: [] };
      });
      const fetchedAlerts: KcdcAlert[] = data.alerts || [];

      console.log("가져온 알림:", fetchedAlerts.length, "개");

      // 무시되지 않은 알림만 필터링
      const newAlerts = fetchedAlerts.filter(
        (alert) => !dismissedAlerts.includes(alert.id)
      );

      console.log("새 알림:", newAlerts.length, "개");

      if (newAlerts.length > 0) {
        setAlerts(newAlerts);
        setShowPopup(true);
      }

      console.groupEnd();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("❌ KCDC 알림 확인 오류:", errorMessage);
      console.error("❌ 전체 에러 객체:", error);
      console.groupEnd();
    }
  };

  // 컴포넌트 마운트 시 알림 확인
  useEffect(() => {
    // 즉시 실행
    const timer = setTimeout(() => {
      checkAlerts();
    }, 3000); // 3초 후 실행

    // 주기적으로 체크 (6시간마다)
    const interval = setInterval(() => {
      checkAlerts();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [userId]);

  // 사용자 설정이 변경되면 다시 확인
  useEffect(() => {
    if (userSettings && userSettings.kcdcAlerts === false) {
      // 설정이 꺼져있으면 팝업 닫기
      setShowPopup(false);
    }
  }, [userSettings]);

  // 팝업 닫기
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // 알림 무시
  const handleDismissAlert = (alertId: string) => {
    try {
      // 로컬 스토리지에 저장
      const dismissedAlertsJson = localStorage.getItem(DISMISSED_ALERTS_KEY);
      const dismissedAlerts: string[] = dismissedAlertsJson
        ? JSON.parse(dismissedAlertsJson)
        : [];

      if (!dismissedAlerts.includes(alertId)) {
        dismissedAlerts.push(alertId);
        localStorage.setItem(
          DISMISSED_ALERTS_KEY,
          JSON.stringify(dismissedAlerts)
        );
        console.log("알림 무시:", alertId);
      }

      // 알림 목록에서 제거
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error("알림 무시 실패:", error);
    }
  };

  return (
    <>
      {children}
      <KcdcAlertPopup
        alerts={alerts}
        open={showPopup}
        onClose={handleClosePopup}
        onDismiss={handleDismissAlert}
      />
    </>
  );
}
























