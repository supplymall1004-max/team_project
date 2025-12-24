/**
 * @file components/health/pets/pet-profile-card.tsx
 * @description 반려동물 프로필 카드 컴포넌트
 * 
 * 반려동물 목록 페이지에서 사용되는 카드 컴포넌트입니다.
 * 반려동물 사진, 이름, 종류, 나이, 생애주기 단계, 다음 백신 D-Day를 표시합니다.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PetProfile } from '@/types/pet';
import { formatPetAge, getLifecycleStageLabel } from '@/lib/health/pet-lifecycle-calculator';
import { PET_TYPE_LABELS } from '@/types/pet';
import { PawPrint, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PetProfileCardProps {
  pet: PetProfile;
  nextVaccineDate?: Date; // 다음 백신 예정일 (선택)
}

export function PetProfileCard({ pet, nextVaccineDate }: PetProfileCardProps) {
  const ageText = pet.age ? formatPetAge(pet.age) : '나이 계산 중...';
  const stageLabel = pet.lifecycle_stage && pet.pet_type
    ? getLifecycleStageLabel(pet.lifecycle_stage, pet.pet_type)
    : null;
  
  // D-Day 계산
  const daysUntilVaccine = nextVaccineDate
    ? Math.ceil((nextVaccineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={`/health/pets/${pet.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
        <CardContent className="p-4">
          {/* 프로필 이미지 및 기본 정보 */}
          <div className="flex items-start gap-4 mb-3">
            {/* 프로필 이미지 */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex-shrink-0">
              {pet.photo_url ? (
                <Image
                  src={pet.photo_url}
                  alt={pet.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PawPrint className="w-8 h-8 text-white" />
                </div>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{pet.name}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {PET_TYPE_LABELS[pet.pet_type]}
                </Badge>
                {pet.breed && (
                  <Badge variant="secondary" className="text-xs">
                    {pet.breed}
                  </Badge>
                )}
                {stageLabel && (
                  <Badge 
                    variant="default" 
                    className={cn(
                      "text-xs",
                      "bg-gradient-to-r from-orange-500 to-amber-500",
                      "text-white border-0",
                      "animate-pulse"
                    )}
                  >
                    {stageLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 나이 정보 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="w-4 h-4" />
            <span>{ageText}</span>
          </div>

          {/* 다음 백신 D-Day */}
          {daysUntilVaccine !== null && daysUntilVaccine >= 0 && (
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium p-2 rounded-lg",
              daysUntilVaccine <= 7
                ? "bg-red-50 text-red-700 border border-red-200"
                : daysUntilVaccine <= 14
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            )}>
              <Clock className="w-4 h-4" />
              <span>
                {daysUntilVaccine === 0
                  ? '오늘 백신 예정'
                  : daysUntilVaccine === 1
                  ? '내일 백신 예정'
                  : `다음 백신까지 D-${daysUntilVaccine}`}
              </span>
            </div>
          )}

          {/* 체중 정보 (있는 경우) */}
          {pet.weight_kg && (
            <div className="text-xs text-muted-foreground mt-2">
              현재 체중: {pet.weight_kg}kg
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

