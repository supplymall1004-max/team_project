/**
 * @file notifications.ts
 * @description 통합 알림 시스템 타입 정의
 *
 * 주요 타입:
 * 1. Notification: 통합 알림 로그
 * 2. NotificationType: 알림 타입
 * 3. NotificationStatus: 알림 상태
 * 4. NotificationPriority: 알림 우선순위
 */

/**
 * 알림 타입
 */
export type NotificationType = 
  | "system" 
  | "health" 
  | "vaccination" 
  | "medication" 
  | "periodic_service";

/**
 * 알림 카테고리 (세부 분류)
 */
export type NotificationCategory = 
  | "kcdc" 
  | "diet-popup" 
  | "system"
  | "scheduled" 
  | "reminder" 
  | "overdue" 
  | "checkup" 
  | "appointment" 
  | "general";

/**
 * 알림 채널
 */
export type NotificationChannel = 
  | "push" 
  | "sms" 
  | "email" 
  | "in_app";

/**
 * 알림 상태
 */
export type NotificationStatus = 
  | "pending" 
  | "sent" 
  | "failed" 
  | "dismissed" 
  | "confirmed" 
  | "missed" 
  | "cancelled";

/**
 * 알림 우선순위
 */
export type NotificationPriority = 
  | "low" 
  | "normal" 
  | "high" 
  | "urgent";

/**
 * 관련 엔티티 타입
 */
export type RelatedEntityType = 
  | "vaccination_schedule" 
  | "medication_record" 
  | "periodic_service"
  | "health_checkup"
  | "appointment";

/**
 * 통합 알림 로그
 */
export interface Notification {
  id: string;
  user_id: string | null;
  family_member_id: string | null;
  type: NotificationType;
  category: NotificationCategory | null;
  channel: NotificationChannel | null;
  title: string | null;
  message: string | null;
  status: NotificationStatus;
  priority: NotificationPriority;
  context_data: Record<string, any>; // JSONB
  scheduled_at: string | null;
  sent_at: string | null;
  read_at: string | null;
  confirmed_at: string | null;
  related_id: string | null;
  related_type: RelatedEntityType | null;
  recipient: string | null;
  error_message: string | null;
  retry_count: number;
  is_test: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 알림 생성 파라미터
 */
export interface CreateNotificationParams {
  user_id?: string;
  family_member_id?: string;
  type: NotificationType;
  category?: NotificationCategory;
  channel?: NotificationChannel;
  title?: string;
  message?: string;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  context_data?: Record<string, any>;
  scheduled_at?: string;
  related_id?: string;
  related_type?: RelatedEntityType;
  recipient?: string;
}

/**
 * 알림 조회 필터
 */
export interface NotificationFilter {
  user_id?: string;
  family_member_id?: string;
  type?: NotificationType;
  category?: NotificationCategory;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

