/**
 * @file components/providers/popup-announcements-provider.tsx
 * @description 팝업 공지사항 Provider 컴포넌트
 *
 * 사용자가 사이트에 접속했을 때 활성 팝업 공지사항을 표시하는 Provider
 * 팝업 공지와 식단 알림 팝업은 별도로 관리됨
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { revalidateTag } from "next/cache";
import { PopupAnnouncementsModal } from "@/components/popup-announcements-modal";
import { useAuth } from "@clerk/nextjs";
import type { AdminPopupAnnouncement } from "@/actions/admin/popups/list";

interface PopupAnnouncementsProviderProps {
  children: React.ReactNode;
}

export function PopupAnnouncementsProvider({ children }: PopupAnnouncementsProviderProps) {
  const [activePopups, setActivePopups] = useState<AdminPopupAnnouncement[]>([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { userId, isLoaded } = useAuth();

  // 활성 팝업 공지사항 조회
  const fetchActivePopups = useCallback(async () => {
    if (!userId) return;

    try {
      console.group("[PopupProvider] fetching active popups");
      setIsLoading(true);

      // 팝업 공지사항 조회 API 호출 (아직 구현되지 않음)
      // const response = await fetch("/api/popup-announcements/active", {
      //   next: { tags: ["popup-announcements"] }
      // });

      // 임시로 빈 배열 반환
      const popups: AdminPopupAnnouncement[] = [];
      setActivePopups(popups);

      if (popups.length > 0) {
        setCurrentPopupIndex(0);
      }

      console.log("active popups fetched", popups.length);
      console.groupEnd();
    } catch (error) {
      console.error("[PopupProvider] fetch error", error);
      console.groupEnd();
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 컴포넌트 마운트 시 활성 팝업 조회
  useEffect(() => {
    if (isLoaded && userId) {
      // 약간의 지연을 주어 다른 초기화 작업이 완료되도록 함
      const timer = setTimeout(() => {
        fetchActivePopups();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, userId, fetchActivePopups]);

  // 팝업 닫기
  const handleClosePopup = () => {
    if (currentPopupIndex < activePopups.length - 1) {
      // 다음 팝업 표시
      setCurrentPopupIndex(prev => prev + 1);
    } else {
      // 모든 팝업 표시 완료
      setActivePopups([]);
      setCurrentPopupIndex(0);
    }
  };

  // 팝업 캐시 무효화 (관리자 콘솔에서 팝업 변경 시 호출)
  const invalidatePopupCache = () => {
    revalidateTag("popup-announcements");
    fetchActivePopups();
  };

  // 현재 표시할 팝업
  const currentPopup = activePopups[currentPopupIndex];

  return (
    <>
      {children}

      {currentPopup && (
        <PopupAnnouncementsModal
          popup={currentPopup}
          isOpen={true}
          onClose={handleClosePopup}
          totalPopups={activePopups.length}
          currentIndex={currentPopupIndex}
        />
      )}
    </>
  );
}
















