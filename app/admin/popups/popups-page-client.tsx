/**
 * @file app/admin/popups/popups-page-client.tsx
 * @description 관리자 팝업 공지 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 팝업 목록과 상세 패널 간 상태 동기화
 * 2. 새 팝업 생성 다이얼로그
 * 3. 반응형 레이아웃 관리
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { PopupTable } from "@/components/admin/popups/popup-table";
import { PopupDetailPanel } from "@/components/admin/popups/popup-detail-panel";
import { PopupCreateDialog } from "@/components/admin/popups/popup-create-dialog";
import { useToast } from "@/hooks/use-toast";
import { listPopups } from "@/actions/admin/popups/list";
import type { AdminPopupAnnouncement } from "@/actions/admin/popups/list";

interface PopupsPageClientProps {
  initialPopups: AdminPopupAnnouncement[];
}

export function PopupsPageClient({ initialPopups }: PopupsPageClientProps) {
  const [popups, setPopups] = useState<AdminPopupAnnouncement[]>(initialPopups);
  const [selectedPopup, setSelectedPopup] = useState<AdminPopupAnnouncement | undefined>();
  const [isLoadingPopups, setIsLoadingPopups] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // 초기 선택: 첫 번째 팝업 자동 선택
  useEffect(() => {
    if (popups.length > 0 && !selectedPopup) {
      setSelectedPopup(popups[0]);
    }
  }, [popups, selectedPopup]);

  // 팝업 목록 새로고침
  const refreshPopups = useCallback(async () => {
    setIsLoadingPopups(true);
    try {
      console.group("[AdminConsole][Popups][Page]");
      console.log("event", "refresh-popups");

      const result = await listPopups();
      if (result.success) {
        setPopups(result.data);

        // 현재 선택된 팝업이 목록에 없으면 선택 해제
        if (selectedPopup && !result.data.find(p => p.id === selectedPopup.id)) {
          setSelectedPopup(undefined);
        }

        console.log("refresh_success", result.total);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "목록 로드 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("refresh_error", errorMessage);
      }
    } catch (error) {
      console.error("refresh_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "팝업 목록 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPopups(false);
      console.groupEnd();
    }
  }, [selectedPopup, toast]);

  // 팝업 선택 핸들러
  const handleSelectPopup = useCallback((popup: AdminPopupAnnouncement) => {
    setSelectedPopup(popup);
  }, []);

  // 팝업 업데이트 핸들러 (편집기에서 저장 성공 시 호출)
  const handlePopupUpdated = useCallback(async () => {
    await refreshPopups();
  }, [refreshPopups]);

  // 새 팝업 생성 핸들러
  const handleCreatePopup = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  // 생성 성공 핸들러
  const handleCreateSuccess = useCallback(async () => {
    await refreshPopups();
  }, [refreshPopups]);

  return (
    <div className="h-full">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex h-full">
        {/* 좌측 테이블 */}
        <div className="w-1/2 border-r border-gray-200">
          <PopupTable
            popups={popups}
            onSelectPopup={handleSelectPopup}
            onCreatePopup={handleCreatePopup}
            isLoading={isLoadingPopups}
            onPopupUpdated={handlePopupUpdated}
          />
        </div>

        {/* 우측 상세 패널 */}
        <div className="w-1/2">
          <PopupDetailPanel
            key={selectedPopup?.id || 'no-selection'}
            selectedPopup={selectedPopup}
            onPopupUpdated={handlePopupUpdated}
          />
        </div>
      </div>

      {/* 모바일 레이아웃 - 단순 테이블 (임시) */}
      <div className="md:hidden h-full">
        <PopupTable
          key="mobile-table"
          popups={popups}
          onSelectPopup={handleSelectPopup}
          onCreatePopup={handleCreatePopup}
          isLoading={isLoadingPopups}
          onPopupUpdated={handlePopupUpdated}
        />
      </div>

      {/* 새 팝업 생성 다이얼로그 */}
      <PopupCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}


