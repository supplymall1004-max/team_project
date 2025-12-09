/**
 * @file components/health/premium/periodic-service-dialog.tsx
 * @description 주기적 건강 관리 서비스 추가/수정 다이얼로그 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { PeriodicHealthService, PeriodicServiceType, CycleType } from "@/types/kcdc";

const periodicServiceSchema = z.object({
  service_type: z.enum(["vaccination", "checkup", "deworming", "disease_management", "other"]),
  service_name: z.string().min(1, "서비스명을 입력해주세요"),
  cycle_type: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"]),
  cycle_days: z.number().min(1).optional().nullable(),
  last_service_date: z.string().optional().nullable(),
  reminder_days_before: z.number().min(1).max(30).default(7),
  reminder_enabled: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

type PeriodicServiceFormValues = z.infer<typeof periodicServiceSchema>;

interface PeriodicServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: PeriodicHealthService | null;
  familyMemberId?: string;
  onSuccess?: () => void;
}

export function PeriodicServiceDialog({
  open,
  onOpenChange,
  service,
  familyMemberId,
  onSuccess,
}: PeriodicServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PeriodicServiceFormValues>({
    resolver: zodResolver(periodicServiceSchema),
    defaultValues: {
      service_type: "vaccination",
      service_name: "",
      cycle_type: "yearly",
      cycle_days: null,
      last_service_date: null,
      reminder_days_before: 7,
      reminder_enabled: true,
      notes: null,
    },
  });

  const cycleType = form.watch("cycle_type");

  useEffect(() => {
    if (service) {
      form.reset({
        service_type: service.service_type,
        service_name: service.service_name,
        cycle_type: service.cycle_type,
        cycle_days: service.cycle_days || null,
        last_service_date: service.last_service_date
          ? new Date(service.last_service_date).toISOString().split("T")[0]
          : null,
        reminder_days_before: service.reminder_days_before,
        reminder_enabled: service.reminder_enabled,
        notes: service.notes || null,
      });
    } else {
      form.reset({
        service_type: "vaccination",
        service_name: "",
        cycle_type: "yearly",
        cycle_days: null,
        last_service_date: null,
        reminder_days_before: 7,
        reminder_enabled: true,
        notes: null,
      });
    }
  }, [service, form]);

  const onSubmit = async (data: PeriodicServiceFormValues) => {
    console.group("[PeriodicServiceDialog] 폼 제출");
    console.log("데이터:", data);

    setIsSubmitting(true);

    try {
      // custom 주기인 경우 cycle_days 필수
      if (data.cycle_type === "custom" && !data.cycle_days) {
        throw new Error("사용자 정의 주기인 경우 주기 일수를 입력해주세요.");
      }

      if (service) {
        // 수정
        const response = await fetch(
          `/api/health/kcdc-premium/periodic-services/${service.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              service_name: data.service_name,
              cycle_type: data.cycle_type,
              cycle_days: data.cycle_days || null,
              last_service_date: data.last_service_date || null,
              reminder_days_before: data.reminder_days_before,
              reminder_enabled: data.reminder_enabled,
              notes: data.notes || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "서비스 수정에 실패했습니다.");
        }

        toast({
          title: "성공",
          description: "서비스가 수정되었습니다.",
        });
      } else {
        // 생성
        const requestBody = {
          family_member_id: familyMemberId,
          service_type: data.service_type,
          service_name: data.service_name,
          cycle_type: data.cycle_type,
          cycle_days: data.cycle_days || null,
          last_service_date: data.last_service_date || null,
          reminder_days_before: data.reminder_days_before,
          reminder_enabled: data.reminder_enabled,
          notes: data.notes || null,
        };

        console.log("📤 API 요청:", requestBody);

        const response = await fetch("/api/health/kcdc-premium/periodic-services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("📥 API 응답 상태:", response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error("❌ API 오류 응답:", errorData);
          throw new Error(errorData.message || "서비스 추가에 실패했습니다.");
        }

        const result = await response.json();
        console.log("✅ API 성공 응답:", result);

        toast({
          title: "성공",
          description: "서비스가 추가되었습니다.",
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
          error instanceof Error ? error.message : "서비스 저장에 실패했습니다.",
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
            {service ? "주기적 서비스 수정" : "주기적 서비스 추가"}
          </DialogTitle>
          <DialogDescription>
            주기적으로 수행해야 하는 건강 관리 서비스를 등록하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">
                서비스 유형 <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="service_type">
                      <SelectValue placeholder="서비스 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vaccination">예방접종</SelectItem>
                      <SelectItem value="checkup">건강검진</SelectItem>
                      <SelectItem value="deworming">구충제</SelectItem>
                      <SelectItem value="disease_management">질병관리</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.service_type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.service_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_name">
                서비스명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service_name"
                {...form.register("service_name")}
                placeholder="예: 독감 예방접종, 위암 검진 등"
              />
              {form.formState.errors.service_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.service_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cycle_type">
                주기 유형 <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={form.control}
                name="cycle_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="cycle_type">
                      <SelectValue placeholder="주기 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                      <SelectItem value="monthly">매월</SelectItem>
                      <SelectItem value="quarterly">분기별</SelectItem>
                      <SelectItem value="yearly">매년</SelectItem>
                      <SelectItem value="custom">사용자 정의</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.cycle_type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cycle_type.message}
                </p>
              )}
            </div>

            {cycleType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="cycle_days">
                  주기 일수 <span className="text-destructive">*</span>
                </Label>
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
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_service_date">마지막 서비스일</Label>
            <Input
              id="last_service_date"
              type="date"
              {...form.register("last_service_date")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder_days_before">알림 일수 전</Label>
              <Input
                id="reminder_days_before"
                type="number"
                min="1"
                max="30"
                {...form.register("reminder_days_before", {
                  valueAsNumber: true,
                })}
              />
              {form.formState.errors.reminder_days_before && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.reminder_days_before.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Controller
                control={form.control}
                name="reminder_enabled"
                render={({ field }) => (
                  <Checkbox
                    id="reminder_enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="reminder_enabled" className="cursor-pointer">
                알림 활성화
              </Label>
            </div>
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
              {isSubmitting ? "저장 중..." : service ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

