/**
 * @file components/game/baby-feeding-schedule-form.tsx
 * @description 아기 분유 스케줄 설정 폼 컴포넌트
 *
 * 사용자가 아기 분유 먹일 시간 간격을 설정할 수 있는 폼입니다.
 *
 * @dependencies
 * - react-hook-form: 폼 관리
 * - zod: 유효성 검사
 * - @/components/ui: shadcn 컴포넌트
 * - @/actions/game/baby-feeding: Server Actions
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Baby } from "lucide-react";
import {
  upsertBabyFeedingScheduleAction,
  getBabyFeedingScheduleAction,
  deactivateBabyFeedingScheduleAction,
} from "@/actions/game/baby-feeding";
import { useToast } from "@/hooks/use-toast";
import type { BabyFeedingSchedule } from "@/types/game/character-game-events";

const babyFeedingSchema = z.object({
  feeding_interval_hours: z
    .number()
    .min(1, "최소 1시간 이상이어야 합니다")
    .max(12, "최대 12시간까지 설정 가능합니다"),
  reminder_enabled: z.boolean().default(true),
  reminder_minutes_before: z.number().min(0).max(60).default(10),
  notes: z.string().optional(),
});

type BabyFeedingFormData = z.infer<typeof babyFeedingSchema>;

interface BabyFeedingScheduleFormProps {
  familyMemberId: string;
  familyMemberName: string;
  onSuccess?: () => void;
}

/**
 * 아기 분유 스케줄 설정 폼 컴포넌트
 */
export function BabyFeedingScheduleForm({
  familyMemberId,
  familyMemberName,
  onSuccess,
}: BabyFeedingScheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [existingSchedule, setExistingSchedule] = useState<BabyFeedingSchedule | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BabyFeedingFormData>({
    resolver: zodResolver(babyFeedingSchema),
    defaultValues: {
      feeding_interval_hours: 3.0,
      reminder_enabled: true,
      reminder_minutes_before: 10,
      notes: "",
    },
  });

  const reminderEnabled = watch("reminder_enabled");

  // 기존 스케줄 조회
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const schedule = await getBabyFeedingScheduleAction(familyMemberId);
        if (schedule) {
          setExistingSchedule(schedule);
          setValue("feeding_interval_hours", schedule.feeding_interval_hours);
          setValue("reminder_enabled", schedule.reminder_enabled);
          setValue("reminder_minutes_before", schedule.reminder_minutes_before);
          setValue("notes", schedule.notes || "");
        }
      } catch (error) {
        console.error("분유 스케줄 조회 실패:", error);
      }
    };

    loadSchedule();
  }, [familyMemberId, setValue]);

  // 폼 제출
  const onSubmit = async (data: BabyFeedingFormData) => {
    try {
      setIsLoading(true);
      console.group("[BabyFeedingScheduleForm] 분유 스케줄 저장");
      console.log("data:", data);

      await upsertBabyFeedingScheduleAction({
        family_member_id: familyMemberId,
        feeding_interval_hours: data.feeding_interval_hours,
        reminder_enabled: data.reminder_enabled,
        reminder_minutes_before: data.reminder_minutes_before,
        notes: data.notes || null,
      });

      console.log("✅ 분유 스케줄 저장 완료");
      console.groupEnd();

      toast({
        title: "저장 완료",
        description: `${familyMemberName}의 분유 스케줄이 저장되었습니다.`,
      });

      onSuccess?.();
    } catch (error) {
      console.error("❌ 분유 스케줄 저장 실패:", error);
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : "분유 스케줄 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 스케줄 비활성화
  const handleDeactivate = async () => {
    if (!confirm("분유 스케줄을 비활성화하시겠습니까?")) {
      return;
    }

    try {
      setIsDeactivating(true);
      await deactivateBabyFeedingScheduleAction(familyMemberId);

      toast({
        title: "비활성화 완료",
        description: "분유 스케줄이 비활성화되었습니다.",
      });

      setExistingSchedule(null);
      onSuccess?.();
    } catch (error) {
      console.error("❌ 분유 스케줄 비활성화 실패:", error);
      toast({
        title: "비활성화 실패",
        description: error instanceof Error ? error.message : "분유 스케줄 비활성화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-pink-500" />
          <CardTitle>{familyMemberName} 분유 스케줄 설정</CardTitle>
        </div>
        <CardDescription>
          분유를 먹일 시간 간격을 설정하면 자동으로 알림이 발생합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 분유 간격 설정 */}
          <div className="space-y-2">
            <Label htmlFor="feeding_interval_hours">
              분유 먹일 시간 간격 (시간)
            </Label>
            <Input
              id="feeding_interval_hours"
              type="number"
              step="0.5"
              min="1"
              max="12"
              {...register("feeding_interval_hours", { valueAsNumber: true })}
              placeholder="예: 3.0 (3시간마다)"
            />
            {errors.feeding_interval_hours && (
              <p className="text-sm text-red-500">{errors.feeding_interval_hours.message}</p>
            )}
            <p className="text-sm text-gray-500">
              예: 3.0을 입력하면 3시간마다 분유를 먹일 시간 알림이 발생합니다.
            </p>
          </div>

          {/* 알림 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminder_enabled">알림 활성화</Label>
                <p className="text-sm text-gray-500">
                  분유 시간이 되면 게임에서 알림이 발생합니다.
                </p>
              </div>
              <Switch
                id="reminder_enabled"
                checked={reminderEnabled}
                onCheckedChange={(checked) => setValue("reminder_enabled", checked)}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder_minutes_before">
                  알림 시간 (분 전)
                </Label>
                <Input
                  id="reminder_minutes_before"
                  type="number"
                  min="0"
                  max="60"
                  {...register("reminder_minutes_before", { valueAsNumber: true })}
                  placeholder="예: 10 (10분 전 알림)"
                />
                {errors.reminder_minutes_before && (
                  <p className="text-sm text-red-500">{errors.reminder_minutes_before.message}</p>
                )}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="notes">메모 (선택사항)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="분유 관련 특이사항을 입력하세요..."
              rows={3}
            />
          </div>

          {/* 다음 분유 시간 표시 */}
          {existingSchedule?.next_feeding_time && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                다음 분유 시간
              </p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {new Date(existingSchedule.next_feeding_time).toLocaleString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
            {existingSchedule?.is_active && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    비활성화 중...
                  </>
                ) : (
                  "비활성화"
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

