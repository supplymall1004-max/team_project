/**
 * @file app/admin/meal-kits/meal-kits-page-client.tsx
 * @description 관리자 밀키트 제품 관리 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 밀키트 목록과 상세 패널 간 상태 동기화
 * 2. 새 밀키트 생성 다이얼로그
 * 3. 반응형 레이아웃 관리
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { MealKitTable } from "@/components/admin/meal-kits/meal-kit-table";
import { MealKitDetailPanel } from "@/components/admin/meal-kits/meal-kit-detail-panel";
import { MealKitCreateDialog } from "@/components/admin/meal-kits/meal-kit-create-dialog";
import { useToast } from "@/hooks/use-toast";
import { listMealKits } from "@/actions/admin/meal-kits/list";
import type { AdminMealKit } from "@/actions/admin/meal-kits/list";

interface MealKitsPageClientProps {
  initialMealKits: AdminMealKit[];
}

export function MealKitsPageClient({ initialMealKits }: MealKitsPageClientProps) {
  const [mealKits, setMealKits] = useState<AdminMealKit[]>(initialMealKits);
  const [selectedMealKit, setSelectedMealKit] = useState<AdminMealKit | undefined>();
  const [isLoadingMealKits, setIsLoadingMealKits] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // 초기 선택: 첫 번째 밀키트 자동 선택
  useEffect(() => {
    if (mealKits.length > 0 && !selectedMealKit) {
      setSelectedMealKit(mealKits[0]);
    }
  }, [mealKits, selectedMealKit]);

  // 밀키트 목록 새로고침
  const refreshMealKits = useCallback(async () => {
    setIsLoadingMealKits(true);
    try {
      console.group("[AdminConsole][MealKits][Page]");
      console.log("event", "refresh-meal-kits");

      const result = await listMealKits();
      if (result.success) {
        setMealKits(result.data);

        // 현재 선택된 밀키트가 목록에 없으면 선택 해제
        if (selectedMealKit && !result.data.find(mk => mk.id === selectedMealKit.id)) {
          setSelectedMealKit(undefined);
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
        description: "밀키트 목록 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMealKits(false);
      console.groupEnd();
    }
  }, [selectedMealKit, toast]);

  // 밀키트 선택 핸들러
  const handleSelectMealKit = useCallback((mealKit: AdminMealKit) => {
    setSelectedMealKit(mealKit);
  }, []);

  // 밀키트 업데이트 핸들러 (편집기에서 저장 성공 시 호출)
  const handleMealKitUpdated = useCallback(async () => {
    await refreshMealKits();
  }, [refreshMealKits]);

  // 새 밀키트 생성 핸들러
  const handleCreateMealKit = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  // 생성 성공 핸들러
  const handleCreateSuccess = useCallback(async () => {
    setIsCreateDialogOpen(false);
    await refreshMealKits();
  }, [refreshMealKits]);

  return (
    <div className="h-full">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex h-full">
        {/* 좌측: 밀키트 테이블 */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <MealKitTable
            mealKits={mealKits}
            selectedMealKit={selectedMealKit}
            onSelectMealKit={handleSelectMealKit}
            onCreateMealKit={handleCreateMealKit}
            isLoading={isLoadingMealKits}
            onRefresh={refreshMealKits}
          />
        </div>

        {/* 우측: 상세 패널 */}
        <div className="w-1/2 overflow-y-auto">
          {selectedMealKit ? (
            <MealKitDetailPanel
              mealKit={selectedMealKit}
              onUpdate={handleMealKitUpdated}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>밀키트를 선택하거나 새로 생성하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="md:hidden h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {selectedMealKit ? (
            <MealKitDetailPanel
              mealKit={selectedMealKit}
              onUpdate={handleMealKitUpdated}
              onBack={() => setSelectedMealKit(undefined)}
            />
          ) : (
            <MealKitTable
              mealKits={mealKits}
              selectedMealKit={selectedMealKit}
              onSelectMealKit={handleSelectMealKit}
              onCreateMealKit={handleCreateMealKit}
              isLoading={isLoadingMealKits}
              onRefresh={refreshMealKits}
            />
          )}
        </div>
      </div>

      {/* 생성 다이얼로그 */}
      <MealKitCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}













