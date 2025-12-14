/**
 * @file components/health/premium/checkup-record-dialog.tsx
 * @description 건강검진 기록 추가/수정 다이얼로그 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { HealthCheckupRecord, CheckupType } from "@/types/kcdc";

const checkupRecordSchema = z.object({
  checkup_type: z.enum(["national", "cancer", "special"]),
  checkup_date: z.string().min(1, "검진일을 선택해주세요"),
  checkup_site: z.string().optional(),
  checkup_site_address: z.string().optional(),
  next_recommended_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type CheckupRecordFormValues = z.infer<typeof checkupRecordSchema>;

interface CheckupRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: HealthCheckupRecord | null;
  familyMemberId?: string;
  onSuccess?: () => void;
}

const CHECKUP_TYPE_LABELS: Record<CheckupType, string> = {
  national: "국가건강검진",
  cancer: "암검진",
  special: "특수검진",
};

export function CheckupRecordDialog({
  open,
  onOpenChange,
  record,
  familyMemberId,
  onSuccess,
}: CheckupRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CheckupRecordFormValues>({
    resolver: zodResolver(checkupRecordSchema),
    defaultValues: {
      checkup_type: "national",
      checkup_date: "",
      checkup_site: "",
      checkup_site_address: "",
      next_recommended_date: "",
      notes: "",
    },
  });

  // 기존 기록이 있으면 폼에 채우기
  useEffect(() => {
    if (record) {
      form.reset({
        checkup_type: record.checkup_type,
        checkup_date: new Date(record.checkup_date)
          .toISOString()
          .split("T")[0],
        checkup_site: record.checkup_site || "",
        checkup_site_address: record.checkup_site_address || "",
        next_recommended_date: record.next_recommended_date
          ? new Date(record.next_recommended_date).toISOString().split("T")[0]
          : "",
        notes: (record as any).notes || "",
      });
    } else {
      form.reset({
        checkup_type: "national",
        checkup_date: "",
        checkup_site: "",
        checkup_site_address: "",
        next_recommended_date: "",
        notes: "",
      });
    }
  }, [record, form]);

  const onSubmit = async (data: CheckupRecordFormValues) => {
    console.group("[CheckupRecordDialog] 폼 제출");
    console.log("데이터:", data);

    setIsSubmitting(true);

    try {
      if (record) {
        // 수정
        const response = await fetch(
          `/api/health/kcdc-premium/checkups/records/${record.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              checkup_type: data.checkup_type,
              checkup_date: data.checkup_date,
              checkup_site: data.checkup_site || null,
              checkup_site_address: data.checkup_site_address || null,
              next_recommended_date: data.next_recommended_date || null,
              notes: data.notes || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "건강검진 기록 수정에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "건강검진 기록이 수정되었습니다.",
        });
      } else {
        // 생성
        const response = await fetch(
          "/api/health/kcdc-premium/checkups/records",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              family_member_id: familyMemberId,
              checkup_type: data.checkup_type,
              checkup_date: data.checkup_date,
              checkup_site: data.checkup_site || null,
              checkup_site_address: data.checkup_site_address || null,
              next_recommended_date: data.next_recommended_date || null,
              notes: data.notes || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "건강검진 기록 추가에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "건강검진 기록이 추가되었습니다.",
        });
      }

      console.log("✅ 성공");
      console.groupEnd();

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("❌ 실패:", error);
      console.groupEnd();

      toast({
        title: "오류",
        description:
          error instanceof Error
            ? error.message
            : "건강검진 기록 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {record ? "건강검진 기록 수정" : "건강검진 기록 추가"}
          </DialogTitle>
          <DialogDescription>
            건강검진 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkup_type">
                검진 유형 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("checkup_type")}
                onValueChange={(value) =>
                  form.setValue("checkup_type", value as CheckupType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">
                    {CHECKUP_TYPE_LABELS.national}
                  </SelectItem>
                  <SelectItem value="cancer">
                    {CHECKUP_TYPE_LABELS.cancer}
                  </SelectItem>
                  <SelectItem value="special">
                    {CHECKUP_TYPE_LABELS.special}
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.checkup_type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.checkup_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkup_date">
                검진일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="checkup_date"
                type="date"
                {...form.register("checkup_date")}
              />
              {form.formState.errors.checkup_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.checkup_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="checkup_site">검진 기관</Label>
              <Input
                id="checkup_site"
                {...form.register("checkup_site")}
                placeholder="예: 서울대학교병원"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="checkup_site_address">검진 기관 주소</Label>
              <Input
                id="checkup_site_address"
                {...form.register("checkup_site_address")}
                placeholder="선택사항"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_recommended_date">다음 권장일</Label>
              <Input
                id="next_recommended_date"
                type="date"
                {...form.register("next_recommended_date")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="검진 결과 요약 또는 추가 정보를 입력하세요"
                rows={4}
              />
            </div>
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
              {isSubmitting
                ? "저장 중..."
                : record
                  ? "수정"
                  : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

