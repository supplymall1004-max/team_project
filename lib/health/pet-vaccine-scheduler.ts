/**
 * @file lib/health/pet-vaccine-scheduler.ts
 * @description 반려동물 백신 스케줄러 로직
 * 
 * AVMA/AAHA 기준으로 반려동물의 백신 일정을 자동 계산하고 관리합니다.
 * - 생애주기 단계에 따른 백신 추천
 * - 다음 접종일 자동 계산
 * - D-Day 카운트다운
 */

import { PetType, PetLifecycleStage, calculatePetLifecycle } from './pet-lifecycle-calculator';
import { PetVaccineMaster, PetVaccinationRecord } from '@/types/pet';

export interface PetVaccineSchedule {
  vaccine_code: string;
  vaccine_name: string;
  recommended_date: Date;
  is_required: boolean;
  lifecycle_stage: PetLifecycleStage;
  dose_number: number;
  total_doses: number;
  booster_interval_months?: number;
  description?: string;
}

export interface PetVaccineScheduleResult {
  schedules: PetVaccineSchedule[];
  nextVaccineDate?: Date;
  daysUntilNext: number | null;
  completedCount: number;
  pendingCount: number;
}

/**
 * 반려동물의 생애주기 단계에 맞는 백신 일정 생성
 * @param petType 반려동물 종류
 * @param birthDate 생년월일
 * @param existingRecords 기존 백신 기록
 * @param vaccineMaster 백신 마스터 데이터
 * @returns 백신 일정 목록
 */
export function generatePetVaccineSchedules(
  petType: PetType,
  birthDate: string | Date,
  existingRecords: PetVaccinationRecord[],
  vaccineMaster: PetVaccineMaster[]
): PetVaccineScheduleResult {
  const lifecycleInfo = calculatePetLifecycle(petType, birthDate);
  const currentStage = lifecycleInfo.stage;
  const ageMonths = lifecycleInfo.age.totalMonths;
  const ageWeeks = Math.floor(lifecycleInfo.age.totalDays / 7);

  // 해당 반려동물 종류와 생애주기 단계에 맞는 백신 필터링
  const applicableVaccines = vaccineMaster.filter((vaccine) => {
    // pet_type이 'both'이거나 해당 종류와 일치
    if (vaccine.pet_type !== 'both' && vaccine.pet_type !== petType) {
      return false;
    }

    // 생애주기 단계가 일치하거나 null인 경우 (모든 단계 적용)
    if (vaccine.lifecycle_stage && vaccine.lifecycle_stage !== currentStage) {
      return false;
    }

    // 나이 조건 확인
    if (vaccine.recommended_age_weeks) {
      if (ageWeeks < vaccine.recommended_age_weeks) {
        return false; // 아직 접종 시기가 아님
      }
    }
    if (vaccine.recommended_age_months) {
      if (ageMonths < vaccine.recommended_age_months) {
        return false; // 아직 접종 시기가 아님
      }
    }

    return true;
  });

  const schedules: PetVaccineSchedule[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 각 백신에 대해 일정 생성
  for (const vaccine of applicableVaccines) {
    // 이미 완료된 백신인지 확인
    const completedRecord = existingRecords.find(
      (record) =>
        record.vaccine_code === vaccine.vaccine_code &&
        record.completed_date &&
        new Date(record.completed_date) <= today
    );

    if (completedRecord && vaccine.booster_interval_months) {
      // 추가 접종이 필요한 경우
      const lastCompletedDate = new Date(completedRecord.completed_date);
      const nextBoosterDate = new Date(lastCompletedDate);
      nextBoosterDate.setMonth(
        nextBoosterDate.getMonth() + vaccine.booster_interval_months
      );

      // 다음 접종일이 오늘 이후인 경우만 추가
      if (nextBoosterDate >= today) {
        schedules.push({
          vaccine_code: vaccine.vaccine_code,
          vaccine_name: vaccine.vaccine_name,
          recommended_date: nextBoosterDate,
          is_required: vaccine.is_required,
          lifecycle_stage: currentStage,
          dose_number: (completedRecord.dose_number || 1) + 1,
          total_doses: vaccine.booster_interval_months ? Infinity : 1,
          booster_interval_months: vaccine.booster_interval_months,
          description: vaccine.description,
        });
      }
    } else if (!completedRecord) {
      // 아직 접종하지 않은 백신
      let recommendedDate: Date;

      if (vaccine.recommended_age_weeks) {
        // 주 단위로 계산
        const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
        recommendedDate = new Date(birth);
        recommendedDate.setDate(recommendedDate.getDate() + vaccine.recommended_age_weeks * 7);
      } else if (vaccine.recommended_age_months) {
        // 개월 단위로 계산
        const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
        recommendedDate = new Date(birth);
        recommendedDate.setMonth(recommendedDate.getMonth() + vaccine.recommended_age_months);
      } else {
        // 즉시 접종 가능
        recommendedDate = today;
      }

      schedules.push({
        vaccine_code: vaccine.vaccine_code,
        vaccine_name: vaccine.vaccine_name,
        recommended_date: recommendedDate,
        is_required: vaccine.is_required,
        lifecycle_stage: currentStage,
        dose_number: 1,
        total_doses: vaccine.booster_interval_months ? Infinity : 1,
        booster_interval_months: vaccine.booster_interval_months,
        description: vaccine.description,
      });
    }
  }

  // 일정 정렬 (추천일 기준)
  schedules.sort((a, b) => a.recommended_date.getTime() - b.recommended_date.getTime());

  // 다음 백신일 계산
  const nextVaccine = schedules.find((s) => s.recommended_date >= today);
  const nextVaccineDate = nextVaccine?.recommended_date;
  const daysUntilNext = nextVaccineDate
    ? Math.ceil((nextVaccineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // 완료/대기 개수 계산
  const completedCount = existingRecords.filter(
    (record) => record.completed_date && new Date(record.completed_date) <= today
  ).length;
  const pendingCount = schedules.length;

  return {
    schedules,
    nextVaccineDate,
    daysUntilNext,
    completedCount,
    pendingCount,
  };
}

/**
 * 백신 접종 완료 후 다음 접종일 계산
 * @param completedDate 접종 완료일
 * @param boosterIntervalMonths 추가 접종 주기 (개월)
 * @returns 다음 접종일
 */
export function calculateNextVaccineDate(
  completedDate: Date,
  boosterIntervalMonths: number
): Date {
  const nextDate = new Date(completedDate);
  nextDate.setMonth(nextDate.getMonth() + boosterIntervalMonths);
  return nextDate;
}

/**
 * D-Day 우선순위 계산
 * @param daysUntilNext 다음 접종일까지 남은 일수
 * @returns 우선순위 ('high' | 'medium' | 'low')
 */
export function calculateVaccinePriority(daysUntilNext: number | null): 'high' | 'medium' | 'low' {
  if (daysUntilNext === null) return 'low';
  if (daysUntilNext <= 7) return 'high';
  if (daysUntilNext <= 14) return 'medium';
  return 'low';
}

