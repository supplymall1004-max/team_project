/**
 * @file components/admin/popups/popup-preview-modal.tsx
 * @description 팝업 미리보기 모달 컴포넌트
 *
 * 주요 기능:
 * 1. 실제 사용자에게 표시될 팝업의 모습을 미리보기
 * 2. 이미지, 제목, 본문, 링크 URL 포함
 */

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AdminPopupAnnouncement } from "@/actions/admin/popups/list";

interface PopupPreviewModalProps {
  popup: AdminPopupAnnouncement;
  isOpen: boolean;
  onClose: () => void;
}

export function PopupPreviewModal({ popup, isOpen, onClose }: PopupPreviewModalProps) {
  if (!isOpen) return null;

  console.group("[PopupPreviewModal]");
  console.log("popup_id", popup.id);
  console.log("popup_title", popup.title);
  console.log("has_image", !!popup.image_url);
  console.log("has_link", !!popup.link_url);
  console.groupEnd();

  return (
    <DialogContent className="sm:max-w-[500px] p-0">
      {/* 이미지 (있는 경우) */}
      {popup.image_url && (
        <div className="relative w-full h-48 bg-gray-100">
          <img
            src={popup.image_url}
            alt={popup.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* 제목 */}
        <DialogHeader className="mb-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 pr-8">
              {popup.title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">닫기</span>
            </button>
          </div>
          <DialogDescription className="sr-only">
            팝업 공지 미리보기
          </DialogDescription>
        </DialogHeader>

        {/* 본문 */}
        <div className="mb-6">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {popup.body}
          </p>
        </div>

        {/* 링크 정보 (있는 경우) */}
        {popup.link_url && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 font-medium mb-1">
              클릭 시 이동할 링크:
            </p>
            <p className="text-xs text-blue-600 break-all">
              {popup.link_url}
            </p>
          </div>
        )}

        {/* 하단 액션 영역 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Checkbox id="preview-hide-today" disabled />
            <Label
              htmlFor="preview-hide-today"
              className="text-sm text-gray-500 cursor-not-allowed"
            >
              오늘 하루 그만보기
            </Label>
          </div>

          <Button
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            닫기
          </Button>
        </div>

        {/* 미리보기 안내 */}
        <p className="mt-4 text-xs text-center text-gray-400">
          * 이것은 미리보기입니다. 실제 팝업과 약간 다를 수 있습니다.
        </p>
      </div>
    </DialogContent>
  );
}
