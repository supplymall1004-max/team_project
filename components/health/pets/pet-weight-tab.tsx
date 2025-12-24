/**
 * @file components/health/pets/pet-weight-tab.tsx
 * @description 반려동물 체중 관리 탭 컴포넌트
 * 
 * 주요 기능:
 * 1. 체중 기록 목록
 * 2. 체중 그래프 시각화 (추후 구현)
 * 3. 체중 기록 추가
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PetProfile, PetWeightRecord } from '@/types/pet';
import { Weight, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PetWeightChart } from './pet-weight-chart';
import { PetWeightForm } from './pet-weight-form';

interface PetWeightTabProps {
  petId: string;
  pet: PetProfile;
}

export function PetWeightTab({ petId, pet }: PetWeightTabProps) {
  const [records, setRecords] = useState<PetWeightRecord[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchWeightRecords();
  }, [petId]);

  const fetchWeightRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health/pets/${petId}/weight`);
      if (!response.ok) {
        throw new Error('체중 기록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setRecords(data.records || []);
      setLatestWeight(data.latestWeight);
    } catch (error) {
      console.error('체중 기록 조회 실패:', error);
      toast.error('체중 기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 현재 체중 */}
      {latestWeight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="w-5 h-5" />
              현재 체중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{latestWeight}kg</div>
              {records.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  최근 기록: {format(new Date(records[0].date), 'yyyy-MM-dd', { locale: ko })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 체중 그래프 */}
      {records.length > 0 && (
        <PetWeightChart weightRecords={records} />
      )}

      {/* 체중 기록 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                체중 기록
              </CardTitle>
              <CardDescription>
                체중 기록을 확인하고 관리하세요
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              기록 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">체중 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Weight className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{record.weight_kg}kg</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.date), 'yyyy년 MM월 dd일', { locale: ko })}
                      </p>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground">{record.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 체중 기록 추가 폼 */}
      <PetWeightForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        petId={petId}
        onSuccess={fetchWeightRecords}
      />
    </div>
  );
}

