/**
 * @file lib/health/lifecycle-master-data.ts
 * @description 생애주기별 이벤트 마스터 데이터
 * 
 * docs/defence.md를 기반으로 한 생애주기별 예방접종 및 건강 이벤트 마스터 데이터
 */

import { HumanLifecycleStage } from './lifecycle-calculator';

export interface LifecycleEventMaster {
  event_code: string;
  event_name: string;
  event_type: 'vaccination' | 'health_checkup' | 'milestone' | 'sensitive_health' | 'education' | 'military' | 'career' | 'family_formation' | 'housing_finance' | 'legal_social' | 'senior_retirement' | 'lifestyle';
  category: string;
  target_age_years?: number;
  target_age_months?: number;
  target_gender?: 'male' | 'female' | 'both';
  lifecycle_stage: HumanLifecycleStage[];
  priority: 'high' | 'medium' | 'low';
  notification_timing_days_before?: number;
  description: string;
  has_professional_info?: boolean;
  requires_user_choice?: boolean;
}

/**
 * 생애주기별 이벤트 마스터 데이터
 * docs/defence.md 기반
 */
export const LIFECYCLE_EVENT_MASTER: LifecycleEventMaster[] = [
  // 영유아기 예방접종 (0-6세)
  {
    event_code: 'hepatitis_b_1st',
    event_name: 'B형 간염 1차',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 0,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 7,
    description: '출생 직후 접종하는 B형 간염 1차 예방접종입니다.',
  },
  {
    event_code: 'hepatitis_b_2nd',
    event_name: 'B형 간염 2차',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 1,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 7,
    description: '1개월 시 접종하는 B형 간염 2차 예방접종입니다.',
  },
  {
    event_code: 'dtap_2months',
    event_name: '5가 혼합백신 (2개월)',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 2,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 7,
    description: '디프테리아, 파상풍, 백일해, 폴리오, 뇌수막염 예방 백신입니다.',
  },
  {
    event_code: 'dtap_4months',
    event_name: '5가 혼합백신 (4개월)',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 4,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 7,
    description: '디프테리아, 파상풍, 백일해, 폴리오, 뇌수막염 예방 백신 2차입니다.',
  },
  {
    event_code: 'dtap_6months',
    event_name: '5가 혼합백신 (6개월)',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 6,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 7,
    description: '디프테리아, 파상풍, 백일해, 폴리오, 뇌수막염 예방 백신 3차입니다.',
  },
  {
    event_code: 'mmr_12months',
    event_name: 'MMR (홍역, 유행성이하선염, 풍진)',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 12,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 14,
    description: '12-15개월 시 접종하는 MMR 백신입니다.',
  },
  {
    event_code: 'chickenpox_12months',
    event_name: '수두 예방접종',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_months: 12,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 14,
    description: '12-15개월 시 접종하는 수두 예방접종입니다.',
  },
  {
    event_code: 'mmr_4years',
    event_name: 'MMR 2차',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 4,
    target_gender: 'both',
    lifecycle_stage: ['infant'],
    priority: 'high',
    notification_timing_days_before: 14,
    description: '4-6세 시 접종하는 MMR 2차 백신입니다.',
  },
  
  // 청소년기 예방접종 (11-18세)
  {
    event_code: 'hpv_12years',
    event_name: 'HPV (사람유두종바이러스) 예방접종',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 12,
    target_gender: 'both',
    lifecycle_stage: ['adolescent'],
    priority: 'high',
    notification_timing_days_before: 30,
    description: '성병 및 자궁경부암 예방을 위해 남녀 모두 접종 권장 (만 12세 전후 최적).',
  },
  {
    event_code: 'tdap_11years',
    event_name: 'Tdap (파상풍, 디프테리아, 백일해)',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 11,
    target_gender: 'both',
    lifecycle_stage: ['adolescent'],
    priority: 'medium',
    notification_timing_days_before: 14,
    description: '만 11-12세에 1회 추가 접종하는 Tdap 백신입니다.',
  },
  
  // 성인기 예방접종 (19-64세)
  {
    event_code: 'tetanus_10years',
    event_name: '파상풍 추가 접종',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 19,
    target_gender: 'both',
    lifecycle_stage: ['adult'],
    priority: 'medium',
    notification_timing_days_before: 30,
    description: '10년에 한 번씩 추가 접종이 필요한 파상풍 백신입니다.',
  },
  {
    event_code: 'flu_annual',
    event_name: '독감 예방접종',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 19,
    target_gender: 'both',
    lifecycle_stage: ['adult', 'elderly'],
    priority: 'high',
    notification_timing_days_before: 14,
    description: '매년 가을(10-11월)에 접종하는 독감 예방접종입니다.',
  },
  
  // 노년기 예방접종 (65세 이상)
  {
    event_code: 'pneumococcal_65years',
    event_name: '폐렴구균 예방접종',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 65,
    target_gender: 'both',
    lifecycle_stage: ['elderly'],
    priority: 'high',
    notification_timing_days_before: 30,
    description: '노년기 합병증 예방을 위해 반드시 권장되는 폐렴구균 예방접종입니다.',
  },
  {
    event_code: 'shingles_50years',
    event_name: '대상포진 예방접종',
    event_type: 'vaccination',
    category: 'kcdc',
    target_age_years: 50,
    target_gender: 'both',
    lifecycle_stage: ['adult', 'elderly'],
    priority: 'medium',
    notification_timing_days_before: 30,
    description: '50-60세 이후 1회(생백신) 또는 2회(사백신) 접종하는 대상포진 예방접종입니다.',
  },
  
  // 건강검진
  {
    event_code: 'national_checkup_40years',
    event_name: '국가건강검진 (40세 이상)',
    event_type: 'health_checkup',
    category: 'checkup',
    target_age_years: 40,
    target_gender: 'both',
    lifecycle_stage: ['adult'],
    priority: 'high',
    notification_timing_days_before: 30,
    description: '40세 이상부터 2년마다 받는 국가건강검진입니다.',
  },
  {
    event_code: 'cancer_screening_40years',
    event_name: '암 검진 (40세 이상)',
    event_type: 'health_checkup',
    category: 'checkup',
    target_age_years: 40,
    target_gender: 'both',
    lifecycle_stage: ['adult'],
    priority: 'high',
    notification_timing_days_before: 30,
    description: '40세 이상부터 시작하는 암 검진입니다.',
  },
];

/**
 * 생애주기 단계에 맞는 이벤트 필터링
 */
export function getEventsByLifecycleStage(
  stage: HumanLifecycleStage,
  gender?: 'male' | 'female'
): LifecycleEventMaster[] {
  return LIFECYCLE_EVENT_MASTER.filter((event) => {
    // 생애주기 단계 확인
    if (!event.lifecycle_stage.includes(stage)) {
      return false;
    }
    
    // 성별 확인
    if (event.target_gender && gender) {
      if (event.target_gender !== 'both' && event.target_gender !== gender) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * 이벤트 타입 한글명 반환
 */
export function getEventTypeLabel(eventType: LifecycleEventMaster['event_type']): string {
  const labels: Record<LifecycleEventMaster['event_type'], string> = {
    vaccination: '예방접종',
    health_checkup: '건강검진',
    milestone: '생애 마일스톤',
    sensitive_health: '민감한 건강 이벤트',
    education: '교육 단계',
    military: '군대',
    career: '직장 생활',
    family_formation: '가족 형성',
    housing_finance: '주거 및 경제',
    legal_social: '사회적 권리',
    senior_retirement: '시니어 및 은퇴',
    lifestyle: '라이프스타일',
  };
  return labels[eventType] || eventType;
}

