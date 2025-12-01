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




















