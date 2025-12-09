/**
 * @file types/kcdc.ts
 * @description KCDC (질병관리청) 알림 관련 타입 정의
 */

/**
 * KCDC 알림 유형
 */
export type KcdcAlertType = "flu" | "vaccination" | "disease_outbreak";

/**
 * 심각도
 */
export type KcdcSeverity = "info" | "warning" | "critical";

/**
 * 독감 경보 단계
 */
export type FluStage = "관심" | "주의" | "경계" | "심각";

/**
 * 대상 연령대
 */
export type TargetAgeGroup = "영유아" | "청소년" | "성인" | "노인" | "전체";

/**
 * KCDC 알림
 */
export interface KcdcAlert {
  id: string;
  alert_type: KcdcAlertType;
  title: string;
  content: string;
  severity: KcdcSeverity;
  
  // 독감 관련 필드
  flu_stage?: FluStage;
  flu_week?: string; // 'YYYY-Www' 형식
  
  // 예방접종 관련 필드
  vaccine_name?: string;
  target_age_group?: TargetAgeGroup;
  recommended_date?: string; // 'YYYY-MM-DD'
  
  // 메타데이터
  source_url?: string;
  published_at?: string;
  is_active: boolean;
  priority: number;
  
  // 캐시 관리
  fetched_at: string;
  expires_at?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * KCDC API 응답 (RSS/JSON)
 */
export interface KcdcApiResponse {
  flu?: {
    stage: FluStage;
    week: string;
    description: string;
    publishedAt: string;
  };
  vaccinations?: Array<{
    name: string;
    targetAgeGroup: TargetAgeGroup;
    recommendedDate?: string;
    description: string;
    publishedAt: string;
  }>;
  diseaseOutbreaks?: Array<{
    name: string;
    severity: KcdcSeverity;
    description: string;
    publishedAt: string;
  }>;
}

/**
 * 사용자별 KCDC 알림 설정
 */
export interface UserKcdcSettings {
  flu_alerts_enabled: boolean;
  vaccination_alerts_enabled: boolean;
  disease_outbreak_alerts_enabled: boolean;
  reminder_frequency: "weekly" | "monthly" | "never";
  target_age_groups: TargetAgeGroup[]; // 관심 있는 연령대
}

// ============================================================================
// Phase 1: 핵심 프리미엄 기능 타입 정의
// ============================================================================

/**
 * 위험 등급
 */
export type RiskLevel = "low" | "moderate" | "high" | "critical";

/**
 * 감염병 위험 지수
 */
export interface InfectionRiskScore {
  id: string;
  user_id: string;
  family_member_id?: string | null;
  risk_score: number; // 0-100
  risk_level: RiskLevel;
  flu_stage?: string | null;
  flu_week?: string | null;
  region?: string | null;
  factors: {
    age?: number;
    diseases?: string[];
    vaccination_status?: Record<string, boolean>;
    region_risk?: number;
    [key: string]: any;
  };
  recommendations: string[];
  calculated_at: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 예방접종 기록
 */
export interface VaccinationRecord {
  id: string;
  user_id: string;
  family_member_id?: string | null;
  vaccine_name: string;
  vaccine_code?: string | null;
  target_age_group?: string | null;
  scheduled_date?: string | null; // DATE 형식
  completed_date?: string | null; // DATE 형식
  dose_number: number;
  total_doses: number;
  vaccination_site?: string | null;
  vaccination_site_address?: string | null;
  reminder_enabled: boolean;
  reminder_days_before: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 예방접종 일정 우선순위
 */
export type VaccinationPriority = "required" | "recommended" | "optional";

/**
 * 예방접종 일정 상태
 */
export type VaccinationScheduleStatus = "pending" | "completed" | "skipped";

/**
 * 예방접종 일정 출처
 */
export type VaccinationScheduleSource = "kcdc" | "user_input";

/**
 * 예방접종 일정
 */
export interface VaccinationSchedule {
  id: string;
  user_id: string;
  family_member_id: string;
  vaccine_name: string;
  recommended_date: string; // DATE 형식
  priority: VaccinationPriority;
  status: VaccinationScheduleStatus;
  source: VaccinationScheduleSource;
  created_at: string;
  updated_at: string;
}

/**
 * 여행 위험도 평가
 */
export interface TravelRiskAssessment {
  id: string;
  user_id: string;
  destination_country: string;
  destination_region?: string | null;
  travel_start_date: string; // DATE 형식
  travel_end_date: string; // DATE 형식
  risk_level: RiskLevel;
  disease_alerts: Array<{
    disease_name: string;
    severity: string;
    description: string;
    [key: string]: any;
  }>;
  prevention_checklist: string[];
  vaccination_requirements: Array<{
    vaccine_name: string;
    required: boolean;
    recommended_date?: string;
    [key: string]: any;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * 건강검진 유형
 */
export type CheckupType = "national" | "cancer" | "special";

/**
 * 건강검진 기록
 */
export interface HealthCheckupRecord {
  id: string;
  user_id: string;
  family_member_id?: string | null;
  checkup_type: CheckupType;
  checkup_date: string; // DATE 형식
  checkup_site?: string | null;
  checkup_site_address?: string | null;
  results: Record<string, any>; // JSONB
  next_recommended_date?: string | null; // DATE 형식
  overdue_days?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * 건강검진 권장 일정 우선순위
 */
export type CheckupPriority = "high" | "medium" | "low";

/**
 * 건강검진 권장 일정
 */
export interface HealthCheckupRecommendation {
  id: string;
  user_id: string;
  family_member_id: string;
  checkup_type: string;
  checkup_name: string;
  recommended_date: string; // DATE 형식
  priority: CheckupPriority;
  overdue: boolean;
  last_checkup_date?: string | null; // DATE 형식
  age_requirement?: string | null;
  gender_requirement?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 감염병 발생 정보 (KCDC 캐시)
 */
export interface DiseaseOutbreak {
  id: string;
  disease_name: string;
  disease_code?: string | null;
  region: string;
  outbreak_date: string; // DATE 형식
  case_count: number;
  severity?: RiskLevel | null;
  alert_level?: string | null;
  description?: string | null;
  source_url?: string | null;
  fetched_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 건강검진 통계 (KCDC 캐시)
 */
export interface HealthCheckupStatistics {
  id: string;
  checkup_type: string;
  age_group: string;
  gender?: "male" | "female" | "all" | null;
  year: number;
  average_values: Record<string, any>; // JSONB
  normal_ranges: Record<string, any>; // JSONB
  fetched_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Phase 9: 주기적 건강 관리 서비스 타입 정의
// ============================================================================

/**
 * 주기적 서비스 유형
 */
export type PeriodicServiceType =
  | "vaccination"
  | "checkup"
  | "deworming"
  | "disease_management"
  | "other";

/**
 * 주기 유형
 */
export type CycleType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

/**
 * 주기적 건강 관리 서비스
 */
export interface PeriodicHealthService {
  id: string;
  user_id: string;
  family_member_id?: string | null;
  service_type: PeriodicServiceType;
  service_name: string;
  cycle_type: CycleType;
  cycle_days?: number | null;
  last_service_date?: string | null; // DATE 형식
  next_service_date: string; // DATE 형식
  reminder_days_before: number;
  reminder_enabled: boolean;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 구충제 복용 기록
 */
export interface DewormingRecord {
  id: string;
  user_id: string;
  family_member_id?: string | null;
  medication_name: string;
  dosage: string;
  taken_date: string; // DATE 형식
  next_due_date?: string | null; // DATE 형식
  cycle_days: number;
  prescribed_by?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 구충제 마스터 데이터
 */
export interface DewormingMedication {
  id: string;
  medication_name: string;
  active_ingredient: string;
  standard_dosage: string;
  standard_cycle_days: number;
  target_parasites: string[];
  age_group?: string | null;
  contraindications: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 알림 유형
 */
export type ReminderType = "push" | "email" | "sms" | "in_app";

/**
 * 알림 상태
 */
export type ReminderStatus = "sent" | "failed" | "dismissed";

/**
 * 주기적 서비스 알림 로그
 */
export interface PeriodicServiceReminder {
  id: string;
  user_id: string;
  service_id: string;
  reminder_type: ReminderType;
  reminder_date: string; // DATE 형식
  service_due_date: string; // DATE 형식
  status: ReminderStatus;
  created_at: string;
}

/**
 * 사용자 알림 설정 (프리미엄 기능)
 */
export interface UserNotificationSettings {
  id: string;
  user_id: string;
  periodic_services_enabled: boolean;
  periodic_services_reminder_days: number;
  deworming_reminders_enabled: boolean;
  vaccination_reminders_enabled: boolean;
  checkup_reminders_enabled: boolean;
  infection_risk_alerts_enabled: boolean;
  travel_risk_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 위험 등급 라벨
 */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "낮음",
  moderate: "보통",
  high: "높음",
  critical: "매우 높음",
};

/**
 * 위험 등급 색상 (Tailwind CSS 클래스)
 */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "text-green-600 bg-green-50",
  moderate: "text-yellow-600 bg-yellow-50",
  high: "text-orange-600 bg-orange-50",
  critical: "text-red-600 bg-red-50",
};

/**
 * 예방접종 우선순위 라벨
 */
export const VACCINATION_PRIORITY_LABELS: Record<VaccinationPriority, string> =
  {
    required: "필수",
    recommended: "권장",
    optional: "선택",
  };

/**
 * 예방접종 일정 상태 라벨
 */
export const VACCINATION_SCHEDULE_STATUS_LABELS: Record<
  VaccinationScheduleStatus,
  string
> = {
  pending: "예정",
  completed: "완료",
  skipped: "건너뜀",
};

/**
 * 건강검진 유형 라벨
 */
export const CHECKUP_TYPE_LABELS: Record<CheckupType, string> = {
  national: "국가건강검진",
  cancer: "암검진",
  special: "특수검진",
};

/**
 * 건강검진 우선순위 라벨
 */
export const CHECKUP_PRIORITY_LABELS: Record<CheckupPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

/**
 * 주기적 서비스 유형 라벨
 */
export const PERIODIC_SERVICE_TYPE_LABELS: Record<
  PeriodicServiceType,
  string
> = {
  vaccination: "예방접종",
  checkup: "건강검진",
  deworming: "구충제",
  disease_management: "질병관리",
  other: "기타",
};

/**
 * 주기 유형 라벨
 */
export const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  quarterly: "분기별",
  yearly: "매년",
  custom: "사용자 정의",
};
























