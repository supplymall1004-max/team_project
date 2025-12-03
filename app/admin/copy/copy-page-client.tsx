/**
 * @file app/admin/copy/copy-page-client.tsx
 * @description 관리자 페이지 문구 편집 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 블록 목록과 편집기 간 상태 동기화
 * 2. 새 블록 생성 다이얼로그
 * 3. 반응형 레이아웃 관리
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { CopyListPanel } from "@/components/admin/copy/copy-list-panel";
import { AdminCopyEditor } from "@/components/admin/copy/admin-copy-editor";
import { CopyCreateDialog } from "@/components/admin/copy/copy-create-dialog";
import { useToast } from "@/hooks/use-toast";
import { listCopyBlocks } from "@/actions/admin/copy/list";
import type { AdminCopyBlock } from "@/actions/admin/copy/list";

interface CopyPageClientProps {
  initialBlocks: AdminCopyBlock[];
}

export function CopyPageClient({ initialBlocks }: CopyPageClientProps) {
  const [blocks, setBlocks] = useState<AdminCopyBlock[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<AdminCopyBlock | undefined>();
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // 초기 선택: 첫 번째 블록 자동 선택
  useEffect(() => {
    if (blocks.length > 0 && !selectedBlock) {
      setSelectedBlock(blocks[0]);
    }
  }, [blocks, selectedBlock]);

  // 블록 목록 새로고침
  const refreshBlocks = useCallback(async () => {
    setIsLoadingBlocks(true);
    try {
      console.group("[AdminConsole][Copy][Page]");
      console.log("event", "refresh-blocks");

      const result = await listCopyBlocks();
      if (result.success) {
        setBlocks(result.data);

        // 현재 선택된 블록이 목록에 없으면 선택 해제
        if (selectedBlock && !result.data.find(b => b.id === selectedBlock.id)) {
          setSelectedBlock(undefined);
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
        description: "블록 목록 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBlocks(false);
      console.groupEnd();
    }
  }, [selectedBlock, toast]);

  // 블록 선택 핸들러
  const handleSelectBlock = useCallback((block: AdminCopyBlock) => {
    setSelectedBlock(block);
  }, []);

  // 블록 업데이트 핸들러 (편집기에서 저장 성공 시 호출)
  const handleBlockUpdated = useCallback((updatedBlock: AdminCopyBlock) => {
    setBlocks(prev => prev.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    ));
    setSelectedBlock(updatedBlock);
  }, []);

  // 새 블록 생성 핸들러
  const handleCreateBlock = useCallback(() => {
    console.log("[CopyPageClient] handleCreateBlock: opening dialog");
    setIsCreateDialogOpen(true);
  }, []);

  // 새 블록 생성 완료 핸들러
  const handleBlockCreated = useCallback(() => {
    console.log("[CopyPageClient] handleBlockCreated: refreshing blocks");
    refreshBlocks();
  }, [refreshBlocks]);

  return (
    <div className="h-full">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex h-full">
        {/* 좌측 패널 */}
        <div className="w-80 border-r border-gray-200">
          <CopyListPanel
            blocks={blocks}
            selectedBlockId={selectedBlock?.id}
            onSelectBlock={handleSelectBlock}
            onCreateBlock={handleCreateBlock}
            isLoading={isLoadingBlocks}
          />
        </div>

        {/* 우측 편집기 */}
        <div className="flex-1">
          <AdminCopyEditor
            key={selectedBlock?.id || 'no-selection'}
            selectedBlock={selectedBlock}
            onBlockUpdated={handleBlockUpdated}
          />
        </div>
      </div>

      {/* 모바일 레이아웃 - 단순 목록 (임시) */}
      <div className="md:hidden h-full">
        <CopyListPanel
          key="mobile-list"
          blocks={blocks}
          selectedBlockId={selectedBlock?.id}
          onSelectBlock={handleSelectBlock}
          onCreateBlock={handleCreateBlock}
          isLoading={isLoadingBlocks}
        />
      </div>

      {/* 새 블록 생성 다이얼로그 */}
      <CopyCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onBlockCreated={handleBlockCreated}
        existingSlugs={blocks.map(b => b.slug)}
      />
    </div>
  );
}


