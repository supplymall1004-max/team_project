/**
 * @file app/admin/promo-codes/promo-codes-page-client.tsx
 * @description 관리자 프로모션 코드 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 프로모션 코드 목록과 상세 패널 간 상태 동기화
 * 2. 새 프로모션 코드 생성 다이얼로그
 * 3. 반응형 레이아웃 관리
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { PromoCodeTable } from "@/components/admin/promo-codes/promo-code-table";
import { PromoCodeDetailPanel } from "@/components/admin/promo-codes/promo-code-detail-panel";
import { PromoCodeCreateDialog } from "@/components/admin/promo-codes/promo-code-create-dialog";
import { useToast } from "@/hooks/use-toast";
import { listPromoCodes } from "@/actions/admin/promo-codes/list";
import type { PromoCodeListItem } from "@/types/promo-code";

interface PromoCodesPageClientProps {
  initialCodes: PromoCodeListItem[];
}

export function PromoCodesPageClient({ initialCodes }: PromoCodesPageClientProps) {
  const [codes, setCodes] = useState<PromoCodeListItem[]>(initialCodes);
  const [selectedCode, setSelectedCode] = useState<PromoCodeListItem | undefined>();
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCodeListItem | null>(null);
  const { toast } = useToast();

  // 초기 선택: 첫 번째 코드 자동 선택
  useEffect(() => {
    if (codes.length > 0 && !selectedCode) {
      setSelectedCode(codes[0]);
    }
  }, [codes, selectedCode]);

  // 코드 목록 새로고침
  const refreshCodes = useCallback(async () => {
    setIsLoadingCodes(true);
    try {
      console.group("[AdminConsole][PromoCodes][Page]");
      console.log("event", "refresh-codes");

      const result = await listPromoCodes();
      if (result.success) {
        setCodes(result.data);

        // 현재 선택된 코드가 목록에 없으면 선택 해제
        if (selectedCode && !result.data.find(c => c.id === selectedCode.id)) {
          setSelectedCode(undefined);
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
        description: "프로모션 코드 목록 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCodes(false);
      console.groupEnd();
    }
  }, [selectedCode, toast]);

  // 코드 선택 핸들러
  const handleSelectCode = useCallback((code: PromoCodeListItem) => {
    setSelectedCode(code);
  }, []);

  // 코드 업데이트 핸들러
  const handleCodeUpdated = useCallback(async () => {
    await refreshCodes();
  }, [refreshCodes]);

  // 새 코드 생성 핸들러
  const handleCreateCode = useCallback(() => {
    setEditingCode(null);
    setIsCreateDialogOpen(true);
  }, []);

  // 코드 편집 핸들러
  const handleEditCode = useCallback((code: PromoCodeListItem) => {
    setEditingCode(code);
    setIsCreateDialogOpen(true);
  }, []);

  // 생성/수정 성공 핸들러
  const handleCreateSuccess = useCallback(async () => {
    await refreshCodes();
    setIsCreateDialogOpen(false);
    setEditingCode(null);
  }, [refreshCodes]);

  // 코드 삭제 핸들러
  const handleCodeDeleted = useCallback(async () => {
    setSelectedCode(undefined);
    await refreshCodes();
  }, [refreshCodes]);

  return (
    <div className="h-full">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden lg:flex h-full gap-4">
        {/* 좌측: 테이블 */}
        <div className="w-1/2">
          <PromoCodeTable
            codes={codes}
            onSelectCode={handleSelectCode}
            onCreateCode={handleCreateCode}
            isLoading={isLoadingCodes}
            onCodeUpdated={handleCodeUpdated}
          />
        </div>

        {/* 우측: 상세 패널 */}
        <div className="w-1/2">
          <PromoCodeDetailPanel
            selectedCode={selectedCode}
            onEdit={handleEditCode}
            onCodeDeleted={handleCodeDeleted}
          />
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden">
        <PromoCodeTable
          codes={codes}
          onSelectCode={handleSelectCode}
          onCreateCode={handleCreateCode}
          isLoading={isLoadingCodes}
          onCodeUpdated={handleCodeUpdated}
        />
        {selectedCode && (
          <div className="mt-4">
            <PromoCodeDetailPanel
              selectedCode={selectedCode}
              onEdit={handleEditCode}
              onCodeDeleted={handleCodeDeleted}
            />
          </div>
        )}
      </div>

      {/* 생성/수정 다이얼로그 */}
      <PromoCodeCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingCode(null);
          }
        }}
        onSuccess={handleCreateSuccess}
        editingCode={editingCode}
      />
    </div>
  );
}

