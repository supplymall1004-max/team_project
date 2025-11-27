/**
 * @file components/providers/diet-notification-provider.tsx
 * @description 식단 알림 팝업 Provider 컴포넌트
 *
 * 사용자가 사이트에 접속했을 때 자동으로 식단 알림 팝업을 표시하는 Provider
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DietNotificationPopup } from "@/components/diet/diet-notification-popup";
import { useAuth } from "@clerk/nextjs";

export function DietNotificationProvider({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const [dietData, setDietData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();

  // 알림 표시 여부 확인 (임시 비활성화 - API 아직 구현되지 않음)
  const checkNotification = async () => {
    if (!userId) return;

    try {
      console.group("🔔 식단 알림 확인 시작");
      console.log("⚠️ 알림 기능이 아직 구현되지 않았습니다. 추후 업데이트에서 제공될 예정입니다.");

      // TODO: API 구현 후 활성화
      // const response = await fetch("/api/diet/notifications/check");
      // if (!response.ok) {
      //   console.error("❌ 알림 확인 실패:", response.status);
      //   console.groupEnd();
      //   return;
      // }
      // const result = await response.json();
      // ...

      console.log("ℹ️ 알림 확인 건너뜀 (기능 미구현)");
      console.groupEnd();
    } catch (error) {
      console.error("❌ 알림 확인 오류:", error);
      console.groupEnd();
    }
  };

  // 컴포넌트 마운트 시 알림 확인 (한 번만)
  useEffect(() => {
    if (userId) {
      // 페이지 로드 후 약간의 지연을 주어 다른 초기화 작업이 완료되도록 함
      const timer = setTimeout(() => {
        checkNotification();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [userId]);

  // 팝업 닫기
  const handleClosePopup = () => {
    setShowPopup(false);
    setDietData(null);
  };

  // 식단 상세 페이지로 이동
  const handleViewDiet = () => {
    setShowPopup(false);
    // 오늘 날짜로 식단 페이지 이동
    const today = new Date().toISOString().split("T")[0];
    router.push(`/health/family/diet/${today}`);
  };

  return (
    <>
      {children}

      <DietNotificationPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        onViewDiet={handleViewDiet}
        dietData={dietData}
        loading={loading}
      />
    </>
  );
}
