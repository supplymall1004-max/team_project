/**
 * @file types/pet.ts
 * @description 반려동물 관련 타입 정의
 */

import { PetType, PetLifecycleStage, PetAge, PetLifecycleInfo } from '@/lib/health/pet-lifecycle-calculator';

/**
 * 반려동물 프로필 (family_members 테이블 확장)
 */
export interface PetProfile {
  id: string;
  user_id: string;
  name: string;
  birth_date: string; // 'YYYY-MM-DD' 형식
  member_type: 'pet';
  pet_type: PetType;
  breed?: string;
  gender?: 'male' | 'female' | 'neutered_male' | 'spayed_female';
  relationship: string; // 'pet', '반려동물' 등
  weight_kg?: number;
  photo_url?: string;
  lifecycle_stage?: PetLifecycleStage;
  pet_metadata?: Record<string, any>; // JSONB
  created_at: string;
  updated_at: string;
  
  // 계산된 필드 (클라이언트 측에서 계산)
  age?: PetAge;
  lifecycleInfo?: PetLifecycleInfo;
}

/**
 * 반려동물 등록/수정 요청 데이터
 */
export interface PetProfileInput {
  name: string;
  birth_date: string; // 'YYYY-MM-DD' 형식
  pet_type: PetType;
  breed?: string;
  gender?: 'male' | 'female' | 'neutered_male' | 'spayed_female';
  relationship?: string; // 기본값: 'pet'
  weight_kg?: number;
  photo_url?: string;
  pet_metadata?: Record<string, any>;
}

/**
 * 반려동물 백신 기록 (user_vaccination_records 테이블 사용)
 */
export interface PetVaccinationRecord {
  id: string;
  user_id: string;
  family_member_id: string; // 반려동물의 family_members.id
  vaccine_name: string;
  vaccine_code?: string;
  target_age_group?: string;
  scheduled_date?: string;
  completed_date?: string;
  dose_number?: number;
  total_doses?: number;
  vaccination_site?: string;
  reminder_enabled: boolean;
  reminder_days_before: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 반려동물 체중 기록 (weight_logs 테이블 사용)
 */
export interface PetWeightRecord {
  id: string;
  user_id: string;
  family_member_id: string; // 반려동물의 family_members.id
  date: string; // 'YYYY-MM-DD' 형식
  weight_kg: number;
  body_fat_percentage?: number;
  muscle_mass_kg?: number;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 반려동물 건강 검진 기록 (user_health_checkup_records 테이블 사용)
 */
export interface PetHealthCheckupRecord {
  id: string;
  user_id: string;
  family_member_id: string; // 반려동물의 family_members.id
  checkup_type: 'regular' | 'dental' | 'blood_test' | 'xray' | 'ultrasound' | 'other';
  checkup_date: string; // 'YYYY-MM-DD' 형식
  checkup_site?: string; // 수의사/병원 이름
  results?: Record<string, any>; // JSONB
  next_recommended_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 반려동물 백신 마스터 데이터
 */
export interface PetVaccineMaster {
  id: string;
  vaccine_name: string;
  vaccine_code: string;
  pet_type: 'dog' | 'cat' | 'both';
  lifecycle_stage?: PetLifecycleStage;
  recommended_age_weeks?: number;
  recommended_age_months?: number;
  booster_interval_months?: number;
  is_required: boolean;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 반려동물 타입 한글명 맵
 */
export const PET_TYPE_LABELS: Record<PetType, string> = {
  dog: '강아지',
  cat: '고양이',
  other: '기타',
};

/**
 * 반려동물 성별 한글명 맵
 */
export const PET_GENDER_LABELS: Record<string, string> = {
  male: '수컷',
  female: '암컷',
  neutered_male: '중성화된 수컷',
  spayed_female: '중성화된 암컷',
};

