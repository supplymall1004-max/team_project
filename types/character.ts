/**
 * @file types/character.ts
 * @description 캐릭터창 인터페이스 타입 정의
 *
 * 캐릭터창에 표시되는 모든 데이터의 타입을 정의합니다.
 */

import type { FamilyMember } from "./family";
import type { MedicationRecord } from "./health-data-integration";
import type {
  HealthCheckupRecord,
  HealthCheckupRecommendation,
  VaccinationRecord,
  VaccinationSchedule,
  DewormingRecord,
} from "./kcdc";
import type { WeightLog } from "./health-visualization";

/**
 * 리마인드 아이템 타입
 */
export interface ReminderItem {
  id: string;
  type: "medication" | "checkup" | "vaccination" | "deworming" | "lifecycle_event";
  title: string;
  description: string;
  dueDate: string; // DATE 형식
  daysUntil: number; // D-Day 계산 (음수면 지난 일수)
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "completed" | "missed";
  relatedId: string | null; // 관련 레코드 ID
}

/**
 * 체중 추이 데이터
 */
export interface WeightTrendData {
  date: string;
  weight_kg: number;
  body_fat_percentage: number | null;
}

/**
 * 활동량 추이 데이터
 */
export interface ActivityTrendData {
  date: string;
  steps: number | null;
  calories_burned: number | null;
}

/**
 * 영양 섭취 추이 데이터
 */
export interface NutritionTrendData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 건강 점수 추이 데이터
 */
export interface HealthScoreTrendData {
  date: string;
  score: number;
}

/**
 * 건강 상태 타입
 */
export type HealthStatus = "excellent" | "good" | "fair" | "needs_attention";

/**
 * 캐릭터창 데이터 타입
 */
export interface CharacterData {
  member: FamilyMember & {
    photo_url?: string | null;
    avatar_type?: "photo" | "icon" | null;
    health_score?: number | null;
    health_score_updated_at?: string | null;
  };
  basicInfo: {
    name: string;
    age: number;
    height_cm: number | null;
    weight_kg: number | null;
    body_fat_percentage: number | null;
    muscle_mass_kg: number | null;
    bmi: number | null;
  };
  importantInfo: {
    diseases: string[];
    allergies: string[];
    health_score: number;
    health_status: HealthStatus;
  };
  medications: {
    active: MedicationRecord[];
    todayChecked: string[]; // 오늘 복용 체크된 약물 ID 목록
    missed: MedicationRecord[]; // 오늘 복용하지 않은 약물 목록
  };
  checkups: {
    last: HealthCheckupRecord | null;
    next: HealthCheckupRecommendation | null;
    daysUntil: number | null; // D-Day 계산
  };
  vaccinations: {
    completed: VaccinationRecord[];
    scheduled: VaccinationSchedule[];
    next: VaccinationSchedule | null;
    daysUntil: number | null; // D-Day 계산
  };
  deworming: {
    last: DewormingRecord | null;
    next: Date | null;
    daysUntil: number | null; // D-Day 계산
    cycleDays: number | null;
  };
  reminders: {
    urgent: ReminderItem[]; // 긴급 리마인드 (오늘 또는 내일)
    upcoming: ReminderItem[]; // 다가올 리마인드 (이번 주)
    all: ReminderItem[]; // 전체 리마인드
  };
  lifecycleNotifications: {
    high: Array<{
      id: string;
      title: string;
      message: string;
      priority: "high" | "urgent";
      status: string;
      scheduled_at: string | null;
    }>;
    medium: Array<{
      id: string;
      title: string;
      message: string;
      priority: "normal" | "medium";
      status: string;
      scheduled_at: string | null;
    }>;
    low: Array<{
      id: string;
      title: string;
      message: string;
      priority: "low";
      status: string;
      scheduled_at: string | null;
    }>;
  };
  healthTrends: {
    weight: WeightTrendData[]; // 최근 3개월 체중 추이
    activity: ActivityTrendData[]; // 최근 3개월 활동량 추이
    nutrition: NutritionTrendData[]; // 최근 3개월 영양 섭취 추이
    healthScore: HealthScoreTrendData[]; // 최근 3개월 건강 점수 추이
  };
}

/**
 * 가족 구성원 캐릭터 카드 데이터 (홈페이지용)
 */
export interface CharacterCardData {
  id: string;
  name: string;
  photo_url: string | null;
  avatar_type: "photo" | "icon";
  health_score: number | null;
  health_status: HealthStatus;
  relationship: string | null;
  age: number;
}

