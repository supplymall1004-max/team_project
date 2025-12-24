/**
 * @file components/health/pets/pet-vaccine-tab.tsx
 * @description 반려동물 백신 관리 탭 컴포넌트
 * 
 * 주요 기능:
 * 1. 백신 일정 표시 (D-Day 카운트다운)
 * 2. 백신 기록 목록
 * 3. 백신 기록 추가/수정
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PetProfile, PetVaccinationRecord } from '@/types/pet';
import { PetVaccineSchedule, calculateVaccinePriority } from '@/lib/health/pet-vaccine-scheduler';
import { Syringe, Calendar, Clock, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PetVaccineDialog } from './pet-vaccine-dialog';

interface PetVaccineTabProps {
  petId: string;
  pet: PetProfile;
}

export function PetVaccineTab({ petId, pet }: PetVaccineTabProps) {
  const [records, setRecords] = useState<PetVaccinationRecord[]>([]);
  const [schedules, setSchedules] = useState<PetVaccineSchedule[]>([]);
  const [nextVaccineDate, setNextVaccineDate] = useState<Date | null>(null);
  const [daysUntilNext, setDaysUntilNext] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchVaccinations();
  }, [petId]);

  const fetchVaccinations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health/pets/${petId}/vaccinations`);
      if (!response.ok) {
        throw new Error('백신 기록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setRecords(data.records || []);
      setSchedules(data.schedules || []);
      if (data.nextVaccineDate) {
        setNextVaccineDate(new Date(data.nextVaccineDate));
      }
      setDaysUntilNext(data.daysUntilNext);
    } catch (error) {
      console.error('백신 기록 조회 실패:', error);
      toast.error('백신 기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const priority = daysUntilNext !== null ? calculateVaccinePriority(daysUntilNext) : 'low';

  return (
    <div className="space-y-6">
      {/* 다음 백신 D-Day 카운트다운 */}
      {nextVaccineDate && daysUntilNext !== null && (
        <Card className={cn(
          "border-2",
          priority === 'high' && "border-red-500 bg-red-50",
          priority === 'medium' && "border-yellow-500 bg-yellow-50",
          priority === 'low' && "border-blue-500 bg-blue-50"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              다음 백신 예정일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {daysUntilNext === 0
                  ? '오늘'
                  : daysUntilNext === 1
                  ? '내일'
                  : `D-${daysUntilNext}`}
              </div>
              <p className="text-muted-foreground">
                {format(nextVaccineDate, 'yyyy년 MM월 dd일', { locale: ko })}
              </p>
              {schedules.length > 0 && (
                <p className="text-sm mt-2">
                  다음 백신: {schedules[0].vaccine_name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 백신 일정 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="w-5 h-5" />
            백신 일정
          </CardTitle>
          <CardDescription>
            생애주기별 권장 백신 일정을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">예정된 백신이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, index) => {
                const daysUntil = Math.ceil(
                  (schedule.recommended_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const schedulePriority = calculateVaccinePriority(daysUntil);

                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border",
                      schedulePriority === 'high' && "border-red-200 bg-red-50",
                      schedulePriority === 'medium' && "border-yellow-200 bg-yellow-50",
                      schedulePriority === 'low' && "border-gray-200 bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{schedule.vaccine_name}</h3>
                          {schedule.is_required && (
                            <Badge variant="destructive" className="text-xs">필수</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(schedule.recommended_date, 'yyyy-MM-dd', { locale: ko })}
                          </span>
                          {daysUntil >= 0 && (
                            <span className={cn(
                              "font-medium",
                              schedulePriority === 'high' && "text-red-600",
                              schedulePriority === 'medium' && "text-yellow-600",
                              schedulePriority === 'low' && "text-blue-600"
                            )}>
                              {daysUntil === 0 ? '오늘' : daysUntil === 1 ? '내일' : `D-${daysUntil}`}
                            </span>
                          )}
                        </div>
                        {schedule.description && (
                          <p className="text-xs text-muted-foreground mt-2">{schedule.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 백신 기록 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                백신 기록
              </CardTitle>
              <CardDescription>
                접종 완료된 백신 기록을 확인하세요
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              기록 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">백신 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{record.vaccine_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {record.completed_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(record.completed_date), 'yyyy-MM-dd', { locale: ko })}
                          </span>
                        )}
                        {record.vaccination_site && (
                          <span>{record.vaccination_site}</span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{record.notes}</p>
                      )}
                    </div>
                    {record.completed_date && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        완료
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 백신 기록 추가 다이얼로그 */}
      <PetVaccineDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        petId={petId}
        onSuccess={fetchVaccinations}
      />
    </div>
  );
}

