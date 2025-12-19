/**
 * @file components/health/dashboard/types.ts
 * @description 건강 대시보드 관련 타입 정의
 */

/**
 * 질병/알레르기 아이템 (JSONB 형식)
 */
export interface DiseaseItem {
  code: string;
  custom_name: string | null;
}

export interface AllergyItem {
  code: string;
  custom_name: string | null;
}

/**
 * 건강 프로필 요약
 */
export interface HealthProfileSummary {
  id: string;
  user_id: string;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  daily_calorie_goal: number;
  diseases: (string | DiseaseItem)[]; // 문자열 배열 또는 객체 배열
  allergies: (string | AllergyItem)[]; // 문자열 배열 또는 객체 배열
  dietary_preferences: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 건강 요약 데이터
 */
export interface HealthSummary {
  profile: HealthProfileSummary | null;
  recentHospitalVisits: number;
  activeMedications: number;
  upcomingVaccinations: number;
  lastHealthCheckup: string | null;
  healthScore: number;
  bmi: number | null;
  recommendations: string[];
}

/**
 * 가족 구성원 건강 요약
 */
export interface FamilyMemberHealthSummary {
  id: string;
  name: string;
  relationship?: string | null;
  healthScore: number;
  recentCheckup: {
    date: string | null;
    hasAbnormalResults: boolean;
  } | null;
  activeMedications: number;
  upcomingVaccinations: number;
  upcomingCheckups: number;
}

/**
 * 건강 알림
 */
export interface HealthAlert {
  id: string;
  type: "vaccination" | "checkup" | "medication" | "flu_alert";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  dueDate: string | null;
  familyMemberId: string | null;
  familyMemberName: string | null;
}

/**
 * 대시보드 모드
 */
export type DashboardMode = "summary" | "family" | "visualization" | "integrated";

/**
 * 대시보드 Props
 */
export interface HealthDashboardProps {
  mode?: DashboardMode;
  userId?: string;
  className?: string;
  showFamilyOverview?: boolean;
  showAlerts?: boolean;
  showVisualization?: boolean;
}
