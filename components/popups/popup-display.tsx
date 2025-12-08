/**
 * @file components/popups/popup-display.tsx
 * @description 사용자 화면에 표시되는 팝업 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 활성화된 팝업 자동 표시
 * 2. 오늘 하루 그만보기 기능
 * 3. 링크 클릭 시 이동
 * 4. 여러 팝업 순차 표시
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckpointBanner } from "@/components/checkpoint-banner";

interface PopupData {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  priority: number;
  display_type: "modal" | "checkpoint";
}

interface PopupDisplayProps {
  popups: PopupData[];
}

// 로컬 스토리지 키
const HIDE_POPUP_KEY_PREFIX = "hide_popup_until_";

// 오늘 하루 그만보기 설정
function hidePopupUntilTomorrow(popupId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // 자정으로 설정
  
  localStorage.setItem(
    `${HIDE_POPUP_KEY_PREFIX}${popupId}`,
    tomorrow.getTime().toString()
  );
}

// 팝업이 숨겨져 있는지 확인
function isPopupHidden(popupId: string): boolean {
  const hideUntil = localStorage.getItem(`${HIDE_POPUP_KEY_PREFIX}${popupId}`);
  if (!hideUntil) return false;
  
  const hideUntilTime = parseInt(hideUntil, 10);
  const now = Date.now();
  
  if (now > hideUntilTime) {
    // 기간이 지났으면 로컬 스토리지에서 삭제
    localStorage.removeItem(`${HIDE_POPUP_KEY_PREFIX}${popupId}`);
    return false;
  }
  
  return true;
}

export function PopupDisplay({ popups }: PopupDisplayProps) {
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);
  const [visiblePopups, setVisiblePopups] = useState<PopupData[]>([]);

  // 표시 가능한 팝업 필터링
  useEffect(() => {
    console.group("[PopupDisplay]");
    console.log("total_popups", popups.length);

    const filtered = popups.filter((popup) => {
      const hidden = isPopupHidden(popup.id);
      console.log("popup", popup.id, popup.title, "hidden", hidden, "display_type", popup.display_type);
      return !hidden;
    });

    console.log("visible_popups", filtered.length);
    setVisiblePopups(filtered);

    // 모달 타입 팝업만 자동으로 열기 (체크포인트는 별도 처리)
    const modalPopups = filtered.filter(p => p.display_type === "modal");
    if (modalPopups.length > 0) {
      setIsOpen(true);
      setCurrentPopupIndex(0);
    }

    console.groupEnd();
  }, [popups]);

  const currentPopup = visiblePopups[currentPopupIndex];
  
  // 체크포인트 배너 팝업들
  const checkpointPopups = visiblePopups.filter(p => p.display_type === "checkpoint");

  // 팝업 닫기
  const handleClose = useCallback(() => {
    console.group("[PopupDisplay]");
    console.log("event", "close");
    console.log("popup_id", currentPopup?.id);
    console.log("hide_today", hideToday);

    // 오늘 하루 그만보기 체크되어 있으면 저장
    if (hideToday && currentPopup) {
      hidePopupUntilTomorrow(currentPopup.id);
      console.log("hidden_until_tomorrow", currentPopup.id);
    }

    // 다음 팝업이 있으면 표시
    if (currentPopupIndex < visiblePopups.length - 1) {
      setCurrentPopupIndex(currentPopupIndex + 1);
      setHideToday(false); // 체크박스 리셋
      console.log("showing_next_popup", currentPopupIndex + 1);
    } else {
      // 모든 팝업을 다 봤으면 닫기
      setIsOpen(false);
      console.log("all_popups_closed");
    }

    console.groupEnd();
  }, [currentPopup, hideToday, currentPopupIndex, visiblePopups.length]);

  // 팝업 클릭 (링크가 있으면 이동)
  const handlePopupClick = useCallback(() => {
    if (!currentPopup?.link_url) return;

    console.group("[PopupDisplay]");
    console.log("event", "click");
    console.log("link_url", currentPopup.link_url);

    // 링크로 이동
    window.open(currentPopup.link_url, "_blank", "noopener,noreferrer");

    console.groupEnd();
  }, [currentPopup]);

  // 체크포인트 배너 렌더링
  const checkpointBanners = checkpointPopups.map((popup) => {
    // 체크포인트 배너용 닫기 핸들러 (팝업 시스템과 호환)
    const handleCheckpointClose = () => {
      hidePopupUntilTomorrow(popup.id);
      console.log("체크포인트 배너 닫기:", popup.id);
    };

    return (
      <CheckpointBanner
        key={popup.id}
        title={popup.title}
        message={popup.body}
        actionUrl={popup.link_url || undefined}
        storageKey={`hide_popup_until_${popup.id}`}
        shouldShow={!isPopupHidden(popup.id)}
        onClose={handleCheckpointClose}
        onAction={() => {
          if (popup.link_url) {
            window.open(popup.link_url, "_blank", "noopener,noreferrer");
          }
        }}
      />
    );
  });

  // 모달 팝업이 없으면 체크포인트 배너만 표시
  if (!isOpen || !currentPopup || currentPopup.display_type !== "modal") {
    return (
      <>
        {checkpointBanners}
      </>
    );
  }

  return (
    <>
      {checkpointBanners}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()} // 외부 클릭으로 닫기 방지
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-xl">{currentPopup.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {currentPopup.body || "팝업 공지사항"}
          </DialogDescription>
        </DialogHeader>

        {/* 팝업 내용 - 링크가 있으면 클릭 가능 */}
        <div
          onClick={handlePopupClick}
          className={currentPopup.link_url ? "cursor-pointer" : ""}
        >
          {/* 이미지 */}
          {currentPopup.image_url && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={currentPopup.image_url}
                alt={currentPopup.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* 본문 */}
          <DialogDescription className="text-base whitespace-pre-wrap">
            {currentPopup.body}
          </DialogDescription>

          {/* 링크 힌트 */}
          {currentPopup.link_url && (
            <p className="text-xs text-muted-foreground mt-4">
              📎 클릭하면 자세한 내용을 확인할 수 있습니다
            </p>
          )}
        </div>

        {/* 하단: 오늘 하루 그만보기 + 닫기 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hide-today"
              checked={hideToday}
              onCheckedChange={(checked) => setHideToday(checked === true)}
            />
            <Label
              htmlFor="hide-today"
              className="text-sm font-normal cursor-pointer"
            >
              오늘 하루 그만보기
            </Label>
          </div>

          <div className="flex items-center gap-2">
            {/* 여러 팝업이 있을 때 표시 */}
            {visiblePopups.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {currentPopupIndex + 1} / {visiblePopups.length}
              </span>
            )}

            <Button onClick={handleClose} variant="default">
              {currentPopupIndex < visiblePopups.length - 1 ? "다음" : "닫기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

























