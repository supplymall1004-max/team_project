/**
 * @file activity-log-form.tsx
 * @description 활동량 기록 입력 폼 컴포넌트
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
import { Activity, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FieldTooltip } from '@/components/health/help/field-tooltip';
import { BluetoothFormButton } from '@/components/health/devices/bluetooth-form-button';
import { HealthAnalysisCard } from '@/components/health/analysis/health-analysis-card';
import { analyzeActivity } from '@/lib/health/analysis/health-data-analyzer';

const activityLogSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  steps: z.number().min(0).default(0),
  exercise_minutes: z.number().min(0).default(0),
  calories_burned: z.number().min(0).default(0),
  activity_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type ActivityLogFormData = z.infer<typeof activityLogSchema>;

interface ActivityLogFormProps {
  initialData?: Partial<ActivityLogFormData>;
  onSuccess?: () => void;
}

export function ActivityLogForm({ initialData, onSuccess }: ActivityLogFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityAnalysis, setActivityAnalysis] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ActivityLogFormData>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      steps: initialData?.steps || 0,
      exercise_minutes: initialData?.exercise_minutes || 0,
      calories_burned: initialData?.calories_burned || 0,
      activity_type: initialData?.activity_type || null,
      notes: initialData?.notes || null,
    },
  });

  const currentSteps = watch('steps');

  // 블루투스 데이터 수신 핸들러 (활동량은 제한적 지원)
  const handleBluetoothData = (data: any) => {
    console.group('[ActivityLogForm] 블루투스 데이터 수신');
    console.log('받은 데이터:', data);

    // 활동량 데이터는 대부분의 블루투스 기기에서 직접 지원하지 않음
    // 일부 스마트워치는 가능하지만 제한적
    toast({
      title: '활동량 데이터',
      description: '활동량은 대부분의 블루투스 기기에서 직접 지원하지 않습니다. 스마트워치 앱을 통해 동기화하세요.',
      variant: 'default',
    });

    console.groupEnd();
  };

  // 걸음 수가 변경되면 분석 업데이트
  const handleStepsChange = (steps: number) => {
    if (steps > 0) {
      const analysis = analyzeActivity(steps);
      setActivityAnalysis(analysis);
    } else {
      setActivityAnalysis(null);
    }
  };

  const onSubmit = async (data: ActivityLogFormData) => {
    try {
      setIsSubmitting(true);
      console.group('[ActivityLogForm] 활동량 기록 저장');

      const response = await fetch('/api/health/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          steps: Number(data.steps),
          exercise_minutes: Number(data.exercise_minutes),
          calories_burned: Number(data.calories_burned),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '활동량 기록 저장에 실패했습니다.');
      }

      console.log('✅ 활동량 기록 저장 완료:', result.data);
      console.groupEnd();

      toast({
        title: '저장 완료',
        description: '활동량 기록이 저장되었습니다.',
      });

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('❌ 활동량 기록 저장 실패:', error);
      console.groupEnd();

      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '활동량 기록 저장에 실패했습니다.',
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
          <Activity className="h-5 w-5" />
          활동량 기록
        </CardTitle>
        <CardDescription>걸음 수, 운동 시간, 소모 칼로리를 기록하세요</CardDescription>
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

          {/* 걸음 수 */}
          <div>
            <Label htmlFor="steps" className="flex items-center gap-1">
              걸음 수
              <FieldTooltip content="하루 동안 걸은 총 걸음 수를 입력하세요. 권장량은 10,000보입니다. 스마트폰이나 피트니스 기기에서 확인할 수 있습니다." />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="steps"
                type="number"
                min="0"
                placeholder="예: 10000"
                {...register('steps', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    const steps = Number(e.target.value);
                    handleStepsChange(steps);
                  }
                })}
                className={`flex-1 ${errors.steps ? 'border-red-500' : ''}`}
              />
              <BluetoothFormButton
                deviceType="activity"
                onDataReceived={handleBluetoothData}
              />
            </div>
            {errors.steps && (
              <p className="text-sm text-red-500 mt-1">{errors.steps.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              💡 활동량은 대부분의 블루투스 기기에서 직접 지원하지 않습니다. 스마트워치 앱을 통해 동기화하세요.
            </p>
          </div>

          {/* 운동 시간 */}
          <div>
            <Label htmlFor="exercise_minutes" className="flex items-center gap-1">
              운동 시간 (분)
              <FieldTooltip content="중강도 이상의 운동을 한 시간을 분 단위로 입력하세요. 권장량은 주당 150분(하루 평균 30분)입니다." />
            </Label>
            <Input
              id="exercise_minutes"
              type="number"
              min="0"
              placeholder="예: 30"
              {...register('exercise_minutes', { valueAsNumber: true })}
            />
          </div>

          {/* 소모 칼로리 */}
          <div>
            <Label htmlFor="calories_burned">소모 칼로리 (kcal)</Label>
            <Input
              id="calories_burned"
              type="number"
              min="0"
              placeholder="예: 300"
              {...register('calories_burned', { valueAsNumber: true })}
            />
          </div>

          {/* 운동 유형 */}
          <div>
            <Label htmlFor="activity_type">운동 유형 (선택사항)</Label>
            <Input
              id="activity_type"
              type="text"
              placeholder="예: 걷기, 달리기, 자전거 등"
              {...register('activity_type')}
            />
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

        {/* 활동량 분석 결과 표시 */}
        {activityAnalysis && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">활동량 분석</h3>
            <HealthAnalysisCard
              analysis={activityAnalysis}
              title="일일 활동량 분석"
              unit="보"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
