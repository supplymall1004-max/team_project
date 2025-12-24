/**
 * @file components/health/pets/pet-registration-form.tsx
 * @description 반려동물 등록/수정 폼 컴포넌트
 * 
 * 반려동물 프로필을 등록하거나 수정하는 폼 컴포넌트입니다.
 * react-hook-form과 Zod를 사용하여 유효성 검사를 수행합니다.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PetProfileInput, PetProfile } from '@/types/pet';
import { PET_TYPE_LABELS, PET_GENDER_LABELS } from '@/types/pet';
import { Loader2 } from 'lucide-react';

const petFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하여야 합니다'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
  pet_type: z.enum(['dog', 'cat', 'other'], {
    required_error: '반려동물 종류를 선택해주세요',
  }),
  breed: z.string().max(100, '견종/묘종은 100자 이하여야 합니다').optional(),
  gender: z.enum(['male', 'female', 'neutered_male', 'spayed_female']).optional(),
  relationship: z.string().max(50).optional(),
  weight_kg: z.coerce.number().positive('체중은 양수여야 합니다').max(200, '체중은 200kg 이하여야 합니다').optional(),
  photo_url: z.string().url('올바른 URL 형식이 아닙니다').optional().or(z.literal('')),
  pet_metadata: z.record(z.any()).optional(),
});

type PetFormData = z.infer<typeof petFormSchema>;

interface PetRegistrationFormProps {
  pet?: PetProfile; // 수정 모드인 경우 기존 데이터
  onSubmit: (data: PetProfileInput) => Promise<void>;
  onCancel?: () => void;
}

export function PetRegistrationForm({ pet, onSubmit, onCancel }: PetRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!pet;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: pet
      ? {
          name: pet.name,
          birth_date: pet.birth_date,
          pet_type: pet.pet_type,
          breed: pet.breed || '',
          gender: pet.gender || undefined,
          relationship: pet.relationship || 'pet',
          weight_kg: pet.weight_kg || undefined,
          photo_url: pet.photo_url || '',
        }
      : {
          relationship: 'pet',
        },
  });

  const petType = watch('pet_type');

  const onSubmitForm = async (data: PetFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        birth_date: data.birth_date,
        pet_type: data.pet_type,
        breed: data.breed || undefined,
        gender: data.gender,
        relationship: data.relationship || 'pet',
        weight_kg: data.weight_kg,
        photo_url: data.photo_url || undefined,
        pet_metadata: data.pet_metadata,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? '반려동물 정보 수정' : '새 반려동물 등록'}</CardTitle>
        <CardDescription>
          {isEditMode
            ? '반려동물 정보를 수정할 수 있습니다.'
            : '반려동물의 기본 정보를 입력해주세요.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* 이름 */}
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="반려동물 이름"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* 생년월일 */}
          <div>
            <Label htmlFor="birth_date">생년월일 *</Label>
            <Input
              id="birth_date"
              type="date"
              {...register('birth_date')}
              className={errors.birth_date ? 'border-red-500' : ''}
            />
            {errors.birth_date && (
              <p className="text-sm text-red-500 mt-1">{errors.birth_date.message}</p>
            )}
          </div>

          {/* 반려동물 종류 */}
          <div>
            <Label htmlFor="pet_type">반려동물 종류 *</Label>
            <Select
              value={petType}
              onValueChange={(value) => setValue('pet_type', value as 'dog' | 'cat' | 'other')}
            >
              <SelectTrigger className={errors.pet_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="종류를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">강아지</SelectItem>
                <SelectItem value="cat">고양이</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
            {errors.pet_type && (
              <p className="text-sm text-red-500 mt-1">{errors.pet_type.message}</p>
            )}
          </div>

          {/* 견종/묘종 */}
          <div>
            <Label htmlFor="breed">견종/묘종</Label>
            <Input
              id="breed"
              {...register('breed')}
              placeholder="예: 골든 리트리버, 페르시안 등"
              className={errors.breed ? 'border-red-500' : ''}
            />
            {errors.breed && (
              <p className="text-sm text-red-500 mt-1">{errors.breed.message}</p>
            )}
          </div>

          {/* 성별 */}
          <div>
            <Label htmlFor="gender">성별</Label>
            <Select
              value={watch('gender') || ''}
              onValueChange={(value) =>
                setValue('gender', value as 'male' | 'female' | 'neutered_male' | 'spayed_female' | undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="성별을 선택하세요 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">수컷</SelectItem>
                <SelectItem value="female">암컷</SelectItem>
                <SelectItem value="neutered_male">중성화된 수컷</SelectItem>
                <SelectItem value="spayed_female">중성화된 암컷</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 체중 */}
          <div>
            <Label htmlFor="weight_kg">현재 체중 (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0"
              max="200"
              {...register('weight_kg', { valueAsNumber: true })}
              placeholder="예: 5.5"
              className={errors.weight_kg ? 'border-red-500' : ''}
            />
            {errors.weight_kg && (
              <p className="text-sm text-red-500 mt-1">{errors.weight_kg.message}</p>
            )}
          </div>

          {/* 사진 URL */}
          <div>
            <Label htmlFor="photo_url">프로필 사진 URL</Label>
            <Input
              id="photo_url"
              type="url"
              {...register('photo_url')}
              placeholder="https://example.com/photo.jpg"
              className={errors.photo_url ? 'border-red-500' : ''}
            />
            {errors.photo_url && (
              <p className="text-sm text-red-500 mt-1">{errors.photo_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              나중에 이미지 업로드 기능이 추가될 예정입니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? '수정 중...' : '등록 중...'}
                </>
              ) : (
                isEditMode ? '수정하기' : '등록하기'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

