/**
 * @file vaccination-family-alert.tsx
 * @description 가족 구성원별 예방접종 안내 팝업 컴포넌트
 *
 * 가족 구성원 중 예방접종을 맞아야 할 나이가 있는 경우 팝업으로 안내합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Syringe, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface VaccinationRecommendation {
  familyMemberId: string;
  familyMemberName: string;
  ageMonths: number;
  ageYears: number;
  vaccinations: Array<{
    vaccine_name: string;
    vaccine_code: string | null;
    target_age_min_months: number;
    target_age_max_months: number | null;
    priority: "required" | "recommended" | "optional";
    dose_number: number;
    total_doses: number;
    description: string | null;
    gender_requirement: string | null;
  }>;
}

export function VaccinationFamilyAlert() {
  const [open, setOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<VaccinationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const response = await fetch('/api/health/vaccinations/family-recommendations');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            setRecommendations(data.data);
            setOpen(true);
          }
        }
      } catch (error) {
        console.error('예방접종 권장사항 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (loading || recommendations.length === 0) {
    return null;
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'required':
        return <Badge className="bg-red-100 text-red-800 border-red-300">필수</Badge>;
      case 'recommended':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">권장</Badge>;
      case 'optional':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">선택</Badge>;
      default:
        return null;
    }
  };

  const getAgeDisplay = (ageMonths: number, ageYears: number) => {
    if (ageYears < 1) {
      return `${ageMonths}개월`;
    } else if (ageMonths % 12 === 0) {
      return `${ageYears}세`;
    } else {
      return `${ageYears}세 ${ageMonths % 12}개월`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sky-900">
            <Syringe className="w-5 h-5 text-sky-600" />
            가족 구성원 예방접종 안내
          </DialogTitle>
          <DialogDescription className="text-sky-700">
            가족 구성원 중 예방접종을 맞아야 할 나이가 있는 분들이 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.familyMemberId}
              className="rounded-lg border-2 border-sky-200 bg-sky-50/50 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sky-900 text-lg">
                    {recommendation.familyMemberName}
                  </h3>
                  <p className="text-sm text-sky-700">
                    현재 나이: {getAgeDisplay(recommendation.ageMonths, recommendation.ageYears)}
                  </p>
                </div>
                <Badge className="bg-sky-100 text-sky-800 border-sky-300">
                  {recommendation.vaccinations.length}건
                </Badge>
              </div>

              <div className="space-y-2">
                {recommendation.vaccinations.map((vaccine, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 border border-sky-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sky-900">
                            {vaccine.vaccine_name}
                          </h4>
                          {getPriorityBadge(vaccine.priority)}
                        </div>
                        <p className="text-xs text-sky-700">
                          {vaccine.dose_number}차 / 총 {vaccine.total_doses}차
                          {vaccine.description && ` · ${vaccine.description}`}
                        </p>
                        {vaccine.target_age_max_months && (
                          <p className="text-xs text-sky-600 mt-1">
                            권장 접종 시기: {Math.floor(vaccine.target_age_min_months / 12)}세 ~{' '}
                            {vaccine.target_age_max_months
                              ? `${Math.floor(vaccine.target_age_max_months / 12)}세`
                              : '상시'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            예방접종은 질병관리청 표준 일정에 따라 접종하시기 바랍니다. 자세한 내용은{' '}
            <Link href="/health/vaccinations" className="underline font-semibold">
              예방접종 안내 페이지
            </Link>
            에서 확인하실 수 있습니다.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-sky-300 text-sky-700 hover:bg-sky-50"
          >
            닫기
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              window.location.href = '/health/vaccinations';
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            상세 정보 보기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

