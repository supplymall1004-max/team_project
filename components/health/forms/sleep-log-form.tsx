/**
 * @file sleep-log-form.tsx
 * @description 수면 기록 입력 폼 컴포넌트
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FieldTooltip } from '@/components/health/help/field-tooltip';

const sleepLogSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  sleep_duration_minutes: z.number().min(0).max(1440).optional().nullable(),
  sleep_quality_score: z.number().min(1).max(10).optional().nullable(),
  deep_sleep_minutes: z.number().min(0).optional().nullable(),
  light_sleep_minutes: z.number().min(0).optional().nullable(),
  rem_sleep_minutes: z.number().min(0).optional().nullable(),
  bedtime: z.string().optional().nullable(),
  wake_time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type SleepLogFormData = z.infer<typeof sleepLogSchema>;

interface SleepLogFormProps {
  initialData?: Partial<SleepLogFormData>;
  onSuccess?: () => void;
}

export function SleepLogForm({ initialData, onSuccess }: SleepLogFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SleepLogFormData>({
    resolver: zodResolver(sleepLogSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      sleep_duration_minutes: initialData?.sleep_duration_minutes || null,
      sleep_quality_score: initialData?.sleep_quality_score || null,
      deep_sleep_minutes: initialData?.deep_sleep_minutes || null,
      light_sleep_minutes: initialData?.light_sleep_minutes || null,
      rem_sleep_minutes: initialData?.rem_sleep_minutes || null,
      bedtime: initialData?.bedtime || null,
      wake_time: initialData?.wake_time || null,
      notes: initialData?.notes || null,
    },
  });

  const onSubmit = async (data: SleepLogFormData) => {
    try {
      setIsSubmitting(true);
      console.group('[SleepLogForm] 수면 기록 저장');

      const response = await fetch('/api/health/sleep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          sleep_duration_minutes: data.sleep_duration_minutes ? Number(data.sleep_duration_minutes) : null,
          sleep_quality_score: data.sleep_quality_score ? Number(data.sleep_quality_score) : null,
          deep_sleep_minutes: data.deep_sleep_minutes ? Number(data.deep_sleep_minutes) : null,
          light_sleep_minutes: data.light_sleep_minutes ? Number(data.light_sleep_minutes) : null,
          rem_sleep_minutes: data.rem_sleep_minutes ? Number(data.rem_sleep_minutes) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '수면 기록 저장에 실패했습니다.');
      }

      console.log('✅ 수면 기록 저장 완료:', result.data);
      console.groupEnd();

      toast({
        title: '저장 완료',
        description: '수면 기록이 저장되었습니다.',
      });

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('❌ 수면 기록 저장 실패:', error);
      console.groupEnd();

      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '수면 기록 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          수면 기록
        </CardTitle>
        <CardDescription>수면 시간과 품질을 기록하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 날짜 */}
          <div>
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* 수면 시간 (시간 단위로 입력) */}
          <div>
            <Label htmlFor="sleep_hours" className="flex items-center gap-1">
              수면 시간 (시간)
              <FieldTooltip content="권장 수면 시간: 성인 기준 7-9시간. 시간 단위로 입력하면 자동으로 분으로 변환됩니다." />
            </Label>
            <Input
              id="sleep_hours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="예: 7.5"
              onChange={(e) => {
                const hours = parseFloat(e.target.value);
                if (!isNaN(hours)) {
                  setValue('sleep_duration_minutes', Math.round(hours * 60));
                }
              }}
            />
            {watch('sleep_duration_minutes') && (
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round((watch('sleep_duration_minutes') || 0) / 60 * 10) / 10}시간
                ({watch('sleep_duration_minutes')}분)
              </p>
            )}
          </div>

          {/* 수면 품질 점수 */}
          <div>
            <Label htmlFor="sleep_quality_score" className="flex items-center gap-1">
              수면 품질 점수 (1-10)
              <FieldTooltip content="수면의 전반적인 만족도를 1-10점으로 평가하세요. 1점은 매우 나쁨, 10점은 매우 좋음입니다." />
            </Label>
            <Input
              id="sleep_quality_score"
              type="number"
              min="1"
              max="10"
              placeholder="1-10"
              {...register('sleep_quality_score', { valueAsNumber: true })}
            />
            {errors.sleep_quality_score && (
              <p className="text-sm text-red-500 mt-1">{errors.sleep_quality_score.message}</p>
            )}
          </div>

          {/* 취침/기상 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bedtime">취침 시간</Label>
              <Input
                id="bedtime"
                type="time"
                {...register('bedtime')}
              />
            </div>
            <div>
              <Label htmlFor="wake_time">기상 시간</Label>
              <Input
                id="wake_time"
                type="time"
                {...register('wake_time')}
              />
            </div>
          </div>

          {/* 수면 단계 (선택사항) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="deep_sleep_minutes">깊은 수면 (분)</Label>
              <Input
                id="deep_sleep_minutes"
                type="number"
                min="0"
                placeholder="분"
                {...register('deep_sleep_minutes', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="light_sleep_minutes">얕은 수면 (분)</Label>
              <Input
                id="light_sleep_minutes"
                type="number"
                min="0"
                placeholder="분"
                {...register('light_sleep_minutes', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="rem_sleep_minutes">REM 수면 (분)</Label>
              <Input
                id="rem_sleep_minutes"
                type="number"
                min="0"
                placeholder="분"
                {...register('rem_sleep_minutes', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <Label htmlFor="notes">메모</Label>
            <Input
              id="notes"
              type="text"
              placeholder="특이사항을 입력하세요"
              {...register('notes')}
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
