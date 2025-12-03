"use client";

/**
 * @file components/admin/copy/copy-create-dialog.tsx
 * @description 새 블록을 생성하는 다이얼로그 컴포넌트
 *
 * 주요 기능:
 * 1. 텍스트 슬롯 선택
 * 2. 선택한 슬롯의 기본값 표시 및 수정
 * 3. 새 블록 생성 API 호출
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SlotSelector } from "@/components/admin/copy/slot-selector";
import { getSlotBySlug } from "@/actions/admin/copy/slots";
import { upsertCopyBlock } from "@/actions/admin/copy/upsert";
import { useToast } from "@/hooks/use-toast";

interface CopyCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockCreated: () => void;
  existingSlugs: string[];
}

export function CopyCreateDialog({
  isOpen,
  onClose,
  onBlockCreated,
  existingSlugs,
}: CopyCreateDialogProps) {
  const { toast } = useToast();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [contentJson, setContentJson] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 선택한 슬롯이 변경되면 기본 콘텐츠 표시
  useEffect(() => {
    if (selectedSlug) {
      const slot = getSlotBySlug(selectedSlug);
      if (slot) {
        setContentJson(JSON.stringify(slot.defaultContent, null, 2));
      }
    } else {
      setContentJson("");
    }
  }, [selectedSlug]);

  // 다이얼로그 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedSlug(null);
      setContentJson("");
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!selectedSlug) {
      toast({
        title: "슬롯 선택 필요",
        description: "텍스트 위치를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // JSON 유효성 검사
    try {
      JSON.parse(contentJson);
    } catch {
      toast({
        title: "JSON 형식 오류",
        description: "콘텐츠가 올바른 JSON 형식이 아닙니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    console.group("[CopyCreateDialog] handleSave");
    console.log("selectedSlug", selectedSlug);
    console.log("contentJson", contentJson);

    try {
      const slot = getSlotBySlug(selectedSlug);
      if (!slot) {
        throw new Error("슬롯을 찾을 수 없습니다.");
      }

      const result = await upsertCopyBlock({
        slug: selectedSlug,
        content: JSON.parse(contentJson),
        locale: "ko", // 기본 언어 설정
      });

      console.log("upsertCopyBlock result", result);
      console.groupEnd();

      if (result.success) {
        toast({
          title: "블록 생성 완료",
          description: `"${slot.label}" 블록이 생성되었습니다.`,
        });
        onBlockCreated();
        onClose();
      } else {
        const errorMessage = "error" in result ? result.error : "블록 생성 실패";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("handleSave error", error);
      console.groupEnd();
      toast({
        title: "블록 생성 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedSlug, contentJson, toast, onBlockCreated, onClose]);

  const selectedSlotData = selectedSlug ? getSlotBySlug(selectedSlug) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 블록 만들기</DialogTitle>
          <DialogDescription>
            홈페이지에서 관리할 텍스트 위치를 선택하고, 기본 내용을 수정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 슬롯 선택 */}
          <SlotSelector
            existingSlugs={existingSlugs}
            selectedSlug={selectedSlug}
            onSlugSelect={setSelectedSlug}
          />

          {/* 콘텐츠 편집 */}
          {selectedSlug && selectedSlotData && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="content" className="text-base font-semibold">
                  콘텐츠 수정
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  JSON 형식으로 콘텐츠를 수정하세요. 저장 후 배포하면 홈페이지에 반영됩니다.
                </p>
              </div>
              <Textarea
                id="content"
                value={contentJson}
                onChange={(e) => setContentJson(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                💡 팁: 위의 기본값을 참고하여 필요한 부분만 수정하세요.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!selectedSlug || isSaving}>
            {isSaving ? "저장 중..." : "블록 생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

