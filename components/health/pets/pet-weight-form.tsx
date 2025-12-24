/**
 * @file components/health/pets/pet-weight-form.tsx
 * @description 반려동물 체중 기록 추가 폼
 */

'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const weightRecordSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  weight_kg: z.coerce.number().min(0.1).max(200, '체중은 0.1-200kg 범위여야 합니다'),
  body_fat_percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  muscle_mass_kg: z.coerce.number().min(0).max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

type WeightRecordFormValues = z.infer<typeof weightRecordSchema>;

interface PetWeightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess?: () => void;
}

export function PetWeightForm({
  open,
  onOpenChange,
  petId,
  onSuccess,
}: PetWeightFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WeightRecordFormValues>({
    resolver: zodResolver(weightRecordSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weight_kg: undefined,
      body_fat_percentage: null,
      muscle_mass_kg: null,
      notes: null,
    },
  });

  const onSubmit = async (data: WeightRecordFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/health/pets/${petId}/weight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '체중 기록 저장에 실패했습니다.');
      }

      toast.success('체중 기록이 추가되었습니다.');
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('체중 기록 저장 실패:', error);
      toast.error(error instanceof Error ? error.message : '체중 기록 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>체중 기록 추가</DialogTitle>
          <DialogDescription>
            반려동물의 체중을 기록하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              type="date"
              {...form.register('date')}
              className={form.formState.errors.date ? 'border-red-500' : ''}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="weight_kg">체중 (kg) *</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              max="200"
              {...form.register('weight_kg', { valueAsNumber: true })}
              placeholder="예: 5.5"
              className={form.formState.errors.weight_kg ? 'border-red-500' : ''}
            />
            {form.formState.errors.weight_kg && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.weight_kg.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="body_fat_percentage">체지방률 (%)</Label>
              <Input
                id="body_fat_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...form.register('body_fat_percentage', { valueAsNumber: true })}
                placeholder="선택사항"
              />
            </div>
            <div>
              <Label htmlFor="muscle_mass_kg">근육량 (kg)</Label>
              <Input
                id="muscle_mass_kg"
                type="number"
                step="0.1"
                min="0"
                max="200"
                {...form.register('muscle_mass_kg', { valueAsNumber: true })}
                placeholder="선택사항"
              />
            </div>
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
                '추가하기'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

