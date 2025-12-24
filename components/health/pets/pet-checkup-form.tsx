/**
 * @file components/health/pets/pet-checkup-form.tsx
 * @description 반려동물 건강 검진 기록 추가 폼
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const checkupRecordSchema = z.object({
  checkup_type: z.enum(['regular', 'dental', 'blood_test', 'xray', 'ultrasound', 'other'], {
    required_error: '검진 종류를 선택해주세요',
  }),
  checkup_date: z.string().min(1, '검진 날짜를 선택해주세요'),
  checkup_site: z.string().optional(),
  next_recommended_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type CheckupRecordFormValues = z.infer<typeof checkupRecordSchema>;

interface PetCheckupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess?: () => void;
}

const CHECKUP_TYPE_LABELS: Record<string, string> = {
  regular: '정기 검진',
  dental: '치과 검진',
  blood_test: '혈액 검사',
  xray: 'X-ray',
  ultrasound: '초음파',
  other: '기타',
};

export function PetCheckupForm({
  open,
  onOpenChange,
  petId,
  onSuccess,
}: PetCheckupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckupRecordFormValues>({
    resolver: zodResolver(checkupRecordSchema),
    defaultValues: {
      checkup_type: 'regular',
      checkup_date: new Date().toISOString().split('T')[0],
      checkup_site: '',
      next_recommended_date: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CheckupRecordFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/health/pets/${petId}/checkups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '건강 검진 기록 저장에 실패했습니다.');
      }

      toast.success('건강 검진 기록이 추가되었습니다.');
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('건강 검진 기록 저장 실패:', error);
      toast.error(error instanceof Error ? error.message : '건강 검진 기록 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>건강 검진 기록 추가</DialogTitle>
          <DialogDescription>
            반려동물의 건강 검진 기록을 입력하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="checkup_type">검진 종류 *</Label>
            <Select
              value={form.watch('checkup_type')}
              onValueChange={(value) =>
                form.setValue('checkup_type', value as CheckupRecordFormValues['checkup_type'])
              }
            >
              <SelectTrigger className={form.formState.errors.checkup_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="검진 종류를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHECKUP_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.checkup_type && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.checkup_type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="checkup_date">검진 날짜 *</Label>
            <Input
              id="checkup_date"
              type="date"
              {...form.register('checkup_date')}
              className={form.formState.errors.checkup_date ? 'border-red-500' : ''}
            />
            {form.formState.errors.checkup_date && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.checkup_date.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="checkup_site">검진 장소</Label>
            <Input
              id="checkup_site"
              {...form.register('checkup_site')}
              placeholder="예: XX동물병원"
            />
          </div>

          <div>
            <Label htmlFor="next_recommended_date">다음 권장일</Label>
            <Input
              id="next_recommended_date"
              type="date"
              {...form.register('next_recommended_date')}
            />
          </div>

          <div>
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="검진 결과나 추가 정보를 입력하세요"
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

