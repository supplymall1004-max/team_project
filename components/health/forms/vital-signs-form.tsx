/**
 * @file vital-signs-form.tsx
 * @description 혈압/혈당 기록 입력 폼 컴포넌트
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
import { Heart, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FieldTooltip } from '@/components/health/help/field-tooltip';
import { BluetoothFormButton } from '@/components/health/devices/bluetooth-form-button';
import { HealthAnalysisCard } from '@/components/health/analysis/health-analysis-card';
import { 
  analyzeHeartRate, 
  analyzeBloodPressure, 
  analyzeFastingGlucose, 
  analyzePostprandialGlucose 
} from '@/lib/health/analysis/health-data-analyzer';

const vitalSignsSchema = z.object({
  measured_at: z.string().min(1, '측정 시간을 입력해주세요'),
  systolic_bp: z.number().min(50).max(250).optional().nullable(),
  diastolic_bp: z.number().min(30).max(150).optional().nullable(),
  fasting_glucose: z.number().min(50).max(300).optional().nullable(),
  postprandial_glucose: z.number().min(50).max(400).optional().nullable(),
  heart_rate: z.number().min(30).max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;

interface VitalSignsFormProps {
  initialData?: Partial<VitalSignsFormData>;
  onSuccess?: () => void;
}

export function VitalSignsForm({ initialData, onSuccess }: VitalSignsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    heartRate?: any;
    bloodPressure?: any;
    fastingGlucose?: any;
    postprandialGlucose?: any;
  }>({});

  // 현재 날짜와 시간을 기본값으로 설정
  const now = new Date();
  const defaultDateTime = `${now.toISOString().split('T')[0]}T${now.toTimeString().slice(0, 5)}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VitalSignsFormData>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      measured_at: initialData?.measured_at || defaultDateTime,
      systolic_bp: initialData?.systolic_bp || null,
      diastolic_bp: initialData?.diastolic_bp || null,
      fasting_glucose: initialData?.fasting_glucose || null,
      postprandial_glucose: initialData?.postprandial_glucose || null,
      heart_rate: initialData?.heart_rate || null,
      notes: initialData?.notes || null,
    },
  });

  // 블루투스 데이터 수신 핸들러
  const handleBluetoothData = (data: any) => {
    console.group('[VitalSignsForm] 블루투스 데이터 수신');
    console.log('받은 데이터:', data);

    // 데이터를 폼에 채우기
    if (data.heart_rate !== undefined) {
      setValue('heart_rate', data.heart_rate);
      const analysis = analyzeHeartRate(data.heart_rate);
      setAnalysisResults(prev => ({ ...prev, heartRate: analysis }));
    }

    if (data.systolic_bp !== undefined) {
      setValue('systolic_bp', data.systolic_bp);
    }
    if (data.diastolic_bp !== undefined) {
      setValue('diastolic_bp', data.diastolic_bp);
    }
    if (data.systolic_bp !== undefined && data.diastolic_bp !== undefined) {
      const analysis = analyzeBloodPressure(data.systolic_bp, data.diastolic_bp);
      setAnalysisResults(prev => ({ ...prev, bloodPressure: analysis }));
    }

    if (data.fasting_glucose !== undefined) {
      setValue('fasting_glucose', data.fasting_glucose);
      const analysis = analyzeFastingGlucose(data.fasting_glucose);
      setAnalysisResults(prev => ({ ...prev, fastingGlucose: analysis }));
    }

    if (data.postprandial_glucose !== undefined) {
      setValue('postprandial_glucose', data.postprandial_glucose);
      const analysis = analyzePostprandialGlucose(data.postprandial_glucose);
      setAnalysisResults(prev => ({ ...prev, postprandialGlucose: analysis }));
    }

    console.log('✅ 폼 데이터 업데이트 완료');
    console.groupEnd();
  };

  const onSubmit = async (data: VitalSignsFormData) => {
    try {
      setIsSubmitting(true);
      console.group('[VitalSignsForm] 혈압/혈당 기록 저장');

      const response = await fetch('/api/health/vital-signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          systolic_bp: data.systolic_bp ? Number(data.systolic_bp) : null,
          diastolic_bp: data.diastolic_bp ? Number(data.diastolic_bp) : null,
          fasting_glucose: data.fasting_glucose ? Number(data.fasting_glucose) : null,
          postprandial_glucose: data.postprandial_glucose ? Number(data.postprandial_glucose) : null,
          heart_rate: data.heart_rate ? Number(data.heart_rate) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '혈압/혈당 기록 저장에 실패했습니다.');
      }

      console.log('✅ 혈압/혈당 기록 저장 완료:', result.data);
      console.groupEnd();

      toast({
        title: '저장 완료',
        description: '혈압/혈당 기록이 저장되었습니다.',
      });

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('❌ 혈압/혈당 기록 저장 실패:', error);
      console.groupEnd();

      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '혈압/혈당 기록 저장에 실패했습니다.',
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
          <Heart className="h-5 w-5" />
          혈압/혈당 기록
        </CardTitle>
        <CardDescription>혈압, 혈당, 심박수를 기록하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 측정 시간 */}
          <div>
            <Label htmlFor="measured_at">측정 시간</Label>
            <Input
              id="measured_at"
              type="datetime-local"
              {...register('measured_at')}
              className={errors.measured_at ? 'border-red-500' : ''}
            />
            {errors.measured_at && (
              <p className="text-sm text-red-500 mt-1">{errors.measured_at.message}</p>
            )}
          </div>

          {/* 혈압 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="systolic_bp" className="flex items-center gap-1">
                수축기 혈압 (mmHg)
                <FieldTooltip content="심장이 수축할 때의 혈압입니다. 정상 범위는 120mmHg 미만입니다. 120-139는 고혈압 전단계, 140 이상은 고혈압입니다." />
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="systolic_bp"
                  type="number"
                  min="50"
                  max="250"
                  placeholder="예: 120"
                  {...register('systolic_bp', { valueAsNumber: true })}
                  className="flex-1"
                />
                <BluetoothFormButton
                  deviceType="blood_pressure"
                  onDataReceived={handleBluetoothData}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="diastolic_bp" className="flex items-center gap-1">
                이완기 혈압 (mmHg)
                <FieldTooltip content="심장이 이완할 때의 혈압입니다. 정상 범위는 80mmHg 미만입니다. 80-89는 고혈압 전단계, 90 이상은 고혈압입니다." />
              </Label>
              <Input
                id="diastolic_bp"
                type="number"
                min="30"
                max="150"
                placeholder="예: 80"
                {...register('diastolic_bp', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 혈당 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fasting_glucose" className="flex items-center gap-1">
                공복 혈당 (mg/dL)
                <FieldTooltip content="8시간 이상 금식 후 측정한 혈당입니다. 정상 범위는 100mg/dL 미만입니다. 100-125는 당뇨 전단계, 126 이상은 당뇨병 의심입니다." />
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fasting_glucose"
                  type="number"
                  min="50"
                  max="300"
                  placeholder="예: 100"
                  {...register('fasting_glucose', { valueAsNumber: true })}
                  className="flex-1"
                />
                <BluetoothFormButton
                  deviceType="glucose"
                  onDataReceived={handleBluetoothData}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="postprandial_glucose" className="flex items-center gap-1">
                식후 혈당 (mg/dL)
                <FieldTooltip content="식사 후 2시간 경과 후 측정한 혈당입니다. 정상 범위는 140mg/dL 미만입니다. 140-199는 당뇨 전단계, 200 이상은 당뇨병 의심입니다." />
              </Label>
              <Input
                id="postprandial_glucose"
                type="number"
                min="50"
                max="400"
                placeholder="예: 140"
                {...register('postprandial_glucose', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 심박수 */}
          <div>
            <Label htmlFor="heart_rate" className="flex items-center gap-1">
              심박수 (bpm)
              <FieldTooltip content="1분당 심장 박동 수입니다. 정상 범위는 60-100 bpm입니다. 운동선수는 더 낮을 수 있습니다." />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="heart_rate"
                type="number"
                min="30"
                max="200"
                placeholder="예: 72"
                {...register('heart_rate', { valueAsNumber: true })}
                className="flex-1"
              />
              <BluetoothFormButton
                deviceType="heart_rate"
                onDataReceived={handleBluetoothData}
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

        {/* 분석 결과 표시 */}
        {Object.keys(analysisResults).length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">건강 상태 분석</h3>
            {analysisResults.heartRate && (
              <HealthAnalysisCard
                analysis={analysisResults.heartRate}
                title="심박수 분석"
                unit=" bpm"
              />
            )}
            {analysisResults.bloodPressure && (
              <HealthAnalysisCard
                analysis={analysisResults.bloodPressure}
                title="혈압 분석"
                unit=" mmHg"
              />
            )}
            {analysisResults.fastingGlucose && (
              <HealthAnalysisCard
                analysis={analysisResults.fastingGlucose}
                title="공복 혈당 분석"
                unit=" mg/dL"
              />
            )}
            {analysisResults.postprandialGlucose && (
              <HealthAnalysisCard
                analysis={analysisResults.postprandialGlucose}
                title="식후 혈당 분석"
                unit=" mg/dL"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
