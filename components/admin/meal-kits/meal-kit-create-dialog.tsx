/**
 * @file components/admin/meal-kits/meal-kit-create-dialog.tsx
 * @description 밀키트 생성 다이얼로그
 *
 * 주요 기능:
 * 1. 새 밀키트 제품 정보 입력
 * 2. 실시간 검증
 */

"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { saveMealKit } from "@/actions/admin/meal-kits/save";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { MealType } from "@/types/health";

const mealKitFormSchema = z.object({
  name: z.string().min(1, "제품명을 입력해주세요").max(200, "제품명은 최대 200자입니다"),
  description: z.string().max(1000, "설명은 최대 1000자입니다").optional(),
  image_url: z.string().url("올바른 URL 형식이 아닙니다").nullable().optional().or(z.literal("")),
  price: z.number().min(0, "가격은 0원 이상이어야 합니다"),
  serving_size: z.number().min(1, "인분 수는 1 이상이어야 합니다"),
  calories: z.number().min(0).nullable().optional(),
  protein: z.number().min(0).nullable().optional(),
  carbs: z.number().min(0).nullable().optional(),
  fat: z.number().min(0).nullable().optional(),
  category: z.enum(["korean", "western", "japanese", "chinese", "fusion", "other"]).optional(),
  meal_type: z.array(z.enum(["breakfast", "lunch", "dinner", "snack"])).default([]),
  purchase_url: z.string().url("올바른 URL 형식이 아닙니다").nullable().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  is_premium_only: z.boolean().default(true),
});

type MealKitFormValues = z.infer<typeof mealKitFormSchema>;

interface MealKitCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MealKitCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: MealKitCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const { toast } = useToast();

  const form = useForm<MealKitFormValues>({
    resolver: zodResolver(mealKitFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
      price: 0,
      serving_size: 1,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      category: "other",
      meal_type: [],
      purchase_url: "",
      is_active: true,
      is_premium_only: true,
    },
  });

  // 식사 타입 토글
  const handleMealTypeToggle = useCallback((mealType: MealType) => {
    setMealTypes(prev => {
      const newMealTypes = prev.includes(mealType)
        ? prev.filter(mt => mt !== mealType)
        : [...prev, mealType];
      form.setValue("meal_type", newMealTypes);
      return newMealTypes;
    });
  }, [form]);

  // 폼 제출
  const onSubmit = useCallback(
    async (data: MealKitFormValues) => {
      console.group("[MealKitCreateDialog]");
      console.log("event", "submit");
      console.log("name", data.name);

      setIsSubmitting(true);

      try {
        const result = await saveMealKit({
          name: data.name,
          description: data.description || null,
          image_url: data.image_url || null,
          price: data.price,
          serving_size: data.serving_size,
          calories: data.calories || null,
          protein: data.protein || null,
          carbs: data.carbs || null,
          fat: data.fat || null,
          category: data.category || "other",
          meal_type: mealTypes,
          purchase_url: data.purchase_url || null,
          is_active: data.is_active,
          is_premium_only: data.is_premium_only,
        });

        if (result.success) {
          toast({
            title: "생성 완료",
            description: `"${data.name}"이 생성되었습니다.`,
          });
          form.reset();
          setMealTypes([]);
          onOpenChange(false);
          onSuccess?.();
          console.log("create_success", result.data.id);
        } else {
          const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
          toast({
            title: "생성 실패",
            description: errorMessage,
            variant: "destructive",
          });
          console.error("create_error", errorMessage);
        }
      } catch (error) {
        console.error("create_unexpected_error", error);
        toast({
          title: "오류 발생",
          description: "밀키트 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        console.groupEnd();
      }
    },
    [form, mealTypes, toast, onOpenChange, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 밀키트 제품 생성</DialogTitle>
          <DialogDescription>
            밀키트 제품 정보를 입력하세요. 필수 항목은 *로 표시되어 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                제품명 * <span className="text-muted-foreground text-xs">(최대 200자)</span>
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="예: 한식 밀키트 세트"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">
                설명 <span className="text-muted-foreground text-xs">(최대 1000자)</span>
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="제품에 대한 설명을 입력하세요"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">가격 (원) *</Label>
                <Input
                  id="price"
                  type="number"
                  {...form.register("price", { valueAsNumber: true })}
                  placeholder="0"
                  min={0}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="serving_size">인분 수 *</Label>
                <Input
                  id="serving_size"
                  type="number"
                  {...form.register("serving_size", { valueAsNumber: true })}
                  placeholder="1"
                  min={1}
                />
                {form.formState.errors.serving_size && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.serving_size.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category">카테고리</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="korean">한식</SelectItem>
                  <SelectItem value="western">양식</SelectItem>
                  <SelectItem value="japanese">일식</SelectItem>
                  <SelectItem value="chinese">중식</SelectItem>
                  <SelectItem value="fusion">퓨전</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>식사 타입</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => (
                  <div key={mealType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-meal-type-${mealType}`}
                      checked={mealTypes.includes(mealType)}
                      onCheckedChange={() => handleMealTypeToggle(mealType)}
                    />
                    <Label
                      htmlFor={`create-meal-type-${mealType}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {mealType === "breakfast" ? "아침" : mealType === "lunch" ? "점심" : mealType === "dinner" ? "저녁" : "간식"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 이미지 및 링크 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="image_url">이미지 URL</Label>
              <Input
                id="image_url"
                type="url"
                {...form.register("image_url")}
                placeholder="https://example.com/image.jpg"
              />
              {form.formState.errors.image_url && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.image_url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="purchase_url">구매 링크</Label>
              <Input
                id="purchase_url"
                type="url"
                {...form.register("purchase_url")}
                placeholder="https://example.com/product"
              />
              {form.formState.errors.purchase_url && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.purchase_url.message}
                </p>
              )}
            </div>
          </div>

          {/* 영양 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold">영양 정보 (선택사항)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">칼로리 (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  {...form.register("calories", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="protein">단백질 (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  {...form.register("protein", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="carbs">탄수화물 (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  {...form.register("carbs", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="fat">지방 (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  {...form.register("fat", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 설정 */}
          <div className="space-y-4">
            <h3 className="font-semibold">설정</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_is_active"
                checked={form.watch("is_active")}
                onCheckedChange={(checked) => form.setValue("is_active", checked as boolean)}
              />
              <Label htmlFor="create_is_active" className="text-sm font-normal cursor-pointer">
                활성 상태
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_is_premium_only"
                checked={form.watch("is_premium_only")}
                onCheckedChange={(checked) => form.setValue("is_premium_only", checked as boolean)}
              />
              <Label htmlFor="create_is_premium_only" className="text-sm font-normal cursor-pointer">
                프리미엄 전용
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

















