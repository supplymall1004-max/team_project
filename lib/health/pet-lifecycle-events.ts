/**
 * @file lib/health/pet-lifecycle-events.ts
 * @description 반려동물 생애주기별 건강 이벤트 생성 로직
 * 
 * AVMA/AAHA 기준으로 반려동물의 생애주기별 건강 이벤트를 생성합니다.
 * - 중성화 수술 시기 안내
 * - 생애주기별 맞춤 건강 이벤트 자동 매칭
 */

import { PetType, PetLifecycleStage, calculatePetLifecycle } from './pet-lifecycle-calculator';
import { PetProfile } from '@/types/pet';

export interface PetLifecycleEvent {
  event_code: string;
  event_name: string;
  event_type: 'neutering' | 'dental' | 'blood_test' | 'senior_care' | 'other';
  target_age_months: number;
  target_age_years?: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
  recommended_action?: string;
  notification_timing_days_before?: number; // 이벤트 예정일로부터 며칠 전 알림
}

/**
 * 반려동물 생애주기별 건강 이벤트 마스터 데이터
 */
const PET_LIFECYCLE_EVENTS: PetLifecycleEvent[] = [
  // 중성화 수술
  {
    event_code: 'dog_neutering',
    event_name: '강아지 중성화 수술',
    event_type: 'neutering',
    target_age_months: 6,
    priority: 'high',
    description: '강아지의 중성화 수술 권장 시기입니다. 건강상 이점과 행동 개선에 도움이 됩니다.',
    recommended_action: '수의사와 상담하여 중성화 수술 일정을 계획하세요.',
    notification_timing_days_before: 30,
  },
  {
    event_code: 'cat_neutering',
    event_name: '고양이 중성화 수술',
    event_type: 'neutering',
    target_age_months: 5,
    priority: 'high',
    description: '고양이의 중성화 수술 권장 시기입니다. 건강상 이점과 행동 개선에 도움이 됩니다.',
    recommended_action: '수의사와 상담하여 중성화 수술 일정을 계획하세요.',
    notification_timing_days_before: 30,
  },
  // 치과 검진 (3세 이후)
  {
    event_code: 'dental_checkup_3years',
    event_name: '정기 치과 검진',
    event_type: 'dental',
    target_age_years: 3,
    priority: 'medium',
    description: '3세 이후부터는 매년 정기적인 치과 검진과 스케일링을 권장합니다.',
    recommended_action: '수의사와 상담하여 치과 검진 일정을 계획하세요.',
    notification_timing_days_before: 14,
  },
  // 혈액 검사 (강아지 7세 이상)
  {
    event_code: 'dog_blood_test_7years',
    event_name: '노령견 혈액 검사',
    event_type: 'blood_test',
    target_age_years: 7,
    priority: 'high',
    description: '강아지 7세 이상부터는 매년 정기적인 혈액 검사를 권장합니다.',
    recommended_action: '수의사와 상담하여 혈액 검사 일정을 계획하세요.',
    notification_timing_days_before: 14,
  },
  {
    event_code: 'dog_blood_test_10years',
    event_name: '고령견 혈액 검사',
    event_type: 'blood_test',
    target_age_years: 10,
    priority: 'high',
    description: '강아지 10세 이상부터는 반기별(6개월마다) 혈액 검사를 권장합니다.',
    recommended_action: '수의사와 상담하여 혈액 검사 일정을 계획하세요.',
    notification_timing_days_before: 14,
  },
  // 혈액 검사 (고양이 10세 이상)
  {
    event_code: 'cat_blood_test_10years',
    event_name: '노묘 혈액 검사',
    event_type: 'blood_test',
    target_age_years: 10,
    priority: 'high',
    description: '고양이 10세 이상부터는 매년 정기적인 혈액 검사를 권장합니다.',
    recommended_action: '수의사와 상담하여 혈액 검사 일정을 계획하세요.',
    notification_timing_days_before: 14,
  },
  {
    event_code: 'cat_blood_test_15years',
    event_name: '고령묘 혈액 검사',
    event_type: 'blood_test',
    target_age_years: 15,
    priority: 'high',
    description: '고양이 15세 이상부터는 반기별(6개월마다) 혈액 검사를 권장합니다.',
    recommended_action: '수의사와 상담하여 혈액 검사 일정을 계획하세요.',
    notification_timing_days_before: 14,
  },
];

/**
 * 반려동물의 생애주기별 건강 이벤트 생성
 * @param pet 반려동물 프로필
 * @returns 건강 이벤트 목록
 */
export function generatePetLifecycleEvents(pet: PetProfile): PetLifecycleEvent[] {
  if (!pet.birth_date || !pet.pet_type) {
    return [];
  }

  const lifecycleInfo = calculatePetLifecycle(pet.pet_type, pet.birth_date);
  const ageMonths = lifecycleInfo.age.totalMonths;
  const ageYears = lifecycleInfo.age.years;

  // 해당 반려동물 종류와 나이에 맞는 이벤트 필터링
  const applicableEvents = PET_LIFECYCLE_EVENTS.filter((event) => {
    // 강아지/고양이 구분
    if (event.event_code.startsWith('dog_') && pet.pet_type !== 'dog') {
      return false;
    }
    if (event.event_code.startsWith('cat_') && pet.pet_type !== 'cat') {
      return false;
    }

    // 나이 조건 확인
    if (event.target_age_months) {
      if (ageMonths < event.target_age_months) {
        return false; // 아직 시기가 아님
      }
      // 이미 지난 이벤트는 제외 (중성화 수술 등은 한 번만)
      if (event.event_type === 'neutering' && ageMonths > event.target_age_months + 3) {
        return false; // 중성화 수술은 3개월 여유를 두고 제외
      }
    }
    if (event.target_age_years) {
      if (ageYears < event.target_age_years) {
        return false; // 아직 시기가 아님
      }
    }

    return true;
  });

  return applicableEvents;
}

/**
 * 이벤트 타입 한글명 반환
 */
export function getEventTypeLabel(eventType: PetLifecycleEvent['event_type']): string {
  const labels: Record<PetLifecycleEvent['event_type'], string> = {
    neutering: '중성화 수술',
    dental: '치과 검진',
    blood_test: '혈액 검사',
    senior_care: '노령 관리',
    other: '기타',
  };
  return labels[eventType] || eventType;
}

