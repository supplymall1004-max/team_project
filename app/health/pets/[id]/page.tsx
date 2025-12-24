/**
 * @file app/health/pets/[id]/page.tsx
 * @description 반려동물 상세 페이지
 * 
 * 주요 기능:
 * 1. 반려동물 프로필 헤더 (사진, 이름, 나이, 생애주기 단계)
 * 2. 건강 상태 요약 대시보드
 * 3. 탭 네비게이션: 백신 관리, 체중 관리, 건강 검진
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Section } from '@/components/section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PetProfile } from '@/types/pet';
import { calculatePetLifecycle, formatPetAge, getLifecycleStageLabel } from '@/lib/health/pet-lifecycle-calculator';
import { ArrowLeft, PawPrint, Loader2, Syringe, Weight, Stethoscope } from 'lucide-react';
import { PetVaccineTab } from '@/components/health/pets/pet-vaccine-tab';
import { PetWeightTab } from '@/components/health/pets/pet-weight-tab';
import { PetCheckupTab } from '@/components/health/pets/pet-checkup-tab';
import { PetLifecycleEventsTab } from '@/components/health/pets/pet-lifecycle-events-tab';
import { toast } from 'sonner';
import Image from 'next/image';

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vaccinations');

  useEffect(() => {
    fetchPet();
  }, [petId]);

  const fetchPet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health/pets/${petId}`);
      if (!response.ok) {
        throw new Error('반려동물 정보를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setPet(data.pet);
    } catch (error) {
      console.error('반려동물 정보 조회 실패:', error);
      toast.error('반려동물 정보를 불러오는데 실패했습니다.');
      router.push('/health/pets');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">반려동물을 찾을 수 없습니다.</p>
            <Button onClick={() => router.push('/health/pets')}>목록으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lifecycleInfo = pet.lifecycleInfo || (pet.birth_date && pet.pet_type
    ? calculatePetLifecycle(pet.pet_type, pet.birth_date)
    : null);
  const ageText = pet.age ? formatPetAge(pet.age) : (lifecycleInfo ? formatPetAge(lifecycleInfo.age) : '');
  const stageLabel = pet.lifecycle_stage && pet.pet_type
    ? getLifecycleStageLabel(pet.lifecycle_stage, pet.pet_type)
    : (lifecycleInfo ? lifecycleInfo.stageLabel : '');

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/health/pets')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>

          {/* 프로필 헤더 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* 프로필 이미지 */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex-shrink-0">
                  {pet.photo_url ? (
                    <Image
                      src={pet.photo_url}
                      alt={pet.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>

                {/* 기본 정보 */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{pet.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-muted-foreground">{ageText}</span>
                    {stageLabel && (
                      <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm rounded-full">
                        {stageLabel}
                      </span>
                    )}
                    {pet.breed && (
                      <span className="text-muted-foreground">{pet.breed}</span>
                    )}
                  </div>
                  {pet.weight_kg && (
                    <p className="text-sm text-muted-foreground">
                      현재 체중: {pet.weight_kg}kg
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="vaccinations" className="flex items-center gap-2">
              <Syringe className="w-4 h-4" />
              백신 관리
            </TabsTrigger>
            <TabsTrigger value="weight" className="flex items-center gap-2">
              <Weight className="w-4 h-4" />
              체중 관리
            </TabsTrigger>
            <TabsTrigger value="checkups" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              건강 검진
            </TabsTrigger>
            <TabsTrigger value="lifecycle" className="flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              생애주기 이벤트
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vaccinations" className="space-y-6">
            <PetVaccineTab petId={petId} pet={pet} />
          </TabsContent>

          <TabsContent value="weight" className="space-y-6">
            <PetWeightTab petId={petId} pet={pet} />
          </TabsContent>

          <TabsContent value="checkups" className="space-y-6">
            <PetCheckupTab petId={petId} pet={pet} />
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-6">
            <PetLifecycleEventsTab petId={petId} pet={pet} />
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

