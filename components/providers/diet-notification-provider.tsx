/**
 * @file components/providers/diet-notification-provider.tsx
 * @description 식단 알림 팝업 Provider 컴포넌트
 *
 * 사용자가 사이트에 접속했을 때 자동으로 식단 알림 팝업을 표시하는 Provider
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DietNotificationPopup } from "@/components/diet/diet-notification-popup";
import { useAuth } from "@clerk/nextjs";

export function DietNotificationProvider({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const [dietData, setDietData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [dontShowTodayChecked, setDontShowTodayChecked] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();

  // 알림 표시 여부 확인
  const checkNotification = useCallback(async () => {
    if (!userId) return;

    try {
      console.group("🔔 식단 알림 확인 시작");
      setLoading(true);

      const response = await fetch("/api/diet/notifications/check");
      if (!response.ok) {
        console.error("❌ 알림 확인 실패:", response.status);
        console.groupEnd();
        return;
      }

      const result = await response.json();
      console.log("알림 확인 결과:", result);

      if (result.shouldShow) {
        console.log("✅ 팝업 표시 조건 만족 - 팝업 표시");

        // 팝업 표시 기록 API 호출
        try {
          const recordResponse = await fetch("/api/diet/notifications/dismiss", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shown: true }),
          });

          if (!recordResponse.ok) {
            console.error("❌ 팝업 표시 기록 실패:", recordResponse.status);
          } else {
            console.log("✅ 팝업 표시 기록 성공");
          }
        } catch (error) {
          console.error("❌ 팝업 표시 기록 오류:", error);
        }

        setShowPopup(true);
        setDietData(result);
        setDontShowTodayChecked(false); // 팝업 표시 시 체크박스 초기화
        console.log("✅ 팝업 표시됨 - 체크박스 초기화");
      } else {
        console.log("⚠️ 팝업 표시 조건 불만족:", result.reason);
      }

      console.groupEnd();
    } catch (error) {
      console.error("❌ 알림 확인 오류:", error);
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 컴포넌트 마운트 시 알림 확인 (한 번만)
  useEffect(() => {
    if (userId) {
      console.log("🏠 홈페이지 진입 - 알림 확인 예약 (2초 후)");
      // 페이지 로드 후 약간의 지연을 주어 다른 초기화 작업이 완료되도록 함
      const timer = setTimeout(() => {
        console.log("⏰ 알림 확인 타이머 실행");
        checkNotification();
      }, 2000);

      return () => {
        console.log("🏠 페이지 벗어남 - 타이머 정리");
        clearTimeout(timer);
      };
    } else {
      console.log("👤 사용자 미인증 - 알림 확인 건너뜀");
    }
  }, [userId, checkNotification]);

  // 오늘 하루 보지 않기 토글
  const handleToggleDontShowToday = async () => {
    const newChecked = !dontShowTodayChecked;
    console.log(`🔔 오늘 하루 보지 않기 ${newChecked ? '활성화' : '비활성화'}`);
    setDontShowTodayChecked(newChecked);

    if (newChecked) {
      // 체크되었을 때 즉시 dismiss 처리
      try {
        console.log("🔔 오늘 하루 보지 않기 활성화 - dismissed_date 업데이트");

        const response = await fetch("/api/diet/notifications/dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dismissed: true }),
        });

        if (!response.ok) {
          console.error("❌ 오늘 하루 보지 않기 기록 실패:", response.status);
          // 실패시 체크박스 상태 되돌리기
          setDontShowTodayChecked(false);
        } else {
          console.log("✅ 오늘 하루 보지 않기 기록 성공 - 팝업 닫기");
          // 성공시 팝업 닫기
          setShowPopup(false);
          setDietData(null);
        }
      } catch (error) {
        console.error("❌ 오늘 하루 보지 않기 기록 오류:", error);
        // 실패시 체크박스 상태 되돌리기
        setDontShowTodayChecked(false);
      }
    }
  };

  // 팝업 닫기 (일반 닫기)
  const handleClosePopup = () => {
    setShowPopup(false);
    setDietData(null);
    setDontShowTodayChecked(false); // 팝업 닫을 때 체크박스 초기화
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
        onDismissToday={handleToggleDontShowToday}
        dontShowTodayChecked={dontShowTodayChecked}
        dietData={dietData as any}
        loading={loading}
      />
    </>
  );
}
