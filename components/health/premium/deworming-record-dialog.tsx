/**
 * @file components/health/premium/deworming-record-dialog.tsx
 * @description 구충제 복용 기록 추가/수정 다이얼로그 (프리미엄 전용)
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
import { useToast } from "@/hooks/use-toast";
import type { DewormingRecord } from "@/types/kcdc";

const dewormingRecordSchema = z.object({
  medication_name: z.string().min(1, "구충제명을 입력해주세요"),
  dosage: z.string().min(1, "복용량을 입력해주세요"),
  taken_date: z.string().min(1, "복용일을 선택해주세요"),
  cycle_days: z.number().min(1).default(90),
  prescribed_by: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

type DewormingRecordFormValues = z.infer<typeof dewormingRecordSchema>;

interface DewormingRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: DewormingRecord | null;
  familyMemberId?: string;
  onSuccess?: () => void;
}

export function DewormingRecordDialog({
  open,
  onOpenChange,
  record,
  familyMemberId,
  onSuccess,
}: DewormingRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DewormingRecordFormValues>({
    resolver: zodResolver(dewormingRecordSchema),
    defaultValues: {
      medication_name: "",
      dosage: "",
      taken_date: "",
      cycle_days: 90,
      prescribed_by: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        medication_name: record.medication_name || "",
        dosage: record.dosage || "",
        taken_date: record.taken_date
          ? new Date(record.taken_date).toISOString().split("T")[0]
          : "",
        cycle_days: record.cycle_days || 90,
        prescribed_by: record.prescribed_by || null,
        notes: record.notes || null,
      });
    } else {
      form.reset({
        medication_name: "",
        dosage: "",
        taken_date: "",
        cycle_days: 90,
        prescribed_by: null,
        notes: null,
      });
    }
  }, [record, form]);

  const onSubmit = async (data: DewormingRecordFormValues) => {
    console.group("[DewormingRecordDialog] 폼 제출");
    console.log("데이터:", data);

    setIsSubmitting(true);

    try {
      if (record) {
        // 수정
        const response = await fetch(
          `/api/health/kcdc-premium/deworming/records/${record.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              medication_name: data.medication_name,
              dosage: data.dosage,
              taken_date: data.taken_date,
              cycle_days: data.cycle_days,
              prescribed_by: data.prescribed_by || null,
              notes: data.notes || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "기록 수정에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "기록이 수정되었습니다.",
        });
      } else {
        // 생성
        const response = await fetch("/api/health/kcdc-premium/deworming/records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            family_member_id: familyMemberId,
            medication_name: data.medication_name,
            dosage: data.dosage,
            taken_date: data.taken_date,
            cycle_days: data.cycle_days,
            prescribed_by: data.prescribed_by || null,
            notes: data.notes || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "기록 추가에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "기록이 추가되었습니다.",
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
          error instanceof Error ? error.message : "기록 저장에 실패했습니다.",
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
            {record ? "구충제 복용 기록 수정" : "구충제 복용 기록 추가"}
          </DialogTitle>
          <DialogDescription>
            구충제 복용 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medication_name">
                구충제명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="medication_name"
                {...form.register("medication_name")}
                placeholder="예: 알벤다졸, 메벤다졸 등"
              />
              {form.formState.errors.medication_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.medication_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">
                복용량 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dosage"
                {...form.register("dosage")}
                placeholder="예: 400mg"
              />
              {form.formState.errors.dosage && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.dosage.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taken_date">
                복용일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="taken_date"
                type="date"
                {...form.register("taken_date")}
              />
              {form.formState.errors.taken_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.taken_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycle_days">복용 주기 (일)</Label>
              <Input
                id="cycle_days"
                type="number"
                min="1"
                {...form.register("cycle_days", {
                  valueAsNumber: true,
                })}
                placeholder="예: 90"
              />
              {form.formState.errors.cycle_days && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cycle_days.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescribed_by">처방 의사/기관</Label>
            <Input
              id="prescribed_by"
              {...form.register("prescribed_by")}
              placeholder="예: 서울대학교병원"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="추가 정보를 입력하세요"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : record ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

