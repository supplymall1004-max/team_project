/**
 * @file components/popup-announcements-modal.tsx
 * @description 팝업 공지사항 모달 컴포넌트
 *
 * 관리자 콘솔에서 생성한 팝업 공지사항을 사용자에게 표시하는 모달
 */

"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminPopupAnnouncement } from "@/actions/admin/popups/list";

interface PopupAnnouncementsModalProps {
  popup: AdminPopupAnnouncement;
  isOpen: boolean;
  onClose: () => void;
  totalPopups: number;
  currentIndex: number;
}

export function PopupAnnouncementsModal({
  popup,
  isOpen,
  onClose,
  totalPopups,
  currentIndex,
}: PopupAnnouncementsModalProps) {
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 이전 팝업으로 이동하는 로직은 Provider에서 처리
    console.log("Previous popup requested");
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 다음 팝업으로 이동하는 로직은 Provider에서 처리
    console.log("Next popup requested");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto">
        <div className="relative">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">공지사항</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 본문 */}
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">{popup.title}</h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
              {popup.body}
            </div>

            {/* 메타 정보 */}
            <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
              <span>
                {new Date(popup.active_from).toLocaleDateString('ko-KR')}
                {popup.active_until && ` ~ ${new Date(popup.active_until).toLocaleDateString('ko-KR')}`}
              </span>
              <div className="flex items-center gap-2">
                {popup.priority > 50 && (
                  <Badge variant="secondary" className="text-xs">
                    중요
                  </Badge>
                )}
                {totalPopups > 1 && (
                  <span className="text-xs">
                    {currentIndex + 1} / {totalPopups}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 p-4 border-t bg-gray-50">
            {totalPopups > 1 && currentIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </Button>
            )}
            <Button
              onClick={onClose}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {currentIndex < totalPopups - 1 ? (
                <>
                  다음
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "확인"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
























