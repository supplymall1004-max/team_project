/**
 * @file app/health/pets/page.tsx
 * @description 반려동물 건강 관리 목록 페이지
 * 
 * 주요 기능:
 * 1. 반려동물 목록 조회 및 표시
 * 2. 반려동물 등록 버튼
 * 3. 반려동물 프로필 카드 그리드 레이아웃
 * 4. 생애주기별 건강 이벤트 요약
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PetProfileCard } from '@/components/health/pets/pet-profile-card';
import { PetRegistrationForm } from '@/components/health/pets/pet-registration-form';
import { PetLifecycleEventsSummary } from '@/components/health/pets/pet-lifecycle-events-summary';
import { PetProfile, PetProfileInput } from '@/types/pet';
import { Plus, PawPrint, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 반려동물 목록 조회
  const fetchPets = async () => {
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
  };

  useEffect(() => {
    fetchPets();
  }, []);

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
      router.push(`/health/pets/${result.pet.id}`);
    } catch (error) {
      console.error('반려동물 등록 실패:', error);
      toast.error(error instanceof Error ? error.message : '반려동물 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* 반려동물 목록 */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {pets.map((pet) => (
              <PetProfileCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}

        {/* 생애주기별 건강 이벤트 요약 */}
        {pets.length > 0 && (
          <PetLifecycleEventsSummary pets={pets} />
        )}

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

