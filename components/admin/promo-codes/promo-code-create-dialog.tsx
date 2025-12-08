/**
 * @file components/admin/promo-codes/promo-code-create-dialog.tsx
 * @description 프로모션 코드 생성/수정 다이얼로그
 *
 * 주요 기능:
 * 1. 프로모션 코드 생성 및 수정
 * 2. 할인 타입 및 값 설정
 * 3. 유효 기간 및 사용 제한 설정
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPromoCode } from "@/actions/admin/promo-codes/create";
import { updatePromoCode } from "@/actions/admin/promo-codes/update";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { PromoCodeListItem } from "@/types/promo-code";

const promoCodeFormSchema = z.object({
  code: z.string().min(1, "코드를 입력해주세요").max(50, "코드는 최대 50자입니다"),
  discount_type: z.enum(["percentage", "fixed_amount", "free_trial"]),
  discount_value: z.number().min(1, "할인 값은 1 이상이어야 합니다"),
  max_uses: z.number().min(1).nullable().optional(),
  valid_from: z.string(),
  valid_until: z.string(),
  applicable_plans: z.array(z.enum(["monthly", "yearly"])).nullable().optional(),
  new_users_only: z.boolean().default(false),
  description: z.string().max(500).optional(),
});

type PromoCodeFormValues = z.infer<typeof promoCodeFormSchema>;

interface PromoCodeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingCode?: PromoCodeListItem | null;
}

export function PromoCodeCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  editingCode,
}: PromoCodeCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const { toast } = useToast();

  const isEditing = !!editingCode;

  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: null,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      applicable_plans: null,
      new_users_only: false,
      description: "",
    },
  });

  // 편집 모드일 때 폼 초기화
  useEffect(() => {
    if (editingCode && open) {
      form.reset({
        code: editingCode.code,
        discount_type: editingCode.discount_type,
        discount_value: editingCode.discount_value,
        max_uses: editingCode.max_uses,
        valid_from: new Date(editingCode.valid_from).toISOString().slice(0, 16),
        valid_until: new Date(editingCode.valid_until).toISOString().slice(0, 16),
        applicable_plans: editingCode.applicable_plans,
        new_users_only: editingCode.new_users_only,
        description: editingCode.description || "",
      });
      setSelectedPlans(editingCode.applicable_plans || []);
    } else if (!editingCode && open) {
      form.reset({
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        max_uses: null,
        valid_from: new Date().toISOString().slice(0, 16),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        applicable_plans: null,
        new_users_only: false,
        description: "",
      });
      setSelectedPlans([]);
    }
  }, [editingCode, open, form]);

  // 폼 제출
  const onSubmit = useCallback(
    async (data: PromoCodeFormValues) => {
      console.group("[PromoCodeCreateDialog]");
      console.log("event", "submit");
      console.log("isEditing", isEditing);
      console.log("code", data.code);

      setIsSubmitting(true);

      try {
        // datetime-local 형식을 ISO 8601 형식으로 변환
        const validFrom = new Date(data.valid_from).toISOString();
        const validUntil = new Date(data.valid_until).toISOString();

        const submitData = {
          ...data,
          valid_from: validFrom,
          valid_until: validUntil,
          applicable_plans: selectedPlans.length > 0 ? selectedPlans as ("monthly" | "yearly")[] : null,
        };

        const result = isEditing && editingCode
          ? await updatePromoCode({
              id: editingCode.id,
              ...submitData,
            })
          : await createPromoCode(submitData);

        if (result.success) {
          toast({
            title: isEditing ? "수정 완료" : "생성 완료",
            description: `프로모션 코드 "${data.code}"가 ${isEditing ? "수정" : "생성"}되었습니다.`,
          });
          onSuccess?.();
          onOpenChange(false);
          console.log("submit_success");
        } else {
          const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
          toast({
            title: isEditing ? "수정 실패" : "생성 실패",
            description: errorMessage,
            variant: "destructive",
          });
          console.error("submit_error", errorMessage);
        }
      } catch (error) {
        console.error("submit_unexpected_error", error);
        toast({
          title: "오류 발생",
          description: "프로모션 코드 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        console.groupEnd();
      }
    },
    [isEditing, editingCode, selectedPlans, toast, onSuccess, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "프로모션 코드 수정" : "새 프로모션 코드 생성"}</DialogTitle>
          <DialogDescription>
            프로모션 코드를 생성하고 할인 설정을 구성하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 코드 */}
          <div className="space-y-2">
            <Label htmlFor="code">프로모션 코드 *</Label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="예: WELCOME2025"
              className="font-mono uppercase"
              disabled={isEditing}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>

          {/* 할인 타입 및 값 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_type">할인 타입 *</Label>
              <Select
                value={form.watch("discount_type")}
                onValueChange={(value) => form.setValue("discount_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">퍼센트 할인</SelectItem>
                  <SelectItem value="fixed_amount">고정 금액 할인</SelectItem>
                  <SelectItem value="free_trial">무료 체험</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                할인 값 * 
                {form.watch("discount_type") === "percentage" && " (%)"}
                {form.watch("discount_type") === "fixed_amount" && " (원)"}
                {form.watch("discount_type") === "free_trial" && " (일)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                {...form.register("discount_value", { valueAsNumber: true })}
                min={1}
              />
              {form.formState.errors.discount_value && (
                <p className="text-sm text-destructive">{form.formState.errors.discount_value.message}</p>
              )}
            </div>
          </div>

          {/* 최대 사용 횟수 */}
          <div className="space-y-2">
            <Label htmlFor="max_uses">최대 사용 횟수 (비워두면 무제한)</Label>
            <Input
              id="max_uses"
              type="number"
              {...form.register("max_uses", { 
                setValueAs: (v) => v === "" || v === null ? null : Number(v),
                valueAsNumber: true 
              })}
              min={1}
              placeholder="무제한"
            />
          </div>

          {/* 유효 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_from">유효 시작일 *</Label>
              <Input
                id="valid_from"
                type="datetime-local"
                {...form.register("valid_from")}
              />
              {form.formState.errors.valid_from && (
                <p className="text-sm text-destructive">{form.formState.errors.valid_from.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">유효 종료일 *</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                {...form.register("valid_until")}
              />
              {form.formState.errors.valid_until && (
                <p className="text-sm text-destructive">{form.formState.errors.valid_until.message}</p>
              )}
            </div>
          </div>

          {/* 적용 가능 플랜 */}
          <div className="space-y-2">
            <Label>적용 가능 플랜 (비워두면 모두 적용)</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plan_monthly"
                  checked={selectedPlans.includes("monthly")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlans([...selectedPlans, "monthly"]);
                    } else {
                      setSelectedPlans(selectedPlans.filter(p => p !== "monthly"));
                    }
                  }}
                />
                <Label htmlFor="plan_monthly" className="cursor-pointer">월간 플랜</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plan_yearly"
                  checked={selectedPlans.includes("yearly")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlans([...selectedPlans, "yearly"]);
                    } else {
                      setSelectedPlans(selectedPlans.filter(p => p !== "yearly"));
                    }
                  }}
                />
                <Label htmlFor="plan_yearly" className="cursor-pointer">연간 플랜</Label>
              </div>
            </div>
          </div>

          {/* 신규 사용자 전용 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="new_users_only"
              {...form.register("new_users_only")}
            />
            <Label htmlFor="new_users_only" className="cursor-pointer">신규 사용자 전용</Label>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="프로모션 코드에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : isEditing ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

