/**
 * @file components/health/pets/pet-vaccine-dialog.tsx
 * @description 반려동물 백신 기록 추가/수정 다이얼로그
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PetVaccinationRecord } from '@/types/pet';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const vaccineRecordSchema = z.object({
  vaccine_name: z.string().min(1, '백신명을 입력해주세요'),
  vaccine_code: z.string().optional(),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  dose_number: z.coerce.number().min(1).default(1),
  total_doses: z.coerce.number().min(1).default(1),
  vaccination_site: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
  reminder_days_before: z.coerce.number().min(1).max(30).default(14),
  notes: z.string().max(500).optional(),
});

type VaccineRecordFormValues = z.infer<typeof vaccineRecordSchema>;

interface PetVaccineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  record?: PetVaccinationRecord | null;
  onSuccess?: () => void;
}

export function PetVaccineDialog({
  open,
  onOpenChange,
  petId,
  record,
  onSuccess,
}: PetVaccineDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!record;

  const form = useForm<VaccineRecordFormValues>({
    resolver: zodResolver(vaccineRecordSchema),
    defaultValues: {
      vaccine_name: '',
      vaccine_code: '',
      scheduled_date: '',
      completed_date: '',
      dose_number: 1,
      total_doses: 1,
      vaccination_site: '',
      reminder_enabled: true,
      reminder_days_before: 14,
      notes: '',
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        vaccine_name: record.vaccine_name || '',
        vaccine_code: record.vaccine_code || '',
        scheduled_date: record.scheduled_date
          ? new Date(record.scheduled_date).toISOString().split('T')[0]
          : '',
        completed_date: record.completed_date
          ? new Date(record.completed_date).toISOString().split('T')[0]
          : '',
        dose_number: record.dose_number || 1,
        total_doses: record.total_doses || 1,
        vaccination_site: record.vaccination_site || '',
        reminder_enabled: record.reminder_enabled !== false,
        reminder_days_before: record.reminder_days_before || 14,
        notes: record.notes || '',
      });
    } else {
      form.reset({
        vaccine_name: '',
        vaccine_code: '',
        scheduled_date: '',
        completed_date: '',
        dose_number: 1,
        total_doses: 1,
        vaccination_site: '',
        reminder_enabled: true,
        reminder_days_before: 14,
        notes: '',
      });
    }
  }, [record, form]);

  const onSubmit = async (data: VaccineRecordFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/health/pets/${petId}/vaccinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '백신 기록 저장에 실패했습니다.');
      }

      toast.success(isEditMode ? '백신 기록이 수정되었습니다.' : '백신 기록이 추가되었습니다.');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('백신 기록 저장 실패:', error);
      toast.error(error instanceof Error ? error.message : '백신 기록 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '백신 기록 수정' : '백신 기록 추가'}</DialogTitle>
          <DialogDescription>
            반려동물의 백신 접종 기록을 입력하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="vaccine_name">백신명 *</Label>
            <Input
              id="vaccine_name"
              {...form.register('vaccine_name')}
              placeholder="예: 종합백신 (DHPP)"
              className={form.formState.errors.vaccine_name ? 'border-red-500' : ''}
            />
            {form.formState.errors.vaccine_name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.vaccine_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="vaccine_code">백신 코드</Label>
            <Input
              id="vaccine_code"
              {...form.register('vaccine_code')}
              placeholder="예: dog_dhpp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_date">예정일</Label>
              <Input
                id="scheduled_date"
                type="date"
                {...form.register('scheduled_date')}
              />
            </div>
            <div>
              <Label htmlFor="completed_date">접종일</Label>
              <Input
                id="completed_date"
                type="date"
                {...form.register('completed_date')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dose_number">접종 차수</Label>
              <Input
                id="dose_number"
                type="number"
                min="1"
                {...form.register('dose_number', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="total_doses">총 차수</Label>
              <Input
                id="total_doses"
                type="number"
                min="1"
                {...form.register('total_doses', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vaccination_site">접종 장소</Label>
            <Input
              id="vaccination_site"
              {...form.register('vaccination_site')}
              placeholder="예: XX동물병원"
            />
          </div>

          <div>
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="추가 정보를 입력하세요"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                isEditMode ? '수정하기' : '추가하기'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

