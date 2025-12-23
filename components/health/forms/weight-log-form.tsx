/**
 * @file weight-log-form.tsx
 * @description 체중 기록 입력 폼 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FieldTooltip } from '@/components/health/help/field-tooltip';
import { BluetoothFormButton } from '@/components/health/devices/bluetooth-form-button';
import { HealthAnalysisCard } from '@/components/health/analysis/health-analysis-card';
import { analyzeWeight } from '@/lib/health/analysis/health-data-analyzer';
import { getHealthProfile } from '@/actions/health/profile';

const weightLogSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  weight_kg: z.number().min(20).max(300, '체중은 20-300kg 범위여야 합니다'),
  body_fat_percentage: z.number().min(0).max(50).optional().nullable(),
  muscle_mass_kg: z.number().min(0).max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type WeightLogFormData = z.infer<typeof weightLogSchema>;

interface WeightLogFormProps {
  initialData?: Partial<WeightLogFormData>;
  onSuccess?: () => void;
}

export function WeightLogForm({ initialData, onSuccess }: WeightLogFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightAnalysis, setWeightAnalysis] = useState<any>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);

  // 건강 프로필에서 키 정보 가져오기
  useEffect(() => {
    const fetchHeight = async () => {
      try {
        const profile = await getHealthProfile();
        if (profile?.height_cm) {
          setHeightCm(profile.height_cm);
        }
      } catch (error) {
        console.warn('키 정보를 가져올 수 없습니다:', error);
      }
    };
    fetchHeight();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WeightLogFormData>({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      weight_kg: initialData?.weight_kg || undefined,
      body_fat_percentage: initialData?.body_fat_percentage || null,
      muscle_mass_kg: initialData?.muscle_mass_kg || null,
      notes: initialData?.notes || null,
    },
  });

  const currentWeight = watch('weight_kg');

  // 체중이 변경되면 BMI 분석 업데이트
  useEffect(() => {
    if (currentWeight && heightCm) {
      const analysis = analyzeWeight(currentWeight, heightCm);
      setWeightAnalysis(analysis);
    } else if (currentWeight) {
      const analysis = analyzeWeight(currentWeight);
      setWeightAnalysis(analysis);
    } else {
      setWeightAnalysis(null);
    }
  }, [currentWeight, heightCm]);

  // 블루투스 데이터 수신 핸들러
  const handleBluetoothData = (data: any) => {
    console.group('[WeightLogForm] 블루투스 데이터 수신');
    console.log('받은 데이터:', data);

    if (data.weight_kg !== undefined) {
      setValue('weight_kg', data.weight_kg);
    }
    if (data.body_fat_percentage !== undefined) {
      setValue('body_fat_percentage', data.body_fat_percentage);
    }
    if (data.muscle_mass_kg !== undefined) {
      setValue('muscle_mass_kg', data.muscle_mass_kg);
    }

    // BMI 분석
    if (data.weight_kg && heightCm) {
      const analysis = analyzeWeight(data.weight_kg, heightCm);
      setWeightAnalysis(analysis);
    } else if (data.weight_kg) {
      const analysis = analyzeWeight(data.weight_kg);
      setWeightAnalysis(analysis);
    }

    console.log('✅ 폼 데이터 업데이트 완료');
    console.groupEnd();
  };

  const onSubmit = async (data: WeightLogFormData) => {
    try {
      setIsSubmitting(true);
      console.group('[WeightLogForm] 체중 기록 저장');

      const response = await fetch('/api/health/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          weight_kg: Number(data.weight_kg),
          body_fat_percentage: data.body_fat_percentage ? Number(data.body_fat_percentage) : null,
          muscle_mass_kg: data.muscle_mass_kg ? Number(data.muscle_mass_kg) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '체중 기록 저장에 실패했습니다.');
      }

      console.log('✅ 체중 기록 저장 완료:', result.data);
      console.groupEnd();

      toast({
        title: '저장 완료',
        description: '체중 기록이 저장되었습니다.',
      });

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('❌ 체중 기록 저장 실패:', error);
      console.groupEnd();

      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '체중 기록 저장에 실패했습니다.',
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
          <TrendingUp className="h-5 w-5" />
          체중 기록
        </CardTitle>
        <CardDescription>체중, 체지방률, 근육량을 기록하세요</CardDescription>
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

          {/* 체중 */}
          <div>
            <Label htmlFor="weight_kg" className="flex items-center gap-1">
              체중 (kg) *
              <FieldTooltip content="체중을 kg 단위로 입력하세요. 매일 같은 시간(예: 아침 기상 직후), 같은 조건에서 측정하면 정확한 추이를 파악할 수 있습니다." />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="예: 70.5"
                {...register('weight_kg', { valueAsNumber: true })}
                className={`flex-1 ${errors.weight_kg ? 'border-red-500' : ''}`}
              />
              <BluetoothFormButton
                deviceType="weight"
                onDataReceived={handleBluetoothData}
              />
            </div>
            {errors.weight_kg && (
              <p className="text-sm text-red-500 mt-1">{errors.weight_kg.message}</p>
            )}
          </div>

          {/* 체지방률 */}
          <div>
            <Label htmlFor="body_fat_percentage" className="flex items-center gap-1">
              체지방률 (%)
              <FieldTooltip content="전체 체중 중 지방의 비율입니다. 체성분 분석기(InBody 등)로 측정할 수 있습니다. 남성 정상 범위: 10-20%, 여성 정상 범위: 18-28%입니다." />
            </Label>
            <Input
              id="body_fat_percentage"
              type="number"
              step="0.1"
              min="0"
              max="50"
              placeholder="예: 20.0"
              {...register('body_fat_percentage', { valueAsNumber: true })}
            />
          </div>

          {/* 근육량 */}
          <div>
            <Label htmlFor="muscle_mass_kg">근육량 (kg)</Label>
            <Input
              id="muscle_mass_kg"
              type="number"
              step="0.1"
              min="0"
              max="200"
              placeholder="예: 50.0"
              {...register('muscle_mass_kg', { valueAsNumber: true })}
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

        {/* BMI 분석 결과 표시 */}
        {weightAnalysis && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">체중 및 BMI 분석</h3>
            <HealthAnalysisCard
              analysis={weightAnalysis}
              title={heightCm ? `BMI 분석 (체중: ${currentWeight}kg, 키: ${heightCm}cm)` : '체중 분석'}
              unit={heightCm ? '' : ' kg'}
            />
            {!heightCm && (
              <Card className="mt-4 bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-blue-700">
                    💡 BMI 계산을 위해 건강 프로필에 키 정보를 입력해주세요. 
                    <a href="/health/profile?tab=profile" className="underline ml-1">건강 프로필 설정</a>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
