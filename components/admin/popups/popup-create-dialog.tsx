/**
 * @file components/admin/popups/popup-create-dialog.tsx
 * @description 팝업 생성/수정 다이얼로그
 *
 * 주요 기능:
 * 1. 제목, 본문, 이미지, 링크 URL 입력
 * 2. 활성 기간 설정
 * 3. 우선순위 설정
 * 4. 실시간 검증
 */

"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { savePopup } from "@/actions/admin/popups/save";
import { ImageUpload } from "./image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const popupFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목은 최대 200자입니다"),
  body: z.string().min(1, "내용을 입력해주세요").max(2000, "내용은 최대 2000자입니다"),
  image_url: z.string().url("올바른 URL 형식이 아닙니다").nullable().optional(),
  link_url: z.string().url("올바른 URL 형식이 아닙니다").nullable().optional().or(z.literal("")),
  active_from: z.string(),
  active_until: z.string().optional(),
  priority: z.number().min(0).max(100),
});

type PopupFormValues = z.infer<typeof popupFormSchema>;

interface PopupCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PopupCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: PopupCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PopupFormValues>({
    resolver: zodResolver(popupFormSchema),
    defaultValues: {
      title: "",
      body: "",
      image_url: null,
      link_url: "",
      active_from: new Date().toISOString().slice(0, 16),
      active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
      priority: 50,
    },
  });

  // 폼 제출
  const onSubmit = useCallback(
    async (data: PopupFormValues) => {
      console.group("[PopupCreateDialog]");
      console.log("event", "submit");
      console.log("title", data.title);

      setIsSubmitting(true);

      try {
        const result = await savePopup({
          title: data.title,
          body: data.body,
          image_url: imageUrl || null,
          link_url: data.link_url || null,
          active_from: new Date(data.active_from).toISOString(),
          active_until: data.active_until
            ? new Date(data.active_until).toISOString()
            : null,
          priority: data.priority,
          target_segments: ["all"],
          metadata: {},
        });

        if (result.success) {
          console.log("save_success", result.data.id);
          toast({
            title: "팝업 생성 완료",
            description: `"${result.data.title}" 팝업이 생성되었습니다.`,
          });

          // 폼 리셋
          form.reset();
          setImageUrl(null);
          onOpenChange(false);

          // 부모 컴포넌트에 성공 알림
          onSuccess?.();
        } else {
          const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
          console.error("save_error", errorMessage);
          toast({
            title: "저장 실패",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("submit_unexpected_error", error);
        toast({
          title: "오류 발생",
          description: "팝업 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        console.groupEnd();
      }
    },
    [imageUrl, form, toast, onOpenChange, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 팝업 생성</DialogTitle>
          <DialogDescription>
            사용자에게 표시될 팝업 공지를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="예: 서비스 오픈 기념 이벤트"
              {...form.register("title")}
              disabled={isSubmitting}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* 본문 */}
          <div className="space-y-2">
            <Label htmlFor="body">본문 *</Label>
            <Textarea
              id="body"
              placeholder="팝업에 표시될 내용을 입력하세요..."
              rows={5}
              {...form.register("body")}
              disabled={isSubmitting}
            />
            {form.formState.errors.body && (
              <p className="text-sm text-destructive">
                {form.formState.errors.body.message}
              </p>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <Label>이미지 (선택)</Label>
            <ImageUpload
              value={imageUrl || undefined}
              onChange={setImageUrl}
              disabled={isSubmitting}
            />
          </div>

          {/* 링크 URL */}
          <div className="space-y-2">
            <Label htmlFor="link_url">링크 URL (선택)</Label>
            <Input
              id="link_url"
              type="url"
              placeholder="https://example.com"
              {...form.register("link_url")}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              팝업 클릭 시 이동할 URL을 입력하세요. 비어있으면 클릭해도 아무 일도 일어나지 않습니다.
            </p>
            {form.formState.errors.link_url && (
              <p className="text-sm text-destructive">
                {form.formState.errors.link_url.message}
              </p>
            )}
          </div>

          {/* 활성 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="active_from">시작일시 *</Label>
              <Input
                id="active_from"
                type="datetime-local"
                {...form.register("active_from")}
                disabled={isSubmitting}
              />
              {form.formState.errors.active_from && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.active_from.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="active_until">종료일시 (선택)</Label>
              <Input
                id="active_until"
                type="datetime-local"
                {...form.register("active_until")}
                disabled={isSubmitting}
              />
              {form.formState.errors.active_until && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.active_until.message}
                </p>
              )}
            </div>
          </div>

          {/* 우선순위 */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              우선순위 (0-100, 높을수록 먼저 표시)
            </Label>
            <Input
              id="priority"
              type="number"
              min={0}
              max={100}
              {...form.register("priority", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {form.formState.errors.priority && (
              <p className="text-sm text-destructive">
                {form.formState.errors.priority.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "생성하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

