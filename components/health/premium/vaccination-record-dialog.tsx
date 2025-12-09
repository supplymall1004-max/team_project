/**
 * @file components/health/premium/vaccination-record-dialog.tsx
 * @description 예방접종 기록 추가/수정 다이얼로그 (프리미엄 전용)
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
import type { VaccinationRecord } from "@/types/kcdc";

const vaccinationRecordSchema = z.object({
  vaccine_name: z.string().min(1, "백신명을 입력해주세요"),
  vaccine_code: z.string().optional(),
  target_age_group: z.string().optional(),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  dose_number: z.number().min(1, "접종 차수는 1 이상이어야 합니다"),
  total_doses: z.number().min(1, "총 차수는 1 이상이어야 합니다"),
  vaccination_site: z.string().optional(),
  vaccination_site_address: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
  reminder_days_before: z.number().min(1).max(30).default(7),
  notes: z.string().max(500).optional(),
});

type VaccinationRecordFormValues = z.infer<typeof vaccinationRecordSchema>;

interface VaccinationRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: VaccinationRecord | null;
  familyMemberId?: string;
  onSuccess?: () => void;
}

export function VaccinationRecordDialog({
  open,
  onOpenChange,
  record,
  familyMemberId,
  onSuccess,
}: VaccinationRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<VaccinationRecordFormValues>({
    resolver: zodResolver(vaccinationRecordSchema),
    defaultValues: {
      vaccine_name: "",
      vaccine_code: "",
      target_age_group: "",
      scheduled_date: "",
      completed_date: "",
      dose_number: 1,
      total_doses: 1,
      vaccination_site: "",
      vaccination_site_address: "",
      reminder_enabled: true,
      reminder_days_before: 7,
      notes: "",
    },
  });

  // 기존 기록이 있으면 폼에 채우기
  useEffect(() => {
    if (record) {
      form.reset({
        vaccine_name: record.vaccine_name || "",
        vaccine_code: record.vaccine_code || "",
        target_age_group: record.target_age_group || "",
        scheduled_date: record.scheduled_date
          ? new Date(record.scheduled_date).toISOString().split("T")[0]
          : "",
        completed_date: record.completed_date
          ? new Date(record.completed_date).toISOString().split("T")[0]
          : "",
        dose_number: record.dose_number || 1,
        total_doses: record.total_doses || 1,
        vaccination_site: record.vaccination_site || "",
        vaccination_site_address: record.vaccination_site_address || "",
        reminder_enabled: record.reminder_enabled ?? true,
        reminder_days_before: record.reminder_days_before || 7,
        notes: record.notes || "",
      });
    } else {
      form.reset({
        vaccine_name: "",
        vaccine_code: "",
        target_age_group: "",
        scheduled_date: "",
        completed_date: "",
        dose_number: 1,
        total_doses: 1,
        vaccination_site: "",
        vaccination_site_address: "",
        reminder_enabled: true,
        reminder_days_before: 7,
        notes: "",
      });
    }
  }, [record, form]);

  const onSubmit = async (data: VaccinationRecordFormValues) => {
    console.group("[VaccinationRecordDialog] 폼 제출");
    console.log("데이터:", data);

    setIsSubmitting(true);

    try {
      if (record) {
        // 수정
        const response = await fetch(
          `/api/health/kcdc-premium/vaccinations/${record.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vaccine_name: data.vaccine_name,
              vaccine_code: data.vaccine_code,
              target_age_group: data.target_age_group,
              scheduled_date: data.scheduled_date || null,
              completed_date: data.completed_date || null,
              dose_number: data.dose_number,
              total_doses: data.total_doses,
              vaccination_site: data.vaccination_site,
              vaccination_site_address: data.vaccination_site_address,
              reminder_enabled: data.reminder_enabled,
              reminder_days_before: data.reminder_days_before,
              notes: data.notes,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "예방접종 기록 수정에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "예방접종 기록이 수정되었습니다.",
        });
      } else {
        // 생성
        const response = await fetch("/api/health/kcdc-premium/vaccinations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            family_member_id: familyMemberId,
            vaccine_name: data.vaccine_name,
            vaccine_code: data.vaccine_code,
            target_age_group: data.target_age_group,
            scheduled_date: data.scheduled_date || null,
            completed_date: data.completed_date || null,
            dose_number: data.dose_number,
            total_doses: data.total_doses,
            vaccination_site: data.vaccination_site,
            vaccination_site_address: data.vaccination_site_address,
            reminder_enabled: data.reminder_enabled,
            reminder_days_before: data.reminder_days_before,
            notes: data.notes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "예방접종 기록 추가에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "예방접종 기록이 추가되었습니다.",
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
            : "예방접종 기록 저장에 실패했습니다.",
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
            {record ? "예방접종 기록 수정" : "예방접종 기록 추가"}
          </DialogTitle>
          <DialogDescription>
            예방접종 정보를 입력해주세요. 모든 항목은 선택사항입니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vaccine_name">
                백신명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vaccine_name"
                {...form.register("vaccine_name")}
                placeholder="예: 독감, MMR 등"
              />
              {form.formState.errors.vaccine_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.vaccine_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaccine_code">백신 코드</Label>
              <Input
                id="vaccine_code"
                {...form.register("vaccine_code")}
                placeholder="선택사항"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_age_group">대상 연령대</Label>
              <Select
                value={form.watch("target_age_group") || ""}
                onValueChange={(value) =>
                  form.setValue("target_age_group", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="영유아">영유아</SelectItem>
                  <SelectItem value="청소년">청소년</SelectItem>
                  <SelectItem value="성인">성인</SelectItem>
                  <SelectItem value="노인">노인</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dose_number">
                접종 차수 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dose_number"
                type="number"
                min="1"
                {...form.register("dose_number", { valueAsNumber: true })}
              />
              {form.formState.errors.dose_number && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.dose_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_doses">
                총 차수 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="total_doses"
                type="number"
                min="1"
                {...form.register("total_doses", { valueAsNumber: true })}
              />
              {form.formState.errors.total_doses && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.total_doses.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">예정일</Label>
              <Input
                id="scheduled_date"
                type="date"
                {...form.register("scheduled_date")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completed_date">접종일</Label>
              <Input
                id="completed_date"
                type="date"
                {...form.register("completed_date")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vaccination_site">접종 기관</Label>
              <Input
                id="vaccination_site"
                {...form.register("vaccination_site")}
                placeholder="예: 서울시 보건소"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vaccination_site_address">접종 기관 주소</Label>
              <Input
                id="vaccination_site_address"
                {...form.register("vaccination_site_address")}
                placeholder="선택사항"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_days_before">알림 일수 (일 전)</Label>
              <Input
                id="reminder_days_before"
                type="number"
                min="1"
                max="30"
                {...form.register("reminder_days_before", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="추가 정보를 입력하세요"
                rows={3}
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

