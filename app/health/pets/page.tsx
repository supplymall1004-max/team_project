/**
 * @file app/health/pets/page.tsx
 * @description 반려동물 건강 관리 목록 페이지
 * 
 * 주요 기능:
 * 1. 반려동물 목록 조회 및 표시
 * 2. 반려동물 등록 버튼
 * 3. 생애주기별 건강 이벤트 요약
 * 4. 중요 정보 배너 (사육 금지, 법규 안내)
 * 5. 분류 탭 (알아두면 좋은 정보)
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PetProfileCard } from '@/components/health/pets/pet-profile-card';
import { PetRegistrationForm } from '@/components/health/pets/pet-registration-form';
import { PetLifecycleEventsSummary } from '@/components/health/pets/pet-lifecycle-events-summary';
import { PetImportantInfoBanner } from '@/components/health/pets/pet-important-info-banner';
import { PetGuideTab } from '@/components/health/pets/pet-guide-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PetVaccineTab } from '@/components/health/pets/pet-vaccine-tab';
import { PetWeightTab } from '@/components/health/pets/pet-weight-tab';
import { PetCheckupTab } from '@/components/health/pets/pet-checkup-tab';
import { PetLifecycleEventsTab } from '@/components/health/pets/pet-lifecycle-events-tab';
import { PetProfile, PetProfileInput, PET_TYPE_LABELS } from '@/types/pet';
import { calculatePetLifecycle, formatPetAge, getLifecycleStageLabel } from '@/lib/health/pet-lifecycle-calculator';
import { Plus, PawPrint, Loader2, Syringe, Weight, Stethoscope, Clock, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function PetsPage() {
  const searchParams = useSearchParams();
  const selectedPetId = searchParams.get('id');
  
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePetTab, setActivePetTab] = useState('vaccinations');
  const [daysUntilNext, setDaysUntilNext] = useState<number | null>(null);

  // 반려동물 목록 조회
  const fetchPets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health/pets');
      if (!response.ok) {
        throw new Error('반려동물 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setPets(data.pets || []);
    } catch (error) {
      console.error('반려동물 목록 조회 실패:', error);
      toast.error('반려동물 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // URL 파라미터로 선택된 반려동물 조회 (하위 호환성 유지)
  useEffect(() => {
    if (selectedPetId) {
      const pet = pets.find(p => p.id === selectedPetId);
      if (pet) {
        setSelectedPet(pet);
        setActivePetTab('vaccinations');
      }
    }
  }, [selectedPetId, pets]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);


  // 반려동물 등록
  const handleCreatePet = async (data: PetProfileInput) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/health/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '반려동물 등록에 실패했습니다.');
      }

      const result = await response.json();
      toast.success('반려동물이 등록되었습니다.');
      setIsDialogOpen(false);
      await fetchPets(); // 목록 새로고침
      // 등록 후 해당 반려동물 선택
      setSelectedPet(result.pet);
      setActivePetTab('vaccinations');
    } catch (error) {
      console.error('반려동물 등록 실패:', error);
      toast.error(error instanceof Error ? error.message : '반려동물 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 반려동물 선택 핸들러
  const handleSelectPet = async (pet: PetProfile) => {
    setSelectedPet(pet);
    setActivePetTab('vaccinations');
    
    // 백신 정보 조회
    try {
      const vaccineResponse = await fetch(`/api/health/pets/${pet.id}/vaccinations`);
      if (vaccineResponse.ok) {
        const vaccineData = await vaccineResponse.json();
        setDaysUntilNext(vaccineData.daysUntilNext);
      }
    } catch (error) {
      console.error('백신 정보 조회 실패:', error);
    }
  };

  // 생애주기 정보 계산
  let lifecycleInfo = null;
  let ageText = '';
  let stageLabel = '';
  
  if (selectedPet) {
    try {
      lifecycleInfo = selectedPet.lifecycleInfo || (selectedPet.birth_date && selectedPet.pet_type
        ? calculatePetLifecycle(selectedPet.pet_type, selectedPet.birth_date)
        : null);
      ageText = selectedPet.age ? formatPetAge(selectedPet.age) : (lifecycleInfo ? formatPetAge(lifecycleInfo.age) : '');
      stageLabel = selectedPet.lifecycle_stage && selectedPet.pet_type
        ? getLifecycleStageLabel(selectedPet.lifecycle_stage, selectedPet.pet_type)
        : (lifecycleInfo ? lifecycleInfo.stageLabel : '');
    } catch (error) {
      console.error('생애주기 정보 계산 실패:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <PawPrint className="w-8 h-8 text-orange-500" />
                반려동물 건강 관리
              </h1>
              <p className="text-muted-foreground">
                반려동물의 생애주기별 건강을 관리하세요
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 반려동물 등록
            </Button>
          </div>
        </div>

        {/* 반려동물 관리 섹션 */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : pets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <PawPrint className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">등록된 반려동물이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    반려동물을 등록하여 건강을 관리해보세요.
                  </p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    첫 반려동물 등록하기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 반려동물 선택 카드 */}
                {!selectedPet && (
                  <Card>
                    <CardHeader>
                      <CardTitle>반려동물 선택</CardTitle>
                      <CardDescription>
                        관리할 반려동물을 선택하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pets.map((pet) => (
                          <div
                            key={pet.id}
                            onClick={() => handleSelectPet(pet)}
                            className="p-4 rounded-lg border-2 cursor-pointer transition-all border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex-shrink-0">
                                {pet.photo_url ? (
                                  <Image
                                    src={pet.photo_url}
                                    alt={pet.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <PawPrint className="w-6 h-6 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">{pet.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {pet.breed || PET_TYPE_LABELS[pet.pet_type]}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 선택된 반려동물 정보 및 관리 탭 */}
                {selectedPet && (
                  <>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* 프로필 이미지 */}
                          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex-shrink-0">
                            {selectedPet.photo_url ? (
                              <Image
                                src={selectedPet.photo_url}
                                alt={selectedPet.name || '반려동물 사진'}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  console.error('이미지 로드 실패:', selectedPet.photo_url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PawPrint className="w-10 h-10 text-white" />
                              </div>
                            )}
                          </div>

                          {/* 기본 정보 */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h2 className="text-2xl font-bold">{selectedPet.name}</h2>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPet(null)}
                              >
                                다른 반려동물 선택
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="text-muted-foreground">{ageText}</span>
                              {stageLabel && (
                                <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm rounded-full">
                                  {stageLabel}
                                </span>
                              )}
                              {selectedPet.breed && (
                                <span className="text-muted-foreground">{selectedPet.breed}</span>
                              )}
                            </div>
                            {selectedPet.weight_kg && (
                              <p className="text-sm text-muted-foreground mb-2">
                                현재 체중: {selectedPet.weight_kg}kg
                              </p>
                            )}
                            
                            {/* 다음 백신 D-Day */}
                            {daysUntilNext !== null && daysUntilNext >= 0 && (
                              <div className={cn(
                                "flex items-center gap-2 text-sm font-medium p-2 rounded-lg mt-2",
                                daysUntilNext <= 7
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : daysUntilNext <= 14
                                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              )}>
                                <Clock className="w-4 h-4" />
                                <span>
                                  {daysUntilNext === 0
                                    ? '오늘 백신 예정'
                                    : daysUntilNext === 1
                                    ? '내일 백신 예정'
                                    : `다음 백신까지 D-${daysUntilNext}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 반려동물 관리 서브 탭 */}
                    <Tabs value={activePetTab} onValueChange={setActivePetTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 gap-2 mb-8">
                          <TabsTrigger value="vaccinations" className="flex items-center justify-center gap-2">
                            <Syringe className="w-4 h-4" />
                            백신 관리
                          </TabsTrigger>
                          <TabsTrigger value="weight" className="flex items-center justify-center gap-2">
                            <Weight className="w-4 h-4" />
                            체중 관리
                          </TabsTrigger>
                          <TabsTrigger value="checkups" className="flex items-center justify-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            건강 검진
                          </TabsTrigger>
                          <TabsTrigger value="lifecycle" className="flex items-center justify-center gap-2">
                            <PawPrint className="w-4 h-4" />
                            생애주기 이벤트
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="vaccinations" className="space-y-6 mt-4">
                          <PetVaccineTab petId={selectedPet.id} pet={selectedPet} />
                        </TabsContent>

                        <TabsContent value="weight" className="space-y-6 mt-4">
                          <PetWeightTab petId={selectedPet.id} pet={selectedPet} />
                        </TabsContent>

                        <TabsContent value="checkups" className="space-y-6 mt-4">
                          <PetCheckupTab petId={selectedPet.id} pet={selectedPet} />
                        </TabsContent>

                        <TabsContent value="lifecycle" className="space-y-6 mt-4">
                          <PetLifecycleEventsTab petId={selectedPet.id} pet={selectedPet} />
                        </TabsContent>
                    </Tabs>
                  </>
                )}

                {/* 생애주기별 건강 이벤트 요약 */}
                {!selectedPet && (
                  <PetLifecycleEventsSummary pets={pets} />
                )}
              </>
            )}

          {/* 분류 섹션 (알아두면 좋은 정보) */}
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-500" />
                분류 (알아두면 좋은 정보)
              </h2>
              <p className="text-muted-foreground">
                반려동물을 키울 때 알아두면 좋은 유용한 정보입니다
              </p>
            </div>
            <PetGuideTab />
          </div>
        </div>

        {/* 중요 정보 배너 (하단) */}
        <div className="mt-12">
          <PetImportantInfoBanner />
        </div>

        {/* 등록 다이얼로그 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 반려동물 등록</DialogTitle>
            </DialogHeader>
            <PetRegistrationForm
              onSubmit={handleCreatePet}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </Section>
    </div>
  );
}

