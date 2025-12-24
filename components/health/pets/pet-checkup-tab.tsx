/**
 * @file components/health/pets/pet-checkup-tab.tsx
 * @description 반려동물 건강 검진 관리 탭 컴포넌트
 * 
 * 주요 기능:
 * 1. 건강 검진 기록 목록
 * 2. 검진 종류별 필터링
 * 3. 검진 기록 추가
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PetProfile, PetHealthCheckupRecord } from '@/types/pet';
import { Stethoscope, Plus, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PetCheckupForm } from './pet-checkup-form';

interface PetCheckupTabProps {
  petId: string;
  pet: PetProfile;
}

const CHECKUP_TYPE_LABELS: Record<string, string> = {
  regular: '정기 검진',
  dental: '치과 검진',
  blood_test: '혈액 검사',
  xray: 'X-ray',
  ultrasound: '초음파',
  other: '기타',
};

export function PetCheckupTab({ petId, pet }: PetCheckupTabProps) {
  const [records, setRecords] = useState<PetHealthCheckupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchCheckupRecords();
  }, [petId]);

  const fetchCheckupRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health/pets/${petId}/checkups`);
      if (!response.ok) {
        throw new Error('건강 검진 기록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('건강 검진 기록 조회 실패:', error);
      toast.error('건강 검진 기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 건강 검진 기록 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                건강 검진 기록
              </CardTitle>
              <CardDescription>
                반려동물의 건강 검진 기록을 확인하고 관리하세요
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
              <p className="text-muted-foreground">건강 검진 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {CHECKUP_TYPE_LABELS[record.checkup_type] || record.checkup_type}
                        </h3>
                        <Badge variant="outline">{record.checkup_type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(record.checkup_date), 'yyyy년 MM월 dd일', { locale: ko })}
                        </span>
                        {record.checkup_site && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {record.checkup_site}
                          </span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                      )}
                      {record.next_recommended_date && (
                        <p className="text-xs text-blue-600 mt-2">
                          다음 권장일: {format(new Date(record.next_recommended_date), 'yyyy-MM-dd', { locale: ko })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 건강 검진 기록 추가 폼 */}
      <PetCheckupForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        petId={petId}
        onSuccess={fetchCheckupRecords}
      />
    </div>
  );
}

