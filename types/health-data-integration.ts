/**
 * @file types/health-data-integration.ts
 * @description 건강정보 자동 연동 관련 타입 정의
 */

/**
 * 데이터 소스 유형
 */
export type DataSourceType = "mydata" | "health_highway" | "manual";

/**
 * 연결 상태
 */
export type ConnectionStatus = "pending" | "connected" | "disconnected" | "error";

/**
 * 동기화 주기
 */
export type SyncFrequency = "daily" | "weekly" | "monthly" | "manual";

/**
 * 동기화 타입
 */
export type SyncType = "full" | "incremental" | "manual";

/**
 * 동기화 상태
 */
export type SyncStatus = "success" | "failed" | "partial";

/**
 * 건강정보 데이터 소스
 */
export interface HealthDataSource {
  id: string;
  user_id: string;
  source_type: DataSourceType;
  source_name: string;
  connection_status: ConnectionStatus;
  connected_at: string | null;
  last_synced_at: string | null;
  sync_frequency: SyncFrequency;
  connection_metadata: Record<string, any>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 병원 방문 기록
 */
export interface HospitalRecord {
  id: string;
  user_id: string;
  family_member_id: string | null;
  visit_date: string; // DATE 형식
  hospital_name: string;
  hospital_code: string | null;
  department: string | null;
  diagnosis: string[];
  diagnosis_codes: string[];
  prescribed_medications: PrescribedMedication[];
  treatment_summary: string | null;
  data_source_id: string | null;
  is_auto_synced: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 처방약물 정보
 */
export interface PrescribedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  medication_code?: string;
}

/**
 * 약물 복용 기록
 */
export interface MedicationRecord {
  id: string;
  user_id: string;
  family_member_id: string | null;
  medication_name: string;
  medication_code: string | null;
  active_ingredient: string | null;
  dosage: string;
  frequency: string;
  start_date: string; // DATE 형식
  end_date: string | null; // DATE 형식
  reminder_times: string[]; // TIME[] 형식
  reminder_enabled: boolean;
  hospital_record_id: string | null;
  data_source_id: string | null;
  is_auto_synced: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 질병 상태
 */
export type DiseaseStatus = "active" | "cured" | "chronic" | "monitoring";

/**
 * 질병 심각도
 */
export type DiseaseSeverity = "mild" | "moderate" | "severe";

/**
 * 질병 진단 기록
 */
export interface DiseaseRecord {
  id: string;
  user_id: string;
  family_member_id: string | null;
  disease_name: string;
  disease_code: string | null;
  diagnosis_date: string; // DATE 형식
  hospital_name: string | null;
  hospital_record_id: string | null;
  status: DiseaseStatus;
  severity: DiseaseSeverity | null;
  treatment_plan: string | null;
  data_source_id: string | null;
  is_auto_synced: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 건강정보 동기화 로그
 */
export interface HealthDataSyncLog {
  id: string;
  user_id: string;
  data_source_id: string | null;
  sync_type: SyncType;
  sync_status: SyncStatus;
  records_synced: number;
  hospital_records_count: number;
  medication_records_count: number;
  disease_records_count: number;
  checkup_records_count: number;
  error_message: string | null;
  error_details: Record<string, any>;
  sync_duration_ms: number | null;
  synced_at: string;
  created_at: string;
}

/**
 * 예방주사 알림 로그
 */
export interface VaccinationNotificationLog {
  id: string;
  user_id: string;
  family_member_id: string | null;
  vaccination_schedule_id: string;
  vaccination_record_id: string | null;
  notification_type: "scheduled" | "reminder" | "overdue";
  notification_channel: "push" | "sms" | "email" | "in_app";
  scheduled_date: string; // DATE 형식
  notification_sent_at: string | null;
  notification_status: "pending" | "sent" | "failed" | "dismissed";
  reminder_days_before: number | null;
  error_message: string | null;
  created_at: string;
}

/**
 * 생애주기별 예방주사 일정
 */
export interface LifecycleVaccinationSchedule {
  id: string;
  vaccine_name: string;
  vaccine_code: string | null;
  target_age_min_months: number | null;
  target_age_max_months: number | null;
  priority: "required" | "recommended" | "optional";
  dose_number: number;
  total_doses: number;
  interval_days: number | null;
  gender_requirement: "male" | "female" | "all" | null;
  description: string | null;
  source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

