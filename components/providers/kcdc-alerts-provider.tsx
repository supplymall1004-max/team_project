/**
 * @file components/providers/kcdc-alerts-provider.tsx
 * @description KCDC 알림 Provider 컴포넌트
 * 
 * 사용자가 사이트에 접속했을 때 자동으로 KCDC 알림 팝업을 표시
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { KcdcAlertPopup } from "@/components/health/kcdc-alert-popup";
import type { KcdcAlert } from "@/types/kcdc";

const DISMISSED_ALERTS_KEY = "kcdc_dismissed_alerts";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6시간

export function KcdcAlertsProvider({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const [alerts, setAlerts] = useState<KcdcAlert[]>([]);
  const { userId } = useAuth();

  // 알림 확인
  const checkAlerts = async () => {
    try {
      console.group("🏥 KCDC 알림 확인");

      // 로컬 스토리지에서 무시된 알림 목록 가져오기
      const dismissedAlertsJson = localStorage.getItem(DISMISSED_ALERTS_KEY);
      const dismissedAlerts: string[] = dismissedAlertsJson
        ? JSON.parse(dismissedAlertsJson)
        : [];

      console.log("무시된 알림:", dismissedAlerts.length, "개");

      // API에서 알림 가져오기
      const response = await fetch("/api/health/kcdc/alerts?limit=5");
      if (!response.ok) {
        console.error("❌ 알림 조회 실패:", response.status);
        console.groupEnd();
        return;
      }

      const data = await response.json();
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
      console.error("❌ KCDC 알림 확인 오류:", error);
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
























